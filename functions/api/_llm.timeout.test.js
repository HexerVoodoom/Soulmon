import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callChatModel, _resetBreaker, GROQ_TIMEOUT_MS, GEMINI_TIMEOUT_MS } from './_llm.js';

const req = { messages: [{ role: 'system', content: 's' }, { role: 'user', content: 'oi' }], temperature: 0.5, maxTokens: 100 };
const env = { GROQ_API_KEY: 'g', GEMINI_API_KEY: 'k' };
const isGroq = u => String(u).includes('groq.com');
const gOk = () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'oi gemini' }] } }] }), { status: 200 });
const qOk = () => new Response(JSON.stringify({ choices: [{ message: { content: 'oi groq' } }] }), { status: 200 });

/** Resposta que só chega depois de `ms`, e que respeita o AbortSignal. */
const lento = (ms, resp) => (url, init) => new Promise((resolve, reject) => {
  const t = setTimeout(() => resolve(resp()), ms);
  init.signal.addEventListener('abort', () => { clearTimeout(t); reject(Object.assign(new Error('abort'), { name: 'AbortError' })); });
});

beforeEach(() => { _resetBreaker(); vi.useFakeTimers(); vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('timeouts separados Groq 12 s / Gemini 8 s', () => {
  it('a soma no pior caso fica abaixo dos 25 s do cliente do chat', () => {
    expect(GROQ_TIMEOUT_MS).toBe(12000);
    expect(GEMINI_TIMEOUT_MS).toBe(8000);
    expect(GROQ_TIMEOUT_MS + GEMINI_TIMEOUT_MS).toBeLessThan(25000);
  });

  it('Groq mudo por 12 s aborta e cai no Gemini', async () => {
    vi.stubGlobal('fetch', vi.fn((u, i) => (isGroq(u) ? lento(60000, qOk)(u, i) : Promise.resolve(gOk()))));
    const p = callChatModel(env, req);
    await vi.advanceTimersByTimeAsync(12000);
    expect(await p).toMatchObject({ ok: true, provider: 'gemini' });
  });

  it('Groq lento de 11 s ainda vence', async () => {
    vi.stubGlobal('fetch', vi.fn((u, i) => (isGroq(u) ? lento(11000, qOk)(u, i) : Promise.resolve(gOk()))));
    const p = callChatModel(env, req);
    await vi.advanceTimersByTimeAsync(11000);
    expect(await p).toMatchObject({ ok: true, provider: 'groq', text: 'oi groq' });
  });

  it('sem GEMINI_API_KEY, o timeout do Groq devolve status 0', async () => {
    vi.stubGlobal('fetch', vi.fn(lento(60000, qOk)));
    const p = callChatModel({ GROQ_API_KEY: 'g' }, req);
    await vi.advanceTimersByTimeAsync(12000);
    expect(await p).toEqual({ ok: false, status: 0 });
  });

  it('Gemini mudo aborta aos 8 s (após o Groq cair)', async () => {
    vi.stubGlobal('fetch', vi.fn(lento(60000, gOk)));
    const p = callChatModel(env, req);
    await vi.advanceTimersByTimeAsync(12000 + 8000);
    expect(await p).toEqual({ ok: false, status: 0 });
  });

  it.each([429, 401])('Groq %i com GEMINI_API_KEY presente vai ao Gemini', async st => {
    vi.stubGlobal('fetch', vi.fn(async u => (isGroq(u) ? new Response('{}', { status: st }) : gOk())));
    expect(await callChatModel(env, req)).toMatchObject({ ok: true, provider: 'gemini' });
  });
});
