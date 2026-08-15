/**
 * REEMBOLSO da Steam e RESPOSTA MALFORMADA da loja — `functions/api/_billing.js`.
 *
 * Dois buracos que a varredura de mutação da rodada 9 expôs:
 *
 * 1. **`isSteamPurchaseVoided` não tinha teste nenhum.** É a função que decide
 *    se um pacote de Créditos comprado na Steam foi estornado. Trocar
 *    `status === 'Succeeded'` por `!==` deixava a suíte verde: com a inversão,
 *    a compra BOA passa a ser candidata a revogação e o estorno de verdade
 *    ('Refunded') vira "compra ativa". Quem pagou perde os Créditos; quem
 *    estornou fica com eles.
 *
 * 2. **Resposta malformada da Valve.** Todo `data?.response?.params` sobrevivia
 *    à remoção do `?.`, porque nenhum teste jamais devolveu um corpo que não
 *    fosse o corpo perfeito. Na prática isso é a diferença entre o servidor
 *    responder "não deu para verificar" e o servidor EXPLODIR — e um proxy
 *    devolvendo HTML, ou a Valve mudando a versão da interface (o comentário no
 *    topo do bloco Steam avisa que ela já mudou), produz exatamente isso.
 *
 * Regra de fundo dos dois: **na dúvida, `null` — nunca se tira o que o jogador
 * pagou.** E falha de loja jamais vira concessão.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isSteamPurchaseVoided, isSteamOwnershipVoided,
  verifySteamOwnership, verifySteamPurchase,
  isPlayPurchaseBoundTo, STEAM_ITEMS, PRODUCTS,
} from './_billing.js';

const STEAM_ENV = { STEAM_PUBLISHER_KEY: 'k', STEAM_APP_ID: '480' };
const DONO = '76561190000000001';

/** Responde por trecho de URL. `undefined` = 500; função = lança. */
function valve(routes) {
  const calls = [];
  const stub = vi.fn(async (url) => {
    calls.push(String(url));
    for (const [needle, payload] of Object.entries(routes)) {
      if (String(url).includes(needle)) {
        if (payload === 'http-error') return new Response('erro', { status: 500 });
        if (payload === 'html') return new Response('<html>502 Bad Gateway</html>', { status: 200 });
        if (typeof payload === 'function') throw payload();
        return Response.json(payload);
      }
    }
    throw new Error(`URL inesperada no teste: ${url}`);
  });
  stub.calls = calls;
  return stub;
}
const useValve = (r) => { const s = valve(r); vi.stubGlobal('fetch', s); return s; };

beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
afterEach(() => { vi.unstubAllGlobals(); });

const txn = (params) => ({ response: { params } });

// ════════════════════════════ isSteamPurchaseVoided — estorno de créditos ══

