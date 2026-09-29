// Admin × tetos de sprite: ×ADMIN_AI_CAP_MULTIPLIER nos POR CONTA, global intacto.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { guardAiRequest, AI_LIMITS } from './_aiGuard.js';
import { ADMIN_AI_CAP_MULTIPLIER, ADMIN_SPRITE_MONTHLY_CAP } from './_admin.js';
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
  it('é 3 e o sub-teto mensal é 40, em constantes', () => { expect(ADMIN_AI_CAP_MULTIPLIER).toBe(3); expect(ADMIN_SPRITE_MONTHLY_CAP).toBe(40); });

  it('diário: admin passa de 6 até 18; o comum para em 6', async () => {
    const env = envWith();
    expect((await run(env, OTHER, OTHER_ID, L.perAccount)).ok).toBe(true);
    expect(await run(env, OTHER, OTHER_ID, 1)).toMatchObject({ ok: false, reason: 'ai-daily-limit' });
    expect((await run(env, ADMIN, ADMIN_ID, L.perAccount * ADMIN_AI_CAP_MULTIPLIER)).ok).toBe(true);
    expect(await run(env, ADMIN, ADMIN_ID, 1)).toMatchObject({ ok: false, reason: 'ai-daily-limit' });
  });

  it('por forma: admin até 9; o comum até 3', async () => {
    const env = envWith();
    expect((await run(env, OTHER, OTHER_ID, L.perFormLifetime, 'rookie')).ok).toBe(true);
    expect(await run(env, OTHER, OTHER_ID, 1, 'rookie')).toMatchObject({ ok: false, reason: 'sprite-form-cap' });
    env.DIGIAPP_SAVES.store.set(ENT_PREFIX + ADMIN_ID, JSON.stringify({ tier: 'demo', credits: 0, aiForms: { rookie: L.perFormLifetime * ADMIN_AI_CAP_MULTIPLIER - 1 } }));
    expect((await run(env, ADMIN, ADMIN_ID, 1, 'rookie')).ok).toBe(true);
    expect(await run(env, ADMIN, ADMIN_ID, 1, 'rookie')).toMatchObject({ ok: false, reason: 'sprite-form-cap' });
  });

  it('vitalício: admin até 78; o comum até 26', async () => {
    const env = envWith();
    env.DIGIAPP_SAVES.store.set(ENT_PREFIX + OTHER_ID, JSON.stringify({ tier: 'paid', credits: 0, aiLifetime: { sprite: L.perAccountLifetime } }));
    expect(await run(env, OTHER, OTHER_ID, 1)).toMatchObject({ ok: false, reason: 'sprite-lifetime-cap' });
    env.DIGIAPP_SAVES.store.set(ENT_PREFIX + ADMIN_ID, JSON.stringify({ tier: 'demo', credits: 0, aiLifetime: { sprite: L.perAccountLifetime } }));
    expect((await run(env, ADMIN, ADMIN_ID, 1)).ok).toBe(true);
    env.DIGIAPP_SAVES.store.set(ENT_PREFIX + ADMIN_ID, JSON.stringify({ tier: 'demo', credits: 0, aiLifetime: { sprite: L.perAccountLifetime * ADMIN_AI_CAP_MULTIPLIER } }));
    expect(await run(env, ADMIN, ADMIN_ID, 1)).toMatchObject({ ok: false, reason: 'sprite-lifetime-cap' });
  });

  it('o teto GLOBAL mensal vale para o admin', async () => {
    const env = envWith();
    const mes = new Date().toISOString().slice(0, 7);
    env.DIGIAPP_SAVES.store.set(`ai:sprite:@all:${mes}`, String(L.globalMonth));
    expect(await run(env, ADMIN, ADMIN_ID, 1)).toMatchObject({ ok: false, status: 503, reason: 'ai-monthly-budget-reached' });
  });

  it('chat não ganha multiplicador, mas o admin usa a cota PAGA (B-2)', async () => {
    const env = envWith();
    const paid = AI_LIMITS.chat.perAccountByTier.paid;
    const tok = await token(ADMIN);
    let r;
    for (let i = 0; i < paid; i++) r = await guardAiRequest(reqWith(tok), env, 'chat', ADMIN_ID);
    expect(r.ok).toBe(true);
    expect(await guardAiRequest(reqWith(tok), env, 'chat', ADMIN_ID)).toMatchObject({ ok: false, reason: 'ai-daily-limit' });
  });

  it('chat de conta demo comum segue em 30', async () => {
    const env = envWith();
    const tok = await token(OTHER);
    let r;
    for (let i = 0; i < AI_LIMITS.chat.perAccountByTier.demo; i++) r = await guardAiRequest(reqWith(tok), env, 'chat', OTHER_ID);
    expect(r.ok).toBe(true);
    expect(await guardAiRequest(reqWith(tok), env, 'chat', OTHER_ID)).toMatchObject({ ok: false, reason: 'ai-daily-limit' });
  });

  it('modo aberto: nem o saveId do dono ganha o multiplicador', async () => {
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
    expect(await r.json()).toMatchObject({ error: 'paid-tier-required' });
  });
  it('conta demo comum (token verificado, não admin) recebe 402 paid-tier-required', async () => {
    const env = envWith();
    env.DIGIAPP_SAVES.store.set(ENT_PREFIX + OTHER_ID, JSON.stringify({ tier: 'demo', credits: 0 }));
    const r = await gerarSprite({ request: reqWith(await token(OTHER), 'https://x/api/generate-sprite', { method: 'POST', body: body(OTHER_ID) }), env });
    expect(r.status).toBe(402);
    expect(await r.json()).toEqual({ error: 'paid-tier-required' });
  });
  it('admin NÃO fura recusa que não seja 402 (tier indeterminável segue 503)', async () => {
    const env = envWith();
    const orig = env.DIGIAPP_SAVES.get;
    env.DIGIAPP_SAVES.get = async (k, ...a) => { if (String(k).startsWith(ENT_PREFIX)) throw new Error('kv fora'); return orig(k, ...a); };
    const r = await gerarSprite({ request: reqWith(await token(ADMIN), 'https://x/api/generate-sprite', { method: 'POST', body: body(ADMIN_ID) }), env });
    expect(r.status).toBe(503);
    expect(await r.json()).toMatchObject({ error: 'tier-unavailable' });
  });
  it('token do admin com id de OUTRO save: 402 (sem admin fora da própria conta)', async () => {
    const r = await gerarSprite({ request: reqWith(await token(ADMIN), 'https://x/api/generate-sprite', { method: 'POST', body: body(OTHER_ID) }), env: envWith() });
    expect(r.status).toBe(402);
  });
});

