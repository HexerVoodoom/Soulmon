/**
 * RTDN (Pub/Sub push) — autenticação OIDC, idempotência e "a mensagem nunca é
 * confiada" (threat-model R7). O JWT é assinado com um par RSA de verdade e o
 * JWKS da Google é servido pelo stub do `fetch`.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { onRequestPost } from './rtdn.js';
import { _resetPubsubJwksCache } from './_pubsubAuth.js';
import { SUBSCRIPTION_SKU, _resetPlayTokenCache, subscriptionOrderId, sha256Hex } from './_billing.js';
import { ENT_PREFIX, ORDER_PREFIX, applySubscriptionState, readEntitlement } from './_entitlements.js';

const ID = 'a'.repeat(32);
const PACKAGE = 'com.soulmon';
const TOKEN = 'tok-rtdn-ABCDEFGH-1234567890';
const AUD = 'https://soulmon.example/api/rtdn';
const PUSH_SA = 'pubsub-push@soulmon-app.iam.gserviceaccount.com';
const DAY = 24 * 60 * 60 * 1000;
const FUTURE = new Date(Date.now() + 80 * DAY).toISOString();

let signKey, jwk, saJson;

const b64u = buf => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = new TextEncoder();

async function mintJwt(over = {}, { key = signKey, kid = 'kid-1' } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64u(enc.encode(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' })));
  const payload = b64u(enc.encode(JSON.stringify({
    iss: 'https://accounts.google.com', aud: AUD, email: PUSH_SA, email_verified: true,
    iat: now, exp: now + 3600, ...over,
  })));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(`${header}.${payload}`));
  return `${header}.${payload}.${b64u(sig)}`;
}

beforeAll(async () => {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  signKey = pair.privateKey;
  jwk = { ...(await crypto.subtle.exportKey('jwk', pair.publicKey)), kid: 'kid-1', alg: 'RS256', use: 'sig' };
  const pem = `-----BEGIN PRIVATE KEY-----\n${Buffer.from(await crypto.subtle.exportKey('pkcs8', pair.privateKey)).toString('base64').replace(/.{64}/g, '$&\n')}\n-----END PRIVATE KEY-----\n`;
  saJson = JSON.stringify({ client_email: 'soulmon-billing@exemplo.iam.gserviceaccount.com', private_key: pem });
});

function fakeKV() {
  const store = new Map();
  return { store, get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); } };
}
const env = (extra = {}) => ({
  DIGIAPP_SAVES: fakeKV(), GOOGLE_PLAY_SERVICE_ACCOUNT: saJson, ANDROID_PACKAGE_NAME: PACKAGE,
  RTDN_AUDIENCE: AUD, RTDN_PUSH_SA_EMAIL: PUSH_SA, ...extra,
});

function subResource(over = {}) {
  return {
    subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
    acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    lineItems: [{ productId: SUBSCRIPTION_SKU, expiryTime: FUTURE }],
    externalAccountIdentifiers: { obfuscatedExternalAccountId: ID },
    ...over,
  };
}

function googleStub(subs) {
  const calls = { gets: 0, acks: 0 };
  const stub = vi.fn(async (url) => {
    const u = String(url);
    if (u.includes('oauth2/v3/certs')) return Response.json({ keys: [jwk] }, { headers: { 'cache-control': 'max-age=3600' } });
    if (u.includes('oauth2.googleapis.com/token')) return Response.json({ access_token: 'ya29.fake', expires_in: 3600 });
    if (u.includes('/purchases/subscriptionsv2/tokens/')) {
      calls.gets++;
      const r = subs[decodeURIComponent(u.split('/tokens/')[1])];
      if (!r) return new Response('nf', { status: 404 });
      if (r.__status) return new Response('err', { status: r.__status });
      return Response.json(r);
    }
    if (u.includes(':acknowledge')) { calls.acks++; return new Response('{}', { status: 200 }); }
    throw new Error(`fetch inesperado: ${u}`);
  });
  stub.calls = calls;
  vi.stubGlobal('fetch', stub);
  return stub;
}

beforeEach(() => { _resetPubsubJwksCache(); _resetPlayTokenCache(); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const note = (payload, messageId = 'm-1') => ({
  message: { messageId, data: Buffer.from(JSON.stringify({ version: '1.0', packageName: PACKAGE, eventTimeMillis: '1', ...payload })).toString('base64') },
  subscription: 'projects/p/subscriptions/s',
});
const subNote = (type = 2, messageId = 'm-1') => note({ subscriptionNotification: { version: '1.0', notificationType: type, purchaseToken: TOKEN } }, messageId);

async function push(e, body, jwt) {
  const token = jwt === undefined ? await mintJwt() : jwt;
  return onRequestPost({
    request: new Request('https://x/api/rtdn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    }),
    env: e,
  });
}

/** Conta X com a cadeia do TOKEN já reivindicada e vitrine aberta. */
async function seedClaimed(e) {
  e.DIGIAPP_SAVES.store.set(ORDER_PREFIX + await subscriptionOrderId(TOKEN), ID);
  await applySubscriptionState(e, ID, {
    rootHash: await sha256Hex(TOKEN), until: Date.parse(FUTURE), state: 'SUBSCRIPTION_STATE_ACTIVE', entitled: true,
  });
}

