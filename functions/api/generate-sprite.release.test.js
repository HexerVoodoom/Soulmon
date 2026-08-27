import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { onRequestPost } from './generate-sprite.js';
import { ENT_PREFIX } from './_entitlements.js';

/**
 * X-1 — **o 500 do provedor debitava antes de gerar.**
 *
 * A unidade sai debitada ANTES da chamada de propósito (o KV não tem transação:
 * reserva não-escrita não segura duas requisições simultâneas). O que faltava
 * era a confirmação. Sem ela, três 500 transitórios do provedor — cerca de 11
 * minutos de instabilidade — queimavam 3 das 26 gerações vitalícias e fechavam
 * uma das 11 formas PARA SEMPRE (`perFormLifetime: 3`), por imagem que nunca
 * existiu e sem botão de recuperar.
 *
 * O que estes testes medem é o CONTADOR, não o corpo da resposta: o dano do X-1
 * é invisível na resposta daquela requisição e só aparece na seguinte.
 */

const SAVE = 'abcdefgh12345678';
const FORM = 'champion-virus';

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

const req = (body = { prompt: 'um bicho fofo', id: SAVE, formId: FORM }) =>
  new Request('https://soulmon.test/api/generate-sprite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const geminiOk = () => new Response(JSON.stringify({
  candidates: [{ finishReason: 'STOP', content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'AAAA' } }] } }],
}), { status: 200, headers: { 'Content-Type': 'application/json' } });

/** 500 do provedor: instabilidade, NÃO política de conteúdo. */
const gemini500 = () => new Response('upstream boom', { status: 500 });

const geminiRecusa = () => new Response(JSON.stringify({
  promptFeedback: { blockReason: 'PROHIBITED_CONTENT' },
}), { status: 200, headers: { 'Content-Type': 'application/json' } });

const ent = env => JSON.parse(env._store.get(ENT_PREFIX + SAVE));
const vitalicio = env => ent(env).aiLifetime?.sprite ?? 0;
const naForma = env => ent(env).aiForms?.[FORM] ?? 0;

/** Faz `fetch` responder segundo uma fila; o que sobrar repete a última. */
function responderCom(...fila) {
  const restante = [...fila];
  vi.stubGlobal('fetch', vi.fn(async () => (restante.length > 1 ? restante.shift() : restante[0])()));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-08-10T12:00:00Z'));
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('X-1: a unidade reservada volta quando o provedor falha', () => {
  it('três 500 seguidos NÃO consomem nada — e a forma continua aberta', async () => {
    const env = fakeEnv();
    responderCom(gemini500);

    for (let i = 0; i < 3; i++) {
      const res = await onRequestPost({ request: req(), env });
      expect(res.status, 'falha do provedor sobe como 500 para o cliente').toBe(500);
    }

    expect(vitalicio(env), 'nenhuma das 26 gerações vitalícias foi queimada').toBe(0);
    expect(naForma(env), `nenhuma das 3 tentativas de ${FORM} foi queimada`).toBe(0);

    // O que o X-1 destruía: com o provedor de volta, a forma ainda pode sair.
    // Antes do conserto, esta 4ª requisição já vinha 409 `sprite-form-cap` e a
    // forma ficava na arte de reserva para sempre.
    responderCom(geminiOk);
    const depois = await onRequestPost({ request: req(), env });
    expect(depois.status).toBe(200);
    expect(vitalicio(env)).toBe(1);
    expect(naForma(env)).toBe(1);
  });

  it('a devolução não desconta o débito de OUTRA requisição que entrou no meio', async () => {
    const env = fakeEnv();
    responderCom(geminiOk);
    expect((await onRequestPost({ request: req(), env })).status).toBe(200);
    expect(vitalicio(env)).toBe(1);

    // OUTRA forma de propósito: repetir `FORM` cairia no dedupe do §5
    // (`sprite:img:<saveId>:<formId>` escrito pelo sucesso acima) e devolveria
    // 200 `cached` sem nem chamar o provedor — o que este caso mede é a
    // devolução, não o cache.
    responderCom(gemini500);
    const outra = req({ prompt: 'um bicho fofo', id: SAVE, formId: 'ultimate-vaccine' });
    expect((await onRequestPost({ request: outra, env })).status).toBe(500);

    expect(vitalicio(env), 'a geração que DEU certo continua cobrada').toBe(1);
    expect(naForma(env)).toBe(1);
  });

  it('provedor não configurado devolve a unidade (503 sem imagem)', async () => {
    const env = fakeEnv();
    delete env.GEMINI_API_KEY;
    vi.stubGlobal('fetch', vi.fn(async () => geminiOk()));

    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(503);
    expect(vitalicio(env), 'não houve provedor, logo não houve custo').toBe(0);
    expect(naForma(env)).toBe(0);
  });
});

describe('X-1: recusa de conteúdo NÃO é devolvida — o provedor foi chamado e cobrou', () => {
  it('recusa sem prompt de reserva custa 1', async () => {
    const env = fakeEnv();
    responderCom(geminiRecusa);

    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(500);
    expect(vitalicio(env), 'recusa custa: é o que o teto por forma existe para limitar').toBe(1);
    expect(naForma(env)).toBe(1);
  });

  it('recusa + refeitura que dá certo custa 2 (comportamento deliberado, inalterado)', async () => {
    const env = fakeEnv();
    responderCom(geminiRecusa, geminiOk);

    const res = await onRequestPost({
      request: req({ prompt: 'com franquia', promptFallback: 'sem franquia', id: SAVE, formId: FORM }),
      env,
    });
    expect(res.status).toBe(200);
    expect((await res.json()).usedFallbackPrompt).toBe(true);
    expect(vitalicio(env), 'uma recusa custa duas imagens').toBe(2);
    expect(naForma(env)).toBe(2);
  });

  it('recusa + refeitura que morre em 500 custa 1: a recusa fica, o extra volta', async () => {
    const env = fakeEnv();
    responderCom(geminiRecusa, gemini500);

    const res = await onRequestPost({
      request: req({ prompt: 'com franquia', promptFallback: 'sem franquia', id: SAVE, formId: FORM }),
      env,
    });
    expect(res.status).toBe(500);
    expect(vitalicio(env), 'só a recusa é cobrada; a refeitura não gerou nada').toBe(1);
    expect(naForma(env), 'e a forma ainda tem 2 das 3 tentativas').toBe(1);
  });
});
