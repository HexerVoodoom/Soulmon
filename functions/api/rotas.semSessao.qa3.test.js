// QA3 — AUTORIZAÇÃO POR ROTA em modo estrito (FIREBASE_PROJECT_ID ligado): sem Bearer válido,
// toda rota que age "em nome de saveId" recusa (401/403/402/410/503) e NÃO escreve no armazenamento;
// com Bearer forjado (assinatura inválida) recusa igual; rotas de admin sem a chave recusam.
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as save from './save.js';
import * as account from './account.js';
import * as billing from './billing.js';
import * as chat from './chat.js';
import * as suggest from './suggest-tasks.js';
import * as sprite from './generate-sprite.js';
import * as ent from './entitlements.js';
import * as community from './community.js';
import * as guild from './guild.js';
import * as topAi from './top-ai.js';
import * as spriteAdmin from './sprite-admin.js';
import * as metrics from './metrics.js';
import * as crash from './crash.js';
import { ENT_PREFIX } from './_entitlements.js';

const ID = 'abcdefgh12345678abcdefgh12345678';
function kvFake() {
  const m = new Map(); const puts = [];
  return {
    _m: m, _puts: puts,
    get: async k => (m.has(k) ? m.get(k) : null),
    put: async (k, v) => { puts.push(k); m.set(k, String(v)); },
    delete: async k => { puts.push('DEL ' + k); m.delete(k); },
    list: async ({ prefix = '' } = {}) => ({ keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
    getWithMetadata: async k => ({ value: m.has(k) ? m.get(k) : null, metadata: null }),
  };
}
const mk = (path, method = 'POST', body = {}, headers = {}) =>
  new Request('https://soulmon.test' + path, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: method === 'GET' ? undefined : JSON.stringify(body) });
afterEach(() => vi.unstubAllGlobals());

const CASOS = [
  ['save GET', save.onRequest, () => mk(`/api/save?id=${ID}`, 'GET')],
  ['save POST', save.onRequest, () => mk(`/api/save?id=${ID}`, 'POST', { state: { a: 1 } })],
  ['entitlements GET', ent.onRequestGet, () => mk(`/api/entitlements?id=${ID}`, 'GET')],
  ['entitlements spend', ent.onRequestPost, () => mk('/api/entitlements?action=spend', 'POST', { id: ID, amount: 1 })],
  ['entitlements rebirth', ent.onRequestPost, () => mk('/api/entitlements?action=rebirth-reset', 'POST', { id: ID })],
  ['billing', billing.onRequestPost, () => mk('/api/billing?action=verify', 'POST', { id: ID, productId: 'x', purchaseToken: 't' })],
  ['community profile', community.onRequest, () => mk('/api/community?action=profile', 'POST', { id: ID, name: 'x' })],
  ['community friends', community.onRequest, () => mk('/api/community?action=friends', 'POST', { id: ID, friendId: 'zzzzzzzzzzzz' })],
  ['community gift', community.onRequest, () => mk('/api/community?action=gift', 'POST', { id: ID, friendId: 'zzzzzzzzzzzz' })],
  ['community gifts', community.onRequest, () => mk(`/api/community?action=gifts&id=${ID}`, 'GET')],
  ['community trophies', community.onRequest, () => mk(`/api/community?action=trophies&id=${ID}&claim=1`, 'GET')],
  ['community match', community.onRequest, () => mk('/api/community?action=match', 'POST', { id: ID, opponentId: 'zzzzzzzzzzzz' })],
  ['community duelStart', community.onRequest, () => mk('/api/community?action=duelStart', 'POST', { id: ID, opponentId: 'zzzzzzzzzzzz' })],
  ['community opponents?id', community.onRequest, () => mk(`/api/community?action=opponents&id=${ID}`, 'GET')],
  ['community rank?id', community.onRequest, () => mk(`/api/community?action=rank&id=${ID}`, 'GET')],
  ['community coopCreate', community.onRequest, () => mk('/api/community?action=coopCreate', 'POST', { id: ID, dayKey: '2026-10-15' })],
  ['guild guildCreate', guild.onRequest, () => mk('/api/guild?action=guildCreate', 'POST', { id: ID, dayKey: '2026-10-15', name: 'abc' })],
  ['guild guild GET', guild.onRequest, () => mk(`/api/guild?action=guild&id=${ID}&dayKey=2026-10-15`, 'GET')],
  ['guild guildLeave', guild.onRequest, () => mk('/api/guild?action=guildLeave', 'POST', { id: ID, dayKey: '2026-10-15' })],
  ['chat', chat.onRequestPost, () => mk('/api/chat', 'POST', { id: ID, message: 'oi' })],
  ['suggest-tasks', suggest.onRequestPost, () => mk('/api/suggest-tasks', 'POST', { id: ID, goalText: 'correr' })],
  ['generate-sprite', sprite.onRequestPost, () => mk('/api/generate-sprite', 'POST', { id: ID, prompt: 'p', formId: 'rookie' })],
  ['account export', account.onRequest, () => mk(`/api/account?id=${ID}&action=export`, 'GET')],
  ['account delete-request', account.onRequest, () => mk(`/api/account?id=${ID}&action=delete-request`, 'POST', {})],
  ['account delete-confirm', account.onRequest, () => mk(`/api/account?id=${ID}&action=delete-confirm`, 'POST', { confirmToken: 'x' })],
];

const b64 = o => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
function jwtForjado() {
  const now = Math.floor(Date.now() / 1000);
  return `${b64({ alg: 'RS256', kid: 'k1' })}.${b64({ aud: 'soulmon-app', iss: 'https://securetoken.google.com/soulmon-app', exp: now + 3600, iat: now, email: 'a@b.c', email_verified: true })}.AAAA`;
}

describe('QA3 autorização: sem sessão / token forjado, modo estrito', () => {
  for (const [nome, handler, fabrica] of CASOS) {
    it(`${nome}: sem Bearer não passa e não escreve`, async () => {
      vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('rede proibida neste teste'); }));
      const store = kvFake();
      store._m.set(ENT_PREFIX + ID, JSON.stringify({ tier: 'paid', credits: 99 }));
      const env = { SOULMON_SAVES: store, FIREBASE_PROJECT_ID: 'soulmon-app', GROQ_API_KEY: 'k', HF_CREDENTIALS: 'a:b' };
      const res = await handler({ request: fabrica(), env });
      expect([401, 403, 402, 410, 503]).toContain(res.status);
      expect(store._puts).toEqual([]);
    });
    it(`${nome}: Bearer com assinatura inválida é recusado e não escreve`, async () => {
      vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ keys: [] }), { status: 200 })));
      const store = kvFake();
      store._m.set(ENT_PREFIX + ID, JSON.stringify({ tier: 'paid', credits: 99 }));
      const env = { SOULMON_SAVES: store, FIREBASE_PROJECT_ID: 'soulmon-app', GROQ_API_KEY: 'k', HF_CREDENTIALS: 'a:b' };
      const base = fabrica();
      const request = new Request(base.url, { method: base.method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwtForjado() }, body: base.method === 'GET' ? undefined : await base.text() });
      const res = await handler({ request, env });
      expect([401, 403, 402, 410, 503]).toContain(res.status);
      expect(store._puts).toEqual([]);
    });
  }

  it('rotas de admin sem a chave: 401 (e 404 sem a variável)', async () => {
    const store = kvFake();
    for (const [h, path, method, extra] of [
      [topAi.onRequestGet, '/api/top-ai', 'GET', {}],
      [spriteAdmin.onRequestPost, '/api/sprite-admin?action=release-form', 'POST', { id: ID, formId: 'rookie' }],
      [metrics.onRequest, '/api/metrics', 'GET', {}],
      [crash.onRequest, '/api/crash', 'GET', {}],
    ]) {
      const semHeader = await h({ request: mk(path, method, extra), env: { SOULMON_SAVES: store, METRICS_ADMIN_KEY: 'segredo-longo' } });
      expect(semHeader.status, path).toBe(401);
      const errada = await h({ request: mk(path, method, extra, { 'X-Metrics-Key': 'segredo-curto' }), env: { SOULMON_SAVES: store, METRICS_ADMIN_KEY: 'segredo-longo' } });
      expect(errada.status, path).toBe(401);
      const semVar = await h({ request: mk(path, method, extra, { 'X-Metrics-Key': 'qualquer' }), env: { SOULMON_SAVES: store } });
      expect(semVar.status, path).toBe(404);
    }
    const g = await ent.onRequestPost({ request: mk('/api/entitlements?action=grant', 'POST', { saveId: ID }), env: { SOULMON_SAVES: store, ENTITLEMENTS_ADMIN_KEY: 'k' } });
    expect(g.status).toBe(401);
    expect(store._puts).toEqual([]);
  });
});
