// BETA-FULL (`_betaFull.js`): e-mail da allowlist = plano pago, derivado do token.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { verifiedBetaFull, betaFullPublicView } from './_betaFull.js';
import { emailToSaveId } from './_auth.js';
import { onRequestGet, onRequestPost } from './entitlements.js';
import { onRequest as saveRoute } from './save.js';
import { ENT_PREFIX, readEntitlement } from './_entitlements.js';
import { OTHER, installJwks, token, envWith, reqWith } from './admin.testkit.js';

const BETA = 'Tester.Beta@Example.test';
let BETA_ID, OTHER_ID;
const env = (extra = {}) => envWith({ ADMIN_EMAILS: '', BETA_EMAILS: ` ${BETA.toLowerCase()} , x@y.z`, ...extra });

beforeAll(async () => {
  await installJwks();
  BETA_ID = await emailToSaveId(BETA);
  OTHER_ID = await emailToSaveId(OTHER);
});
afterAll(() => vi.unstubAllGlobals());

const get = (e, tok, id) => onRequestGet({ request: reqWith(tok, `https://x/api/entitlements?id=${id}`), env: e });

describe('verifiedBetaFull', () => {
  it('e-mail na lista + token verificado -> true (comparação normalizada)', async () => {
    expect(await verifiedBetaFull(env(), reqWith(await token(BETA)))).toEqual({ betaFull: true });
    expect(await verifiedBetaFull(env(), reqWith(await token(BETA)), BETA_ID)).toEqual({ betaFull: true });
  });
  it('fora da lista, sem lista, sem projeto, sem token -> false', async () => {
    expect((await verifiedBetaFull(env(), reqWith(await token(OTHER)))).betaFull).toBe(false);
    expect((await verifiedBetaFull(env({ BETA_EMAILS: '' }), reqWith(await token(BETA)))).betaFull).toBe(false);
    expect((await verifiedBetaFull(env({ FIREBASE_PROJECT_ID: '' }), reqWith(await token(BETA)))).betaFull).toBe(false);
    expect((await verifiedBetaFull(env(), reqWith(null))).betaFull).toBe(false);
  });
  it('email_verified:false (conta forjada com o e-mail da lista) -> false', async () => {
    expect((await verifiedBetaFull(env(), reqWith(await token(BETA, { email_verified: false })))).betaFull).toBe(false);
  });
  it('token de OUTRO save -> false (sem impersonação)', async () => {
    expect((await verifiedBetaFull(env(), reqWith(await token(BETA)), OTHER_ID)).betaFull).toBe(false);
  });
});

describe('GET /api/entitlements', () => {
  it('allowlist: tier paid + betaFull + provider beta, créditos reais, nada gravado em ent:', async () => {
    const e = env();
    const r = await get(e, await token(BETA), BETA_ID);
    const j = await r.json();
    expect(j).toMatchObject({ tier: 'paid', betaFull: true, provider: 'beta', admin: false });
    expect(j.credits).toBeLessThan(1000);
    const gravado = await e.DIGIAPP_SAVES.get(ENT_PREFIX + BETA_ID);
    expect(gravado === null || JSON.parse(gravado).tier === 'demo').toBe(true);
  });
  it('fora da lista continua demo e sem betaFull', async () => {
    const j = await (await get(env(), await token(OTHER), OTHER_ID)).json();
    expect(j.tier).toBe('demo');
    expect(j.betaFull).toBeUndefined();
  });
  it('sai da lista -> volta a demo na leitura seguinte (revoga)', async () => {
    const e = env();
    expect((await (await get(e, await token(BETA), BETA_ID)).json()).tier).toBe('paid');
    e.BETA_EMAILS = 'outra@pessoa.test';
    expect((await (await get(e, await token(BETA), BETA_ID)).json()).tier).toBe('demo');
  });
  it('compra real depois nao duplica: tier segue paid, flag continua', async () => {
    const e = env();
    await e.DIGIAPP_SAVES.put(ENT_PREFIX + BETA_ID, JSON.stringify({ tier: 'paid', credits: 5, consumedOrders: ['o1'], orderDetails: [{ orderId: 'o1', provider: 'play', grantTier: 'paid', grantCredits: 0 }], auditedAt: Date.now() }));
    const j = await (await get(e, await token(BETA), BETA_ID)).json();
    expect(j).toMatchObject({ tier: 'paid', betaFull: true, credits: 5 });
  });
  it('action=beta-full sem id: so o token decide', async () => {
    const q = async (e, tok) => (await (await onRequestGet({ request: reqWith(tok, 'https://x/api/entitlements?action=beta-full'), env: e })).json()).betaFull;
    expect(await q(env(), await token(BETA))).toBe(true);
    expect(await q(env(), await token(OTHER))).toBe(false);
    expect(await q(env(), null)).toBe(false);
  });
});

describe('save GET e rebirth-reset', () => {
  it('save GET devolve accountTier paid para a allowlist', async () => {
    const e = env();
    await e.DIGIAPP_SAVES.put(BETA_ID, JSON.stringify({ accountTier: 'demo', credits: 0 }));
    const r = await saveRoute({ request: reqWith(await token(BETA), `https://x/api/save?id=${BETA_ID}`), env: e });
    expect((await r.json()).state.accountTier).toBe('paid');
  });
  it('rebirth-reset nao recusa como not-paid para a allowlist', async () => {
    const e = env();
    await e.DIGIAPP_SAVES.put(BETA_ID, JSON.stringify({ rebirth: { at: '2026-10-01', fromStage: 'x' }, totalXP: 0 }));
    const r = await onRequestPost({
      request: reqWith(await token(BETA), 'https://x/api/entitlements?action=rebirth-reset', { method: 'POST', body: JSON.stringify({ id: BETA_ID }) }),
      env: e,
    });
    expect((await r.json()).reason).not.toBe('not-paid');
  });
});

it('betaFullPublicView preserva provider real e creditos', () => {
  expect(betaFullPublicView({ tier: 'demo', credits: 3, adsLeft: 1 })).toMatchObject({ tier: 'paid', credits: 3, provider: 'beta', betaFull: true });
  expect(betaFullPublicView({ tier: 'paid', credits: 3, provider: 'play' }).provider).toBe('play');
});

it('nenhum log da sessao contem e-mail', async () => {
  const spy = vi.spyOn(console, 'log');
  await verifiedBetaFull(env(), reqWith(await token(BETA)), BETA_ID);
  expect(JSON.stringify(spy.mock.calls)).not.toMatch(/example\.test/);
  spy.mockRestore();
});
