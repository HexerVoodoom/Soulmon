/**
 * ASSINATURA COSMÉTICA TRIMESTRAL — contrato do servidor (D10, threat-model R1..R10).
 *
 * Mesmo instrumento de `billing.play.test.js`: um par RSA de VERDADE assina o
 * JWT da conta de serviço, e a única coisa falsificada é a fronteira externa
 * (OAuth + androidpublisher). Tudo entre a requisição HTTP e o KV é código de
 * produção.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { onRequestPost } from './billing.js';
import {
  PRODUCTS, SUBSCRIPTION_SKU, interpretSubscription, subscriptionOrderId, sha256Hex,
  _resetPlayTokenCache, maskToken,
} from './_billing.js';
import { ENT_PREFIX, publicView, applySubscriptionState, readEntitlement } from './_entitlements.js';

const ID = 'a'.repeat(32);
const OUTRO_ID = 'b'.repeat(32);
const PACKAGE = 'com.hexervoodoom.soulmon';
const TOKEN = 'tok-assinatura-ABCDEFGH-1234567890';
const TOKEN_ANTIGO = 'tok-assinatura-ANTIGO-0987654321';
const NOW = Date.parse('2026-10-11T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const EXPIRY = new Date(NOW + 90 * DAY).toISOString();

let SERVICE_ACCOUNT_JSON;

function pemFromPkcs8(buf) {
  const b64 = Buffer.from(buf).toString('base64');
  return `-----BEGIN PRIVATE KEY-----\n${b64.replace(/.{64}/g, '$&\n')}\n-----END PRIVATE KEY-----\n`;
}

beforeAll(async () => {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  SERVICE_ACCOUNT_JSON = JSON.stringify({
    client_email: 'soulmon-billing@exemplo.iam.gserviceaccount.com',
    private_key: pemFromPkcs8(await crypto.subtle.exportKey('pkcs8', pair.privateKey)),
  });
});

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

/** O recurso `SubscriptionPurchaseV2` mínimo que a Google devolve. */
function subResource(over = {}) {
  return {
    kind: 'androidpublisher#subscriptionPurchaseV2',
    subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
    acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING',
    latestOrderId: 'GPA.3333-4444-5555-66666',
    lineItems: [{ productId: SUBSCRIPTION_SKU, expiryTime: EXPIRY, autoRenewingPlan: { autoRenewEnabled: true } }],
    externalAccountIdentifiers: { obfuscatedExternalAccountId: ID },
    testPurchase: {},
    ...over,
  };
}

/** Google de mentira: `subs[token]` = recurso, ou `{ __status }` para um erro HTTP. */
function googleStub(subs, { ackStatus = 200 } = {}) {
  const calls = { gets: [], acks: [] };
  const stub = vi.fn(async (url, init) => {
    const u = String(url);
    if (u.includes('oauth2.googleapis.com/token')) return Response.json({ access_token: 'ya29.fake', expires_in: 3600 });
    if (u.includes('/purchases/subscriptionsv2/tokens/')) {
      const token = decodeURIComponent(u.split('/tokens/')[1]);
      calls.gets.push(token);
      const r = subs[token];
      if (!r) return new Response('not found', { status: 404 });
      if (r.__status) return new Response('err', { status: r.__status });
      return Response.json(r);
    }
    if (u.includes(':acknowledge')) {
      calls.acks.push({ url: u, method: init?.method });
      return new Response('{}', { status: ackStatus });
    }
    throw new Error(`fetch inesperado: ${u}`);
  });
  stub.calls = calls;
  return stub;
}
const useGoogle = stub => { vi.stubGlobal('fetch', stub); return stub; };

beforeEach(() => { _resetPlayTokenCache(); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); _resetPlayTokenCache(); });

