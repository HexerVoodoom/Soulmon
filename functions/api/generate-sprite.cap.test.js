import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { onRequestPost } from './generate-sprite.js';
import { ENT_PREFIX } from './_entitlements.js';
import { AI_LIMITS } from './_aiGuard.js';

// O que interessa medir aqui NÃO é o corpo da resposta (ele pode dizer qualquer
// coisa): é se o provedor de IA foi CHAMADO. Chamada que não aconteceu é fatura
// que não chegou. Por isso todo caso conta `fetch`.

const SAVE = 'abcdefgh12345678';

function fakeEnv() {
  const store = new Map();
  store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid' }));
  const env = {
    GEMINI_API_KEY: 'k',
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

const req = (body = { prompt: 'um bicho fofo', id: SAVE }) =>
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

describe('generate-sprite: o teto para ANTES de gastar', () => {
  it('a 7ª do dia é 429 e NÃO chama IA nenhuma', async () => {
    const env = fakeEnv();
    for (let i = 0; i < 6; i++) {
      expect((await onRequestPost({ request: req(), env })).status).toBe(200);
    }
    expect(chamadasDeIA).toHaveLength(6);

    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe('ai-daily-limit');
    expect(chamadasDeIA).toHaveLength(6); // nenhuma chamada nova
  });

  it('a 27ª da VIDA é 402 e não chama IA — mesmo em dias diferentes', async () => {
    const env = fakeEnv();
    for (let d = 0; d < 5; d++) {
      vi.setSystemTime(new Date(`2026-08-${String(10 + d).padStart(2, '0')}T12:00:00Z`));
      for (let i = 0; i < 6; i++) await onRequestPost({ request: req(), env });
    }
    expect(chamadasDeIA).toHaveLength(AI_LIMITS.sprite.perAccountLifetime);
    expect(lifetimeDe(env)).toBe(26);

    vi.setSystemTime(new Date('2026-12-25T12:00:00Z'));
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(402);
    expect((await res.json()).error).toBe('sprite-lifetime-cap');
    expect(chamadasDeIA).toHaveLength(26);
  });

  it('a recusa de conteúdo custa 2 no teto vitalício — porque são 2 cobranças', async () => {
    // `promptFallback` refaz o pedido sem citar franquia. É uma SEGUNDA imagem
    // paga. Teto que conta 1 aí é teto que mente.
    const env = fakeEnv();
    fetch.mockImplementationOnce(async url => { chamadasDeIA.push(String(url)); return geminiRecusa(); });
    const res = await onRequestPost({
      request: req({ prompt: 'com referências', promptFallback: 'sem referências', id: SAVE }),
      env,
    });
    expect(res.status).toBe(200);
    expect((await res.json()).usedFallbackPrompt).toBe(true);
    expect(chamadasDeIA).toHaveLength(2);
    expect(lifetimeDe(env)).toBe(2);
  });

  it('a refeitura por recusa é RECUSADA se estourar o teto — não fura pela porta dos fundos', async () => {
    const env = fakeEnv();
    // Deixa a conta com 25 de 26 gastos: sobra exatamente 1, e a recusa pede 2.
    env._store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid', aiLifetime: { sprite: 25 } }));
    fetch.mockImplementationOnce(async url => { chamadasDeIA.push(String(url)); return geminiRecusa(); });
    const res = await onRequestPost({
      request: req({ prompt: 'com referências', promptFallback: 'sem referências', id: SAVE }),
      env,
    });
    expect(res.status).toBe(402);
    expect((await res.json()).error).toBe('sprite-lifetime-cap');
    expect(chamadasDeIA).toHaveLength(1); // a 1ª aconteceu; a refeitura NÃO
    expect(lifetimeDe(env)).toBe(26);
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

  it('contador ilegível recusa com 503 e ZERO chamada de IA (fail-closed)', async () => {
    const env = fakeEnv();
    env._store.set('ai:sprite:@all:2026-08', 'NaN-de-verdade');
    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('ai-quota-unavailable');
    expect(chamadasDeIA).toEqual([]);
  });
});

describe('generate-sprite: o teto POR FORMA para antes de gastar', () => {
  const reqForma = formId => req({ prompt: 'um bicho fofo', id: SAVE, formId });

  it('a 4ª tentativa da MESMA forma é 409 sem chamar IA — e outra forma ainda gera', async () => {
    const env = fakeEnv();
    // As três tentativas são RECUSAS de conteúdo, não sucessos, e isso não é
    // detalhe de teste: sucesso escreve `sprite:img:<saveId>:<formId>`
    // (dedupe do §5) e a 2ª chamada da mesma forma passa a ser acerto de cache
    // com custo ZERO — nunca chega a três débitos. O caminho REAL para esgotar
    // `perFormLifetime` é o que falha e cobra: a recusa de conteúdo.
    for (let i = 0; i < 3; i++) {
      fetch.mockImplementationOnce(async url => { chamadasDeIA.push(String(url)); return geminiRecusa(); });
      expect((await onRequestPost({ request: reqForma('mega-power'), env })).status).toBe(500);
    }
    expect(chamadasDeIA).toHaveLength(3);

    const res = await onRequestPost({ request: reqForma('mega-power'), env });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('sprite-form-cap');
    expect(body.message['pt-BR']).toBeTruthy();
    expect(body.message.en).toBeTruthy();
    expect(chamadasDeIA).toHaveLength(3); // NENHUM fetch novo

    // O jogador no clímax não perde a árvore por causa de um galho.
    expect((await onRequestPost({ request: reqForma('ultra'), env })).status).toBe(200);
    expect(chamadasDeIA).toHaveLength(4);
  });

  it('recusa de conteúdo custa 2 na FORMA também — a refeitura é uma segunda imagem paga', async () => {
    const env = fakeEnv();
    fetch.mockImplementationOnce(async url => { chamadasDeIA.push(String(url)); return geminiRecusa(); });
    const res = await onRequestPost({
      request: req({ prompt: 'com referências', promptFallback: 'sem referências', id: SAVE, formId: 'rookie' }),
      env,
    });
    expect(res.status).toBe(200);
    expect(chamadasDeIA).toHaveLength(2);
    expect(JSON.parse(env._store.get(ENT_PREFIX + SAVE)).aiForms).toEqual({ rookie: 2 });

  });

  it('com 2 de 3 gastas na forma, a recusa NÃO refaz pela porta dos fundos', async () => {
    // Continuação do caso acima, em cenário próprio: a 2ª chamada de `rookie`
    // ali viraria acerto de cache (a 1ª deu certo e escreveu `sprite:img:`), e
    // o que se quer medir é o teto POR FORMA, não o dedupe. Forma virgem, com
    // as 2 tentativas já gastas no registro.
    const env = fakeEnv();
    env._store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid', aiForms: { 'champion-harmony': 2 } }));
    fetch.mockImplementationOnce(async url => { chamadasDeIA.push(String(url)); return geminiRecusa(); });
    const res = await onRequestPost({
      request: req({ prompt: 'com referências', promptFallback: 'sem referências', id: SAVE, formId: 'champion-harmony' }),
      env,
    });
    expect(res.status).toBe(409);
    expect(chamadasDeIA).toHaveLength(1); // a 1ª aconteceu; a refeitura NÃO
    expect(JSON.parse(env._store.get(ENT_PREFIX + SAVE)).aiForms['champion-harmony']).toBe(3);
  });

  it('`formId` inventado é 400 e ZERO chamada de IA', async () => {
    const env = fakeEnv();
    const res = await onRequestPost({ request: reqForma('mega-fogo'), env });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid-form-id');
    expect(chamadasDeIA).toEqual([]);
  });
});