describe('autenticação OIDC do Pub/Sub (R7)', () => {
  it('sem Bearer: 401, e a Google nunca é consultada', async () => {
    const g = googleStub({ [TOKEN]: subResource() });
    const res = await push(env(), subNote(), null);
    expect(res.status).toBe(401);
    expect(g.calls.gets).toBe(0);
  });

  it('aud errado: 401', async () => {
    googleStub({ [TOKEN]: subResource() });
    expect((await push(env(), subNote(), await mintJwt({ aud: 'https://outro.example/rtdn' }))).status).toBe(401);
  });

  it('e-mail de OUTRA service account: 401', async () => {
    googleStub({ [TOKEN]: subResource() });
    expect((await push(env(), subNote(), await mintJwt({ email: 'intruso@outro.iam.gserviceaccount.com' }))).status).toBe(401);
  });

  it('email_verified falso, iss estranho, expirado: 401', async () => {
    googleStub({ [TOKEN]: subResource() });
    for (const over of [{ email_verified: false }, { iss: 'https://evil.example' }, { exp: Math.floor(Date.now() / 1000) - 10 }]) {
      expect((await push(env(), subNote(), await mintJwt(over))).status, JSON.stringify(over)).toBe(401);
    }
  });

  it('assinatura inválida (chave que não é a do JWKS): 401', async () => {
    googleStub({ [TOKEN]: subResource() });
    const other = await crypto.subtle.generateKey(
      { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'],
    );
    expect((await push(env(), subNote(), await mintJwt({}, { key: other.privateKey }))).status).toBe(401);
  });

  it('lixo no lugar do JWT: 401 (nunca lança)', async () => {
    googleStub({});
    expect((await push(env(), subNote(), 'nao.e.jwt')).status).toBe(401);
    expect((await push(env(), subNote(), 'x')).status).toBe(401);
  });

  it('sem RTDN_AUDIENCE/RTDN_PUSH_SA_EMAIL o endpoint não aceita nada (503, fail-closed)', async () => {
    googleStub({});
    expect((await push(env({ RTDN_AUDIENCE: undefined }), subNote())).status).toBe(503);
    expect((await push(env({ RTDN_PUSH_SA_EMAIL: undefined }), subNote())).status).toBe(503);
  });
});

describe('o payload nunca é confiado — a Google decide', () => {
  it('RENEWED no payload, mas a Google diz EXPIRED: a vitrine fecha', async () => {
    const e = env();
    await seedClaimed(e);
    googleStub({ [TOKEN]: subResource({ subscriptionState: 'SUBSCRIPTION_STATE_EXPIRED', lineItems: [{ productId: SUBSCRIPTION_SKU, expiryTime: new Date(Date.now() - DAY).toISOString() }] }) });
    const res = await push(e, subNote(2));
    expect(res.status).toBe(200);
    const ent = await readEntitlement(e, ID);
    expect(ent.sub.state).toBe('SUBSCRIPTION_STATE_EXPIRED');
    expect(ent.sub.until).toBeLessThanOrEqual(Date.now());
    expect(ent.tier).toBe('demo');
  });

  it('EXPIRED no payload, mas a Google diz ACTIVE: segue aberta', async () => {
    const e = env();
    await seedClaimed(e);
    googleStub({ [TOKEN]: subResource() });
    expect((await push(e, subNote(13))).status).toBe(200);
    const ent = await readEntitlement(e, ID);
    expect(ent.sub.until).toBe(Date.parse(FUTURE));
  });

  it('RENEWED estende o until com o expiryTime novo da Google', async () => {
    const e = env();
    await seedClaimed(e);
    const novo = new Date(Date.now() + 170 * DAY).toISOString();
    googleStub({ [TOKEN]: subResource({ lineItems: [{ productId: SUBSCRIPTION_SKU, expiryTime: novo }] }) });
    await push(e, subNote(2));
    expect((await readEntitlement(e, ID)).sub.until).toBe(Date.parse(novo));
  });

  it('CANCELED mantém o direito até o fim do período pago', async () => {
    const e = env();
    await seedClaimed(e);
    googleStub({ [TOKEN]: subResource({ subscriptionState: 'SUBSCRIPTION_STATE_CANCELED' }) });
    await push(e, subNote(3));
    const ent = await readEntitlement(e, ID);
    expect(ent.sub.state).toBe('SUBSCRIPTION_STATE_CANCELED');
    expect(ent.sub.until).toBe(Date.parse(FUTURE));
  });

  it('voidedPurchaseNotification (assinatura) reconsulta e fecha se a Google revogou', async () => {
    const e = env();
    await seedClaimed(e);
    googleStub({ [TOKEN]: subResource({ subscriptionState: 'SUBSCRIPTION_STATE_EXPIRED' }) });
    const res = await push(e, note({ voidedPurchaseNotification: { purchaseToken: TOKEN, orderId: 'GPA.1', productType: 1, refundType: 1 } }));
    expect(res.status).toBe(200);
    expect((await readEntitlement(e, ID)).sub.until).toBeLessThanOrEqual(Date.now());
  });

  it('voided de produto único (productType 2) não consulta a assinatura', async () => {
    const e = env();
    const g = googleStub({});
    await push(e, note({ voidedPurchaseNotification: { purchaseToken: TOKEN, orderId: 'GPA.1', productType: 2 } }));
    expect(g.calls.gets).toBe(0);
  });

  it('a notificação nunca escreve tier nem Créditos', async () => {
    const e = env();
    await seedClaimed(e);
    googleStub({ [TOKEN]: subResource() });
    await push(e, subNote(4));
    const ent = JSON.parse(e.DIGIAPP_SAVES.store.get(ENT_PREFIX + ID));
    expect(ent.tier).toBe('demo');
    expect(ent.credits).toBe(0);
    expect(ent.orderDetails).toEqual([]);
  });
});

describe('idempotência por messageId', () => {
  it('a mesma messageId duas vezes = uma consulta à Google, um efeito', async () => {
    const e = env();
    await seedClaimed(e);
    const g = googleStub({ [TOKEN]: subResource() });
    const a = await push(e, subNote(2, 'dup-1'));
    const b = await push(e, subNote(2, 'dup-1'));
    expect(a.status).toBe(200);
    expect((await b.json()).duplicate).toBe(true);
    expect(g.calls.gets).toBe(1);
  });

  it('messageId diferente reconsulta', async () => {
    const e = env();
    await seedClaimed(e);
    const g = googleStub({ [TOKEN]: subResource() });
    await push(e, subNote(2, 'm-a'));
    await push(e, subNote(2, 'm-b'));
    expect(g.calls.gets).toBe(2);
  });

  it('Google fora: 5xx para o Pub/Sub tentar de novo, e a messageId NÃO é marcada', async () => {
    const e = env();
    await seedClaimed(e);
    googleStub({ [TOKEN]: { __status: 503 } });
    expect((await push(e, subNote(2, 'retry-1'))).status).toBe(503);
    googleStub({ [TOKEN]: subResource() });
    const again = await push(e, subNote(2, 'retry-1'));
    expect(again.status).toBe(200);
    expect((await again.json()).duplicate).toBeUndefined();
  });

  it('com D1: dedupe pela tabela rtdn_messages', async () => {
    const rows = new Map();
    const DB = {
      prepare(sql) {
        let args = [];
        const api = {
          bind: (...a) => { args = a; return api; },
          run: async () => {
            if (/^INSERT INTO rtdn_messages/.test(sql)) {
              if (rows.has(args[0])) throw new Error('UNIQUE constraint failed: rtdn_messages.message_id');
              rows.set(args[0], { expires_at: args[2] });
            }
            return {};
          },
          first: async () => {
            if (/FROM rtdn_messages/.test(sql)) return rows.has(args[0]) && rows.get(args[0]).expires_at > args[1] ? { x: 1 } : null;
            if (/FROM order_claims/.test(sql)) return { save_id: ID };
            return null;
          },
        };
        return api;
      },
    };
    const e = env({ DB });
    await applySubscriptionState(e, ID, { rootHash: await sha256Hex(TOKEN), until: Date.parse(FUTURE), state: 'SUBSCRIPTION_STATE_ACTIVE', entitled: true });
    const g = googleStub({ [TOKEN]: subResource() });
    await push(e, subNote(2, 'd1-1'));
    await push(e, subNote(2, 'd1-1'));
    expect(g.calls.gets).toBe(1);
    expect(rows.has('d1-1')).toBe(true);
  });

  // Gate adversarial A4: deploy ANTES da migração 0003 (order_claims existe, rtdn_messages não).
  it('A4: D1 SEM a tabela rtdn_messages (0003 não aplicada): o aviso é processado (200) e só a dedupe degrada', async () => {
    const DB = {
      prepare(sql) {
        if (/rtdn_messages/.test(sql)) throw new Error('D1_ERROR: no such table: rtdn_messages');
        let args = [];
        const api = { bind: (...a) => { args = a; return api; }, run: async () => ({}), first: async () => (/FROM order_claims/.test(sql) ? { save_id: ID } : null) };
        void args;
        return api;
      },
    };
    const e = env({ DB });
    await applySubscriptionState(e, ID, { rootHash: await sha256Hex(TOKEN), until: Date.parse(FUTURE), state: 'SUBSCRIPTION_STATE_ACTIVE', entitled: true });
    const g = googleStub({ [TOKEN]: subResource({ subscriptionState: 'SUBSCRIPTION_STATE_EXPIRED' }) });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const r1 = await push(e, subNote(13, 'a4-1'));
    expect(r1.status).toBe(200);
    // o efeito aconteceu (a Google disse EXPIRED → vitrine fecha)
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(`ent:${ID}`)).sub.state).toBe('SUBSCRIPTION_STATE_EXPIRED');
    // sem a tabela a reentrega reconsulta (custa quota, nunca efeito errado)
    expect((await push(e, subNote(13, 'a4-1'))).status).toBe(200);
    expect(g.calls.gets).toBe(2);
  });

  it('D1 quebrado: o erro real vira 500 para o Pub/Sub tentar de novo (nunca engole o efeito)', async () => {
    const DB = { prepare: () => { throw new Error('no such table: rtdn_messages'); } };
    const e = env({ DB });
    googleStub({ [TOKEN]: subResource() });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    // lookupOrderOwner também usa o D1 -> erro real vira 500 para o Pub/Sub tentar de novo (nunca engole efeito).
    const res = await push(e, subNote(2, 'x-1'));
    expect(res.status).toBe(500);
  });
});

