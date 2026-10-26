import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { onRequestGet, onRequestPost } from './gm-rift-payout.js';
import { onRequestGet as paginaSoulmons } from '../gm/soulmons.js';
import { onRequestGet as paginaRift } from '../gm/rift.js';
import { FIREBASE_SRI } from '../gm/_gmPage.js';
import { ADMIN, OTHER, installJwks, token, envWith, reqWith, fakeKV } from './admin.testkit.js';
import { readEntitlement } from './_entitlements.js';

beforeAll(() => installJwks());
afterAll(() => vi.unstubAllGlobals());

const P = 'p'.repeat(32);
const mk = () => envWith({ DIGIAPP_SAVES: fakeKV({
  [`rift-pending:2026-10:${P}`]: JSON.stringify({ status: 'pending', month: '2026-10', credits: 50, place: 1, score: 270, at: 1 }),
  [`profile:${P}`]: JSON.stringify({ name: 'Zeca' }),
  [`riftlayers:2026-10:${P}`]: JSON.stringify({ n: 12, base: 261, rec: 262, d: '2026-10-20', dn: 4 }),
}) });
const lista = (env, tok) => onRequestGet({ request: reqWith(tok, 'https://x/api/gm-rift-payout'), env });
const acao = (env, tok, body) => onRequestPost({ request: new Request('https://x/api/gm-rift-payout', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) }, body: JSON.stringify(body) }), env });

describe('gm-rift-payout: só o GM aprova o prêmio', () => {
  it('403 sem token e com token não-GM (lista e ação) e NADA é creditado', async () => {
    const env = mk();
    expect((await lista(env, '')).status).toBe(403);
    expect((await lista(env, await token(OTHER))).status).toBe(403);
    expect((await acao(env, '', { month: '2026-10', saveId: P, action: 'approve' })).status).toBe(403);
    expect((await acao(env, await token(OTHER), { month: '2026-10', saveId: P, action: 'approve' })).status).toBe(403);
    expect((await readEntitlement(env, P)).credits).toBe(0);
  });
  it('o GM vê a progressão e aprova; aprovar de novo não repaga', async () => {
    const env = mk();
    const t = await token(ADMIN);
    const j = await (await lista(env, t)).json();
    expect(j.items).toEqual([expect.objectContaining({ saveId: P, name: 'Zeca', place: 1, credits: 50, status: 'pending', progresso: { base: 261, camadasComecadas: 12, recordeDoServidor: 262 } })]);
    expect((await (await acao(env, t, { month: '2026-10', saveId: P, action: 'approve' })).json()).status).toBe('paid');
    expect((await (await acao(env, t, { month: '2026-10', saveId: P, action: 'approve' })).json()).status).toBe('already');
    expect((await readEntitlement(env, P)).credits).toBe(50);
  });
  it('entrada inválida: 400/404; rejeitar não credita', async () => {
    const env = mk();
    const t = await token(ADMIN);
    expect((await acao(env, t, { month: '2026-10', saveId: P, action: 'pagar' })).status).toBe(400);
    expect((await acao(env, t, { month: '../x', saveId: P, action: 'approve' })).status).toBe(400);
    expect((await acao(env, t, { month: '2026-09', saveId: P, action: 'approve' })).status).toBe(404);
    expect((await acao(env, t, { month: '2026-10', saveId: P, action: 'reject' })).status).toBe(200);
    expect((await readEntitlement(env, P)).credits).toBe(0);
  });
});

describe('páginas GM: cabeçalhos anti-iframe e SRI (R8)', () => {
  for (const [nome, pagina] of [['soulmons', paginaSoulmons], ['rift', paginaRift]]) {
    it(`/gm/${nome}: frame-ancestors 'none', X-Frame-Options DENY, SRI nos dois scripts do Firebase`, async () => {
      const r = await pagina({ env: { FIREBASE_API_KEY: 'k', FIREBASE_AUTH_DOMAIN: 'd', FIREBASE_PROJECT_ID: 'p' } });
      expect(r.headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
      expect(r.headers.get('X-Frame-Options')).toBe('DENY');
      const html = await r.text();
      expect(html).toContain(`integrity="${FIREBASE_SRI.app}"`);
      expect(html).toContain(`integrity="${FIREBASE_SRI.auth}"`);
      expect(FIREBASE_SRI.app).toMatch(/^sha384-[A-Za-z0-9+/]{64}$/);
      expect(html.match(/<script nonce="[^"]+" src="https:\/\/www\.gstatic\.com[^>]*integrity=/g)).toHaveLength(2);
    });
  }
});
