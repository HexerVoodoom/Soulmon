import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PRODUCTS, STEAM_ITEMS,
  verifyPlayPurchase, verifySteamOwnership, verifySteamPurchase, isSteamOwnershipVoided,
  isPlayPurchaseBoundTo,
} from './_billing.js';

// Estes testes protegem o portão do dinheiro do lado da Steam. Se algum cair,
// alguém ganha crédito ou o tier pago sem ter comprado.

const STEAM_ENV = { STEAM_PUBLISHER_KEY: 'k', STEAM_APP_ID: '480' };

/** Responde às chamadas da Valve por trecho da URL. */
function mockSteam(routes) {
  return vi.fn(async url => {
    for (const [needle, payload] of Object.entries(routes)) {
      if (String(url).includes(needle)) {
        if (payload === 'http-error') return { ok: false, status: 500 };
        return { ok: true, json: async () => payload };
      }
    }
    throw new Error(`URL inesperada no teste: ${url}`);
  });
}

const okTicket = (steamid, ownersteamid) => ({
  response: { params: { result: 'OK', steamid, ownersteamid } },
});
const ownership = owns => ({ appownership: { ownsapp: owns } });

beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('catálogo cross-store', () => {
  it('todo itemid da Steam aponta pra um produto existente', () => {
    for (const productId of Object.values(STEAM_ITEMS)) {
      expect(PRODUCTS[productId]).toBeDefined();
    }
  });

  it('o desbloqueio completo NÃO é vendido por microtransação na Steam', () => {
    // Na Steam ele vem da posse do app (a loja cobra pelo jogo). Se aparecesse
    // aqui, o jogador poderia pagar duas vezes pela mesma coisa.
    expect(Object.values(STEAM_ITEMS)).not.toContain('soulmon.unlock.full');
  });
});

