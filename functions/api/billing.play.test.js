/**
 * TESTE DE CONTRATO da rota de DINHEIRO — lado GOOGLE PLAY.
 *
 * ## Por que este arquivo existe
 *
 * `billing.test.js` abre dizendo, com todas as letras, por que a Play ficou de
 * fora:
 *
 * > "A Steam é o provedor escolhido porque a verificação dela é 100% `fetch`;
 * >  a Play exigiria assinar um JWT com chave de serviço real, o que faria o
 * >  teste medir a criptografia em vez do contrato."
 *
 * A intenção era boa e o resultado foi ruim: o caminho da Play — que é o do
 * app Android, isto é, o de TODO mundo que paga hoje — nunca foi executado por
 * teste nenhum. `verifyPlayPurchase` e `isPlayPurchaseVoided` inteiras, mais
 * `getAccessToken`, viviam sem uma única asserção. A varredura de mutação
 * mostrou o preço disso: trocar
 *
 *     if (purchase.purchaseState !== 0)   →   if (purchase.purchaseState === 0)
 *
 * deixava a suíte VERDE. Com essa mutação, uma compra PENDENTE (`purchaseState:
 * 2` — cartão em análise, boleto, controle parental) vira compra válida e o
 * jogador recebe os Créditos sem que o dinheiro tenha entrado; e a compra
 * legítima passa a ser recusada. Ninguém veria.
 *
 * ## O instrumento
 *
 * A objeção da criptografia se resolve gerando um par de chaves RSA-2048 DE
 * VERDADE no `beforeAll` (71ms, uma vez por arquivo) e montando um
 * service-account PKCS8 PEM com ela. Assim o `getAccessToken` de produção
 * assina de verdade, e o único ponto falsificado é a FRONTEIRA EXTERNA: os dois
 * endpoints do Google (`oauth2.googleapis.com/token` e
 * `androidpublisher.googleapis.com`). Tudo entre a requisição HTTP e o KV é
 * código de produção — `billing.js`, `_billing.js`, `_entitlements.js`,
 * `_auth.js`.
 *
 * Isso NÃO mede criptografia: o teste não afirma nada sobre RSA. Ele usa a
 * chave real só para que o código sob teste chegue vivo até a linha que decide
 * se o jogador pagou.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { onRequestPost } from './billing.js';
import {
  verifyPlayPurchase, isPlayPurchaseVoided, _resetPlayTokenCache, PRODUCTS,
} from './_billing.js';
import { ENT_PREFIX } from './_entitlements.js';

const ID = 'a'.repeat(32);
const OUTRO_ID = 'b'.repeat(32);
const PACKAGE = 'com.soulmon.app';
const TOKEN = 'tok-de-compra-abc123';

// ─────────────────────────────────────── service account RSA de VERDADE ──

let SERVICE_ACCOUNT_JSON;
let publicKey;

function pemFromPkcs8(buf) {
  const b64 = Buffer.from(buf).toString('base64');
  return `-----BEGIN PRIVATE KEY-----\n${b64.replace(/.{64}/g, '$&\n')}\n-----END PRIVATE KEY-----\n`;
}

beforeAll(async () => {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  publicKey = pair.publicKey;
  SERVICE_ACCOUNT_JSON = JSON.stringify({
    client_email: 'soulmon-billing@exemplo.iam.gserviceaccount.com',
    private_key: pemFromPkcs8(await crypto.subtle.exportKey('pkcs8', pair.privateKey)),
  });
});

// ───────────────────────────────────────────────── a loja de mentira ──

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
  };
}

const env = (extra = {}) => ({
  DIGIAPP_SAVES: fakeKV(),
  GOOGLE_PLAY_SERVICE_ACCOUNT: SERVICE_ACCOUNT_JSON,
  ANDROID_PACKAGE_NAME: PACKAGE,
  ...extra,
});

/**
 * O Google de mentira, na fronteira do `fetch`.
 *
 * `purchase` é o corpo devolvido pelo androidpublisher; `httpStatus` permite
 * simular 404/500; `body` cru cobre resposta malformada; `fail` simula a rede
 * caindo (é o que um timeout vira depois do `AbortError`).
 */