describe('reembolso de microtransação na Steam', () => {
  const ORDER = 'steam:txn:999';

  it('Succeeded → false (compra viva, nada é revogado)', async () => {
    useValve({ QueryTxn: txn({ status: 'Succeeded' }) });
    expect(await isSteamPurchaseVoided(STEAM_ENV, { orderId: ORDER })).toBe(false);
  });

  // ►►► REGRESSÃO TRANCADA: `status === 'Succeeded'` → `!==` sobrevivia.
  it.each(['Refunded', 'PartialRefund', 'Chargeback', 'Failed'])(
    '%s → true (o benefício pode ser revogado)',
    async (status) => {
      useValve({ QueryTxn: txn({ status }) });
      expect(await isSteamPurchaseVoided(STEAM_ENV, { orderId: ORDER })).toBe(true);
    },
  );

  it('status intermediário/desconhecido NÃO revoga', async () => {
    // 'Init'/'Approved' são etapas do fluxo, não estorno. Revogar aqui tiraria
    // Créditos de uma compra que ainda está andando.
    for (const status of ['Init', 'Approved', 'Cancelled']) {
      useValve({ QueryTxn: txn({ status }) });
      expect(await isSteamPurchaseVoided(STEAM_ENV, { orderId: ORDER }), status).toBe(false);
    }
  });

  it('sem status na resposta → null (não deu para saber)', async () => {
    useValve({ QueryTxn: txn({}) });
    expect(await isSteamPurchaseVoided(STEAM_ENV, { orderId: ORDER })).toBeNull();
  });

  it('Valve fora do ar → null', async () => {
    useValve({ QueryTxn: 'http-error' });
    expect(await isSteamPurchaseVoided(STEAM_ENV, { orderId: ORDER })).toBeNull();
  });

  it('resposta que não é JSON → null, e NÃO explode', async () => {
    useValve({ QueryTxn: 'html' });
    expect(await isSteamPurchaseVoided(STEAM_ENV, { orderId: ORDER })).toBeNull();
  });

  it('corpo JSON sem `response` → null', async () => {
    useValve({ QueryTxn: { alguma: 'coisa' } });
    expect(await isSteamPurchaseVoided(STEAM_ENV, { orderId: ORDER })).toBeNull();
  });

  it('rede caindo → null', async () => {
    useValve({ QueryTxn: () => new Error('ECONNRESET') });
    expect(await isSteamPurchaseVoided(STEAM_ENV, { orderId: ORDER })).toBeNull();
  });

  it('aceita o orderId com e sem o prefixo `steam:txn:`', async () => {
    const s = useValve({ QueryTxn: txn({ status: 'Refunded' }) });
    expect(await isSteamPurchaseVoided(STEAM_ENV, { orderId: 'steam:txn:999' })).toBe(true);
    expect(await isSteamPurchaseVoided(STEAM_ENV, { orderId: '999' })).toBe(true);
    // e o número vai limpo na URL, sem o prefixo grudado
    expect(s.calls.every(u => u.includes('orderid=999'))).toBe(true);
  });

  it('a URL leva chave, appid e orderid — montada, não concatenada errado', async () => {
    const s = useValve({ QueryTxn: txn({ status: 'Succeeded' }) });
    await isSteamPurchaseVoided(STEAM_ENV, { orderId: ORDER });
    expect(s.calls[0]).toContain('/ISteamMicroTxn/QueryTxn/');
    expect(s.calls[0]).toContain('key=k');
    expect(s.calls[0]).toContain('appid=480');
    expect(s.calls[0]).toContain('orderid=999');
  });

  it('orderId vazio, não-numérico ou longo demais → null, sem consultar a Valve', async () => {
    for (const orderId of ['steam:txn:', '', undefined, null, 'abc', '1 OR 1=1', '9'.repeat(33)]) {
      const s = useValve({ QueryTxn: txn({ status: 'Refunded' }) });
      expect(await isSteamPurchaseVoided(STEAM_ENV, { orderId }), String(orderId)).toBeNull();
      expect(s, String(orderId)).not.toHaveBeenCalled();
    }
  });

  it('32 dígitos ainda é aceito (o limite superior do formato)', async () => {
    useValve({ QueryTxn: txn({ status: 'Refunded' }) });
    expect(await isSteamPurchaseVoided(STEAM_ENV, { orderId: '9'.repeat(32) })).toBe(true);
  });

  it('sem credencial → null, sem consultar nada', async () => {
    const s = useValve({ QueryTxn: txn({ status: 'Refunded' }) });
    expect(await isSteamPurchaseVoided({}, { orderId: ORDER })).toBeNull();
    expect(await isSteamPurchaseVoided({ STEAM_PUBLISHER_KEY: 'k' }, { orderId: ORDER })).toBeNull();
    expect(await isSteamPurchaseVoided({ STEAM_APP_ID: '480' }, { orderId: ORDER })).toBeNull();
    expect(s).not.toHaveBeenCalled();
  });
});

// ════════════════════════ isSteamOwnershipVoided — bordas do formato ══

