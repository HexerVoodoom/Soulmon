import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { ADMIN, OTHER, installJwks, token, envWith, reqWith } from './admin.testkit.js';
import { resetRateLimits } from './_rateLimit.js';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const gen = vi.hoisted(() => ({ generateHf: vi.fn() }));
vi.mock('./_spriteGen.js', async (orig) => ({ ...(await orig()), generateHf: gen.generateHf }));
const { onRequestPost } = await import('./gm-gerar-sprite.js');

beforeAll(() => installJwks());
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => { resetRateLimits(); gen.generateHf.mockReset().mockResolvedValue(PNG); });

const env = () => envWith({ HF_CREDENTIALS: 'id:secret' });
const call = (e, tok, body) => onRequestPost({
  request: reqWith(tok, 'https://x/api/gm-gerar-sprite', { method: 'POST', body: JSON.stringify(body) }), env: e,
});

describe('gm-gerar-sprite', () => {
  it('403 sem token e com não-GM, sem chamar o gerador', async () => {
    expect((await call(env(), '', { prompt: 'a' })).status).toBe(403);
    expect((await call(env(), await token(OTHER), { prompt: 'a' })).status).toBe(403);
    expect(gen.generateHf).not.toHaveBeenCalled();
  });
  it('GM gera n vezes e devolve URLs, gravando sob sprite:gm:', async () => {
    const e = env();
    const r = await call(e, await token(ADMIN), { prompt: 'a dragon', model: 'flare', n: 3 });
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.images).toHaveLength(3);
    j.images.forEach(u => expect(u).toMatch(/^https:\/\/x\/api\/sprite-image\?k=[0-9a-f]{32}$/));
    expect(gen.generateHf).toHaveBeenCalledTimes(3);
    expect(gen.generateHf.mock.calls[0][1]).toBe('flare');
    const keys = [...e.DIGIAPP_SAVES.store.keys()].filter(k => k.startsWith('sprite:gm:'));
    expect(keys).toHaveLength(3);
    expect(JSON.stringify([...e.DIGIAPP_SAVES.store.values()])).not.toContain(ADMIN);
  });
  it('padrão: alpha, n=1', async () => {
    const r = await call(env(), await token(ADMIN), { prompt: 'x' });
    expect((await r.json()).images).toHaveLength(1);
    expect(gen.generateHf.mock.calls[0][1]).toBe('alpha');
  });
  it('400 para prompt grande demais, modelo e n inválidos', async () => {
    const t = await token(ADMIN);
    expect((await call(env(), t, { prompt: 'x'.repeat(12001) })).status).toBe(400);
    expect((await call(env(), t, { prompt: 'x', model: 'soul' })).status).toBe(400);
    expect((await call(env(), t, { prompt: 'x', n: 5 })).status).toBe(400);
    expect(gen.generateHf).not.toHaveBeenCalled();
  });
  it('502 quando o gerador falha', async () => {
    gen.generateHf.mockRejectedValue(new Error('boom'));
    expect((await call(env(), await token(ADMIN), { prompt: 'x' })).status).toBe(502);
  });
});
