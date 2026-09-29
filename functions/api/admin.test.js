// Papel de ADMIN/GM (`_admin.js`): quem é admin e o que isso muda na leitura.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { vi } from 'vitest';
import { parseAdminEmails, isAdminEmail, verifiedAdmin, ADMIN_CREDITS_DISPLAY } from './_admin.js';
import { emailToSaveId } from './_auth.js';
import { onRequestGet } from './entitlements.js';
import { onRequest as saveRoute } from './save.js';
import { ENT_PREFIX } from './_entitlements.js';
import { ADMIN, OTHER, installJwks, token, envWith, reqWith } from './admin.testkit.js';

let ADMIN_ID, OTHER_ID;
beforeAll(async () => {
  await installJwks();
  ADMIN_ID = await emailToSaveId(ADMIN);
  OTHER_ID = await emailToSaveId(OTHER);
});
afterAll(() => vi.unstubAllGlobals());

describe('parseAdminEmails / isAdminEmail', () => {
  it('vírgula, espaço, caixa alta — mesma normalização do saveId', () => {
    const s = parseAdminEmails('  ADMIN@Example.test , b@x.io\nc@y.io');
    expect([...s]).toEqual(['admin@example.test', 'b@x.io', 'c@y.io']);
    expect(isAdminEmail({ ADMIN_EMAILS: ' Admin@EXAMPLE.test ' }, '  admin@example.TEST')).toBe(true);
  });
  it('ponto no e-mail NÃO é ignorado (é outra conta)', () => {
    expect(isAdminEmail({ ADMIN_EMAILS: ADMIN }, 'ad.min@example.test')).toBe(false);
  });
  it('ausente ou vazia → ninguém', () => {
    expect(parseAdminEmails(undefined).size).toBe(0);
    expect(parseAdminEmails(' , ').size).toBe(0);
    expect(isAdminEmail({}, ADMIN)).toBe(false);
    expect(isAdminEmail({ ADMIN_EMAILS: '' }, ADMIN)).toBe(false);
  });
});

describe('verifiedAdmin', () => {
  it('lista + token verificado → admin', async () => {
    expect(await verifiedAdmin(envWith(), reqWith(await token(ADMIN)))).toEqual({ admin: true });
    expect(await verifiedAdmin(envWith(), reqWith(await token(ADMIN)), ADMIN_ID)).toEqual({ admin: true });
  });
  it('caixa/espaço na variável e no token ainda casam', async () => {
    const env = envWith({ ADMIN_EMAILS: '  ADMIN@example.TEST ' });
    expect((await verifiedAdmin(env, reqWith(await token('Admin@Example.test')), ADMIN_ID)).admin).toBe(true);
  });
  it('email_verified:false (conta e-mail/senha criada com o e-mail do dono) → NÃO', async () => {
    expect((await verifiedAdmin(envWith(), reqWith(await token(ADMIN, { email_verified: false })), ADMIN_ID)).admin).toBe(false);
    expect((await verifiedAdmin(envWith(), reqWith(await token(ADMIN, { email_verified: 'true' })), ADMIN_ID)).admin).toBe(false);
  });
  it('e-mail fora da lista → NÃO', async () => {
    expect((await verifiedAdmin(envWith(), reqWith(await token(OTHER)), OTHER_ID)).admin).toBe(false);
  });
  it('token inválido, expirado, aud/iss errada, assinatura adulterada → NÃO', async () => {
    const env = envWith();
    const now = Math.floor(Date.now() / 1000);
    for (const t of [
      'lixo', '',
      await token(ADMIN, { exp: now - 1 }),
      await token(ADMIN, { aud: 'outro' }),
      await token(ADMIN, { iss: 'https://securetoken.google.com/outro' }),
    ]) expect((await verifiedAdmin(env, reqWith(t), ADMIN_ID)).admin).toBe(false);
    const ok = await token(OTHER);
    const [h, , s] = ok.split('.');
    const forjado = btoa(JSON.stringify({ ...JSON.parse(atob(ok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))), email: ADMIN })).replace(/=+$/, '');
    expect((await verifiedAdmin(env, reqWith(`${h}.${forjado}.${s}`), ADMIN_ID)).admin).toBe(false);
  });
  it('modo aberto (sem FIREBASE_PROJECT_ID) → nunca admin, mesmo com o saveId certo', async () => {
    const env = envWith({ FIREBASE_PROJECT_ID: undefined });
    expect((await verifiedAdmin(env, reqWith(await token(ADMIN)), ADMIN_ID)).admin).toBe(false);
    expect((await verifiedAdmin(env, reqWith(null), ADMIN_ID)).admin).toBe(false);
  });
  it('ADMIN_EMAILS ausente/vazia → NÃO', async () => {
    for (const v of [undefined, '', '  ,  ']) {
      expect((await verifiedAdmin(envWith({ ADMIN_EMAILS: v }), reqWith(await token(ADMIN)), ADMIN_ID)).admin).toBe(false);
    }
  });
  it('token do admin sobre OUTRO saveId → NÃO (sem impersonação)', async () => {
    expect((await verifiedAdmin(envWith(), reqWith(await token(ADMIN)), OTHER_ID)).admin).toBe(false);
  });
});

describe('GET /api/entitlements — contrato `admin: boolean`', () => {
  it('admin: tier paid, admin:true, saldo de exibição — e ent: intocado', async () => {
    const env = envWith();
    const res = await onRequestGet({ request: reqWith(await token(ADMIN), `https://x/api/entitlements?id=${ADMIN_ID}`), env });
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j).toMatchObject({ admin: true, tier: 'paid', credits: ADMIN_CREDITS_DISPLAY });
    const raw = env.DIGIAPP_SAVES.store.get(ENT_PREFIX + ADMIN_ID);
    if (raw) {
      const ent = JSON.parse(raw);
      expect(ent).not.toHaveProperty('admin');
      expect(ent.tier).toBe('demo');
      expect(ent.credits).toBe(0);
    }
  });
  it('não-admin: admin:false e o tier real', async () => {
    const res = await onRequestGet({ request: reqWith(await token(OTHER), `https://x/api/entitlements?id=${OTHER_ID}`), env: envWith() });
    expect(await res.json()).toMatchObject({ admin: false, tier: 'demo', credits: 0 });
  });
  it('modo aberto: admin:false mesmo pedindo o saveId do dono', async () => {
    const res = await onRequestGet({ request: reqWith(null, `https://x/api/entitlements?id=${ADMIN_ID}`), env: envWith({ FIREBASE_PROJECT_ID: undefined }) });
    expect(await res.json()).toMatchObject({ admin: false, tier: 'demo' });
  });
});

describe('save.js — accountTier derivado, nunca gravado', () => {
  it('GET do admin devolve accountTier paid; o save gravado não muda', async () => {
    const env = envWith();
    env.DIGIAPP_SAVES.store.set(ADMIN_ID, JSON.stringify({ petName: 'x' }));
    const r = await saveRoute({ request: reqWith(await token(ADMIN), `https://x/api/save?id=${ADMIN_ID}`), env });
    const j = await r.json();
    expect(j.state.accountTier).toBe('paid');
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(ADMIN_ID))).toEqual({ petName: 'x' });
  });
  it('GET de não-admin segue com o tier do ent', async () => {
    const env = envWith();
    env.DIGIAPP_SAVES.store.set(OTHER_ID, JSON.stringify({ petName: 'y' }));
    const r = await saveRoute({ request: reqWith(await token(OTHER), `https://x/api/save?id=${OTHER_ID}`), env });
    expect((await r.json()).state.accountTier).toBe('demo');
  });
});
