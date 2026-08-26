import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { onRequestPost as chat } from './chat.js';
import { onRequestPost as suggest } from './suggest-tasks.js';
import { ENT_PREFIX } from './_entitlements.js';

/**
 * As DUAS outras rotas de IA (`chat`, `suggest`) e o par reserva/confirmação.
 *
 * Elas não são o X-1: `chat` e `suggest` não têm teto vitalício nem por forma
 * (`AI_LIMITS`), então o débito mora só em chaves KV com TTL de 30h e se reverte
 * sozinho. O que é bug de verdade aqui é de ORDEM — a checagem de
 * `GROQ_API_KEY` estava DEPOIS do portão de volume, então com a chave ausente
 * toda requisição debitava e devolvia 500 sem chamar ninguém. Em `suggest` isso
 * caía no caminho de primeira impressão (2º onboarding, 1ª tarefa obrigatória)
 * e contra o menor teto do sistema: 30/dia.
 *
 * O que se mede aqui é o CONTADOR, nunca o corpo da resposta.
 */

const SAVE = 'abcdefgh12345678';
const DIA = '2026-08-10';

function fakeEnv({ comChave = true } = {}) {
  const store = new Map();
  store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid' }));
  const env = {
    DIGIAPP_SAVES: {
      get: async k => (store.has(k) ? store.get(k) : null),
      put: async (k, v) => { store.set(k, v); },
    },
  };
  if (comChave) env.GROQ_API_KEY = 'k';
  env._store = store;
  return env;
}

const contador = (env, bucket) => Number(env._store.get(`ai:${bucket}:${SAVE}:${DIA}`) ?? 0);

const pedidoChat = () => new Request('https://soulmon.test/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'oi', id: SAVE }),
});

const pedidoSuggest = () => new Request('https://soulmon.test/api/suggest-tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ goalText: 'dormir melhor', id: SAVE }),
});

const groqOk = corpo => new Response(JSON.stringify({
  choices: [{ message: { content: corpo } }],
}), { status: 200, headers: { 'Content-Type': 'application/json' } });

const groq500 = () => new Response('upstream boom', { status: 500 });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${DIA}T12:00:00Z`));
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('chat: cota não é queimada por falha que não gerou resposta', () => {
  it('sem GROQ_API_KEY, NENHUMA unidade é debitada (a checagem vem antes do portão)', async () => {
    const env = fakeEnv({ comChave: false });
    vi.stubGlobal('fetch', vi.fn(async () => groqOk('oi')));

    const res = await chat({ request: pedidoChat(), env });
    expect(res.status).toBe(500);
    expect(contador(env, 'chat'), 'chave ausente é estado permanente: não pode custar cota').toBe(0);
  });

  it('três 500 do Groq não consomem — e a requisição seguinte, boa, consome 1', async () => {
    const env = fakeEnv();
    vi.stubGlobal('fetch', vi.fn(async () => groq500()));
    for (let i = 0; i < 3; i++) {
      expect((await chat({ request: pedidoChat(), env })).status).toBe(500);
    }
    expect(contador(env, 'chat')).toBe(0);

    vi.stubGlobal('fetch', vi.fn(async () => groqOk('oi')));
    expect((await chat({ request: pedidoChat(), env })).status).toBe(200);
    expect(contador(env, 'chat')).toBe(1);
  });

  it('a devolução não apaga o débito de uma conversa que DEU certo', async () => {
    const env = fakeEnv();
    vi.stubGlobal('fetch', vi.fn(async () => groqOk('oi')));
    expect((await chat({ request: pedidoChat(), env })).status).toBe(200);

    vi.stubGlobal('fetch', vi.fn(async () => groq500()));
    expect((await chat({ request: pedidoChat(), env })).status).toBe(500);

    expect(contador(env, 'chat')).toBe(1);
  });
});

describe('suggest-tasks: o menor teto do sistema, no caminho de primeira impressão', () => {
  it('sem GROQ_API_KEY, nenhuma das 30 unidades do dia é queimada', async () => {
    const env = fakeEnv({ comChave: false });
    vi.stubGlobal('fetch', vi.fn(async () => groqOk('[]')));

    const res = await suggest({ request: pedidoSuggest(), env });
    expect(res.status).toBe(500);
    expect(contador(env, 'suggest')).toBe(0);
  });

  it('500 do Groq não consome', async () => {
    const env = fakeEnv();
    vi.stubGlobal('fetch', vi.fn(async () => groq500()));
    expect((await suggest({ request: pedidoSuggest(), env })).status).toBe(500);
    expect(contador(env, 'suggest')).toBe(0);
  });

  it('resposta 200 NÃO parseável CONSOME 1 — o modelo trabalhou e cobrou', async () => {
    // Regra deliberada, e por isso travada: é o análogo da recusa de conteúdo no
    // sprite. Sem este teste, alguém "conserta" a assimetria devolvendo aqui.
    const env = fakeEnv();
    vi.stubGlobal('fetch', vi.fn(async () => groqOk('desculpa, não consigo')));

    const res = await suggest({ request: pedidoSuggest(), env });
    expect(res.status).toBe(502);
    expect(contador(env, 'suggest'), 'o Groq respondeu: isso custa').toBe(1);
  });
});
