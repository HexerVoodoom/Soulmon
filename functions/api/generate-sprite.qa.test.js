import { describe, it, expect, vi, afterEach } from 'vitest';
import { onRequestPost } from './generate-sprite.js';
import { ENT_PREFIX } from './_entitlements.js';

const SAVE = 'abcdefgh12345678';
function fakeEnv(extra = {}) {
  const store = new Map();
  store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid' }));
  return { GEMINI_API_KEY: 'k', SPRITE_GEMINI_IMAGE: '1', ...extra,
    DIGIAPP_SAVES: { get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); },
      delete: async k => { store.delete(k); }, getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }) } };
}
const req = body => new Request('https://x/api/generate-sprite', { method: 'POST',
  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const bloqueio = () => new Response(JSON.stringify({ promptFeedback: { blockReason: 'SEGREDO_DO_PROVEDOR_123' } }), { status: 200 });
const ok = () => new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'AAAA' } }] } }] }), { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe('L07-05: sprite não vaza mensagem crua do provedor', () => {
  it('fallback após recusa não devolve o texto do provedor', async () => {
    const fila = [bloqueio, ok];
    vi.stubGlobal('fetch', vi.fn(async () => (fila.length > 1 ? fila.shift() : fila[0])()));
    const res = await onRequestPost({ request: req({ prompt: 'bicho com refs', promptFallback: 'bicho sem refs', id: SAVE, formId: 'champion-power' }), env: fakeEnv() });
    const txt = await res.text();
    expect(res.status).toBe(200);
    expect(txt).not.toContain('SEGREDO_DO_PROVEDOR_123');
    expect(JSON.parse(txt).usedFallbackPrompt).toBe(true);
  });
  it('provedor não configurado devolve código fixo', async () => {
    const env = fakeEnv(); delete env.GEMINI_API_KEY;
    const res = await onRequestPost({ request: req({ prompt: 'bicho', id: SAVE, formId: 'champion-power' }), env });
    const txt = await res.text();
    expect(res.status).toBe(503);
    expect(txt).not.toContain('HF_API_KEY');
  });
});
