/**
 * QA rodada 2 (22/09/2026) — a LÁPIDE de conta apagada, corrigida em dois eixos:
 *
 *   (1) `00-skeptic-r2` #1 (FATAL): a lápide bloqueava o MESMO e-mail por 30 d.
 *       Login → conta nova → POST 410 → wipe + logout, em loop. Agora o
 *       `auth_time` do JWT decide: login POSTERIOR à exclusão reabre (a lápide
 *       sai e a chamada segue); sessão ANTERIOR (o aparelho esquecido) → 410.
 *   (2) `01-seguranca-r2` §1.3 / `04-dados-r2` §0: a lápide protegia SÓ
 *       `save.js`; o cliente recriava `profile:`/`pid:` por `community.js` 3 s
 *       depois. Agora ela mora em `authorizeSaveAccess` — TODA rota que autoriza
 *       em nome de um `saveId` responde 410 `account-deleted`.
 *
 * Os tokens são RS256 DE VERDADE (par gerado no teste, JWK servido por um
 * `fetch` falso) — `auth_time` só chega em `authorizeSaveAccess` passando por
 * `verifyIdToken`, então um mock da auth não provaria nada.
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { emailToSaveId, authorizeSaveAccess } from './_auth.js';
import { writeTombstone, tombstoneKey, gateTombstone } from './_accountTombstone.js';
import { onRequest as saveRoute } from './save.js';
import { onRequest as communityRoute } from './community.js';
import { onRequestPost as subscribePost } from './subscribe.js';
import { onRequestPost as fcmPost } from './fcm-subscribe.js';
import { onRequestGet as entitlementsGet } from './entitlements.js';
import { onRequestPost as spritePost } from './generate-sprite.js';

const PROJECT = 'soulmon-test';
const EMAIL = 'volta@exemplo.com';
const KID = 'kid-qa2';
let ID;
let privateKey;
let publicJwk;

const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64json = (o) => b64url(new TextEncoder().encode(JSON.stringify(o)));

/** ID token do Firebase assinado, com `auth_time` em SEGUNDOS. */
async function tokenCom({ authTime, email = EMAIL }) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64json({ alg: 'RS256', kid: KID, typ: 'JWT' });
  const payload = b64json({
    aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}`,
    iat: now, exp: now + 3600, auth_time: authTime,
    email, email_verified: true, sub: 'uid',
  });
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(`${header}.${payload}`));
  return `${header}.${payload}.${b64url(new Uint8Array(sig))}`;
}

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const meta = new Map();
  return {
    store,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? { t: Date.now() } }),
    put: async (k, v, o) => { store.set(k, v); if (o?.metadata) meta.set(k, o.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}

beforeAll(async () => {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  privateKey = pair.privateKey;
  publicJwk = { ...(await crypto.subtle.exportKey('jwk', pair.publicKey)), kid: KID, alg: 'RS256', use: 'sig' };
  ID = await emailToSaveId(EMAIL);
});

afterEach(() => vi.unstubAllGlobals());

/** `fetch` falso: serve o JWK e recusa qualquer outra URL (nada sai daqui). */
function stubJwks() {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (String(url).includes('securetoken@system.gserviceaccount.com')) {
      return new Response(JSON.stringify({ keys: [publicJwk] }), { headers: { 'cache-control': 'max-age=1' } });
    }
    return new Response('nope', { status: 500 });
  }));
}

const env = (seed = {}) => ({ DIGIAPP_SAVES: fakeKV(seed), FIREBASE_PROJECT_ID: PROJECT });
const req = (url, { method = 'GET', token, body } = {}) => new Request(url, {
  method,
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});

describe('(1) reabertura por login posterior à exclusão — 00-skeptic-r2 #1', () => {
  it('authorizeSaveAccess expõe `authTime` (claim auth_time) do token', async () => {
    stubJwks();
    const authTime = Math.floor(Date.now() / 1000) - 10;
    const r = await authorizeSaveAccess(req('https://x/api/save', { token: await tokenCom({ authTime }) }), env(), ID);
    expect(r.ok).toBe(true);
    expect(r.authTime).toBe(authTime);
    expect(r.tombstone).toEqual({ deleted: false, reopened: false });
  });

  it('mesmo e-mail RELOGADO depois da exclusão → POST /api/save 200 e a lápide SOME', async () => {
    stubJwks();
    const e = env();
    const exclusaoEm = Date.now() - 60_000; // apagou há 1 min
    await writeTombstone(e, ID, exclusaoEm);
    expect(e.DIGIAPP_SAVES.store.has(tombstoneKey(ID))).toBe(true);
    vi.spyOn(console, 'info').mockImplementation(() => {});

    const token = await tokenCom({ authTime: Math.floor(Date.now() / 1000) }); // logou AGORA
    const r = await saveRoute({ request: req(`https://x/api/save?id=${ID}`, { method: 'POST', token, body: { state: { petName: 'Nova' } } }), env: e });
    expect(r.status).toBe(200);
    expect(e.DIGIAPP_SAVES.store.has(ID), 'a conta nova gravou').toBe(true);
    expect(e.DIGIAPP_SAVES.store.has(tombstoneKey(ID)), 'a lápide saiu').toBe(false);
  });

  it('sessão ANTERIOR à exclusão (aparelho esquecido) → 410 e nada gravado', async () => {
    stubJwks();
    const e = env();
    const authTime = Math.floor(Date.now() / 1000) - 3600; // logou há 1 h
    await writeTombstone(e, ID, Date.now() - 60_000);       // apagou há 1 min
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const token = await tokenCom({ authTime });
    for (const method of ['POST', 'GET']) {
      const r = await saveRoute({
        request: req(`https://x/api/save?id=${ID}`, { method, token, body: method === 'POST' ? { state: { petName: 'X' } } : undefined }),
        env: e,
      });
      expect(r.status, method).toBe(410);
      expect(await r.json()).toMatchObject({ error: 'account-deleted', deletedAt: expect.any(Number) });
    }
    expect(e.DIGIAPP_SAVES.store.has(ID)).toBe(false);
    expect(e.DIGIAPP_SAVES.store.has(tombstoneKey(ID)), 'a lápide fica').toBe(true);
  });

  it('token sem `auth_time` nunca reabre; lápide sem `at` (formato antigo) reabre para qualquer login real', async () => {
    const e = env();
    e.DIGIAPP_SAVES.store.set(tombstoneKey(ID), JSON.stringify({}));
    expect(await gateTombstone(e, ID, 0)).toMatchObject({ deleted: true, reopened: false, at: expect.any(Number) });
    expect(await gateTombstone(e, ID, undefined)).toMatchObject({ deleted: true, reopened: false, at: expect.any(Number) });
    vi.spyOn(console, 'info').mockImplementation(() => {});
    expect(await gateTombstone(e, ID, 1)).toEqual({ deleted: false, reopened: true });
    expect(e.DIGIAPP_SAVES.store.has(tombstoneKey(ID))).toBe(false);
  });

  it('sem FIREBASE_PROJECT_ID (auth desligada) não há auth_time: lápide vigente sempre bloqueia', async () => {
    const e = { DIGIAPP_SAVES: fakeKV() };
    await writeTombstone(e, ID);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await saveRoute({ request: req(`https://x/api/save?id=${ID}`, { method: 'POST', body: { state: {} } }), env: e });
    expect(r.status).toBe(410);
  });

  it('a autorização vem ANTES da lápide: quem não é o dono toma 403, nunca descobre o 410', async () => {
    stubJwks();
    const e = env();
    await writeTombstone(e, ID);
    const outro = await tokenCom({ authTime: Math.floor(Date.now() / 1000), email: 'intruso@exemplo.com' });
    const r = await saveRoute({ request: req(`https://x/api/save?id=${ID}`, { token: outro }), env: e });
    expect(r.status).toBe(403);
  });
});

