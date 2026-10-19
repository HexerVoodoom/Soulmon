/**
 * KILL-SWITCHES do beta (`_killSwitch.js`, BETA-CONTINGENCIA §0) — derivados do
 * critério: "com `BILLING_DISABLED` o servidor recusa NOVAS compras com mensagem
 * amigável, sem tirar de ninguém o que já foi pago" e "com `CHAT_DISABLED` o chat
 * não gasta cota e o app cai nas respostas locais".
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { onRequestPost as billing } from './billing.js';
import { onRequestPost as chat } from './chat.js';
import { onRequestGet as config } from './config.js';
import { SUBSCRIPTION_SKU, _resetPlayTokenCache } from './_billing.js';
import { ENT_PREFIX } from './_entitlements.js';
import { flagOn, isBillingDisabled, isChatDisabled, BILLING_DISABLED_MESSAGE } from './_killSwitch.js';

const ID = 'a'.repeat(32);
const OUTRO = 'b'.repeat(32);
const PACKAGE = 'com.soulmon';
const TOKEN = 'tok-kill-switch-ABCDEFGH-123';
const EXPIRY = new Date(Date.now() + 90 * 86400000).toISOString();
let SA;

function pemFromPkcs8(buf) {
  const b64 = Buffer.from(buf).toString('base64');
  return `-----BEGIN PRIVATE KEY-----\n${b64.replace(/.{64}/g, '$&\n')}\n-----END PRIVATE KEY-----\n`;
}
beforeAll(async () => {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  SA = JSON.stringify({
    client_email: 'billing@exemplo.iam.gserviceaccount.com',
    private_key: pemFromPkcs8(await crypto.subtle.exportKey('pkcs8', pair.privateKey)),
  });
});

function fakeKV() {
  const store = new Map();
  return { store, get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); } };
}
const env = (extra = {}) => ({ DIGIAPP_SAVES: fakeKV(), GOOGLE_PLAY_SERVICE_ACCOUNT: SA, ANDROID_PACKAGE_NAME: PACKAGE, ...extra });

/** Google de mentira: produto avulso, assinatura, oauth e acknowledge/consume. */
function google({ owner = ID } = {}) {
  const calls = { acks: 0, verifies: 0 };
  const stub = vi.fn(async url => {
    const u = String(url);
    if (u.includes('oauth2.googleapis.com/token')) return Response.json({ access_token: 'ya29.fake', expires_in: 3600 });
    if (u.includes(':acknowledge') || u.includes(':consume')) { calls.acks++; return new Response('{}'); }
    if (u.includes('/subscriptionsv2/tokens/')) {
      calls.verifies++;
      return Response.json({
        subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE', acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING',
        latestOrderId: 'GPA.9999-0000', lineItems: [{ productId: SUBSCRIPTION_SKU, expiryTime: EXPIRY, autoRenewingPlan: { autoRenewEnabled: true } }],
        externalAccountIdentifiers: { obfuscatedExternalAccountId: owner }, testPurchase: {},
      });
    }
    if (u.includes('/purchases/products/')) {
      calls.verifies++;
      return Response.json({ purchaseState: 0, orderId: 'GPA.1111-2222', obfuscatedExternalAccountId: owner });
    }
    throw new Error(`fetch inesperado: ${u}`);
  });
  vi.stubGlobal('fetch', stub);
  return calls;
}

const req = body => new Request('https://x/api/billing?action=verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const buy = (e, over = {}) => billing({ request: req({ id: ID, productId: 'soulmon.unlock.full', purchaseToken: TOKEN, ...over }), env: e });
const sub = (e, over = {}) => billing({ request: req({ id: ID, productId: SUBSCRIPTION_SKU, purchaseToken: TOKEN, ...over }), env: e });
const ent = (e, id = ID) => JSON.parse(e.DIGIAPP_SAVES.store.get(ENT_PREFIX + id) ?? 'null');

beforeEach(() => { _resetPlayTokenCache(); vi.spyOn(console, 'log').mockImplementation(() => {}); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); _resetPlayTokenCache(); });