function playStub({
  purchase = { purchaseState: 0, orderId: 'GPA.1111-2222-3333' },
  httpStatus = 200,
  body,
  fail = null,
  tokenStatus = 200,
  expiresIn = 3600,
} = {}) {
  const calls = [];
  const stub = vi.fn(async (url, init) => {
    const u = String(url);
    calls.push({ url: u, init });
    if (u.includes('oauth2.googleapis.com/token')) {
      if (tokenStatus !== 200) {
        return new Response('quota exceeded', { status: tokenStatus });
      }
      // `expiresIn: null` omite o campo (JSON.stringify descarta `undefined`),
      // que é o caso em que o padrão de 1h do código de produção precisa valer.
      return Response.json({ access_token: 'ya29.fake', expires_in: expiresIn ?? undefined });
    }
    if (u.includes('androidpublisher.googleapis.com')) {
      if (fail) throw fail;
      if (httpStatus !== 200) return new Response('nope', { status: httpStatus });
      if (body !== undefined) return new Response(body, { status: 200 });
      return Response.json(purchase);
    }
    throw new Error(`fetch inesperado no teste: ${u}`);
  });
  stub.calls = calls;
  return stub;
}

const useStore = (stub) => { vi.stubGlobal('fetch', stub); return stub; };

beforeEach(() => { _resetPlayTokenCache(); });
afterEach(() => { vi.unstubAllGlobals(); _resetPlayTokenCache(); });