describe('(2) a lápide cobre TODAS as rotas que autorizam em nome do saveId — 01-seguranca §1.3', () => {
  // Auth desligada de propósito: é o modo em que o QA achou o furo, e é o
  // modo em que `authorizeSaveAccess` era fail-open SEM olhar a lápide.
  const apagada = async (extra = {}) => {
    const e = { DIGIAPP_SAVES: fakeKV(), PUSH_SUBSCRIPTIONS: fakeKV(), ...extra };
    await writeTombstone(e, ID);
    return e;
  };

  it('community.js — profile POST (o que recriava o diretório público) → 410, nada gravado', async () => {
    const e = await apagada();
    const r = await communityRoute({ request: req('https://x/api/community?action=profile', { method: 'POST', body: { id: ID, name: 'Fantasma', stage: 'rookie' } }), env: e });
    expect(r.status).toBe(410);
    expect(await r.json()).toMatchObject({ error: 'account-deleted', deletedAt: expect.any(Number) });
    expect([...e.DIGIAPP_SAVES.store.keys()].filter(k => k.startsWith('profile:') || k.startsWith('pid:'))).toEqual([]);
  });

  it.each([
    ['friends', 'POST', { friendId: 'b'.repeat(32) }],
    ['coopCreate', 'POST', { name: 'g' }],
    ['coopLeave', 'POST', {}],
    ['gifts', 'GET', null],
  ])('community.js — action=%s (%s) → 410', async (action, method, body) => {
    const e = await apagada();
    const url = `https://x/api/community?action=${action}&id=${ID}`;
    const r = await communityRoute({ request: req(url, { method, body: body ? { id: ID, ...body } : undefined }), env: e });
    expect(r.status).toBe(410);
  });

  it('generate-sprite.js (conta paga apagada) → 410 antes de gastar qualquer coisa', async () => {
    const e = await apagada({ HIGGSFIELD_API_KEY: 'k' });
    // `requirePaidTier` vem antes da autorização (demo toma 402 primeiro); a
    // conta relevante aqui é a PAGA que se apagou — o resíduo minimizado do
    // entitlement continua `paid`.
    e.DIGIAPP_SAVES.store.set(`ent:${ID}`, JSON.stringify({ tier: 'paid', credits: 0, consumedOrders: [], orderDetails: [{ orderId: 'o1', grantTier: 'paid' }] }));
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('não pode chegar aqui'); }));
    const r = await spritePost({ request: req('https://x/api/generate-sprite', { method: 'POST', body: { id: ID, prompt: 'x', formId: 'rookie' } }), env: e });
    expect(r.status).toBe(410);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('entitlements.js GET → 410', async () => {
    const e = await apagada();
    const r = await entitlementsGet({ request: req(`https://x/api/entitlements?id=${ID}`), env: e });
    expect(r.status).toBe(410);
  });

  it('subscribe.js / fcm-subscribe.js COM saveId da conta apagada → 410, nada gravado no namespace de push', async () => {
    const e = await apagada();
    const web = await subscribePost({
      request: req('https://x/api/subscribe', { method: 'POST', body: { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'A'.repeat(20), auth: 'B'.repeat(20) }, saveId: ID } }),
      env: e,
    });
    expect(web.status).toBe(410);
    const fcm = await fcmPost({
      request: req('https://x/api/fcm-subscribe', { method: 'POST', body: { token: 'c'.repeat(64), saveId: ID } }),
      env: e,
    });
    expect(fcm.status).toBe(410);
    expect(e.PUSH_SUBSCRIPTIONS.store.size).toBe(0);
  });

  it('subscribe.js SEM saveId continua 201: inscrição anônima não é da conta apagada', async () => {
    const e = await apagada();
    const web = await subscribePost({
      request: req('https://x/api/subscribe', { method: 'POST', body: { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'A'.repeat(20), auth: 'B'.repeat(20) } } }),
      env: e,
    });
    expect(web.status).toBe(201);
  });
});