describe('flagOn — o que conta como "ligado"', () => {
  it('liga com 1/true/yes/on/sim (sem caixa, com espaço)', () => {
    for (const v of ['1', 'true', 'TRUE', ' yes ', 'on', 'Sim', true, 1]) expect(flagOn(v)).toBe(true);
  });
  it('vazio, ausente, 0, false, lixo = desligado (nunca fecha a loja por engano)', () => {
    for (const v of [undefined, null, '', '0', 'false', 'no', 'off', 'talvez', 0, false, {}, []]) expect(flagOn(v)).toBe(false);
  });
  it('lê as vars certas', () => {
    expect(isBillingDisabled({ BILLING_DISABLED: '1' })).toBe(true);
    expect(isChatDisabled({ CHAT_DISABLED: '1' })).toBe(true);
    expect(isBillingDisabled({ CHAT_DISABLED: '1' })).toBe(false);
    expect(isBillingDisabled(undefined)).toBe(false);
  });
});

describe('BILLING_DISABLED — compra avulsa', () => {
  it('compra NOVA: 503 billing-disabled, mensagem PT/EN, nada concedido nem reconhecido', async () => {
    const g = google();
    const e = env({ BILLING_DISABLED: 'true' });
    const res = await buy(e);
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body).toMatchObject({ ok: false, reason: 'billing-disabled', message: BILLING_DISABLED_MESSAGE });
    expect(body.message.pt).toMatch(/Nada foi cobrado/);
    expect(ent(e)?.tier ?? 'demo').not.toBe('paid');
    expect(g.acks).toBe(0); // não reconhecida → a Play estorna em 3 dias
  });

  it('RESTAURAR o que já é desta conta continua funcionando com a loja fechada', async () => {
    google();
    const e = env();
    expect((await buy(e)).status).toBe(200); // comprou com a loja aberta
    e.BILLING_DISABLED = '1';
    const res = await buy(e); // reinstalou e restaurou
    expect(res.status).toBe(200);
    expect(ent(e).tier).toBe('paid');
  });

  it('comprovante de OUTRA conta com a loja fechada: recusado como novo (não vira 409 vazando dono)', async () => {
    google();
    const e = env();
    expect((await buy(e)).status).toBe(200);
    e.BILLING_DISABLED = '1';
    google({ owner: OUTRO });
    const res = await billing({ request: req({ id: OUTRO, productId: 'soulmon.unlock.full', purchaseToken: TOKEN }), env: e });
    expect(res.status).toBe(503);
    expect((await res.json()).reason).toBe('billing-disabled');
  });

  it('var desligada ("0") = fluxo normal', async () => {
    google();
    expect((await buy(env({ BILLING_DISABLED: '0' }))).status).toBe(200);
  });
});

describe('BILLING_DISABLED — assinatura', () => {
  it('assinatura NOVA: 503, sem vigência gravada e sem acknowledge', async () => {
    const g = google();
    const e = env({ BILLING_DISABLED: 'on' });
    const res = await sub(e);
    expect(res.status).toBe(503);
    expect((await res.json()).reason).toBe('billing-disabled');
    expect(ent(e)?.sub).toBeUndefined();
    expect(g.acks).toBe(0);
  });

  it('reconciliar a assinatura que já é desta conta segue valendo', async () => {
    google();
    const e = env();
    expect((await sub(e)).status).toBe(200);
    e.BILLING_DISABLED = '1';
    const res = await sub(e);
    expect(res.status).toBe(200);
    expect((await res.json()).subActive).toBe(true);
  });
});

describe('CHAT_DISABLED', () => {
  it('503 chat-disabled ANTES de qualquer provedor ou cota (nenhum fetch)', async () => {
    const f = vi.fn(() => { throw new Error('não deveria chamar a rede'); });
    vi.stubGlobal('fetch', f);
    const e = { DIGIAPP_SAVES: fakeKV(), GROQ_API_KEY: 'gsk_x', CHAT_DISABLED: '1' };
    const res = await chat({ request: new Request('https://x/api/chat', { method: 'POST', body: JSON.stringify({ message: 'oi', id: 'abcdefgh12345678', language: 'pt-BR' }) }), env: e });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('chat-disabled');
    expect(typeof body.message.pt).toBe('string');
    expect(f).not.toHaveBeenCalled();
    expect(e.DIGIAPP_SAVES.store.size).toBe(0); // não debitou cota
  });
});

describe('/api/config expõe os dois interruptores (e só booleanos)', () => {
  it('desligados por padrão; ligados quando a var está ligada', async () => {
    const off = await (await config({ env: {} })).json();
    expect(off.billingDisabled).toBe(false);
    expect(off.chatDisabled).toBe(false);
    const on = await (await config({ env: { BILLING_DISABLED: '1', CHAT_DISABLED: 'true' } })).json();
    expect(on.billingDisabled).toBe(true);
    expect(on.chatDisabled).toBe(true);
  });
});
