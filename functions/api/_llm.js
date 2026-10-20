// ---------------------------------------------------------------------------
// ADAPTADOR ÚNICO DE LLM DO CHAT — Groq (principal) com fallback para Gemini.
//
// Quem chama (`chat.js`) fala UM formato (OpenAI: messages + tools) e recebe UM
// formato de volta: `{ ok, text, toolCalls, provider }`. Trocar de provedor ou
// de modelo não toca em regra de produto.
//
// CUSTO ZERO (decisão do dono, 11/10/2026, REGISTRO §32): só o plano GRATUITO
// do Groq, com o gratuito do Gemini de reserva. Nada aqui exige billing pago.
//
// MODELO PADRÃO = `openai/gpt-oss-120b`. Fonte: console.groq.com/docs/rate-limits
// (lido em 11/10/2026): gpt-oss-120b 30 RPM · 1.000 RPD · 8K TPM · 200K TPD. O
// `llama-3.3-70b-versatile` NÃO aparece nessa tabela; fontes de terceiros
// (2026) dão 30 RPM · 1.000 RPD · 12K TPM · 100K TPD no gratuito — METADE dos
// tokens/dia. Com ~1.900 tokens por chamada (prompt + ferramentas + fatos +
// resposta) isso é ~105 chamadas/dia no 120b contra ~52 no 70b. Os dois são de
// produção com tool use (console.groq.com/docs/models). O 8b errava o formato de
// ferramenta. `reasoning_effort: 'low'` porque o gpt-oss é de raciocínio e o
// raciocínio conta no TPD. Troca sem deploy: var `CHAT_MODEL`.
//
// LIMITE: 429 do Groq cai no Gemini gratuito (`gemini-2.5-flash`; ~10 RPM /
// ~250 RPD segundo guias de jan/2026 — o Google manda conferir no AI Studio).
// Se os dois limitarem, `callChatModel` devolve 429 e `chat.js` responde a frase
// cansada do Soulmon (`AI_BUSY_MESSAGE`), nunca erro.
//
// LOG: só status e nome do provedor. Corpo de erro do provedor pode ecoar o
// prompt (texto da pessoa) e NUNCA vai para o log.
// ---------------------------------------------------------------------------

/**
 * @typedef {{ messages: Array<{role:string,content:string}>, tools?: any[], temperature: number, maxTokens: number }} LlmReq
 * @typedef {{ ok: true, provider: string, text: string, toolCalls: any[] } | { ok: false, status: number }} LlmResult
 */

export const GROQ_MODEL_DEFAULT = 'openai/gpt-oss-120b';
// 20/10/2026: `gemini-2.5-flash` passou a responder 404 (modelo aposentado).
// O alias `-latest` acompanha o Flash vigente; troca sem deploy: var `GEMINI_CHAT_MODEL`.
export const GEMINI_MODEL = 'gemini-flash-latest';
export function geminiModel(env) {
  const m = typeof env?.GEMINI_CHAT_MODEL === 'string' ? env.GEMINI_CHAT_MODEL.trim() : '';
  return /^[\w.-]{3,60}$/.test(m) ? m : GEMINI_MODEL;
}
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Timeouts separados. O gpt-oss-120b raciocina (mesmo com effort 'low'), então o
// Groq ganha mais tempo; o Gemini (thinkingBudget 0) é rápido. Soma no pior
// caso: 12 s + 8 s = 20 s < 25 s do cliente do chat.
export const GROQ_TIMEOUT_MS = 12000;
export const GEMINI_TIMEOUT_MS = 8000;

/** @returns {Promise<Response>} */
async function timedFetch(url, init, timeoutMs) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function chatModel(env) {
  const m = typeof env?.CHAT_MODEL === 'string' ? env.CHAT_MODEL.trim() : '';
  return /^[\w./:-]{3,80}$/.test(m) ? m : GROQ_MODEL_DEFAULT;
}