const post = (body, qs = '?action=verify') => new Request(`https://x/api/billing${qs}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const ent = (e, id = ID) => JSON.parse(e.DIGIAPP_SAVES.store.get(ENT_PREFIX + id) ?? 'null');

const buy = (e, body = {}) => onRequestPost({
  request: post({ id: ID, productId: 'soulmon.credits.60', purchaseToken: TOKEN, ...body }),
  env: e,
});

// ══════════════════════════════════════════════════ o caminho feliz ══

describe('Play — compra paga concede o benefício, ponta a ponta', () => {
  it('purchaseState 0 credita NO KV, não só na resposta', async () => {
    useStore(playStub());
    const e = env();
    const res = await buy(e);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.credits).toBe(60);
    // A resposta pode mentir; o KV não.
    expect(ent(e).credits).toBe(60);
    expect(ent(e).consumedOrders).toEqual(['play:GPA.1111-2222-3333']);
  });

  it('o desbloqueio completo vira tier `paid` e NÃO devolve consumeToken', async () => {
    useStore(playStub());
    const e = env();
    const res = await buy(e, { productId: 'soulmon.unlock.full' });
    const body = await res.json();

    expect(body.tier).toBe('paid');
    expect(ent(e).tier).toBe('paid');
    // Compra NÃO consumível: consumir na Play apagaria o direito do histórico
    // da conta Google e o "restaurar compras" pararia de funcionar.
    expect(body.consumeToken).toBeUndefined();
  });

  it('pacote de créditos DEVOLVE consumeToken (senão o jogador não recompra)', async () => {
    useStore(playStub());
    const body = await (await buy(env(), { productId: 'soulmon.credits.150' })).json();
    expect(body.consumeToken).toBe(TOKEN);
    expect(body.credits).toBe(150);
  });

  it('cada SKU concede exatamente o número de créditos do catálogo', async () => {
    // Números CRUS de propósito: comparar com PRODUCTS[...] seria a tautologia
    // que deixou WEEKLY_RELIEF_HEARTS valer zero por três rodadas.
    for (const [productId, esperado] of [
      ['soulmon.credits.60', 60],
      ['soulmon.credits.150', 150],
      ['soulmon.credits.400', 400],
    ]) {
      useStore(playStub({ purchase: { purchaseState: 0, orderId: `GPA.${productId}` } }));
      const e = env();
      await buy(e, { productId });
      expect(ent(e).credits, productId).toBe(esperado);
    }
  });

  it('o desbloqueio completo não dá crédito nenhum', async () => {
    useStore(playStub());
    const e = env();
    await buy(e, { productId: 'soulmon.unlock.full' });
    expect(ent(e).credits).toBe(0);
  });
});

// ══════════════════════════════════ o estado da compra (o dinheiro) ══

describe('Play — o estado da compra decide, e só o estado 0 paga', () => {
  // ►►► REGRESSÃO TRANCADA (mutante que sobrevivia na rodada 8):
  //     `purchase.purchaseState !== 0` → `=== 0`.
  //     Sem este bloco, a inversão passava despercebida e uma compra PENDENTE
  //     concedia Créditos comprados com dinheiro real que ainda não entrou.
  it('PENDENTE (purchaseState 2) NÃO concede nada', async () => {
    useStore(playStub({ purchase: { purchaseState: 2, orderId: 'GPA.pendente' } }));
    const e = env();
    const res = await buy(e);

    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.reason).toBe('not-purchased');
    expect(body.status).toBe(2);
    // O que mais importa: NADA foi gravado.
    expect(ent(e)).toBeNull();
  });

  it('CANCELADA (purchaseState 1) NÃO concede nada', async () => {
    useStore(playStub({ purchase: { purchaseState: 1, orderId: 'GPA.cancelada' } }));
    const e = env();
    const res = await buy(e);

    expect(res.status).toBe(402);
    expect((await res.json()).reason).toBe('not-purchased');
    expect(ent(e)).toBeNull();
  });

  it('estado desconhecido (7) NÃO concede nada — a lista branca é o 0', async () => {
    // Se um dia a Google acrescentar um estado, o padrão tem que ser recusar.
    useStore(playStub({ purchase: { purchaseState: 7, orderId: 'GPA.futuro' } }));
    const e = env();
    expect((await buy(e)).status).toBe(402);
    expect(ent(e)).toBeNull();
  });

  it('purchaseState AUSENTE não é tratado como 0', async () => {
    // `undefined !== 0` recusa — mas a inversão do operador aceitaria, e uma
    // resposta truncada da Google viraria compra paga.
    useStore(playStub({ purchase: { orderId: 'GPA.sem-estado' } }));
    const e = env();
    expect((await buy(e)).status).toBe(402);
    expect(ent(e)).toBeNull();
  });

  it('a string "0" NÃO passa por 0 (comparação estrita)', async () => {
    useStore(playStub({ purchase: { purchaseState: '0', orderId: 'GPA.string' } }));
    const e = env();
    expect((await buy(e)).status).toBe(402);
    expect(ent(e)).toBeNull();
  });

  it('só o 0 paga: varredura de 0 a 4 na função pura', async () => {
    for (const estado of [0, 1, 2, 3, 4]) {
      useStore(playStub({ purchase: { purchaseState: estado, orderId: 'GPA.x' } }));
      const r = await verifyPlayPurchase(env(), {
        productId: 'soulmon.credits.60', purchaseToken: TOKEN, saveId: ID,
      });
      expect(r.ok, `purchaseState=${estado}`).toBe(estado === 0);
    }
  });
});

// ══════════════════════════════════════ recibo de OUTRA conta / replay ══

describe('Play — um comprovante, uma conta', () => {
  it('recibo vinculado a OUTRA conta é recusado com 403', async () => {
    useStore(playStub({
      purchase: { purchaseState: 0, orderId: 'GPA.alheia', obfuscatedExternalAccountId: OUTRO_ID },
    }));
    const e = env();
    const res = await buy(e);

    expect(res.status).toBe(403);
    expect((await res.json()).reason).toBe('account-mismatch');
    expect(ent(e)).toBeNull();
  });

  it('recibo vinculado a ESTA conta passa', async () => {
    useStore(playStub({
      purchase: { purchaseState: 0, orderId: 'GPA.minha', obfuscatedExternalAccountId: ID },
    }));
    const e = env();
    expect((await buy(e)).status).toBe(200);
    expect(ent(e).credits).toBe(60);
  });

  it('sem vínculo, PLAY_REQUIRE_ACCOUNT_BINDING=true recusa (e sem a flag, aceita)', async () => {
    useStore(playStub({ purchase: { purchaseState: 0, orderId: 'GPA.sem-vinculo' } }));
    const comFlag = env({ PLAY_REQUIRE_ACCOUNT_BINDING: 'true' });
    expect((await buy(comFlag)).status).toBe(403);
    expect(ent(comFlag)).toBeNull();

    useStore(playStub({ purchase: { purchaseState: 0, orderId: 'GPA.sem-vinculo' } }));
    const semFlag = env();
    expect((await buy(semFlag)).status).toBe(200);
  });

  it('a flag só vale para o literal "true" — "1" não liga a trava', async () => {
    useStore(playStub({ purchase: { purchaseState: 0, orderId: 'GPA.sem-vinculo' } }));
    const e = env({ PLAY_REQUIRE_ACCOUNT_BINDING: '1' });
    expect((await buy(e)).status).toBe(200);
  });

  it('MESMO token reusado em OUTRA conta Soulmon leva 409 e não credita', async () => {
    useStore(playStub());
    const e = env();
    await buy(e);

    const res = await onRequestPost({
      request: post({ id: OUTRO_ID, productId: 'soulmon.credits.60', purchaseToken: TOKEN }),
      env: e,
    });
    expect(res.status).toBe(409);
    expect((await res.json()).reason).toBe('order-in-use');
    expect(ent(e, OUTRO_ID)).toBeNull();
    // e a primeira conta continua com exatamente 60 — nem a mais, nem a menos
    expect(ent(e).credits).toBe(60);
  });

  it('reenviar a mesma compra na MESMA conta não dobra os créditos', async () => {
    useStore(playStub());
    const e = env();
    await buy(e);
    const body = await (await buy(e)).json();

    expect(body.ok).toBe(true);
    expect(body.duplicate).toBe(true);
    expect(ent(e).credits).toBe(60);
    expect(ent(e).consumedOrders).toHaveLength(1);
  });

  it('o orderId leva o namespace `play:` — não pode colidir com a Steam', async () => {
    useStore(playStub({ purchase: { purchaseState: 0, orderId: '999' } }));
    const r = await verifyPlayPurchase(env(), {
      productId: 'soulmon.credits.60', purchaseToken: TOKEN, saveId: ID,
    });
    expect(r.orderId).toBe('play:999');
    // `steam:txn:999` existe no outro provedor; se o prefixo sumisse, uma
    // compra da Steam bloquearia (ou liberaria) uma compra da Play.
    expect(r.orderId).not.toBe('999');
  });
});

// ══════════════════════════════════════ a loja falhando / respondendo mal ══

describe('Play — falha da loja nunca vira concessão', () => {
  it('404 (token forjado/inexistente) → invalid-purchase, com o status junto', async () => {
    useStore(playStub({ httpStatus: 404 }));
    const e = env();
    const res = await buy(e);

    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.reason).toBe('invalid-purchase');
    expect(body.status).toBe(404);
    expect(ent(e)).toBeNull();
  });

  it('500 da Google também recusa, e repassa o 500 no campo status', async () => {
    useStore(playStub({ httpStatus: 500 }));
    const e = env();
    expect((await buy(e)).status).toBe(402);
    expect(ent(e)).toBeNull();

    useStore(playStub({ httpStatus: 500 }));
    const r = await verifyPlayPurchase(env(), {
      productId: 'soulmon.credits.60', purchaseToken: TOKEN, saveId: ID,
    });
    expect(r).toEqual({ ok: false, reason: 'invalid-purchase', status: 500 });
  });

  it('resposta MALFORMADA (não é JSON) → verification-failed, 502', async () => {
    useStore(playStub({ body: '<html>proxy error</html>' }));
    const e = env();
    const res = await buy(e);

    expect(res.status).toBe(502);
    expect((await res.json()).reason).toBe('verification-failed');
    expect(ent(e)).toBeNull();
  });

  it('corpo JSON vazio (`null`) não vira compra paga', async () => {
    useStore(playStub({ body: 'null' }));
    const e = env();
    // `null.purchaseState` lança → cai no catch? Não: o catch envolve só o
    // fetch/json. O acesso acontece depois. Seja qual for o caminho, o que este
    // teste tranca é que NADA é concedido.
    await buy(e).catch(() => {});
    expect(ent(e)).toBeNull();
  });

  it('TIMEOUT / rede caindo → verification-failed, 502, nada gravado', async () => {
    const abort = Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });
    useStore(playStub({ fail: abort }));
    const e = env();
    const res = await buy(e);

    expect(res.status).toBe(502);
    expect((await res.json()).reason).toBe('verification-failed');
    expect(ent(e)).toBeNull();
  });

  it('falha na troca do token OAuth → verification-failed, nada gravado', async () => {
    useStore(playStub({ tokenStatus: 403 }));
    const e = env();
    const res = await buy(e);

    expect(res.status).toBe(502);
    expect((await res.json()).reason).toBe('verification-failed');
    expect(ent(e)).toBeNull();
  });
});

// ══════════════════════════════════════════════ credencial e entrada ══

describe('Play — sem credencial, e entradas inválidas', () => {
  it('sem GOOGLE_PLAY_SERVICE_ACCOUNT → 503 e nada concedido', async () => {
    useStore(playStub());
    const e = env({ GOOGLE_PLAY_SERVICE_ACCOUNT: undefined });
    const res = await buy(e);

    expect(res.status).toBe(503);
    expect((await res.json()).reason).toBe('billing-not-configured');
    expect(ent(e)).toBeNull();
  });

  it('sem ANDROID_PACKAGE_NAME → 503 e nada concedido', async () => {
    useStore(playStub());
    const e = env({ ANDROID_PACKAGE_NAME: undefined });
    expect((await buy(e)).status).toBe(503);
    expect(ent(e)).toBeNull();
  });

  it('service account que não é JSON → billing-misconfigured, 503', async () => {
    const stub = useStore(playStub());
    const e = env({ GOOGLE_PLAY_SERVICE_ACCOUNT: 'não-é-json' });
    const res = await buy(e);

    expect(res.status).toBe(503);
    expect((await res.json()).reason).toBe('billing-misconfigured');
    // e nem chegou a falar com a Google
    expect(stub).not.toHaveBeenCalled();
    expect(ent(e)).toBeNull();
  });

  it('produto fora do catálogo → 400, sem perguntar à Google', async () => {
    const stub = useStore(playStub());
    const e = env();
    const res = await buy(e, { productId: 'soulmon.credits.999999' });

    expect(res.status).toBe(400);
    expect((await res.json()).reason).toBe('unknown-product');
    expect(stub).not.toHaveBeenCalled();
    expect(ent(e)).toBeNull();
  });

  it('purchaseToken ausente ou não-string → 400, sem perguntar à Google', async () => {
    for (const purchaseToken of [undefined, '', 123, { a: 1 }, null]) {
      const stub = useStore(playStub());
      const e = env();
      const res = await buy(e, { purchaseToken });
      expect(res.status, String(purchaseToken)).toBe(400);
      expect((await res.json()).reason).toBe('missing-token');
      expect(stub).not.toHaveBeenCalled();
    }
  });

  it('a ORDEM importa: catálogo é checado antes da credencial da loja', async () => {
    // Sem credencial E com produto inexistente, a resposta tem que ser a da
    // credencial (503) — é a disciplina do módulo: sem poder verificar, não se
    // avalia mais nada.
    useStore(playStub());
    const e = env({ ANDROID_PACKAGE_NAME: undefined });
    expect((await buy(e, { productId: 'inexistente' })).status).toBe(503);
  });
});

// ══════════════════════════════════════ a URL que vai para a Google ══

describe('Play — a requisição montada para o androidpublisher', () => {
  it('usa pacote, produto e token, todos codificados, e manda o Bearer', async () => {
    const stub = useStore(playStub());
    await verifyPlayPurchase(env(), {
      productId: 'soulmon.credits.60', purchaseToken: 'a/b c+d', saveId: ID,
    });

    const call = stub.calls.find(c => c.url.includes('androidpublisher'));
    expect(call.url).toContain(`/applications/${encodeURIComponent(PACKAGE)}/`);
    expect(call.url).toContain('/purchases/products/soulmon.credits.60/');
    // Se o encode sumisse, `a/b c+d` viraria segmentos de path e a Google
    // responderia 404 para uma compra legítima.
    expect(call.url).toContain('/tokens/a%2Fb%20c%2Bd');
    expect(call.init.headers.Authorization).toBe('Bearer ya29.fake');
  });

  it('o JWT enviado ao OAuth é assinado de verdade e traz as claims certas', async () => {
    const stub = useStore(playStub());
    await verifyPlayPurchase(env(), {
      productId: 'soulmon.credits.60', purchaseToken: TOKEN, saveId: ID,
    });

    const call = stub.calls.find(c => c.url.includes('oauth2'));
    const assertion = new URLSearchParams(call.init.body).get('assertion');
    const [h, p, s] = assertion.split('.');
    const dec = (x) => JSON.parse(Buffer.from(x.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());

    expect(dec(h)).toEqual({ alg: 'RS256', typ: 'JWT' });
    const claims = dec(p);
    expect(claims.iss).toBe('soulmon-billing@exemplo.iam.gserviceaccount.com');
    expect(claims.scope).toBe('https://www.googleapis.com/auth/androidpublisher');
    expect(claims.aud).toBe('https://oauth2.googleapis.com/token');
    // Uma hora de validade. Número cru: se virar 0, todo token nasce expirado
    // e a verificação de compra para no ar — em produção, silenciosamente.
    expect(claims.exp - claims.iat).toBe(3600);

    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', publicKey,
      Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'),
      new TextEncoder().encode(`${h}.${p}`),
    );
    expect(ok).toBe(true);

    expect(new URLSearchParams(call.init.body).get('grant_type'))
      .toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
  });

  it('o token de acesso é REUSADO entre compras (uma troca OAuth só)', async () => {
    const stub = useStore(playStub());
    const e = env();
    await buy(e);
    await onRequestPost({
      request: post({ id: OUTRO_ID, productId: 'soulmon.credits.60', purchaseToken: 'outro-token' }),
      env: e,
    });
    expect(stub.calls.filter(c => c.url.includes('oauth2'))).toHaveLength(1);
  });

  it('sem `expires_in` na resposta, o padrão de 1h vale (não vira 0)', async () => {
    // Com o padrão em 0, `cachedExpiry` nasce no passado e TODA compra
    // renegocia o token — quatro chamadas OAuth por verificação, e o
    // rate limit do Google derruba o billing num pico de vendas.
    const stub = useStore(playStub({ expiresIn: null }));
    const e = env();
    await buy(e);
    await onRequestPost({
      request: post({ id: OUTRO_ID, productId: 'soulmon.credits.60', purchaseToken: 'outro-token' }),
      env: e,
    });
    expect(stub.calls.filter(c => c.url.includes('oauth2'))).toHaveLength(1);
  });

  it('token quase expirando é RENOVADO (a margem de 60s existe)', async () => {
    // expires_in curto: a segunda chamada cai dentro da margem de segurança e
    // tem que pedir um token novo. Se a margem virasse 0, o servidor usaria um
    // token prestes a morrer e a compra falharia por 401 na Google.
    const stub = useStore(playStub({ expiresIn: 30 }));
    const e = env();
    await buy(e);
    await onRequestPost({
      request: post({ id: OUTRO_ID, productId: 'soulmon.credits.60', purchaseToken: 'outro-token' }),
      env: e,
    });
    expect(stub.calls.filter(c => c.url.includes('oauth2'))).toHaveLength(2);
  });
});

// ══════════════════════════════════════════════ conferência de reembolso ══

describe('Play — isPlayPurchaseVoided (a conferência de estorno)', () => {
  const args = { productId: 'soulmon.credits.60', purchaseToken: TOKEN };

  it('purchaseState 1 (reembolsada) → true, o benefício é revogável', async () => {
    // ►►► REGRESSÃO TRANCADA: `=== 1` e `=== 0` sobreviviam à mutação. Com
    //     eles trocados, um estorno deixa de ser reconhecido (o jogador fica
    //     com Créditos que a Google já devolveu) ou uma compra VÁLIDA é
    //     tratada como estorno e o benefício some de quem pagou.
    useStore(playStub({ purchase: { purchaseState: 1 } }));
    expect(await isPlayPurchaseVoided(env(), args)).toBe(true);
  });

  it('purchaseState 0 (ativa) → false, nada é revogado', async () => {
    useStore(playStub({ purchase: { purchaseState: 0 } }));
    expect(await isPlayPurchaseVoided(env(), args)).toBe(false);
  });

  it('purchaseState 2 (pendente) → null: na dúvida, mantém', async () => {
    useStore(playStub({ purchase: { purchaseState: 2 } }));
    expect(await isPlayPurchaseVoided(env(), args)).toBeNull();
  });

  it('estado desconhecido → null (nunca tira o que o jogador pagou por chute)', async () => {
    useStore(playStub({ purchase: { purchaseState: 9 } }));
    expect(await isPlayPurchaseVoided(env(), args)).toBeNull();
  });

  it('404 da Google → null, NÃO true — ambíguo demais para revogar', async () => {
    // 404 pode ser compra apagada, mas também mudança de produto/pacote.
    // Se isto virasse `true`, um rename de SKU revogaria a compra de todo mundo.
    useStore(playStub({ httpStatus: 404 }));
    expect(await isPlayPurchaseVoided(env(), args)).toBeNull();
  });

  it('rede caindo → null', async () => {
    useStore(playStub({ fail: new Error('ECONNRESET') }));
    expect(await isPlayPurchaseVoided(env(), args)).toBeNull();
  });

  it('resposta malformada → null', async () => {
    useStore(playStub({ body: 'not json' }));
    expect(await isPlayPurchaseVoided(env(), args)).toBeNull();
  });

  it('sem credencial, sem productId ou sem token → null, sem consultar nada', async () => {
    const casos = [
      [env({ GOOGLE_PLAY_SERVICE_ACCOUNT: undefined }), args],
      [env({ ANDROID_PACKAGE_NAME: undefined }), args],
      [env(), { ...args, productId: undefined }],
      [env(), { ...args, purchaseToken: undefined }],
      [env(), { ...args, purchaseToken: '' }],
    ];
    for (const [e, a] of casos) {
      const stub = useStore(playStub());
      expect(await isPlayPurchaseVoided(e, a)).toBeNull();
      expect(stub).not.toHaveBeenCalled();
    }
  });

  it('service account inválido → null', async () => {
    useStore(playStub());
    expect(await isPlayPurchaseVoided(env({ GOOGLE_PLAY_SERVICE_ACCOUNT: '{' }), args)).toBeNull();
  });

  it('consulta o MESMO endpoint da verificação (produto e token na URL)', async () => {
    const stub = useStore(playStub({ purchase: { purchaseState: 1 } }));
    await isPlayPurchaseVoided(env(), args);
    const call = stub.calls.find(c => c.url.includes('androidpublisher'));
    expect(call.url).toContain(`/purchases/products/soulmon.credits.60/tokens/${TOKEN}`);
  });
});

// ══════════════════════════════════════════════════════════ catálogo ══

describe('Play — o catálogo é o que a loja vende', () => {
  it('os 4 SKUs existem, com os valores exatos', () => {
    expect(Object.keys(PRODUCTS).sort()).toEqual([
      'soulmon.credits.150', 'soulmon.credits.400', 'soulmon.credits.60', 'soulmon.unlock.full',
    ]);
    expect(PRODUCTS['soulmon.unlock.full']).toEqual({ grantTier: 'paid', grantCredits: 0, consumable: false });
    expect(PRODUCTS['soulmon.credits.60']).toEqual({ grantTier: null, grantCredits: 60, consumable: true });
    expect(PRODUCTS['soulmon.credits.150']).toEqual({ grantTier: null, grantCredits: 150, consumable: true });
    expect(PRODUCTS['soulmon.credits.400']).toEqual({ grantTier: null, grantCredits: 400, consumable: true });
  });

  it('NENHUM pacote de crédito concede tier pago de brinde', () => {
    for (const [id, p] of Object.entries(PRODUCTS)) {
      if (id === 'soulmon.unlock.full') continue;
      expect(p.grantTier, id).toBeNull();
    }
  });
});