describe('reembolso do JOGO na Steam — bordas do orderId', () => {
  it('só o formato `steam:own:<appid>:<steamid>` é consultado', async () => {
    for (const orderId of [
      'steam:own:480:', 'steam:own::7656119', 'steam:own:480:abc',
      'steam:txn:999', 'play:GPA.1', '', undefined,
      `steam:own:480:${'9'.repeat(33)}`,
    ]) {
      const s = useValve({ CheckAppOwnership: { appownership: { ownsapp: false } } });
      expect(await isSteamOwnershipVoided(STEAM_ENV, { orderId }), String(orderId)).toBeNull();
      expect(s, String(orderId)).not.toHaveBeenCalled();
    }
  });

  it('o steamid consultado é o do orderId, não o do appid', async () => {
    // O regex tem DOIS grupos; pegar o `[1]` em vez do `[2]` consultaria a posse
    // do APP ID como se fosse uma conta — e ninguém nunca teria o jogo.
    const s = useValve({ CheckAppOwnership: { appownership: { ownsapp: true } } });
    await isSteamOwnershipVoided(STEAM_ENV, { orderId: `steam:own:480:${DONO}` });
    expect(s.calls[0]).toContain(`steamid=${DONO}`);
    expect(s.calls[0]).toContain('appid=480');
  });

  it('resposta malformada ou sem o campo → null (nunca revoga por chute)', async () => {
    for (const payload of ['html', {}, { appownership: {} }, { appownership: null }]) {
      useValve({ CheckAppOwnership: payload });
      expect(await isSteamOwnershipVoided(STEAM_ENV, { orderId: `steam:own:480:${DONO}` }))
        .toBeNull();
    }
  });

  it('ownsapp precisa ser o booleano — a string "false" não revoga', async () => {
    useValve({ CheckAppOwnership: { appownership: { ownsapp: 'false' } } });
    expect(await isSteamOwnershipVoided(STEAM_ENV, { orderId: `steam:own:480:${DONO}` }))
      .toBeNull();
  });
});

// ══════════════════════ resposta malformada nos caminhos de CONCESSÃO ══