const post = body => new Request('https://x/api/billing?action=verify', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
const subscribe = (e, body = {}) => onRequestPost({
  request: post({ id: ID, productId: SUBSCRIPTION_SKU, purchaseToken: TOKEN, ...body }), env: e,
});
const entOf = (e, id = ID) => JSON.parse(e.DIGIAPP_SAVES.store.get(ENT_PREFIX + id) ?? 'null');

// ═════════════════════════════════════════════════════ catálogo (R1/R6) ══

describe('catálogo — a assinatura não concede nada de jogo', () => {
  it('SKU é o combinado, é assinatura, e grantTier/grantCredits são nulos', () => {
    expect(SUBSCRIPTION_SKU).toBe('soulmon_cosmetic_quarterly');
    expect(PRODUCTS[SUBSCRIPTION_SKU]).toEqual({ kind: 'subscription', grantTier: null, grantCredits: 0, consumable: false });
  });
});

// ═══════════════════════════════════════════ interpretação dos estados ══

describe('interpretSubscription — só estado com direito abre a vitrine', () => {
  const read = (state, over = {}) => interpretSubscription(subResource({ subscriptionState: state, ...over }), { saveId: ID, now: NOW });

  it.each([
    ['SUBSCRIPTION_STATE_ACTIVE', true],
    ['SUBSCRIPTION_STATE_IN_GRACE_PERIOD', true],
    // Cancelou a renovação, mas o período pago vai até o expiryTime (D10).
    ['SUBSCRIPTION_STATE_CANCELED', true],
    ['SUBSCRIPTION_STATE_ON_HOLD', false],
    ['SUBSCRIPTION_STATE_PAUSED', false],
    ['SUBSCRIPTION_STATE_EXPIRED', false],
    ['SUBSCRIPTION_STATE_PENDING', false],
    ['SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED', false],
    ['', false],
  ])('%s -> entitled=%s', (state, entitled) => {
    const r = read(state);
    expect(r.ok).toBe(true);
    expect(r.entitled).toBe(entitled);
    if (!entitled) expect(r.until).toBeLessThanOrEqual(NOW); // nunca vigência futura sem direito
  });

  it('until é o expiryTime da Google (o maior entre os itens do SKU)', () => {
    const tarde = new Date(NOW + 120 * DAY).toISOString();
    const r = read('SUBSCRIPTION_STATE_ACTIVE', {
      lineItems: [
        { productId: SUBSCRIPTION_SKU, expiryTime: EXPIRY },
        { productId: SUBSCRIPTION_SKU, expiryTime: tarde },
        { productId: 'outro_sku', expiryTime: new Date(NOW + 999 * DAY).toISOString() },
      ],
    });
    expect(r.until).toBe(Date.parse(tarde));
  });

  it('ACTIVE com expiryTime no passado não concede', () => {
    const r = read('SUBSCRIPTION_STATE_ACTIVE', { lineItems: [{ productId: SUBSCRIPTION_SKU, expiryTime: new Date(NOW - DAY).toISOString() }] });
    expect(r.entitled).toBe(false);
  });

  it('productId trocado recusa', () => {
    const r = read('SUBSCRIPTION_STATE_ACTIVE', { lineItems: [{ productId: 'soulmon.credits.60', expiryTime: EXPIRY }] });
    expect(r).toEqual({ ok: false, reason: 'unknown-product' });
  });

  it('conta trocada, ausente ou saveId ausente recusa (vínculo é SEMPRE exigido)', () => {
    expect(read('SUBSCRIPTION_STATE_ACTIVE', { externalAccountIdentifiers: { obfuscatedExternalAccountId: OUTRO_ID } }).reason).toBe('account-mismatch');
    expect(read('SUBSCRIPTION_STATE_ACTIVE', { externalAccountIdentifiers: {} }).reason).toBe('account-mismatch');
    expect(interpretSubscription(subResource(), { saveId: '', now: NOW }).reason).toBe('account-mismatch');
  });

  it('oferta (fase grátis/promocional) é recusada — sem trial (R6)', () => {
    const r = read('SUBSCRIPTION_STATE_ACTIVE', {
      lineItems: [{ productId: SUBSCRIPTION_SKU, expiryTime: EXPIRY, offerDetails: { basePlanId: 'trimestral', offerId: 'trial-7d', offerTags: ['trial'] } }],
    });
    expect(r).toEqual({ ok: false, reason: 'offer-not-allowed' });
  });

  it('base plan sem oferta passa (offerDetails só com basePlanId)', () => {
    const r = read('SUBSCRIPTION_STATE_ACTIVE', {
      lineItems: [{ productId: SUBSCRIPTION_SKU, expiryTime: EXPIRY, offerDetails: { basePlanId: 'trimestral' } }],
    });
    expect(r.ok).toBe(true);
  });
});

// ═════════════════════════════════════════════ POST /api/billing (R1-R4) ══

describe('POST /api/billing — assinatura', () => {
  it('ACTIVE: grava a vigência DA GOOGLE e não mexe em tier nem Créditos', async () => {
    const g = useGoogle(googleStub({ [TOKEN]: subResource() }));
    const e = env();
    const res = await subscribe(e);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.tier).toBe('demo');
    expect(body.credits).toBe(0);
    expect(body.subActive).toBe(true);
    expect(body.subUntil).toBe(Date.parse(EXPIRY));
    expect(entOf(e).sub.until).toBe(Date.parse(EXPIRY));
    expect(entOf(e).tier).toBe('demo');
    expect(entOf(e).credits).toBe(0);
    // A assinatura nunca entra em orderDetails (auditRefunds do vitalício não a toca).
    expect(entOf(e).orderDetails).toEqual([]);
    expect(g.calls.gets).toEqual([TOKEN]);
  });

  it('R2: vigência forjada no corpo é ignorada', async () => {
    useGoogle(googleStub({ [TOKEN]: subResource() }));
    const e = env();
    const body = await (await subscribe(e, { subUntil: 99999999999999, expiry: 99999999999999, expiryTime: '2099-01-01T00:00:00Z', tier: 'paid', credits: 9999 })).json();
    expect(body.subUntil).toBe(Date.parse(EXPIRY));
    expect(entOf(e).sub.until).toBe(Date.parse(EXPIRY));
    expect(entOf(e).tier).toBe('demo');
    expect(entOf(e).credits).toBe(0);
  });

  it('R3: reconhece no servidor, 1x, no SKU certo; idempotente na repetição', async () => {
    const g = useGoogle(googleStub({ [TOKEN]: subResource() }));
    const e = env();
    await subscribe(e);
    expect(g.calls.acks).toHaveLength(1);
    expect(g.calls.acks[0].method).toBe('POST');
    expect(g.calls.acks[0].url).toContain(`/purchases/subscriptions/${SUBSCRIPTION_SKU}/tokens/${TOKEN}:acknowledge`);

    // Repetir (restore, reenvio de rede) não quebra e não duplica efeito.
    const again = await subscribe(e);
    expect(again.status).toBe(200);
    expect((await again.json()).duplicate).toBe(true);
  });

  it('R3: já reconhecida na Google = nenhuma chamada de acknowledge', async () => {
    const g = useGoogle(googleStub({ [TOKEN]: subResource({ acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED' }) }));
    await subscribe(env());
    expect(g.calls.acks).toHaveLength(0);
  });

  it('R3: falha no acknowledge NÃO desfaz a concessão', async () => {
    useGoogle(googleStub({ [TOKEN]: subResource() }, { ackStatus: 500 }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const e = env();
    const res = await subscribe(e);
    expect(res.status).toBe(200);
    expect(entOf(e).sub.until).toBe(Date.parse(EXPIRY));
  });

  it('recusa e NÃO reconhece quando o vínculo é de outra conta (403)', async () => {
    const g = useGoogle(googleStub({ [TOKEN]: subResource({ externalAccountIdentifiers: { obfuscatedExternalAccountId: OUTRO_ID } }) }));
    const e = env();
    const res = await subscribe(e);
    expect(res.status).toBe(403);
    expect((await res.json()).reason).toBe('account-mismatch');
    expect(g.calls.acks).toHaveLength(0);
    expect(entOf(e)).toBeNull();
  });

  it('recusa sem vínculo algum, mesmo com PLAY_REQUIRE_ACCOUNT_BINDING desligada', async () => {
    useGoogle(googleStub({ [TOKEN]: subResource({ externalAccountIdentifiers: {} }) }));
    const res = await subscribe(env({ PLAY_REQUIRE_ACCOUNT_BINDING: 'false' }));
    expect(res.status).toBe(403);
  });

  it.each([
    'SUBSCRIPTION_STATE_ON_HOLD', 'SUBSCRIPTION_STATE_PAUSED', 'SUBSCRIPTION_STATE_EXPIRED', 'SUBSCRIPTION_STATE_PENDING',
  ])('%s: 402 e nada gravado', async (state) => {
    useGoogle(googleStub({ [TOKEN]: subResource({ subscriptionState: state }) }));
    const e = env();
    const res = await subscribe(e);
    expect(res.status).toBe(402);
    expect((await res.json()).reason).toBe('not-active');
    expect(entOf(e)).toBeNull();
  });

  it('IN_GRACE_PERIOD e CANCELED (período pago) abrem a vitrine', async () => {
    for (const state of ['SUBSCRIPTION_STATE_IN_GRACE_PERIOD', 'SUBSCRIPTION_STATE_CANCELED']) {
      useGoogle(googleStub({ [TOKEN]: subResource({ subscriptionState: state }) }));
      const e = env();
      expect((await subscribe(e)).status, state).toBe(200);
      expect(entOf(e).sub.state).toBe(state);
    }
  });

  it('com oferta/trial: 402 offer-not-allowed, nada concedido nem reconhecido', async () => {
    const g = useGoogle(googleStub({ [TOKEN]: subResource({
      lineItems: [{ productId: SUBSCRIPTION_SKU, expiryTime: EXPIRY, offerDetails: { basePlanId: 'trimestral', offerId: 'trial', offerTags: ['trial'] } }],
    }) }));
    const e = env();
    const res = await subscribe(e);
    expect(res.status).toBe(402);
    expect((await res.json()).reason).toBe('offer-not-allowed');
    expect(g.calls.acks).toHaveLength(0);
    expect(entOf(e)).toBeNull();
  });

  it('R10: sem credencial = 503 e nada concedido', async () => {
    const g = useGoogle(googleStub({ [TOKEN]: subResource() }));
    const e = env({ GOOGLE_PLAY_SERVICE_ACCOUNT: undefined });
    const res = await subscribe(e);
    expect(res.status).toBe(503);
    expect(entOf(e)).toBeNull();
    expect(g).not.toHaveBeenCalled();
  });

  it('R10: Google fora (5xx) = 502 e nada concedido; token desconhecido (404) = 402', async () => {
    useGoogle(googleStub({ [TOKEN]: { __status: 503 } }));
    const e = env();
    expect((await subscribe(e)).status).toBe(502);
    expect(entOf(e)).toBeNull();

    useGoogle(googleStub({}));
    expect((await subscribe(env())).status).toBe(402);
  });

  it('R10: rede caindo (fetch lança) = 502, nunca concede', async () => {
    useGoogle(vi.fn(async () => { throw new Error('boom'); }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const e = env();
    expect((await subscribe(e)).status).toBe(502);
    expect(entOf(e)).toBeNull();
  });

  it('productId de assinatura mas token de OUTRO produto na Google: recusa', async () => {
    useGoogle(googleStub({ [TOKEN]: subResource({ lineItems: [{ productId: 'outra_assinatura', expiryTime: EXPIRY }] }) }));
    const res = await subscribe(env());
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════ R4: cadeia linkedPurchaseToken ══

describe('R4 — a cadeia linkedPurchaseToken é UMA assinatura, UMA conta', () => {
  it('token B ligado a A (reivindicado por X): vale para X, e Y recebe 409', async () => {
    const e = env();
    useGoogle(googleStub({ [TOKEN_ANTIGO]: subResource() }));
    expect((await subscribe(e, { purchaseToken: TOKEN_ANTIGO })).status).toBe(200);

    // Reassinatura: token novo, ligado ao antigo.
    useGoogle(googleStub({
      [TOKEN]: subResource({ linkedPurchaseToken: TOKEN_ANTIGO }),
      [TOKEN_ANTIGO]: subResource({ subscriptionState: 'SUBSCRIPTION_STATE_EXPIRED' }),
    }));
    expect((await subscribe(e)).status).toBe(200);

    // Só UM claim para a cadeia inteira.
    const claims = [...e.DIGIAPP_SAVES.store.keys()].filter(k => k.startsWith('ord:'));
    expect(claims).toHaveLength(1);
    expect(claims[0]).toBe(`ord:${await subscriptionOrderId(TOKEN_ANTIGO)}`);

    // Outra conta (Y) tentando o token novo: o recurso da Google teria o id de Y,
    // mas a cadeia já é de X.
    useGoogle(googleStub({
      [TOKEN]: subResource({ linkedPurchaseToken: TOKEN_ANTIGO, externalAccountIdentifiers: { obfuscatedExternalAccountId: OUTRO_ID } }),
      [TOKEN_ANTIGO]: subResource({ subscriptionState: 'SUBSCRIPTION_STATE_EXPIRED' }),
    }));
    const y = await onRequestPost({ request: post({ id: OUTRO_ID, productId: SUBSCRIPTION_SKU, purchaseToken: TOKEN }), env: e });
    expect(y.status).toBe(409);
    expect((await y.json()).reason).toBe('order-in-use');
    expect(entOf(e, OUTRO_ID)).toBeNull();
  });

  it('a chave NÃO é o orderId de renovação: renovações (..0, ..1) não geram claim novo', async () => {
    const e = env();
    for (const latestOrderId of ['GPA.1111-2222-3333-44444', 'GPA.1111-2222-3333-44444..0', 'GPA.1111-2222-3333-44444..1']) {
      useGoogle(googleStub({ [TOKEN]: subResource({ latestOrderId }) }));
      expect((await subscribe(e)).status).toBe(200);
    }
    expect([...e.DIGIAPP_SAVES.store.keys()].filter(k => k.startsWith('ord:'))).toHaveLength(1);
  });

  it('o claim guarda hash, nunca o token cru', async () => {
    useGoogle(googleStub({ [TOKEN]: subResource() }));
    const e = env();
    await subscribe(e);
    const keys = [...e.DIGIAPP_SAVES.store.keys()].join('|');
    expect(keys).not.toContain(TOKEN);
    expect(JSON.stringify(entOf(e))).not.toContain(TOKEN);
    expect(await subscriptionOrderId(TOKEN)).toBe(`play:sub:${await sha256Hex(TOKEN)}`);
  });

  it('elo da cadeia com erro TRANSITÓRIO: 502, sem adivinhar a raiz', async () => {
    useGoogle(googleStub({ [TOKEN]: subResource({ linkedPurchaseToken: TOKEN_ANTIGO }), [TOKEN_ANTIGO]: { __status: 503 } }));
    const e = env();
    expect((await subscribe(e)).status).toBe(502);
    expect(entOf(e)).toBeNull();
  });

  it('elo antigo que a Google esqueceu (404) vira a raiz', async () => {
    useGoogle(googleStub({ [TOKEN]: subResource({ linkedPurchaseToken: TOKEN_ANTIGO }) }));
    const e = env();
    expect((await subscribe(e)).status).toBe(200);
    expect([...e.DIGIAPP_SAVES.store.keys()]).toContain(`ord:${await subscriptionOrderId(TOKEN_ANTIGO)}`);
  });
});

// ═══════════════════════════════════════════════ estado no entitlement ══

describe('applySubscriptionState / publicView', () => {
  const base = { rootHash: 'r1', until: NOW + DAY, state: 'SUBSCRIPTION_STATE_ACTIVE', entitled: true };

  it('aviso de uma cadeia ANTIGA expirando não fecha a vitrine da cadeia nova', async () => {
    const e = env();
    await applySubscriptionState(e, ID, { ...base, rootHash: 'nova' }, NOW);
    const r = await applySubscriptionState(e, ID, { rootHash: 'velha', until: NOW - DAY, state: 'SUBSCRIPTION_STATE_EXPIRED', entitled: false }, NOW);
    expect(r.changed).toBe(false);
    expect((await readEntitlement(e, ID)).sub.rootHash).toBe('nova');
  });

  it('expirar fecha a vitrine (subActive=false) sem tocar em tier/Créditos', async () => {
    const e = env();
    await applySubscriptionState(e, ID, base, NOW);
    await applySubscriptionState(e, ID, { ...base, until: NOW - 1, state: 'SUBSCRIPTION_STATE_EXPIRED', entitled: false }, NOW);
    const ent = await readEntitlement(e, ID);
    expect(publicView(ent).subActive).toBe(false);
    expect(ent.tier).toBe('demo');
    expect(ent.credits).toBe(0);
  });

  it('conta sem assinatura mantém o formato público de sempre (sem subActive/subUntil)', () => {
    expect(Object.keys(publicView({ tier: 'demo', credits: 0, adDate: '', adCount: 0, orderDetails: [], sub: null })).sort()).toEqual(['adsLeft', 'credits', 'tier']);
  });

  it('mesmo estado de novo não regrava (changed=false)', async () => {
    const e = env();
    await applySubscriptionState(e, ID, base, NOW);
    expect((await applySubscriptionState(e, ID, base, NOW)).changed).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════ R9: sem token ══

describe('R9 — o log nunca carrega o token', () => {
  it('maskToken esconde o miolo', () => {
    expect(maskToken(TOKEN)).not.toContain('ABCDEFGH');
    expect(maskToken('curto')).toBe('***');
  });

  it('verify ok e verify recusado não vazam o token nem o saveId inteiro', async () => {
    const logs = [];
    for (const m of ['log', 'error', 'warn']) vi.spyOn(console, m).mockImplementation((...a) => { logs.push(a.map(String).join(' ')); });
    useGoogle(googleStub({ [TOKEN]: subResource() }, { ackStatus: 500 }));
    await subscribe(env());
    useGoogle(googleStub({ [TOKEN]: subResource({ subscriptionState: 'SUBSCRIPTION_STATE_EXPIRED' }) }));
    await subscribe(env());
    const all = logs.join('\n');
    expect(all.length).toBeGreaterThan(0);
    expect(all).not.toContain(TOKEN);
    expect(all).not.toContain(ID);
  });
});
