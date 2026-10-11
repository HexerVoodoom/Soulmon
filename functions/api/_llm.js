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
export const GEMINI_MODEL = 'gemini-2.5-flash';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TIMEOUT_MS = 10000;

/** @returns {Promise<Response>} */
async function timedFetch(url, init) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
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
    max_tokens: maxTokens,
    temperature,
  };
  // gpt-oss raciocina antes de responder; `low` gasta menos do TPD gratuito.
  // O raciocínio conta dentro de `max_tokens`: sem folga, uma resposta de 120
  // tokens podia sair VAZIA (tudo gasto pensando). +300 de folga.
  if (/^openai\/gpt-oss/.test(body.model)) { body.reasoning_effort = 'low'; body.max_tokens = maxTokens + 300; }
  if (withTools && tools?.length) { body.tools = tools; body.tool_choice = 'auto'; body.parallel_tool_calls = false; }
  const res = await timedFetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GROQ_API_KEY}` },
    body: JSON.stringify(body),
  });
  return res;
}

/** @param {Record<string, any>} env @param {LlmReq} req @returns {Promise<LlmResult>} */
async function groq(env, req) {
  let res = await callGroq(env, req, true);
  if (res.status === 400 && req.tools?.length) {
    // `tool_use_failed`: o modelo montou a chamada errada. Uma segunda tentativa
    // SEM ferramentas ainda entrega a conversa (e nenhuma ação, que é o seguro).
    const t = await res.text().catch(() => '');
    if (/tool_use_failed/.test(t)) res = await callGroq(env, req, false);
    else return { ok: false, status: 400 };
  }
  if (!res.ok) return { ok: false, status: res.status };
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
  const res = await timedFetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    // Chave em header, não na URL: URL vai parar em log de proxy.
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      tools: geminiTools(tools),
      generationConfig: { temperature: Math.min(temperature, 2), maxOutputTokens: maxTokens, thinkingConfig: { thinkingBudget: 0 } },
    }),
  });
  if (!res.ok) return { ok: false, status: res.status };
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
  if (env.GROQ_API_KEY) {
    try {
      const r = await groq(env, req);
      if (r.ok) return r;
      last = r;
      console.error('[chat] groq falhou', { status: r.status });
    } catch (err) {
      console.error('[chat] groq rede/timeout', { name: err?.name });
      last = { ok: false, status: 0 };
    }
    // 4xx do pedido (≠ 429) não melhora trocando de provedor; o resto, sim.
    if (last.status >= 400 && last.status < 500 && last.status !== 429) return last;
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