describe('Steam — corpo estranho da loja não vira concessão nem exceção', () => {
  const okTicket = { response: { params: { result: 'OK', steamid: DONO, ownersteamid: DONO } } };

  it('posse: `appownership` ausente → not-purchased (e não uma exceção)', async () => {
    useValve({ AuthenticateUserTicket: okTicket, CheckAppOwnership: {} });
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'not-purchased' });
  });

  it('posse: corpo que não é JSON → not-purchased', async () => {
    useValve({ AuthenticateUserTicket: okTicket, CheckAppOwnership: 'html' });
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'not-purchased' });
  });

  it('posse: `ownsapp: "true"` (string) NÃO concede — só o booleano vale', async () => {
    useValve({ AuthenticateUserTicket: okTicket, CheckAppOwnership: { appownership: { ownsapp: 'true' } } });
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'not-purchased' });
  });

  it('ticket: corpo que não é JSON → invalid-ticket', async () => {
    useValve({ AuthenticateUserTicket: 'html' });
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'invalid-ticket' });
  });

  it('ticket: JSON sem `response` → invalid-ticket', async () => {
    useValve({ AuthenticateUserTicket: { qualquer: 1 } });
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'invalid-ticket' });
  });

  it('ticket: `params` presente mas sem result → invalid-ticket', async () => {
    useValve({ AuthenticateUserTicket: { response: { params: { steamid: DONO } } } });
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'invalid-ticket' });
  });

  it('microtransação: QueryTxn sem `response` → invalid-purchase', async () => {
    useValve({ AuthenticateUserTicket: okTicket, QueryTxn: { nada: true } });
    expect(await verifySteamPurchase(STEAM_ENV, { orderId: '999', ticket: 't' }))
      .toEqual({ ok: false, reason: 'invalid-purchase' });
  });

  it('microtransação: QueryTxn que não é JSON → invalid-purchase', async () => {
    useValve({ AuthenticateUserTicket: okTicket, QueryTxn: 'html' });
    expect(await verifySteamPurchase(STEAM_ENV, { orderId: '999', ticket: 't' }))
      .toEqual({ ok: false, reason: 'invalid-purchase' });
  });

  it('microtransação: `items` ausente → unsupported-transaction, não crédito', async () => {
    useValve({
      AuthenticateUserTicket: okTicket,
      QueryTxn: txn({ status: 'Succeeded', steamid: DONO, orderid: '999' }),
    });
    expect(await verifySteamPurchase(STEAM_ENV, { orderId: '999', ticket: 't' }))
      .toEqual({ ok: false, reason: 'unsupported-transaction' });
  });

  it('microtransação: `items` vazio → unsupported-transaction', async () => {
    useValve({
      AuthenticateUserTicket: okTicket,
      QueryTxn: txn({ status: 'Succeeded', steamid: DONO, orderid: '999', items: [] }),
    });
    expect(await verifySteamPurchase(STEAM_ENV, { orderId: '999', ticket: 't' }))
      .toEqual({ ok: false, reason: 'unsupported-transaction' });
  });

  it('microtransação: sem steamid na transação NÃO passa pela trava do dono', async () => {
    useValve({
      AuthenticateUserTicket: okTicket,
      QueryTxn: txn({ status: 'Succeeded', orderid: '999', items: [{ itemid: 102 }] }),
    });
    expect(await verifySteamPurchase(STEAM_ENV, { orderId: '999', ticket: 't' }))
      .toEqual({ ok: false, reason: 'not-purchased' });
  });

  it('a Valve fora do ar em CheckAppOwnership não vira posse', async () => {
    useValve({ AuthenticateUserTicket: okTicket, CheckAppOwnership: 'http-error' });
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'verification-failed' });
  });

  it('a rede caindo no ticket vira verification-failed, nunca concessão', async () => {
    useValve({ AuthenticateUserTicket: () => new Error('ECONNRESET') });
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'verification-failed' });
  });

  // ►►► Os três casos abaixo trancam mutantes que transformavam FALHA DA LOJA
  //     em `{ ok: true }`. Um `ok: true` sem `product` faz `billing.js` ler
  //     `result.product.grantTier` de `undefined` — ou seja, a Valve cair vira
  //     500 na melhor das hipóteses, e concessão na pior. É o pior tipo de
  //     defeito num módulo de dinheiro: o modo de falha é "conceder".
  it('a rede caindo em CheckAppOwnership NÃO vira posse', async () => {
    useValve({ AuthenticateUserTicket: okTicket, CheckAppOwnership: () => new Error('ECONNRESET') });
    const r = await verifySteamOwnership(STEAM_ENV, { ticket: 't' });
    expect(r.ok).toBe(false);
    expect(r).toEqual({ ok: false, reason: 'verification-failed' });
  });

  it('QueryTxn fora do ar NÃO vira microtransação válida', async () => {
    useValve({ AuthenticateUserTicket: okTicket, QueryTxn: 'http-error' });
    const r = await verifySteamPurchase(STEAM_ENV, { orderId: '999', ticket: 't' });
    expect(r.ok).toBe(false);
    expect(r).toEqual({ ok: false, reason: 'invalid-purchase' });
  });

  // ►►► BUG DE PRODUÇÃO CORRIGIDO NESTA RODADA + REGRESSÃO TRANCADA.
  //     `verifySteamPurchase` chamava `authenticateSteamTicket` FORA de
  //     try/catch, enquanto `verifySteamOwnership` (que chama a mesma função)
  //     tinha o try/catch. Com a Valve inalcançável, a exceção subia até
  //     `onRequestPost` — que também não tem try/catch — e o jogador tomava um
  //     500 cru em vez de `502 verification-failed`. A assimetria entre as duas
  //     irmãs era o indício; nenhum teste tinha derrubado a rede no ticket da
  //     microtransação. Falha fechado nos dois casos, mas 500 numa rota de
  //     pagamento é ruído que esconde incidente de verdade.
  it('a rede caindo NO TICKET da microtransação não explode — devolve 502', async () => {
    useValve({ AuthenticateUserTicket: () => new Error('ECONNRESET') });
    let r = null; let lancou = null;
    try {
      r = await verifySteamPurchase(STEAM_ENV, { orderId: '999', ticket: 't' });
    } catch (e) { lancou = e; }
    expect(lancou).toBeNull();
    expect(r).toEqual({ ok: false, reason: 'verification-failed' });
  });

  it('as duas irmãs respondem IGUAL quando a Valve some no ticket', async () => {
    // A paridade é a regra: mesma falha, mesma resposta. Divergir de novo aqui
    // é como o bug nasceu.
    useValve({ AuthenticateUserTicket: () => new Error('ECONNRESET') });
    const posse = await verifySteamOwnership(STEAM_ENV, { ticket: 't' });
    useValve({ AuthenticateUserTicket: () => new Error('ECONNRESET') });
    const micro = await verifySteamPurchase(STEAM_ENV, { orderId: '999', ticket: 't' });
    expect(micro).toEqual(posse);
  });

  it('a rede caindo em QueryTxn NÃO vira microtransação válida', async () => {
    useValve({ AuthenticateUserTicket: okTicket, QueryTxn: () => new Error('ECONNRESET') });
    const r = await verifySteamPurchase(STEAM_ENV, { orderId: '999', ticket: 't' });
    expect(r.ok).toBe(false);
    expect(r).toEqual({ ok: false, reason: 'verification-failed' });
  });

  it('credencial pela metade (só a chave, ou só o appid) → not-configured', async () => {
    const s = useValve({ AuthenticateUserTicket: okTicket });
    expect(await verifySteamOwnership({ STEAM_PUBLISHER_KEY: 'k' }, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'billing-not-configured' });
    expect(await verifySteamOwnership({ STEAM_APP_ID: '480' }, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'billing-not-configured' });
    expect(s).not.toHaveBeenCalled();
  });

  it('ticket que não é string → missing-token, sem consultar a Valve', async () => {
    const s = useValve({ AuthenticateUserTicket: okTicket });
    for (const ticket of [undefined, '', 123, {}, null]) {
      expect(await verifySteamOwnership(STEAM_ENV, { ticket }), String(ticket))
        .toEqual({ ok: false, reason: 'missing-token' });
    }
    expect(s).not.toHaveBeenCalled();
  });
});