/** @param {Record<string, any>} env @param {LlmReq} req @param {boolean} withTools */
async function callGroq(env, req, withTools) {
  const { messages, tools, temperature, maxTokens } = req;
  const body = {
    model: chatModel(env),
    messages,
    max_completion_tokens: maxTokens,
    temperature,
  };
  // gpt-oss raciocina antes de responder; `low` gasta menos do TPD gratuito.
  // O raciocínio conta dentro de `max_completion_tokens`: sem folga, uma resposta de 120
  // tokens podia sair VAZIA (tudo gasto pensando). +300 de folga.
  if (/^openai\/gpt-oss/.test(body.model)) { body.reasoning_effort = 'low'; body.max_completion_tokens = maxTokens + 300; }
  if (withTools && tools?.length) { body.tools = tools; body.tool_choice = 'auto'; }
  const res = await timedFetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GROQ_API_KEY}` },
    body: JSON.stringify(body),
  }, GROQ_TIMEOUT_MS);
  return res;
}

/** Classifica a mensagem de erro do provedor por palavra-chave FIXA: nunca
 *  devolve trecho da mensagem (ela pode ecoar o prompt). */
export function errorHint(message) {
  if (typeof message !== 'string') return '';
  const m = message.toLowerCase();
  const KEYS = ['decommission', 'deprecated', 'terms', 'does not exist', 'not found',
    'reasoning_effort', 'max_completion_tokens', 'temperature', 'tool', 'context', 'too large',
    'thinking', 'api key', 'permission', 'quota', 'billing', 'organization', 'restricted', 'invalid'];
  return KEYS.filter(k => m.includes(k)).join('|').slice(0, 80);
}

/** Só metadados do erro do Groq: `error.code`, `error.type` e o modelo.
 *  NUNCA `message`/`failed_generation` (ecoam o prompt). Valores passam por
 *  lista de caracteres seguros para não carregar texto livre. */
async function logGroqError(env, res) {
  let code = '', type = '', hint = '';
  try {
    const e = JSON.parse(await res.text())?.error ?? {};
    const safe = v => (typeof v === 'string' && /^[\w.-]{1,40}$/.test(v) ? v : '');
    code = safe(e.code); type = safe(e.type);
    hint = errorHint(e.message);
  } catch { /* corpo não-JSON: sem metadados */ }
  console.error('[chat] groq 400', { code, type, hint, model: chatModel(env) });
}

// Falha de CONTA/CONFIG do Groq (modelo, chave, termos): 400 final (já sem
// ferramentas), 401, 403, 404. Não é culpa do pedido: troca de provedor.
const isAccountFail = st => st === 400 || st === 401 || st === 403 || st === 404;

// Disjuntor em memória do isolate: 2 falhas de conta em 10 min => 10 min direto
// no Gemini, sem gastar 2 chamadas por mensagem. Sucesso do Groq zera.
const BREAKER_WINDOW_MS = 10 * 60 * 1000;
/** @type {{ fails: number[], openUntil: number }} */
const breaker = { fails: [], openUntil: 0 };
export function _resetBreaker() { breaker.fails = []; breaker.openUntil = 0; }
function noteAccountFail(now) {
  breaker.fails = breaker.fails.filter(t => now - t < BREAKER_WINDOW_MS);
  breaker.fails.push(now);
  if (breaker.fails.length >= 2) breaker.openUntil = now + BREAKER_WINDOW_MS;
}

/** @param {Record<string, any>} env @param {LlmReq} req @returns {Promise<LlmResult>} */
async function groq(env, req) {
  let res = await callGroq(env, req, true);
  if (res.status === 400 && req.tools?.length) {
    // 400 COM ferramentas, por qualquer motivo (modelo montou a chamada errada,
    // esquema/parâmetro rejeitado): uma 2ª tentativa SEM ferramentas ainda
    // entrega a conversa (e nenhuma ação, que é o seguro). Só a 2ª falha vale.
    await logGroqError(env, res);
    res = await callGroq(env, req, false);
  }
  if (!res.ok) {
    if (res.status === 400) await logGroqError(env, res);
    return { ok: false, status: res.status };
  }
  const data = await res.json();
  const msg = data.choices?.[0]?.message ?? {};
  return {
    ok: true,
    provider: 'groq',
    text: typeof msg.content === 'string' ? msg.content : '',
    toolCalls: Array.isArray(msg.tool_calls) ? msg.tool_calls : [],
  };
}

/** Esquema OpenAI → subconjunto OpenAPI do Gemini (sem enum inteiro, sem objeto vazio). */
function geminiSchema(s) {
  if (!s || typeof s !== 'object') return s;
  const out = {};
  for (const [k, v] of Object.entries(s)) {
    if (k === 'type') out.type = String(v).toUpperCase();
    else if (k === 'enum' && s.type === 'integer') continue;
    else if (k === 'properties') out.properties = Object.fromEntries(Object.entries(v).map(([n, p]) => [n, geminiSchema(p)]));
    else if (k === 'items') out.items = geminiSchema(v);
    else out[k] = v;
  }
  return out;
}

function geminiTools(tools) {
  if (!tools?.length) return undefined;
  return [{
    functionDeclarations: tools.map(t => {
      const p = t.function.parameters;
      const hasProps = p && p.properties && Object.keys(p.properties).length > 0;
      return {
        name: t.function.name,
        description: t.function.description,
        ...(hasProps ? { parameters: geminiSchema(p) } : {}),
      };
    }),
  }];
}

/** @param {Record<string, any>} env @param {LlmReq} req @returns {Promise<LlmResult>} */
async function gemini(env, req) {
  const { messages, tools, temperature, maxTokens } = req;
  const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content) }],
  }));
  const call = generationConfig => timedFetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel(env)}:generateContent`, {
    method: 'POST',
    // Chave em header, não na URL: URL vai parar em log de proxy.
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      tools: geminiTools(tools),
      generationConfig,
    }),
  }, GEMINI_TIMEOUT_MS);
  const base = { temperature: Math.min(temperature, 2) };
  let res = await call({ ...base, maxOutputTokens: maxTokens, thinkingConfig: { thinkingBudget: 0 } });
  // Modelos novos podem recusar `thinkingBudget: 0` (400): repete sem ele, com folga
  // para o raciocínio não comer a resposta inteira.
  if (res.status === 400) res = await call({ ...base, maxOutputTokens: maxTokens + 400 });
  if (!res.ok) {
    let hint = '';
    try { hint = errorHint(JSON.parse(await res.text())?.error?.message); } catch { /* sem corpo */ }
    console.error('[chat] gemini erro', { status: res.status, hint, model: geminiModel(env) });
    return { ok: false, status: res.status };
  }
  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return {
    ok: true,
    provider: 'gemini',
    text: parts.filter(p => typeof p.text === 'string').map(p => p.text).join('').trim(),
    toolCalls: parts.filter(p => p.functionCall).map(p => ({ function: { name: p.functionCall.name, arguments: p.functionCall.args ?? {} } })),
  };
}

