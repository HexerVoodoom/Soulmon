/**
 * REGISTRO §49 (dono, 14/10/2026) — compra creditada sozinha, restauração que
 * não recredita, e compra de conta EXCLUÍDA que não vale em conta nova.
 * Mesmo instrumento de `billing.play.test.js` (RSA real, só o Google falso).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
  authStatus: () => 200,
}));

import { onRequestPost } from './billing.js';
import { onRequest as account } from './account.js';
import { _resetPlayTokenCache } from './_billing.js';
import { ENT_PREFIX } from './_entitlements.js';

const ID = 'a'.repeat(32);
const NOVA = 'b'.repeat(32);
const PACKAGE = 'com.soulmon.app';
let SA;

beforeAll(async () => {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const b64 = Buffer.from(await crypto.subtle.exportKey('pkcs8', pair.privateKey)).toString('base64');
  SA = JSON.stringify({ client_email: 'x@y.iam.gserviceaccount.com', private_key: `-----BEGIN PRIVATE KEY-----\n${b64.replace(/.{64}/g, '$&\n')}\n-----END PRIVATE KEY-----\n` });
});

function fakeKV() {
  const store = new Map();
  return {
    store,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: {} }),
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const mkEnv = () => ({ DIGIAPP_SAVES: fakeKV(), GOOGLE_PLAY_SERVICE_ACCOUNT: SA, ANDROID_PACKAGE_NAME: PACKAGE, FIREBASE_PROJECT_ID: 'soulmon-test' });

/** Google falso; `purchase` pode mudar entre chamadas. */
let purchase;
beforeEach(() => {
  _resetPlayTokenCache();
  vi.stubGlobal('fetch', vi.fn(async url => {
    const u = String(url);
    if (u.includes('oauth2.googleapis.com')) return Response.json({ access_token: 't', expires_in: 3600 });
    return Response.json(purchase);
  }));
});
afterEach(() => { vi.unstubAllGlobals(); _resetPlayTokenCache(); });

const buy = (e, id, productId, token) => onRequestPost({
  request: new Request('https://x/api/billing?action=verify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, productId, purchaseToken: token }),
  }),
  env: e,
});
const ent = (e, id = ID) => JSON.parse(e.DIGIAPP_SAVES.store.get(ENT_PREFIX + id) ?? 'null');

describe('restaurar NÃO recredita consumível', () => {
  it('o mesmo pacote reenviado 3x (restaurar/reconciliar) credita UMA vez', async () => {
    purchase = { purchaseState: 0, orderId: 'GPA.1', obfuscatedExternalAccountId: ID };
    const e = mkEnv();
    for (let i = 0; i < 3; i++) await buy(e, ID, 'soulmon.credits.150', 'tok-pack');
    expect(ent(e).credits).toBe(150);
  });

  it('pacote JÁ CONSUMIDO na Play e fora do histórico da conta é recusado (consumido não é entrega pendente)', async () => {
    purchase = { purchaseState: 0, orderId: 'GPA.2', consumptionState: 1, obfuscatedExternalAccountId: ID };
    const e = mkEnv();
    const res = await buy(e, ID, 'soulmon.credits.60', 'tok-velho');
    expect(res.status).toBe(409);
    expect((await res.json()).reason).toBe('already-consumed');
    expect(ent(e)).toBeNull();
  });

  it('pacote consumido que JÁ foi creditado volta duplicate, sem novo saldo (créditos gastos não voltam)', async () => {
    const e = mkEnv();
    purchase = { purchaseState: 0, orderId: 'GPA.3', obfuscatedExternalAccountId: ID };
    await buy(e, ID, 'soulmon.credits.60', 'tok-3');
    const raw = ent(e); raw.credits = 0; // gastou tudo
    e.DIGIAPP_SAVES.store.set(ENT_PREFIX + ID, JSON.stringify(raw));
    purchase = { purchaseState: 0, orderId: 'GPA.3', consumptionState: 1, obfuscatedExternalAccountId: ID };
    const body = await (await buy(e, ID, 'soulmon.credits.60', 'tok-3')).json();
    expect(body.duplicate).toBe(true);
    expect(ent(e).credits).toBe(0);
  });

  it('desbloqueio permanente: reconhecido uma vez, restaurar de novo é no-op', async () => {
    purchase = { purchaseState: 0, orderId: 'GPA.4', obfuscatedExternalAccountId: ID };
    const e = mkEnv();
    const a = await (await buy(e, ID, 'soulmon.unlock.full', 'tok-4')).json();
    const b = await (await buy(e, ID, 'soulmon.unlock.full', 'tok-4')).json();
    expect(a.duplicate).toBe(false);
    expect(b.duplicate).toBe(true);
    expect(ent(e).consumedOrders).toEqual(['play:GPA.4']);
  });
});

describe('compra de conta EXCLUÍDA não vale em conta nova', () => {
  async function excluir(e, id) {
    const post = (qs, body) => new Request(`https://x/api/account?${qs}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}),
    });
    const { confirmToken } = await (await account({ request: post(`action=delete-request&id=${id}`), env: e })).json();
    const r = await account({ request: post(`action=delete-confirm&id=${id}`, { confirmToken }), env: e });
    expect(r.status).toBe(200);
  }

  it('pagou, excluiu, criou outra conta: 409 order-in-use, nada concedido', async () => {
    purchase = { purchaseState: 0, orderId: 'GPA.5', obfuscatedExternalAccountId: ID };
    const e = mkEnv();
    e.DIGIAPP_SAVES.store.set(ID, JSON.stringify({ petName: 'x' }));
    await buy(e, ID, 'soulmon.unlock.full', 'tok-5');
    expect(ent(e).tier).toBe('paid');
    await excluir(e, ID);
    expect(e.DIGIAPP_SAVES.store.get('ord:play:GPA.5')).toBe('deleted');
    purchase = { purchaseState: 0, orderId: 'GPA.5' }; // recibo sem vínculo = pior caso
    const res = await buy(e, NOVA, 'soulmon.unlock.full', 'tok-5');
    expect(res.status).toBe(409);
    expect(ent(e, NOVA)).toBeNull();
  });

  it('mesmo e-mail (mesmo saveId) volta: também NÃO recupera — paga de novo', async () => {
    purchase = { purchaseState: 0, orderId: 'GPA.6', obfuscatedExternalAccountId: ID };
    const e = mkEnv();
    e.DIGIAPP_SAVES.store.set(ID, JSON.stringify({ petName: 'x' }));
    await buy(e, ID, 'soulmon.credits.400', 'tok-6');
    await excluir(e, ID);
    const res = await buy(e, ID, 'soulmon.credits.400', 'tok-6');
    expect(res.status).toBe(409);
    expect(ent(e).tier).toBe('demo');
    expect(ent(e).credits).toBe(0);
  });
});
