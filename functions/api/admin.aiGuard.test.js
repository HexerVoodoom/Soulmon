// Admin × tetos de sprite: ×ADMIN_AI_CAP_MULTIPLIER nos POR CONTA, global intacto.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { guardAiRequest, AI_LIMITS } from './_aiGuard.js';
import { ADMIN_AI_CAP_MULTIPLIER } from './_admin.js';
import { emailToSaveId } from './_auth.js';
import { ENT_PREFIX } from './_entitlements.js';
import { onRequestPost as gerarSprite } from './generate-sprite.js';
import { ADMIN, OTHER, installJwks, token, envWith, reqWith } from './admin.testkit.js';

let ADMIN_ID, OTHER_ID;
beforeAll(async () => {
  await installJwks();
  ADMIN_ID = await emailToSaveId(ADMIN);
  OTHER_ID = await emailToSaveId(OTHER);
});
afterAll(() => vi.unstubAllGlobals());

const L = AI_LIMITS.sprite;
const run = async (env, email, id, n, formId = null) => {
  const tok = await token(email);
  let last;
  for (let i = 0; i < n; i++) last = await guardAiRequest(reqWith(tok), env, 'sprite', id, 1, formId);
  return last;
};

describe('multiplicador do admin', () => {
  it('é 10, numa constante', () => expect(ADMIN_AI_CAP_MULTIPLIER).toBe(10));

  it('diário: admin passa de 6 até 60; o comum para em 6', async () => {
    const env = envWith();
    expect((await run(env, OTHER, OTHER_ID, L.perAccount)).ok).toBe(true);
    expect(await run(env, OTHER, OTHER_ID, 1)).toMatchObject({ ok: false, reason: 'ai-daily-limit' });
    expect((await run(env, ADMIN, ADMIN_ID, L.perAccount * 10)).ok).toBe(true);
    expect(await run(env, ADMIN, ADMIN_ID, 1)).toMatchObject({ ok: false, reason: 'ai-daily-limit' });
  });

  it('por forma: admin até 30; o comum até 3', async () => {
    const env = envWith();
    expect((await run(env, OTHER, OTHER_ID, L.perFormLifetime, 'rookie')).ok).toBe(true);
    expect(await run(env, OTHER, OTHER_ID, 1, 'rookie')).toMatchObject({ ok: false, reason: 'sprite-form-cap' });
    env.DIGIAPP_SAVES.store.set(ENT_PREFIX + ADMIN_ID, JSON.stringify({ tier: 'demo', credits: 0, aiForms: { rookie: L.perFormLifetime * 10 - 1 } }));
    expect((await run(env, ADMIN, ADMIN_ID, 1, 'rookie')).ok).toBe(true);
    expect(await run(env, ADMIN, ADMIN_ID, 1, 'rookie')).toMatchObject({ ok: false, reason: 'sprite-form-cap' });
  });

  it('vitalício: admin até 260; o comum até 26', async () => {
    const env = envWith();
    env.DIGIAPP_SAVES.store.set(ENT_PREFIX + OTHER_ID, JSON.stringify({ tier: 'paid', credits: 0, aiLifetime: { sprite: L.perAccountLifetime } }));
    expect(await run(env, OTHER, OTHER_ID, 1)).toMatchObject({ ok: false, reason: 'sprite-lifetime-cap' });
    env.DIGIAPP_SAVES.store.set(ENT_PREFIX + ADMIN_ID, JSON.stringify({ tier: 'demo', credits: 0, aiLifetime: { sprite: L.perAccountLifetime } }));
    expect((await run(env, ADMIN, ADMIN_ID, 1)).ok).toBe(true);
    env.DIGIAPP_SAVES.store.set(ENT_PREFIX + ADMIN_ID, JSON.stringify({ tier: 'demo', credits: 0, aiLifetime: { sprite: L.perAccountLifetime * 10 } }));
    expect(await run(env, ADMIN, ADMIN_ID, 1)).toMatchObject({ ok: false, reason: 'sprite-lifetime-cap' });
  });

  it('o teto GLOBAL mensal vale para o admin', async () => {
    const env = envWith();
    const mes = new Date().toISOString().slice(0, 7);
    env.DIGIAPP_SAVES.store.set(`ai:sprite:@all:${mes}`, String(L.globalMonth));
    expect(await run(env, ADMIN, ADMIN_ID, 1)).toMatchObject({ ok: false, status: 503, reason: 'ai-monthly-budget-reached' });
  });

  it('chat não ganha multiplicador (só sprite)', async () => {
    const env = envWith();
    const tok = await token(ADMIN);
    let r;
    for (let i = 0; i <= AI_LIMITS.chat.perAccountByTier.demo; i++) r = await guardAiRequest(reqWith(tok), env, 'chat', ADMIN_ID);
    expect(r).toMatchObject({ ok: false, reason: 'ai-daily-limit' });
  });

  it('modo aberto: nem o saveId do dono ganha ×10', async () => {
    const env = envWith({ FIREBASE_PROJECT_ID: undefined });
    for (let i = 0; i < L.perAccount; i++) expect((await guardAiRequest(reqWith(null), env, 'sprite', ADMIN_ID)).ok).toBe(true);
    expect(await guardAiRequest(reqWith(null), env, 'sprite', ADMIN_ID)).toMatchObject({ ok: false, reason: 'ai-daily-limit' });
  });
});

describe('generate-sprite: requirePaidTier', () => {
  const body = (id) => JSON.stringify({ prompt: 'p', id, formId: 'rookie' });
  it('admin demo passa do portão de tier (cai no provedor não configurado, não em 402)', async () => {
    const r = await gerarSprite({ request: reqWith(await token(ADMIN), 'https://x/api/generate-sprite', { method: 'POST', body: body(ADMIN_ID) }), env: envWith() });
    expect(r.status).not.toBe(402);
  });
  it('não-admin demo continua 402', async () => {
    const r = await gerarSprite({ request: reqWith(await token(OTHER), 'https://x/api/generate-sprite', { method: 'POST', body: body(OTHER_ID) }), env: envWith() });
    expect(r.status).toBe(402);
  });
  it('token do admin com id de OUTRO save: 402 (sem admin fora da própria conta)', async () => {
    const r = await gerarSprite({ request: reqWith(await token(ADMIN), 'https://x/api/generate-sprite', { method: 'POST', body: body(OTHER_ID) }), env: envWith() });
    expect(r.status).toBe(402);
  });
});
