/**
 * BB PERSONALIZADO SÓ NO NASCIMENTO (dono, 17/11/2026; REGISTRO §472): `formId: 'bb'` gera só enquanto o save da nuvem não
 * prova que o nascimento passou; reroll do BB nunca; o retry de uma FALHA no nascimento passa; o cache do BB volta sem IA.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { onRequestPost } from './generate-sprite.js';
import { ENT_PREFIX } from './_entitlements.js';

const SAVE = 'abcdefgh12345678';

function fakeEnv(save) {
  const store = new Map();
  store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid' }));
  if (save !== undefined) store.set(SAVE, typeof save === 'string' ? save : JSON.stringify(save));
  return {
    GEMINI_API_KEY: 'k', SPRITE_GEMINI_IMAGE: '1',
    DIGIAPP_SAVES: {
      get: async k => (store.has(k) ? store.get(k) : null),
      put: async (k, v) => { store.set(k, v); },
      delete: async k => { store.delete(k); },
      getWithMetadata: async (k) => ({ value: store.get(k) ?? null, metadata: null }),
    },
  };
}
const req = (extra = {}) => new Request('https://soulmon.test/api/generate-sprite', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'um bebê fofo', id: SAVE, formId: 'bb', ...extra }),
});
const geminiOk = () => new Response(JSON.stringify({
  candidates: [{ finishReason: 'STOP', content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'AAAA' } }] } }],
}), { status: 200, headers: { 'Content-Type': 'application/json' } });

let chamadas;
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-17T12:00:00Z'));
  chamadas = 0;
  vi.stubGlobal('fetch', vi.fn(async () => { chamadas++; return geminiOk(); }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

const NASCENDO = { evolutionStage: 'bb', unlockedEvolutions: ['bb'], soulmonStages: [{}] };

describe('generate-sprite: BB só no nascimento', () => {
  it('nascimento (save ainda não sincronizou): gera; o 2º pedido devolve o CACHE, sem IA', async () => {
    const env = fakeEnv();
    const a = await onRequestPost({ request: req(), env });
    expect(a.status).toBe(200);
    const n = chamadas;
    expect(n).toBeGreaterThan(0);
    const b = await onRequestPost({ request: req(), env });
    expect(b.status).toBe(200);
    expect((await b.json()).cached).toBe(true);
    expect(chamadas).toBe(n);
  });

  it('save em bb sem arte (nascimento já sincronizado) gera', async () => {
    const res = await onRequestPost({ request: req(), env: fakeEnv(NASCENDO) });
    expect(res.status).toBe(200);
  });

  it('retry depois de uma FALHA no nascimento não é bloqueado', async () => {
    const env = fakeEnv(NASCENDO);
    vi.stubGlobal('fetch', vi.fn(async () => { chamadas++; return new Response('boom', { status: 500 }); }));
    const falhou = await onRequestPost({ request: req(), env });
    expect(falhou.status).not.toBe(200);
    expect((await falhou.json()).error).not.toBe('bb-birth-only');
    vi.stubGlobal('fetch', vi.fn(async () => { chamadas++; return geminiOk(); }));
    const ok = await onRequestPost({ request: req(), env });
    expect(ok.status).toBe(200);
  });

  for (const [nome, save] of [
    ['grátis que já tem o BB do pool (comprou depois)', { evolutionStage: 'bb', unlockedEvolutions: ['bb'], spriteLibrary: { sprites: { bb: { url: 'https://x/bb.png' } } } }],
    ['já evoluiu para rookie', { evolutionStage: 'rookie', unlockedEvolutions: ['bb', 'rookie'] }],
    ['save de antes do BB', { evolutionStage: 'rookie', unlockedEvolutions: ['rookie'], soulmonStages: [{}] }],
  ]) {
    it(`recusa com motivo e ZERO IA: ${nome}`, async () => {
      const res = await onRequestPost({ request: req(), env: fakeEnv(save) });
      expect(res.status).toBe(409);
      const corpo = await res.json();
      expect(corpo.error).toBe('bb-birth-only');
      expect(corpo.en).toBeTruthy();
      expect(corpo.pt).toBeTruthy();
      expect(chamadas).toBe(0);
    });
  }

  it('sem reroll do BB: `regenerate` é recusado mesmo no nascimento', async () => {
    const res = await onRequestPost({ request: req({ regenerate: true }), env: fakeEnv() });
    expect(res.status).toBe(409);
    expect(chamadas).toBe(0);
  });

  it('outras formas não mudam (rookie de save antigo gera como sempre)', async () => {
    const res = await onRequestPost({ request: req({ formId: 'rookie' }), env: fakeEnv({ evolutionStage: 'rookie', unlockedEvolutions: ['rookie'], soulmonStages: [{}] }) });
    expect(res.status).toBe(200);
  });
});
