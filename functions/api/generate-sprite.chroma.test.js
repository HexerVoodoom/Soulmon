import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { onRequestPost, hfRequestBody, spriteModel, spriteQuality, __setHfPollMs } from './generate-sprite.js';
import { onRequestGet as spriteImage } from './sprite-image.js';
import { ENT_PREFIX } from './_entitlements.js';
import { encodePng, decodePng } from './_png.js';

/** Fluxo da API pública do Higgsfield (§48): create -> polling -> download -> chroma -> KV. */
const SAVE = 'abcdefgh12345678';
const FORM = 'champion-power';

function fakeEnv(extra = {}) {
  const store = new Map();
  const meta = new Map();
  store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid' }));
  return {
    HF_CREDENTIALS: 'kid:ksecret',
    ...extra,
    DIGIAPP_SAVES: {
      get: async k => (store.has(k) ? store.get(k) : null),
      put: async (k, v, o) => { store.set(k, v); if (o?.metadata) meta.set(k, o.metadata); },
      delete: async k => { store.delete(k); meta.delete(k); },
      getWithMetadata: async k => ({ value: store.has(k) ? store.get(k) : null, metadata: meta.get(k) ?? null }),
    },
    _store: store,
  };
}

const req = () => new Request('https://soulmon.test/api/generate-sprite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'bicho', id: SAVE, formId: FORM, referenceImageUrls: [`https://soulmon.test/api/sprite-image?k=${'a'.repeat(32)}`] }),
});

function png(bg, c = [200, 40, 40]) {
  const w = 64, d = new Uint8Array(w * w * 4);
  for (let i = 0; i < w * w; i++) d.set([...bg, 255], i * 4);
  for (let y = 20; y < 44; y++) for (let x = 20; x < 44; x++) d.set([...c, 255], (y * w + x) * 4);
  return encodePng(w, w, d);
}
const json = o => new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } });

let calls;
function mockApi(imageBytes) {
  calls = [];
  let polls = 0;
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    url = String(url);
    calls.push({ url, init });
    if (url.startsWith('https://api.higgsfield.ai/marketing-studio/')) {
      return json({ request_id: 'req-1', status_url: 'https://api.higgsfield.ai/requests/req-1/status' });
    }
    if (url.endsWith('/requests/req-1/status')) {
      return json(++polls < 3 ? { status: polls === 1 ? 'queued' : 'in_progress' } : { status: 'completed', images: [{ url: 'https://cdn.hf.test/out.png' }] });
    }
    if (url === 'https://cdn.hf.test/out.png') return new Response(imageBytes, { headers: { 'Content-Type': 'image/png' } });
    throw new Error('fetch inesperado ' + url);
  }));
}

beforeEach(() => __setHfPollMs(1));
afterEach(() => vi.unstubAllGlobals());

describe('corpo da requisição', () => {
  it('sem `background`; campos documentados; image_urls só com referência', () => {
    const b = hfRequestBody({}, 'alpha', 'p', undefined);
    expect(b).toEqual({ prompt: 'p', quality: 'low', resolution: '1k', aspect_ratio: '1:1', moderation: 'auto', enhance_prompt: false });
    expect('background' in b).toBe(false);
    expect(hfRequestBody({}, 'alpha', 'p', ['https://x/y']).image_urls).toEqual(['https://x/y']);
  });
  it('modelo padrão = alpha; flare só por var; qualidade low por padrão', () => {
    expect(spriteModel({})).toBe('alpha');
    expect(spriteModel({ SPRITE_MODEL: 'gpt_image_2' })).toBe('alpha');
    expect(spriteModel({ SPRITE_MODEL: 'flare' })).toBe('flare');
    expect(spriteQuality({})).toBe('low');
    expect(spriteQuality({ SPRITE_QUALITY: 'max' }, 'alpha')).toBe('low');
    expect(spriteQuality({ SPRITE_QUALITY: 'max' }, 'flare')).toBe('max');
  });
});

describe('fluxo: queued -> polling -> completed -> chroma -> armazenamento', () => {
  it('2.0 Alpha: rota, auth, Idempotency-Key, fundo verde removido, PNG RGBA guardado', async () => {
    mockApi(png([0, 255, 0]));
    const env = fakeEnv();
    const r = await onRequestPost({ request: req(), env });
    expect(r.status).toBe(200);
    const { image, provider } = await r.json();
    expect(provider).toBe('higgsfield');
    expect(image).toMatch(/^https:\/\/soulmon\.test\/api\/sprite-image\?k=[0-9a-f]{32}$/);

    const create = calls[0];
    expect(create.url).toBe('https://api.higgsfield.ai/marketing-studio/image');
    expect(create.init.headers.Authorization).toBe('Key kid:ksecret');
    expect(create.init.headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/);
    const body = JSON.parse(create.init.body);
    expect('background' in body).toBe(false);
    expect(body.image_urls).toHaveLength(1);
    expect(calls.filter(c => c.url.endsWith('/status'))).toHaveLength(3);

    const k = new URL(image).searchParams.get('k');
    const got = await spriteImage({ request: new Request(image), env });
    expect(got.status).toBe(200);
    const dec = decodePng(new Uint8Array(await got.arrayBuffer()));
    expect(dec.data[3]).toBe(0); // canto transparente
    const opacos = [...dec.data].filter((_, i) => i % 4 === 3 && dec.data[i]).length;
    expect(opacos).toBe(24 * 24);
    expect(k).toBeTruthy();
  });

  it('SPRITE_MODEL=flare usa a rota flare', async () => {
    mockApi(png([0, 255, 0]));
    const r = await onRequestPost({ request: req(), env: fakeEnv({ SPRITE_MODEL: 'flare' }) });
    expect(r.status).toBe(200);
    expect(calls[0].url).toBe('https://api.higgsfield.ai/marketing-studio/image/flare');
  });

  it('imagem sem fundo verde => bad-chroma: não guarda e cai no caminho de falha (500, sem Soul)', async () => {
    mockApi(png([255, 255, 255]));
    const env = fakeEnv();
    const r = await onRequestPost({ request: req(), env });
    expect(r.status).toBe(500);
    expect([...env._store.keys()].some(k => k.startsWith('sprite:blob:'))).toBe(false);
    expect([...env._store.keys()].some(k => k.startsWith('sprite:img:'))).toBe(false);
  });

  it('sem HF_CREDENTIALS nem Soul: provedor não configurado (503), nenhuma chamada à API nova', async () => {
    mockApi(png([0, 255, 0]));
    const env = fakeEnv({ HF_CREDENTIALS: '' });
    const r = await onRequestPost({ request: req(), env });
    expect(r.status).toBe(503);
    expect(calls).toHaveLength(0);
  });
});
