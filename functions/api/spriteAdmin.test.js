/**
 * Gate adversarial C2: o dono libera UMA nova geração de UMA forma (desenho feio),
 * sem reabrir "regerar à vontade". Auth = `METRICS_ADMIN_KEY`, tempo constante.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { onRequestPost as admin } from './sprite-admin.js';
import { onRequestPost as gerar } from './generate-sprite.js';
import { ENT_PREFIX } from './_entitlements.js';

const SAVE = 'abcdefgh12345678';
function env() {
  const store = new Map([[ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid' })]]);
  return { _store: store, METRICS_ADMIN_KEY: 'segredo-admin', GEMINI_API_KEY: 'k', SPRITE_GEMINI_IMAGE: '1',
    DIGIAPP_SAVES: { get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); } } };
}
const liberar = (e, body, key = 'segredo-admin', qs = '?action=release-form') => admin({ request: new Request(`https://soulmon.test/api/sprite-admin${qs}`, { method: 'POST', headers: { 'X-Metrics-Key': key, 'CF-Connecting-IP': '1.2.3.4' }, body: JSON.stringify(body) }), env: e });
const pedir = e => gerar({ request: new Request('https://soulmon.test/api/generate-sprite', { method: 'POST', body: JSON.stringify({ prompt: 'p', id: SAVE, formId: 'mega-power' }) }), env: e });
const geminiOk = () => new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'AAAA' } }] } }] }), { status: 200 });

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('sprite-admin: liberar uma forma', () => {
  it('404 sem METRICS_ADMIN_KEY; 401 com chave errada; 400 com forma/id inválidos ou ação desconhecida', async () => {
    const e = env();
    expect((await admin({ request: new Request('https://x/api/sprite-admin?action=release-form', { method: 'POST' }), env: {} })).status).toBe(404);
    expect((await liberar(e, { id: SAVE, formId: 'mega-power' }, 'errada')).status).toBe(401);
    expect((await liberar(e, { id: SAVE, formId: 'mega-fogo' })).status).toBe(400);
    expect((await liberar(e, { id: 'x', formId: 'mega-power' })).status).toBe(400);
    expect((await liberar(e, { id: SAVE, formId: 'mega-power' }, 'segredo-admin', '?action=tudo')).status).toBe(400);
  });

  it('ponta a ponta: gera 1×, a 2ª vem do cache; o dono libera; a próxima é desenho NOVO; e só uma', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const f = vi.fn(async () => geminiOk());
    vi.stubGlobal('fetch', f);
    const e = env();
    expect((await pedir(e)).status).toBe(200);
    expect((await (await pedir(e)).json()).cached).toBe(true);
    expect(f).toHaveBeenCalledTimes(1);

    const r = await liberar(e, { id: SAVE, formId: 'mega-power' });
    expect(await r.json()).toMatchObject({ ok: true, antes: 1, depois: 0 });
    expect(e._store.has(`sprite:img:${SAVE}:mega-power`)).toBe(false);

    const nova = await pedir(e);
    expect(nova.status).toBe(200);
    expect((await nova.json()).cached).toBeUndefined();
    expect(f).toHaveBeenCalledTimes(2);
    // vitalício NÃO voltou: 2 gerações contadas
    expect(JSON.parse(e._store.get(ENT_PREFIX + SAVE)).aiLifetime.sprite).toBe(2);
    // e a forma volta a estar "gasta": sem nova liberação, não regenera
    e._store.delete(`sprite:img:${SAVE}:mega-power`);
    expect((await pedir(e)).status).toBe(409);
  });
});