describe('sem credencial configurada, nada é concedido', () => {
  it('Play', async () => {
    const r = await verifyPlayPurchase({}, { productId: 'soulmon.credits.60', purchaseToken: 't' });
    expect(r).toEqual({ ok: false, reason: 'billing-not-configured' });
  });

  it('Steam — microtransação', async () => {
    const r = await verifySteamPurchase({}, { orderId: '123', ticket: 't' });
    expect(r).toEqual({ ok: false, reason: 'billing-not-configured' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('Steam — posse do app', async () => {
    const r = await verifySteamOwnership({}, { ticket: 'abc' });
    expect(r).toEqual({ ok: false, reason: 'billing-not-configured' });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('Steam — microtransação (créditos)', () => {
  // A microtransação exige o MESMO ticket assinado que a posse do app: o
  // `orderid` é gerado pelo parceiro (contador/timestamp), então ids vizinhos
  // são adivinháveis e sozinhos não provam nada.
  const DONO = '76561190000000001';
  const OUTRO = '76561190000000002';
  const txn = (params) => ({ response: { params: { orderid: '999', ...params } } });

  it('credita quando a Valve confirma Succeeded e a transação é desta sessão', async () => {
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: okTicket(DONO, DONO),
      QueryTxn: txn({ status: 'Succeeded', steamid: DONO, items: [{ itemid: 102 }] }),
    }));
    const r = await verifySteamPurchase(STEAM_ENV, { orderId: '999', ticket: 't' });
    expect(r.ok).toBe(true);
    expect(r.product).toEqual(PRODUCTS['soulmon.credits.150']);
    // orderId com namespace da loja — não pode colidir com um orderId da Play.
    expect(r.orderId).toBe('steam:txn:999');
  });

  it('recusa transação que não foi paga', async () => {
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: okTicket(DONO, DONO),
      QueryTxn: txn({ status: 'Failed', steamid: DONO, items: [{ itemid: 102 }] }),
    }));
    expect(await verifySteamPurchase(STEAM_ENV, { orderId: '1', ticket: 't' }))
      .toEqual({ ok: false, reason: 'not-purchased' });
  });

  it('RECUSA a transação paga por OUTRA pessoa', async () => {
    // O achado: `orderid` sozinho não prova posse. Varrendo ids vizinhos dava
    // para resgatar a compra de outro jogador antes dele — a vítima pagava a
    // Valve e não recebia nada.
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: okTicket(OUTRO, OUTRO),
      QueryTxn: txn({ status: 'Succeeded', steamid: DONO, items: [{ itemid: 102 }] }),
    }));
    expect(await verifySteamPurchase(STEAM_ENV, { orderId: '999', ticket: 't-do-atacante' }))
      .toEqual({ ok: false, reason: 'not-purchased' });
  });

  it('recusa sem ticket, sem sequer perguntar à Valve', async () => {
    expect(await verifySteamPurchase(STEAM_ENV, { orderId: '999' }))
      .toEqual({ ok: false, reason: 'missing-ticket' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('recusa ticket inválido', async () => {
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: { response: { params: { result: 'Falha' } } },
    }));
    expect(await verifySteamPurchase(STEAM_ENV, { orderId: '999', ticket: 'forjado' }))
      .toEqual({ ok: false, reason: 'invalid-ticket' });
  });

  it('a recusa de transação alheia é INDISTINGUÍVEL de transação inexistente', async () => {
    // Senão o endpoint vira oráculo: `not-purchased` vs `order-in-use` diria ao
    // atacante quais ids são compras reais ainda não resgatadas.
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: okTicket(OUTRO, OUTRO),
      QueryTxn: txn({ status: 'Succeeded', steamid: DONO, items: [{ itemid: 102 }] }),
    }));
    const alheia = await verifySteamPurchase(STEAM_ENV, { orderId: '999', ticket: 't' });
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: okTicket(OUTRO, OUTRO),
      QueryTxn: txn({ status: 'Failed', steamid: OUTRO, items: [{ itemid: 102 }] }),
    }));
    const inexistente = await verifySteamPurchase(STEAM_ENV, { orderId: '998', ticket: 't' });
    expect(alheia).toEqual(inexistente);
  });

  it('recusa item que não está no catálogo', async () => {
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: okTicket(DONO, DONO),
      QueryTxn: txn({ status: 'Succeeded', steamid: DONO, items: [{ itemid: 9999 }] }),
    }));
    expect(await verifySteamPurchase(STEAM_ENV, { orderId: '1', ticket: 't' }))
      .toEqual({ ok: false, reason: 'unknown-product' });
  });

  it('recusa transação com mais de um item em vez de adivinhar', async () => {
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: okTicket(DONO, DONO),
      QueryTxn: txn({ status: 'Succeeded', steamid: DONO, items: [{ itemid: 101 }, { itemid: 102 }] }),
    }));
    expect(await verifySteamPurchase(STEAM_ENV, { orderId: '1', ticket: 't' }))
      .toEqual({ ok: false, reason: 'unsupported-transaction' });
  });

  it('recusa orderId que não é numérico sem chamar a Valve', async () => {
    expect(await verifySteamPurchase(STEAM_ENV, { orderId: '1 OR 1=1', ticket: 't' }))
      .toEqual({ ok: false, reason: 'missing-token' });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('Steam — posse do app (tier pago)', () => {
  it('concede o tier pago quando o ticket é válido e a conta possui o app', async () => {
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: okTicket('7656119', '7656119'),
      CheckAppOwnership: ownership(true),
    }));
    const r = await verifySteamOwnership(STEAM_ENV, { ticket: 'deadbeef' });
    expect(r.ok).toBe(true);
    expect(r.product.grantTier).toBe('paid');
    expect(r.orderId).toBe('steam:own:480:7656119');
  });

  it('mesmo jogador reenviando o ticket gera o MESMO orderId (idempotente)', async () => {
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: okTicket('7656119', '7656119'),
      CheckAppOwnership: ownership(true),
    }));
    const a = await verifySteamOwnership(STEAM_ENV, { ticket: 't1' });
    const b = await verifySteamOwnership(STEAM_ENV, { ticket: 't2' });
    expect(a.orderId).toBe(b.orderId);
  });

  it('recusa ticket que a Valve não valida', async () => {
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: { response: { error: { errorcode: 101 } } },
    }));
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 'forjado' }))
      .toEqual({ ok: false, reason: 'invalid-ticket' });
  });

  it('recusa quem tem o ticket mas não possui o app', async () => {
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: okTicket('7656119', '7656119'),
      CheckAppOwnership: ownership(false),
    }));
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'not-purchased' });
  });

  it('Family Sharing NÃO dá tier pago a quem pegou a licença emprestada', async () => {
    // O tier é gravado na conta Soulmon de QUEM PEDIU. Se aceitássemos a posse
    // do dono, cada amigo com acesso à biblioteca sairia com uma conta paga
    // própria — uma compra virando N contas pagas.
    const fetchMock = mockSteam({
      AuthenticateUserTicket: okTicket('111_jogador', '999_dono'),
      CheckAppOwnership: ownership(true),
    });
    vi.stubGlobal('fetch', fetchMock);
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'family-shared' });
    // Nem chega a consultar a posse — a recusa é anterior.
    expect(fetchMock.mock.calls.map(c => String(c[0])).some(u => u.includes('CheckAppOwnership'))).toBe(false);
  });

  it('a posse é checada no SteamID de quem está jogando', async () => {
    const fetchMock = mockSteam({
      AuthenticateUserTicket: okTicket('7656119', '7656119'),
      CheckAppOwnership: ownership(true),
    });
    vi.stubGlobal('fetch', fetchMock);
    await verifySteamOwnership(STEAM_ENV, { ticket: 't' });
    const url = fetchMock.mock.calls.map(c => String(c[0])).find(u => u.includes('CheckAppOwnership'));
    expect(url).toContain('steamid=7656119');
  });

  it('recusa conta banida pelo publisher', async () => {
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: { response: { params: { result: 'OK', steamid: '1', publisherbanned: true } } },
    }));
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'banned' });
  });

  it('Valve fora do ar não vira concessão', async () => {
    vi.stubGlobal('fetch', mockSteam({ AuthenticateUserTicket: 'http-error' }));
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'steam-unreachable' });
  });
});