// ════════════════════════════ o mapa itemid → produto, item por item ══

describe('STEAM_ITEMS — cada número da Valve cai no pacote certo', () => {
  const okTicket = { response: { params: { result: 'OK', steamid: DONO, ownersteamid: DONO } } };

  it('o mapa é exatamente 101/102/103 → 60/150/400 créditos', () => {
    // Números CRUS: o `itemid` é definido no Steamworks e um engano aqui
    // credita o pacote errado — o jogador paga 400 e recebe 60.
    expect(STEAM_ITEMS).toEqual({
      101: 'soulmon.credits.60',
      102: 'soulmon.credits.150',
      103: 'soulmon.credits.400',
    });
  });

  it.each([[101, 60], [102, 150], [103, 400]])(
    'itemid %i credita %i',
    async (itemid, creditos) => {
      useValve({
        AuthenticateUserTicket: okTicket,
        QueryTxn: txn({ status: 'Succeeded', steamid: DONO, orderid: '7', items: [{ itemid }] }),
      });
      const r = await verifySteamPurchase(STEAM_ENV, { orderId: '7', ticket: 't' });
      expect(r.ok).toBe(true);
      expect(r.product.grantCredits).toBe(creditos);
      // e nunca o tier pago de brinde
      expect(r.product.grantTier).toBeNull();
    },
  );

  it('itemid como STRING também resolve (a Valve devolve número, mas não custa)', async () => {
    useValve({
      AuthenticateUserTicket: okTicket,
      QueryTxn: txn({ status: 'Succeeded', steamid: DONO, orderid: '7', items: [{ itemid: '103' }] }),
    });
    const r = await verifySteamPurchase(STEAM_ENV, { orderId: '7', ticket: 't' });
    expect(r.product).toBe(PRODUCTS['soulmon.credits.400']);
  });
});

// ═══════════════════════════ isPlayPurchaseBoundTo — entrada degenerada ══

describe('isPlayPurchaseBoundTo aguenta entrada vazia', () => {
  it('compra ausente/nula não explode — cai na regra da flag', () => {
    // A função é chamada com o que a Google devolveu; um corpo vazio não pode
    // virar exceção no meio da verificação de pagamento.
    expect(isPlayPurchaseBoundTo(undefined, 'a'.repeat(32))).toBe(true);
    expect(isPlayPurchaseBoundTo(null, 'a'.repeat(32))).toBe(true);
    expect(isPlayPurchaseBoundTo(undefined, 'a'.repeat(32), { PLAY_REQUIRE_ACCOUNT_BINDING: 'true' }))
      .toBe(false);
  });
});
