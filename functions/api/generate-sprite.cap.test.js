import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { onRequestPost } from './generate-sprite.js';
import { ENT_PREFIX } from './_entitlements.js';
import { AI_LIMITS } from './_aiGuard.js';
import { usarTetosDeSpriteDeProducao } from '../../src/test/tetosSprite.js';

// O commit 372df3132 liberou os tetos de produção para os testes iniciais; estes testes provam a máquina do teto COM os números de produção (ver `src/test/tetosSprite.js`).
usarTetosDeSpriteDeProducao();

// O que interessa medir aqui NÃO é o corpo da resposta (ele pode dizer qualquer
// coisa): é se o provedor de IA foi CHAMADO. Chamada que não aconteceu é fatura
// que não chegou. Por isso todo caso conta `fetch`.

const SAVE = 'abcdefgh12345678';

function fakeEnv() {
  const store = new Map();
  store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid' }));
  const env = {
    GEMINI_API_KEY: 'k', SPRITE_GEMINI_IMAGE: '1' /* o mock do provedor é o caminho Gemini; em produção ele fica desligado */,
    DIGIAPP_SAVES: {
      get: async k => (store.has(k) ? store.get(k) : null),
      put: async (k, v) => { store.set(k, v); },
      delete: async k => { store.delete(k); },
      getWithMetadata: async (k) => ({ value: store.get(k) ?? null, metadata: null }),
    },
  };
  env._store = store;
  return env;
}

const req = (body = { prompt: 'um bicho fofo', id: SAVE, formId: 'rookie' }) =>
  new Request('https://soulmon.test/api/generate-sprite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const geminiOk = () => new Response(JSON.stringify({
  candidates: [{ finishReason: 'STOP', content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'AAAA' } }] } }],
}), { status: 200, headers: { 'Content-Type': 'application/json' } });

const geminiRecusa = () => new Response(JSON.stringify({
  promptFeedback: { blockReason: 'PROHIBITED_CONTENT' },
}), { status: 200, headers: { 'Content-Type': 'application/json' } });

let chamadasDeIA;
const lifetimeDe = env => JSON.parse(env._store.get(ENT_PREFIX + SAVE)).aiLifetime?.sprite ?? 0;
const FORMAS = ['rookie', 'champion-power', 'champion-harmony', 'champion-benevolence', 'ultimate-power', 'ultimate-harmony',
  'ultimate-benevolence', 'mega-power', 'mega-harmony', 'mega-benevolence', 'ultra'];