describe('reembolso do JOGO na Steam (posse do app)', () => {
  const LICENSE = 'steam:own:480:7656119';

  it('reembolsou o jogo → posse some → benefício é revogado', async () => {
    // Não precisa de session ticket: o SteamID já está no próprio orderId.
    const fetchMock = mockSteam({ CheckAppOwnership: ownership(false) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await isSteamOwnershipVoided(STEAM_ENV, { orderId: LICENSE })).toBe(true);
    expect(fetchMock.mock.calls.map(c => String(c[0]))[0]).toContain('steamid=7656119');
  });

  it('ainda possui o jogo → nada muda', async () => {
    vi.stubGlobal('fetch', mockSteam({ CheckAppOwnership: ownership(true) }));
    expect(await isSteamOwnershipVoided(STEAM_ENV, { orderId: LICENSE })).toBe(false);
  });

  it('Steam fora do ar → null (mantém o benefício)', async () => {
    vi.stubGlobal('fetch', mockSteam({ CheckAppOwnership: 'http-error' }));
    expect(await isSteamOwnershipVoided(STEAM_ENV, { orderId: LICENSE })).toBeNull();
  });

  it('ignora orderId que não é de posse (microtransação)', async () => {
    expect(await isSteamOwnershipVoided(STEAM_ENV, { orderId: 'steam:txn:999' })).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sem credencial não consulta nada', async () => {
    expect(await isSteamOwnershipVoided({}, { orderId: LICENSE })).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('Play — o recibo pertence a UMA conta', () => {
  // A trava que realmente mata a clonagem de conta paga: quem diz de quem é a
  // compra é a Google, não o cliente. Testado na função pura porque
  // verifyPlayPurchase precisa de credencial de serviço real para rodar.
  const MINHA = 'a'.repeat(32);
  const OUTRA = 'b'.repeat(32);
  const compra = (bound) => ({ purchaseState: 0, orderId: 'GPA.1', obfuscatedExternalAccountId: bound });

  it('aceita quando a compra está vinculada a esta conta', () => {
    expect(isPlayPurchaseBoundTo(compra(MINHA), MINHA)).toBe(true);
  });

  it('RECUSA recibo real vinculado a OUTRA conta', () => {
    // Era o cerne do achado: o mesmo purchaseToken servia para N contas, porque
    // a Google valida o token para qualquer chamador que o apresente.
    expect(isPlayPurchaseBoundTo(compra(OUTRA), MINHA)).toBe(false);
  });

  it('recusa quando o vínculo existe mas a requisição não diz a conta', () => {
    expect(isPlayPurchaseBoundTo(compra(MINHA), undefined)).toBe(false);
  });

  it('sem vínculo, aceita por padrão — para não quebrar cliente antigo', () => {
    expect(isPlayPurchaseBoundTo(compra(undefined), MINHA)).toBe(true);
  });

  it('com PLAY_REQUIRE_ACCOUNT_BINDING, compra sem vínculo é recusada', () => {
    // A flag para ligar depois que o app com setObfuscatedAccountId estiver no
    // ar. Sem ela, um cliente antigo (sem o campo) continuaria clonável.
    expect(isPlayPurchaseBoundTo(compra(undefined), MINHA, { PLAY_REQUIRE_ACCOUNT_BINDING: 'true' })).toBe(false);
  });
});
