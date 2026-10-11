/**
 * BETA FECHADO + ANTIABUSO (release/beta-1, decisões do dono 11/10/2026):
 * allowlist `BETA_EMAILS` / `BETA_CLOSED`, hash de IP (HMAC + TTL 30 d) e alerta
 * ao dono a 80 %. Derivado dos critérios do coordenador, não do código.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseBetaEmails, betaGate, betaAllows, betaRuleApplies, normalizeEmail as normLocal } from './_betaAccess.js';
import { normalizeEmail } from './_auth.js';
import { ipHash, takeIpQuota, IP_HASH_TTL_SECONDS, IP_LIMITS } from './_ipHash.js';
import { cruzouLimiar, alertAdmin } from './_adminAlert.js';
import { guardAiRequest } from './_aiGuard.js';

function kvFalso() {
  const store = new Map(); const ttls = new Map();
  return { store, ttls, get: async k => store.get(k) ?? null, put: async (k, v, o) => { store.set(k, v); ttls.set(k, o?.expirationTtl); }, delete: async k => { store.delete(k); } };
}
const reqIp = ip => new Request('https://s/api/x', { method: 'POST', headers: { 'CF-Connecting-IP': ip } });

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('allowlist BETA_EMAILS', () => {
  it('normaliza (trim + minúsculas), aceita vírgula/;/espaço/quebra, descarta lixo', () => {
    expect(parseBetaEmails(' Ana@X.com, bia@y.com;caio@z.com\nana@x.com  nao-email ')).toEqual(['ana@x.com', 'bia@y.com', 'caio@z.com']);
    expect(parseBetaEmails(undefined)).toEqual([]);
  });
  it('a régua local é a MESMA do saveId (`_auth.normalizeEmail`) — paridade', () => {
    for (const e of [' A@B.C ', 'x.y+tag@gmail.com', 'ÁÉ@x.com', '', null]) expect(normLocal(e)).toBe(normalizeEmail(e));
  });
  // Gate adversarial C1: no GMAIL ponto e +tag são o MESMO endereço para a lista
  // (o saveId não muda — segue `normalizeEmail`). Fora do Gmail, não.
  it('C1: Gmail sem ponto e sem +tag (gmail.com = googlemail.com); outros domínios literais', () => {
    const env = { BETA_EMAILS: 'Ana.Maria@gmail.com, beto@empresa.com' };
    expect(betaAllows(env, 'ANA@gmail.com ')).toBe(false);
    expect(betaAllows(env, 'anamaria@gmail.com')).toBe(true);
    expect(betaAllows(env, 'a.n.a.maria+beta@googlemail.com')).toBe(true);
    expect(betaAllows(env, 'beto@empresa.com')).toBe(true);
    expect(betaAllows(env, 'b.eto@empresa.com')).toBe(false);
    expect(betaAllows(env, 'beto+x@empresa.com')).toBe(false);
  });
  it('flag off e lista vazia: aberto; flag off e lista: só IA; flag on: tudo', () => {
    expect(betaRuleApplies({}, 'ai')).toBe(false);
    expect(betaRuleApplies({ BETA_EMAILS: 'a@b.c' }, 'ai')).toBe(true);
    expect(betaRuleApplies({ BETA_EMAILS: 'a@b.c' }, 'core')).toBe(false);
    expect(betaRuleApplies({ BETA_CLOSED: 'true' }, 'core')).toBe(true);
  });
  it('fail-closed: regra ligada e sem e-mail verificado → recusa; lista vazia com flag on → ninguém entra', () => {
    expect(betaGate({ BETA_CLOSED: '1', BETA_EMAILS: 'a@b.c' }, { ok: true }, 'core')).toEqual({ status: 403, reason: 'beta-closed' });
    expect(betaGate({ BETA_CLOSED: '1' }, { ok: true, email: 'a@b.c' }, 'core')).not.toBeNull();
    expect(betaGate({ BETA_CLOSED: '1', BETA_EMAILS: 'a@b.c' }, { ok: true, email: 'A@B.C' }, 'core')).toBeNull();
  });
  it('Q8: e-mail fora da lista → 403 beta-closed no portão de IA (antes de qualquer cota)', async () => {
    const kv = kvFalso();
    const env = { DIGIAPP_SAVES: kv, BETA_EMAILS: 'convidada@x.com' };
    const preAuth = { ok: true, email: 'intrusa@x.com' };
    const r = await guardAiRequest(reqIp('1.1.1.1'), env, 'chat', 'abcdefgh12345678', 1, null, preAuth);
    expect(r).toMatchObject({ ok: false, status: 403, reason: 'beta-closed' });
    expect(r.message['pt-BR']).toMatch(/teste fechado/);
    expect(kv.store.size).toBe(0);
    const ok = await guardAiRequest(reqIp('1.1.1.1'), env, 'chat', 'abcdefgh12345678', 1, null, { ok: true, email: 'Convidada@x.com' });
    expect(ok.ok).toBe(true);
  });
});

describe('hash de IP (HMAC, TTL 30 dias)', () => {
  it('sem IP_HASH_SALT nada é calculado nem gravado', async () => {
    const kv = kvFalso();
    expect(await ipHash({}, reqIp('9.9.9.9'))).toBeNull();
    expect(await takeIpQuota({ DIGIAPP_SAVES: kv }, reqIp('9.9.9.9'), 'sprite')).toEqual({ ok: true, hash: null });
    expect(kv.store.size).toBe(0);
  });
  it('o IP nunca aparece: chave e valor só têm o HMAC truncado; o sal muda o hash', async () => {
    const kv = kvFalso();
    const env = { DIGIAPP_SAVES: kv, IP_HASH_SALT: 'sal-secreto' };
    const r = await takeIpQuota(env, reqIp('203.0.113.7'), 'newAccount', new Date('2026-10-11T10:00:00Z'));
    expect(r.ok).toBe(true);
    expect(r.hash).toMatch(/^[0-9a-f]{16}$/);
    const [k] = [...kv.store.keys()];
    expect(k).toBe(`iph:newAccount:${r.hash}:2026-10-11`);
    expect(k).not.toContain('203.0.113');
    expect(kv.ttls.get(k)).toBe(IP_HASH_TTL_SECONDS);
    expect(IP_HASH_TTL_SECONDS).toBe(30 * 86400);
    expect(await ipHash({ IP_HASH_SALT: 'outro' }, reqIp('203.0.113.7'))).not.toBe(r.hash);
  });
  it('limite por ip-hash/dia: contas novas e sprites', async () => {
    const env = { DIGIAPP_SAVES: kvFalso(), IP_HASH_SALT: 's' };
    for (let i = 0; i < IP_LIMITS.newAccount; i++) expect((await takeIpQuota(env, reqIp('5.5.5.5'), 'newAccount')).ok).toBe(true);
    expect(await takeIpQuota(env, reqIp('5.5.5.5'), 'newAccount')).toMatchObject({ ok: false, status: 429, reason: 'ip-new-account-limit' });
    expect((await takeIpQuota(env, reqIp('6.6.6.6'), 'newAccount')).ok).toBe(true);
    for (let i = 0; i < IP_LIMITS.sprite; i++) await takeIpQuota(env, reqIp('5.5.5.5'), 'sprite');
    expect(await takeIpQuota(env, reqIp('5.5.5.5'), 'sprite')).toMatchObject({ ok: false, reason: 'ip-sprite-limit' });
  });
});

describe('alerta ao dono (80 % / disjuntor)', () => {
  it('cruzouLimiar só dispara quando cruza a linha', () => {
    expect(cruzouLimiar(199, 200, 250)).toBe(true);
    expect(cruzouLimiar(200, 201, 250)).toBe(false);
    expect(cruzouLimiar(10, 11, 250)).toBe(false);
    expect(cruzouLimiar(0, 1, 0)).toBe(false);
  });
  it('1×/tipo/dia; sem ADMIN_PUSH_TARGET só loga; com alvo manda UM push FCM sem dado pessoal', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const kv = kvFalso();
    expect(await alertAdmin({ DIGIAPP_SAVES: kv }, 'chat-dia-80', '200/250')).toBe('log');
    expect(await alertAdmin({ DIGIAPP_SAVES: kv }, 'chat-dia-80', '201/250')).toBe('dup');

    const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
    const pkcs8 = Buffer.from(await crypto.subtle.exportKey('pkcs8', pair.privateKey)).toString('base64');
    const sa = JSON.stringify({ client_email: 'x@y.iam.gserviceaccount.com', project_id: 'soulmon-app', private_key: `-----BEGIN PRIVATE KEY-----\n${pkcs8}\n-----END PRIVATE KEY-----\n` });
    const f = vi.fn(async url => (String(url).includes('oauth2') ? Response.json({ access_token: 't', expires_in: 3600 }) : Response.json({ name: 'ok' })));
    vi.stubGlobal('fetch', f);
    const r = await alertAdmin({ DIGIAPP_SAVES: kvFalso(), ADMIN_PUSH_TARGET: 'tok-admin', FIREBASE_SERVICE_ACCOUNT: sa }, 'sprite-dia-80', '32/40');
    expect(r).toBe('sent');
    const push = f.mock.calls.find(c => String(c[0]).includes('fcm.googleapis.com'));
    const body = JSON.parse(push[1].body);
    expect(body.message.token).toBe('tok-admin');
    expect(body.message.notification.body).toBe('sprite-dia-80: 32/40');
  });
  it('o portão de IA alerta ao cruzar 80 % do global (uma vez)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const kv = kvFalso();
    const hoje = new Date().toISOString().slice(0, 10);
    kv.store.set(`ai:chat:@all:${hoje}`, '199');
    const env = { DIGIAPP_SAVES: kv };
    expect((await guardAiRequest(reqIp('1.1.1.1'), env, 'chat', 'abcdefgh12345678', 1, null, { ok: true, email: 'a@b.c' })).ok).toBe(true);
    expect(kv.store.get(`alert:${hoje}:chat-dia-80`)).toBe('1');
    expect(warn.mock.calls.some(c => String(c[0]).includes('chat-dia-80'))).toBe(true);
  });
});

describe('rotas: save e compra com o beta FECHADO; contas novas por ip-hash', async () => {
  const { onRequest: save } = await import('./save.js');
  const { onRequestPost: billing } = await import('./billing.js');
  const kvSave = () => {
    const store = new Map();
    return { store, get: async k => store.get(k) ?? null, getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }), put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); } };
  };
  const postSave = (id, ip = '7.7.7.7') => new Request(`https://x/api/save?id=${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip }, body: JSON.stringify({ state: { healthPoints: 2 } }) });

  it('BETA_CLOSED sem e-mail verificado: save GET e POST → 403 beta-closed com mensagem PT/EN; nada gravado', async () => {
    const kv = kvSave();
    const env = { DIGIAPP_SAVES: kv, BETA_CLOSED: 'true', BETA_EMAILS: 'a@b.c' };
    const id = 'a'.repeat(32);
    const r = await save({ request: postSave(id), env });
    expect(r.status).toBe(403);
    const b = await r.json();
    expect(b.error).toBe('beta-closed');
    expect(b.message.pt).toMatch(/teste fechado/);
    expect(kv.store.has(id)).toBe(false);
    expect((await save({ request: new Request(`https://x/api/save?id=${id}`), env })).status).toBe(403);
  });

  it('flag OFF: o save segue aberto mesmo com lista (a lista só vale para IA)', async () => {
    const env = { DIGIAPP_SAVES: kvSave(), BETA_EMAILS: 'a@b.c' };
    expect((await save({ request: postSave('b'.repeat(32)), env })).status).toBe(200);
  });

  it('BETA_CLOSED: compra fora da lista → 403 beta-closed antes de falar com a Google', async () => {
    const f = vi.fn(); vi.stubGlobal('fetch', f);
    const env = { DIGIAPP_SAVES: kvSave(), BETA_CLOSED: '1', GOOGLE_PLAY_SERVICE_ACCOUNT: '{}', ANDROID_PACKAGE_NAME: 'x' };
    const r = await billing({ request: new Request('https://x/api/billing?action=verify', { method: 'POST', body: JSON.stringify({ id: 'c'.repeat(32), productId: 'soulmon.unlock.full', purchaseToken: 't' }) }), env });
    expect(r.status).toBe(403);
    expect((await r.json()).reason).toBe('beta-closed');
    expect(f).not.toHaveBeenCalled();
  });

  it('contas NOVAS por ip-hash/dia: a 4ª do mesmo IP é 429; regravar conta existente não conta', async () => {
    const kv = kvSave();
    const env = { DIGIAPP_SAVES: kv, IP_HASH_SALT: 's' };
    for (let i = 0; i < 3; i++) expect((await save({ request: postSave(String(i).repeat(32)), env })).status).toBe(200);
    expect((await save({ request: postSave('0'.repeat(32)), env })).status).toBe(200); // já existe
    const r = await save({ request: postSave('9'.repeat(32)), env });
    expect(r.status).toBe(429);
    expect((await r.json()).error).toBe('ip-new-account-limit');
    expect((await save({ request: postSave('8'.repeat(32), '8.8.8.8'), env })).status).toBe(200);
  });
});