describe('outras mensagens', () => {
  it('testNotification: 200, logada, sem consultar a Google', async () => {
    const g = googleStub({});
    const logs = [];
    vi.spyOn(console, 'log').mockImplementation((...a) => { logs.push(a.join(' ')); });
    const res = await push(env(), note({ testNotification: { version: '1.0' } }, 'test-1'));
    expect(res.status).toBe(200);
    expect((await res.json()).outcome).toBe('test');
    expect(g.calls.gets).toBe(0);
    expect(logs.join('\n')).toContain('rtdn.test');
  });

  it('pacote errado: 200 ignorado, sem consulta', async () => {
    const g = googleStub({ [TOKEN]: subResource() });
    const body = note({ subscriptionNotification: { version: '1.0', notificationType: 2, purchaseToken: TOKEN } });
    const decoded = JSON.parse(Buffer.from(body.message.data, 'base64').toString());
    decoded.packageName = 'com.outro.app';
    body.message.data = Buffer.from(JSON.stringify(decoded)).toString('base64');
    const res = await push(env(), body);
    expect((await res.json()).ignored).toBe('package');
    expect(g.calls.gets).toBe(0);
  });

  it('corpo malformado de remetente autêntico: 2xx (reentregar não conserta)', async () => {
    googleStub({});
    expect((await push(env(), { message: { messageId: 'bad-1', data: '###' } })).status).toBe(200);
    expect((await push(env(), { nada: true })).status).toBe(200);
  });

  it('compra ainda não verificada pelo app (sem dono): reconhece e responde 200 sem conceder', async () => {
    const e = env();
    const g = googleStub({ [TOKEN]: subResource({ acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING' }) });
    const res = await push(e, subNote(4, 'new-1'));
    expect((await res.json()).outcome).toBe('unclaimed');
    expect(g.calls.acks).toBe(1);
    expect(e.DIGIAPP_SAVES.store.has(ENT_PREFIX + ID)).toBe(false);
  });

  it('token que a Google não conhece (404): 200, nada a fazer', async () => {
    googleStub({});
    expect((await push(env(), subNote(2, 'nf-1'))).status).toBe(200);
  });
});

describe('R9 — log sem token nem JWT', () => {
  it('nenhuma linha de log contém o purchaseToken, o JWT ou o saveId inteiro', async () => {
    const logs = [];
    for (const m of ['log', 'error', 'warn']) vi.spyOn(console, m).mockImplementation((...a) => { logs.push(a.map(String).join(' ')); });
    const e = env();
    await seedClaimed(e);
    googleStub({ [TOKEN]: subResource({ acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING' }) });
    const jwt = await mintJwt();
    await push(e, subNote(2, 'log-1'), jwt);
    const all = logs.join('\n');
    expect(all).toContain('rtdn.sub.reconciled');
    expect(all).not.toContain(TOKEN);
    expect(all).not.toContain(jwt);
    expect(all).not.toContain(ID);
  });
});