describe('sub-teto mensal do admin (M-1)', () => {
  const mes = () => new Date().toISOString().slice(0, 7);
  it('atingido: 503 igual ao do teto global, sem contar no global além do gasto', async () => {
    const env = envWith();
    env.DIGIAPP_SAVES.store.set(`ai:sprite:@admin:${mes()}`, String(ADMIN_SPRITE_MONTHLY_CAP));
    const r = await run(env, ADMIN, ADMIN_ID, 1);
    expect(r).toMatchObject({ ok: false, status: 503, reason: 'ai-monthly-budget-reached' });
    expect(JSON.stringify(r)).not.toMatch(/admin/i);
    expect(env.DIGIAPP_SAVES.store.get(`ai:sprite:@all:${mes()}`) ?? '0').toBe('0');
  });
  it('abaixo do sub-teto passa e debita a chave do admin e a global', async () => {
    const env = envWith();
    env.DIGIAPP_SAVES.store.set(`ai:sprite:@admin:${mes()}`, String(ADMIN_SPRITE_MONTHLY_CAP - 1));
    expect((await run(env, ADMIN, ADMIN_ID, 1)).ok).toBe(true);
    expect(env.DIGIAPP_SAVES.store.get(`ai:sprite:@admin:${mes()}`)).toBe(String(ADMIN_SPRITE_MONTHLY_CAP));
    expect(env.DIGIAPP_SAVES.store.get(`ai:sprite:@all:${mes()}`)).toBe('1');
    expect(await run(env, ADMIN, ADMIN_ID, 1)).toMatchObject({ ok: false, reason: 'ai-monthly-budget-reached' });
  });
  it('release devolve a unidade do sub-teto', async () => {
    const env = envWith();
    const r = await run(env, ADMIN, ADMIN_ID, 1);
    await r.release('teste');
    expect(env.DIGIAPP_SAVES.store.get(`ai:sprite:@admin:${mes()}`)).toBe('0');
  });
  it('a chave não leva saveId nem e-mail', async () => {
    const env = envWith();
    await run(env, ADMIN, ADMIN_ID, 1);
    const k = [...env.DIGIAPP_SAVES.store.keys()].find((x) => x.includes('@admin'));
    expect(k).toBe(`ai:sprite:@admin:${mes()}`);
  });
  it('não-admin: sub-teto cheio não o afeta', async () => {
    const env = envWith();
    env.DIGIAPP_SAVES.store.set(`ai:sprite:@admin:${mes()}`, String(ADMIN_SPRITE_MONTHLY_CAP));
    expect((await run(env, OTHER, OTHER_ID, 1)).ok).toBe(true);
    expect(env.DIGIAPP_SAVES.store.has(`ai:sprite:@admin:${mes()}`)).toBe(true);
  });
  it('pior caso: o admin nunca passa de 40 no mês, mesmo com o global folgado', async () => {
    const env = envWith();
    let ok = 0;
    for (let d = 0; d < 3; d++) {
      // zera só o contador diário para simular dias diferentes
      for (const k of [...env.DIGIAPP_SAVES.store.keys()]) if (k.startsWith(`ai:sprite:${ADMIN_ID}:`)) env.DIGIAPP_SAVES.store.delete(k);
      for (let i = 0; i < 18; i++) if ((await run(env, ADMIN, ADMIN_ID, 1)).ok) ok++;
    }
    expect(ok).toBeLessThanOrEqual(ADMIN_SPRITE_MONTHLY_CAP);
  });
});