/**
 * @param {Record<string, any>} env
 * @param {LlmReq} req
 * @returns {Promise<LlmResult>}
 */
export async function callChatModel(env, req) {
  /** @type {LlmResult} */
  let last = { ok: false, status: 0 };
  const now = Date.now();
  const skipGroq = !!env.GEMINI_API_KEY && now < breaker.openUntil;
  if (env.GROQ_API_KEY && !skipGroq) {
    try {
      const r = await groq(env, req);
      if (r.ok) { breaker.fails = []; return r; }
      last = r;
      console.error('[chat] groq falhou', { status: r.status });
      if (isAccountFail(r.status)) noteAccountFail(now);
    } catch (err) {
      console.error('[chat] groq rede/timeout', { name: err?.name });
      last = { ok: false, status: 0 };
    }
    // Outro 4xx (ex.: 413/422) é do pedido: trocar de provedor não ajuda.
    // 400/401/403/404 são de conta/config e caem no Gemini (se houver chave).
    if (last.status >= 400 && last.status < 500 && last.status !== 429 && !isAccountFail(last.status)) return last;
  }
  if (env.GEMINI_API_KEY) {
    try {
      const r = await gemini(env, req);
      if (!r.ok) console.error('[chat] gemini falhou', { status: r.status });
      return r;
    } catch (err) {
      console.error('[chat] gemini rede/timeout', { name: err?.name });
      return { ok: false, status: 0 };
    }
  }
  return last;
}

export const hasChatProvider = env => !!(env?.GROQ_API_KEY || env?.GEMINI_API_KEY);
