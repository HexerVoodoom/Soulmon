import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { onRequestPost, JANELA_FORMA_BASE_MS } from './generate-sprite.js';
import { ENT_PREFIX } from './_entitlements.js';

/**
 * REGISTRO §404 — "tá gerando duas imagens quando evolui". Cliente antigo (em cache no aparelho) pedia `champion-power` e, assim que a imagem chegava,
 * `champion-power@fogo`. O servidor passa a devolver a forma-base desenhada há instantes (zero IA, zero cota) em vez de gerar a segunda.
 */
const SAVE = 'abcdefgh12345678';
const BASE = 'champion-power';
const ALT = 'champion-power@fogo';

function fakeEnv() {
  const store = new Map();
  store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid' }));
  const env = {
    GEMINI_API_KEY: 'k', SPRITE_GEMINI_IMAGE: '1',
    DIGIAPP_SAVES: {
      get: async k => (store.has(k) ? store.get(k) : null),
      put: async (k, v) => { store.set(k, v); },
      delete: async k => { store.delete(k); },
      getWithMetadata: async k => ({ value: store.has(k) ? store.get(k) : null, metadata: null }),
    },
  };
  env._store = store;
  return env;
}
const req = body => new Request('https://soulmon.test/api/generate-sprite', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'um bicho fofo', id: SAVE, formId: BASE, ...body }),
});
const geminiOk = () => new Response(JSON.stringify({
  candidates: [{ finishReason: 'STOP', content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'AAAA' } }] } }],
}), { status: 200, headers: { 'Content-Type': 'application/json' } });

let chamadasDeIA;
const ent = env => JSON.parse(env._store.get(ENT_PREFIX + SAVE));
const semear = (env, formId, at) => env._store.set(`sprite:img:${SAVE}:${formId}`, JSON.stringify({ image: `https://x/${formId}.png`, provider: 'gemini', at }));

beforeEach(() => {
  chamadasDeIA = [];
  vi.stubGlobal('fetch', vi.fn(async url => { chamadasDeIA.push(String(url)); return geminiOk(); }));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('forma alternativa pedida logo depois da forma-base (cliente antigo)', () => {
  it('base desenhada agora: o pedido da alternativa devolve a base, zero IA, zero cota', async () => {
    const env = fakeEnv();
    const primeiro = await onRequestPost({ request: req(), env });
    expect(primeiro.status).toBe(200);
    const imagem = (await primeiro.json()).image;
    expect(chamadasDeIA).toHaveLength(1);
    const lifetimeAntes = ent(env).aiLifetime?.sprite;

    const segundo = await onRequestPost({ request: req({ formId: ALT }), env });
    expect(segundo.status).toBe(200);
    expect(await segundo.json()).toMatchObject({ image: imagem, cached: true });
    expect(chamadasDeIA, 'nenhuma 2ª geração').toHaveLength(1);
    expect(ent(env).aiLifetime?.sprite, 'nenhuma cobrança do vitalício').toBe(lifetimeAntes);
    expect(ent(env).aiForms?.[ALT] ?? 0, 'nem do teto da forma alternativa').toBe(0);
  });

  it('base antiga (passou a janela): a alternativa é pedido legítimo e gera', async () => {
    const env = fakeEnv();
    semear(env, BASE, Date.now() - JANELA_FORMA_BASE_MS - 1000);
    const r = await onRequestPost({ request: req({ formId: ALT }), env });
    expect(r.status).toBe(200);
    expect((await r.json()).cached).toBeUndefined();
    expect(chamadasDeIA).toHaveLength(1);
  });

  it('regenerate: true (Gerar Soulmon) nunca é engolido pela base recente', async () => {
    const env = fakeEnv();
    semear(env, BASE, Date.now());
    const r = await onRequestPost({ request: req({ formId: ALT, regenerate: true }), env });
    expect(r.status).toBe(200);
    expect(chamadasDeIA).toHaveLength(1);
  });

  it('forma-base como pedido (sem @) não é afetada pela regra', async () => {
    const env = fakeEnv();
    const r = await onRequestPost({ request: req(), env });
    expect(r.status).toBe(200);
    expect(chamadasDeIA).toHaveLength(1);
  });
});
