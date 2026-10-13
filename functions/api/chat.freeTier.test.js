/**
 * CUSTO ZERO no chat (decisão do dono, 11/10/2026, REGISTRO §32): só o plano
 * GRATUITO do Groq, com o Gemini gratuito de reserva. Critérios:
 *  (a) modelo padrão = o que mais rende no gratuito com tool use (gpt-oss-120b);
 *  (b) 429 do Groq cai no Gemini;
 *  (c) os dois no limite → 429 `ai-busy` com a fala cansada do Soulmon, sem 500;
 *  (d) a cota diária cabe no gratuito para ~15 testadores.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { onRequestPost as chat, AI_BUSY_MESSAGE } from './chat.js';
import { GROQ_MODEL_DEFAULT } from './_llm.js';
import { AI_LIMITS } from './_aiGuard.js';
import { ENT_PREFIX } from './_entitlements.js';

const SAVE = 'abcdefgh12345678';
function fakeEnv(extra = {}) {
  const store = new Map([[ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid' })]]);
  return { GROQ_API_KEY: 'k', DIGIAPP_SAVES: { get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); } }, ...extra };
}
const pedido = (lang = 'pt-BR') => new Request('https://soulmon.test/api/chat', { method: 'POST', body: JSON.stringify({ message: 'oi', id: SAVE, language: lang }) });
const geminiOk = text => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });
const groqOk = text => new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), { status: 200 });

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('chat no plano gratuito', () => {
  it('(a) padrão gpt-oss-120b com reasoning_effort low e folga de max_completion_tokens para o raciocínio', async () => {
    expect(GROQ_MODEL_DEFAULT).toBe('openai/gpt-oss-120b');
    const f = vi.fn(async () => groqOk('oi!'));
    vi.stubGlobal('fetch', f);
    const res = await chat({ request: pedido(), env: fakeEnv() });
    expect((await res.json()).response).toBe('oi!');
    const body = JSON.parse(f.mock.calls[0][1].body);
    expect(body.model).toBe('openai/gpt-oss-120b');
    expect(body.reasoning_effort).toBe('low');
    expect(body.max_completion_tokens).toBeGreaterThanOrEqual(300);
  });

  it('modelo não-gpt-oss (CHAT_MODEL) não recebe reasoning_effort', async () => {
    const f = vi.fn(async () => groqOk('oi!'));
    vi.stubGlobal('fetch', f);
    await chat({ request: pedido(), env: fakeEnv({ CHAT_MODEL: 'llama-3.3-70b-versatile' }) });
    expect(JSON.parse(f.mock.calls[0][1].body).reasoning_effort).toBeUndefined();
  });

  it('(b) Groq 429 → Gemini gratuito responde', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async url => (String(url).includes('groq.com') ? new Response('rate', { status: 429 }) : geminiOk('pelo gemini'))));
    const res = await chat({ request: pedido(), env: fakeEnv({ GEMINI_API_KEY: 'g' }) });
    expect(res.status).toBe(200);
    expect((await res.json()).response).toBe('pelo gemini');
  });

  it('(c) Groq 429 e Gemini 429 → 429 ai-busy com a fala cansada (PT e EN), nunca 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => new Response('rate', { status: 429 })));
    let res = await chat({ request: pedido('pt-BR'), env: fakeEnv({ GEMINI_API_KEY: 'g' }) });
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: 'ai-busy', response: AI_BUSY_MESSAGE.pt });
    res = await chat({ request: pedido('en-US'), env: fakeEnv({ GEMINI_API_KEY: 'g' }) });
    expect((await res.json()).response).toBe(AI_BUSY_MESSAGE.en);
    expect(AI_BUSY_MESSAGE.pt).toMatch(/cansad/);
  });

  it('(c) só Groq configurado e no limite → mesmo 429 amigável', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => new Response('rate', { status: 429 })));
    const res = await chat({ request: pedido(), env: fakeEnv() });
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe('ai-busy');
  });

  it('(d) cota cabe no gratuito: global 250 ≤ Groq (~105/dia) + Gemini (~250/dia); 15 testadores × demo cabem', () => {
    const { perAccountByTier, global, perMinute } = AI_LIMITS.chat;
    expect(global).toBe(250);
    expect(15 * perAccountByTier.demo).toBeLessThanOrEqual(global);
    expect(global).toBeLessThanOrEqual(105 + 250);
    expect(perMinute).toBe(4);
  });
});
