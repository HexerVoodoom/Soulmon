import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callChatModel, _resetBreaker } from './_llm.js';

const req = { messages: [{ role: 'system', content: 's' }, { role: 'user', content: 'SEGREDO-DO-USUARIO' }], tools: [{ type: 'function', function: { name: 'criar_tarefa', description: 'd', parameters: { type: 'object', properties: { titulo: { type: 'string' } } } } }], temperature: 0.5, maxTokens: 100 };
const env = { GROQ_API_KEY: 'g', GEMINI_API_KEY: 'AQ.x' };
const gOk = (parts = [{ text: 'oi gemini' }]) => new Response(JSON.stringify({ candidates: [{ content: { parts } }] }), { status: 200 });
const groqErr = st => new Response(JSON.stringify({ error: { code: 'model_terms', type: 'invalid_request_error', message: 'SEGREDO-DO-USUARIO' } }), { status: st });
const isGroq = u => String(u).includes('groq.com');

beforeEach(() => { _resetBreaker(); vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('fallback Groq -> Gemini em falha de conta', () => {
  it('Groq 400/400 (com e sem ferramentas) -> Gemini responde, com ferramentas e header x-goog-api-key', async () => {
    const f = vi.fn(async u => (isGroq(u) ? groqErr(400) : gOk([{ functionCall: { name: 'criar_tarefa', args: { titulo: 'x' } } }])));
    vi.stubGlobal('fetch', f);
    const r = await callChatModel(env, req);
    expect(f.mock.calls.filter(c => isGroq(c[0])).length).toBe(2);
    expect(r).toMatchObject({ ok: true, provider: 'gemini' });
    expect(r.toolCalls[0].function).toEqual({ name: 'criar_tarefa', arguments: { titulo: 'x' } });
    const gc = f.mock.calls.find(c => !isGroq(c[0]));
    expect(gc[1].headers['x-goog-api-key']).toBe('AQ.x');
    const b = JSON.parse(gc[1].body);
    expect(b.tools[0].functionDeclarations[0].name).toBe('criar_tarefa');
    expect(b.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 });
  });
  it('Groq 401 -> Gemini', async () => {
    vi.stubGlobal('fetch', vi.fn(async u => (isGroq(u) ? groqErr(401) : gOk())));
    expect(await callChatModel(env, req)).toMatchObject({ ok: true, provider: 'gemini', text: 'oi gemini' });
  });
  it('Gemini também 4xx -> falha com status 4xx', async () => {
    vi.stubGlobal('fetch', vi.fn(async u => (isGroq(u) ? groqErr(403) : new Response('x', { status: 400 }))));
    expect(await callChatModel(env, req)).toEqual({ ok: false, status: 400 });
  });
  it('sem GEMINI_API_KEY, 401 do Groq continua falha', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => groqErr(401)));
    expect(await callChatModel({ GROQ_API_KEY: 'g' }, req)).toEqual({ ok: false, status: 401 });
  });
  it('log não contém conteúdo do usuário nem chave', async () => {
    vi.stubGlobal('fetch', vi.fn(async u => (isGroq(u) ? groqErr(400) : new Response('SEGREDO-DO-USUARIO', { status: 400 }))));
    await callChatModel(env, req);
    const log = JSON.stringify(console.error.mock.calls);
    expect(log).not.toMatch(/SEGREDO|AQ\.x|Bearer/);
    expect(log).toContain('model_terms');
  });
  it('disjuntor: após 2 falhas de conta vai direto ao Gemini; fecha após 10 min', async () => {
    const f = vi.fn(async u => (isGroq(u) ? groqErr(401) : gOk()));
    vi.stubGlobal('fetch', f);
    await callChatModel(env, req); await callChatModel(env, req);
    const antes = f.mock.calls.filter(c => isGroq(c[0])).length;
    expect(antes).toBe(2);
    const r = await callChatModel(env, req);
    expect(r.provider).toBe('gemini');
    expect(f.mock.calls.filter(c => isGroq(c[0])).length).toBe(antes);
    const t = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(t + 11 * 60 * 1000);
    await callChatModel(env, req);
    expect(f.mock.calls.filter(c => isGroq(c[0])).length).toBe(antes + 1);
  });
});
