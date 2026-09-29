// Admin — o que um cliente adulterado NÃO consegue.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { onRequestGet, onRequestPost } from './entitlements.js';
import { onRequest as saveRoute } from './save.js';
import { emailToSaveId } from './_auth.js';
import { ENT_PREFIX } from './_entitlements.js';
import { ADMIN, OTHER, installJwks, token, envWith, reqWith } from './admin.testkit.js';

let ADMIN_ID, OTHER_ID;
beforeAll(async () => {
  await installJwks();
  ADMIN_ID = await emailToSaveId(ADMIN);
  OTHER_ID = await emailToSaveId(OTHER);
});
afterAll(() => vi.unstubAllGlobals());

const post = async (email, action, body, env) => onRequestPost({
  request: reqWith(email ? await token(email) : null, `https://x/api/entitlements?action=${action}`, { method: 'POST', body: JSON.stringify(body) }),
  env,
});
const ent = (env, id) => JSON.parse(env.DIGIAPP_SAVES.store.get(ENT_PREFIX + id) ?? 'null');

describe('spend', () => {
  it('admin não debita e não escreve ent:/spend:', async () => {
    const env = envWith();
    env.DIGIAPP_SAVES.store.set(ENT_PREFIX + ADMIN_ID, JSON.stringify({ tier: 'demo', credits: 0 }));
    const r = await post(ADMIN, 'spend', { id: ADMIN_ID, amount: 50, opId: 'op-12345678' }, env);
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ ok: true, admin: true, tier: 'paid' });
    expect(ent(env, ADMIN_ID)).toEqual({ tier: 'demo', credits: 0 });
    expect([...env.DIGIAPP_SAVES.store.keys()].some(k => k.startsWith('spend:'))).toBe(false);
  });
  it('outros debitam (e sem saldo, 402)', async () => {
    const env = envWith();
    env.DIGIAPP_SAVES.store.set(ENT_PREFIX + OTHER_ID, JSON.stringify({ tier: 'paid', credits: 60 }));
    const r = await post(OTHER, 'spend', { id: OTHER_ID, amount: 50 }, env);
    expect(await r.json()).toMatchObject({ ok: true, admin: false, credits: 10 });
    expect(ent(env, OTHER_ID).credits).toBe(10);
    expect((await post(OTHER, 'spend', { id: OTHER_ID, amount: 50 }, env)).status).toBe(402);
  });
  it('corpo com admin:true forjado não vale nada', async () => {
    const env = envWith();
    env.DIGIAPP_SAVES.store.set(ENT_PREFIX + OTHER_ID, JSON.stringify({ tier: 'demo', credits: 0 }));
    const r = await post(OTHER, 'spend', { id: OTHER_ID, amount: 50, admin: true, isAdmin: true, tier: 'paid' }, env);
    expect(r.status).toBe(402);
  });
  it('cabeçalho X-Admin forjado não vale nada', async () => {
    const env = envWith();
    const r = await onRequestGet({ request: reqWith(await token(OTHER), `https://x/api/entitlements?id=${OTHER_ID}`, { headers: { 'X-Admin': 'true' } }), env });
    expect(await r.json()).toMatchObject({ admin: false, tier: 'demo' });
  });
  it('modo aberto: spend no saveId do dono DEBITA (não há admin sem login)', async () => {
    const env = envWith({ FIREBASE_PROJECT_ID: undefined });
    env.DIGIAPP_SAVES.store.set(ENT_PREFIX + ADMIN_ID, JSON.stringify({ tier: 'paid', credits: 50 }));
    await post(null, 'spend', { id: ADMIN_ID, amount: 50 }, env);
    expect(ent(env, ADMIN_ID).credits).toBe(0);
  });
});

describe('ent: nunca recebe admin', () => {
  it('rebirth-reset e GET do admin não gravam admin/tier paid', async () => {
    const env = envWith();
    env.DIGIAPP_SAVES.store.set(ADMIN_ID, JSON.stringify({ rebirth: { at: '2026-09-01', fromStage: 'ultra' } }));
    await post(ADMIN, 'rebirth-reset', { id: ADMIN_ID }, env);
    await onRequestGet({ request: reqWith(await token(ADMIN), `https://x/api/entitlements?id=${ADMIN_ID}`), env });
    const e = ent(env, ADMIN_ID);
    expect(e).not.toHaveProperty('admin');
    expect(e.tier).toBe('demo');
    expect(e.credits).toBe(0);
  });
  it('POST de save do admin não grava accountTier', async () => {
    const env = envWith();
    await saveRoute({ request: reqWith(await token(ADMIN), `https://x/api/save?id=${ADMIN_ID}`, { method: 'POST', body: JSON.stringify({ state: { accountTier: 'paid', admin: true, petName: 'z' } }) }), env });
    const s = JSON.parse(env.DIGIAPP_SAVES.store.get(ADMIN_ID));
    expect(s).not.toHaveProperty('accountTier');
  });
});

describe('nenhuma rota devolve dados de outro saveId ao admin', () => {
  it('entitlements GET/POST e save GET com id alheio → 403', async () => {
    const env = envWith();
    env.DIGIAPP_SAVES.store.set(OTHER_ID, JSON.stringify({ segredo: 1 }));
    env.DIGIAPP_SAVES.store.set(ENT_PREFIX + OTHER_ID, JSON.stringify({ tier: 'paid', credits: 99 }));
    const tok = await token(ADMIN);
    expect((await onRequestGet({ request: reqWith(tok, `https://x/api/entitlements?id=${OTHER_ID}`), env })).status).toBe(403);
    expect((await post(ADMIN, 'spend', { id: OTHER_ID, amount: 1 }, env)).status).toBe(403);
    expect((await saveRoute({ request: reqWith(tok, `https://x/api/save?id=${OTHER_ID}`), env })).status).toBe(403);
    expect(ent(env, OTHER_ID).credits).toBe(99);
  });
  it('rotas de comunidade/guilda/torneio não conhecem o admin (jogador comum)', () => {
    for (const f of ['community.js', 'guild.js', 'account.js', 'metrics.js']) {
      let src = '';
      try { src = readFileSync(new URL(`./${f}`, import.meta.url), 'utf8'); } catch { continue; }
      expect(src, f).not.toMatch(/_admin\.js|verifiedAdmin|ADMIN_EMAILS/);
    }
  });
  it('_admin.js não aceita saveId arbitrário como prova nem lê corpo', () => {
    const src = readFileSync(new URL('./_admin.js', import.meta.url), 'utf8');
    expect(src).not.toMatch(/request\.json|searchParams/);
  });
});

describe('auditoria sem PII (M11)', () => {
  it('logAdminSession não emite e-mail nem saveId', async () => {
    const logs = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...a) => { logs.push(a.join(' ')); });
    try {
      const env = envWith();
      await onRequestGet({ request: reqWith(await token(ADMIN), `https://x/api/entitlements?id=${ADMIN_ID}`), env });
      await post(ADMIN, 'spend', { id: ADMIN_ID, amount: 1, opId: 'op-12345678' }, env);
    } finally { spy.mockRestore(); }
    const audit = logs.filter((l) => l.includes('admin_session'));
    expect(audit.length).toBeGreaterThanOrEqual(2);
    for (const l of audit) {
      expect(l).not.toMatch(/@/);
      expect(l).not.toMatch(/[0-9a-f]{32}/);
      expect(l).not.toContain(ADMIN_ID);
      expect(Object.keys(JSON.parse(l)).sort()).toEqual(['event', 'route']);
    }
  });
});