const reqForma = (formId, extra = {}) => req({ prompt: 'um bicho fofo', id: SAVE, formId, ...extra });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-08-10T12:00:00Z'));
  chamadasDeIA = [];
  vi.stubGlobal('fetch', vi.fn(async url => {
    chamadasDeIA.push(String(url));
    return geminiOk();
  }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

// POLÍTICA (decisão do dono, 11/10/2026): UMA geração por forma, nunca regenerar;
// vitalício 15 (11 formas + 4 de folga para recusa de conteúdo); 6/dia; global
// 800/mês e 40/dia. Os testes abaixo foram reescritos para ela.
describe('generate-sprite: o teto para ANTES de gastar', () => {
  it('os números são os da decisão do dono', () => {
    expect(AI_LIMITS.sprite).toMatchObject({ perAccount: 6, perAccountLifetime: 15, perFormLifetime: 1, globalMonth: 800, globalDay: 40 });
  });

  it('sem formId é 400 e ZERO IA (sem forma não há "uma geração por forma")', async () => {
    const res = await onRequestPost({ request: req({ prompt: 'um bicho fofo', id: SAVE }), env: fakeEnv() });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('form-id-required');
    expect(chamadasDeIA).toEqual([]);
  });

  it('a 7ª do dia (7ª forma) é 429 e NÃO chama IA nenhuma', async () => {
    const env = fakeEnv();
    for (let i = 0; i < 6; i++) expect((await onRequestPost({ request: reqForma(FORMAS[i]), env })).status).toBe(200);
    expect(chamadasDeIA).toHaveLength(6);
    const res = await onRequestPost({ request: reqForma(FORMAS[6]), env });
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe('ai-daily-limit');
    expect(chamadasDeIA).toHaveLength(6);
  });

  it('a árvore inteira (11 formas) sai em dias diferentes, 1× cada; o vitalício fica em 11', async () => {
    const env = fakeEnv();
    for (let i = 0; i < FORMAS.length; i++) {
      vi.setSystemTime(new Date(`2026-08-${String(10 + i).padStart(2, '0')}T12:00:00Z`));
      expect((await onRequestPost({ request: reqForma(FORMAS[i]), env })).status).toBe(200);
    }
    expect(chamadasDeIA).toHaveLength(11);
    expect(lifetimeDe(env)).toBe(11);
  });

  it('vitalício esgotado (15) é 402 e não chama IA', async () => {
    const env = fakeEnv();
    env._store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid', aiLifetime: { sprite: 15 } }));
    const res = await onRequestPost({ request: reqForma('ultra'), env });
    expect(res.status).toBe(402);
    expect((await res.json()).error).toBe('sprite-lifetime-cap');
    expect(chamadasDeIA).toEqual([]);
  });

  it('a recusa de conteúdo custa 2 no vitalício (2 cobranças) e 1 na forma (saiu UMA imagem)', async () => {
    const env = fakeEnv();
    fetch.mockImplementationOnce(async url => { chamadasDeIA.push(String(url)); return geminiRecusa(); });
    const res = await onRequestPost({ request: reqForma('rookie', { prompt: 'com referências', promptFallback: 'sem referências' }), env });
    expect(res.status).toBe(200);
    expect((await res.json()).usedFallbackPrompt).toBe(true);
    expect(chamadasDeIA).toHaveLength(2);
    expect(lifetimeDe(env)).toBe(2);
    expect(JSON.parse(env._store.get(ENT_PREFIX + SAVE)).aiForms).toEqual({ rookie: 1 });
  });

  it('a refeitura por recusa é RECUSADA se estourar o vitalício — não fura pela porta dos fundos', async () => {
    const env = fakeEnv();
    env._store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid', aiLifetime: { sprite: 14 } }));
    fetch.mockImplementationOnce(async url => { chamadasDeIA.push(String(url)); return geminiRecusa(); });
    const res = await onRequestPost({ request: reqForma('rookie', { prompt: 'com referências', promptFallback: 'sem referências' }), env });
    expect(res.status).toBe(402);
    expect(chamadasDeIA).toHaveLength(1);
    expect(lifetimeDe(env)).toBe(15);
  });

  it('cota mensal esgotada devolve 503 sem chamar IA, e com texto PT-BR + EN', async () => {
    const env = fakeEnv();
    env._store.set('ai:sprite:@all:2026-08', String(AI_LIMITS.sprite.globalMonth));
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('ai-monthly-budget-reached');
    expect(body.message['pt-BR']).toBeTruthy();
    expect(body.message.en).toBeTruthy();
    expect(chamadasDeIA).toEqual([]);
  });

  it('teto GLOBAL DIÁRIO (40, Higgsfield) esgotado: 503 ai-daily-budget-reached sem IA', async () => {
    const env = fakeEnv();
    env._store.set('ai:sprite:@all:2026-08-10', String(AI_LIMITS.sprite.globalDay));
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('ai-daily-budget-reached');
    expect(chamadasDeIA).toEqual([]);
  });

  it('contador ilegível recusa com 503 e ZERO chamada de IA (fail-closed)', async () => {
    const env = fakeEnv();
    env._store.set('ai:sprite:@all:2026-08', 'NaN-de-verdade');
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('ai-quota-unavailable');
    expect(chamadasDeIA).toEqual([]);
  });

  it('SPRITE_DISABLED: 503 sprite-disabled com mensagem PT/EN, sem cota nem IA', async () => {
    const env = fakeEnv();
    env.SPRITE_DISABLED = '1';
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(503);
    const b = await res.json();
    expect(b.error).toBe('sprite-disabled');
    expect(b.message['pt-BR']).toMatch(/ateliê/);
    expect(chamadasDeIA).toEqual([]);
    expect(lifetimeDe(env)).toBe(0);
  });
});

describe('generate-sprite: UMA geração por forma, nunca regenerar', () => {
  it('depois de gerar, pedir a MESMA forma devolve a mesma arte (cache) sem IA nem cota', async () => {
    const env = fakeEnv();
    const a = await (await onRequestPost({ request: reqForma('mega-power'), env })).json();
    const b = await onRequestPost({ request: reqForma('mega-power'), env });
    expect(b.status).toBe(200);
    expect((await b.json()).image).toBe(a.image);
    expect(chamadasDeIA).toHaveLength(1);
    expect(lifetimeDe(env)).toBe(1);
  });

  it('forma já gerada SEM cache (ex.: conta excluída e relogada) → 409, nunca regenera', async () => {
    const env = fakeEnv();
    env._store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid', aiForms: { 'mega-power': 1 }, aiLifetime: { sprite: 1 } }));
    const res = await onRequestPost({ request: reqForma('mega-power'), env });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('sprite-form-cap');
    expect(body.message['pt-BR']).toBeTruthy();
    expect(chamadasDeIA).toEqual([]);
    // outra forma ainda pode sair (uma vez)
    expect((await onRequestPost({ request: reqForma('ultra'), env })).status).toBe(200);
  });

  it('`formId` inventado é 400 e ZERO chamada de IA', async () => {
    const res = await onRequestPost({ request: reqForma('mega-fogo'), env: fakeEnv() });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid-form-id');
    expect(chamadasDeIA).toEqual([]);
  });

  it('Gemini Image DESLIGADO por padrão: sem SPRITE_GEMINI_IMAGE e sem Higgsfield → 503 não configurado, ZERO IA, cota devolvida', async () => {
    const env = fakeEnv();
    delete env.SPRITE_GEMINI_IMAGE;
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(503);
    expect(chamadasDeIA).toEqual([]);
    expect(lifetimeDe(env)).toBe(0);
  });

  it('com o Gemini ligado (só se o dono religar), a chave vai no HEADER, nunca na URL', async () => {
    const env = fakeEnv();
    await onRequestPost({ request: req(), env });
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).not.toContain('key=');
    expect(init.headers['x-goog-api-key']).toBe('k');
  });
});
