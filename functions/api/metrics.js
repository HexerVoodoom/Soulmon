// ---------------------------------------------------------------------------
// TELEMETRIA — recebe lotes de eventos e grava AGREGADOS DIÁRIOS na KV.
//
// Par servidor de `src/utils/telemetry.ts`. Leia os princípios lá; eles valem
// aqui com a mesma força, e três deles são responsabilidade DESTE arquivo:
//
//  1. AGREGADOS, NUNCA CONTEÚDO — e nunca a série individual. O que existe na
//     KV é uma chave por DIA (`m:YYYY-MM-DD`) com contadores somados de todo
//     mundo. Não há chave por usuário, não há lista de eventos, não há nada de
//     onde reconstruir o comportamento de uma pessoa. Isso não é uma política
//     de retenção que alguém precisa lembrar de aplicar: é a forma do dado.
//  3. PSEUDÔNIMO, NUNCA IDENTIDADE — `batch.id` é validado (formato) e
//     DESCARTADO. Ele nunca entra numa chave, num valor, nem num `console.log`.
//     O `saveId` (SHA-256 do e-mail) não aparece em lugar nenhum deste arquivo,
//     e é isso que impede religar métrica a conta.
//  5. FALHA SILENCIOSA — o cliente ignora a resposta. Ainda assim respondemos
//     com status honesto (400 em corpo malformado) porque é o que torna o
//     endpoint testável; o cliente é quem escolhe não olhar.
//  6. SEM PII DERIVÁVEL — a maior resolução aceita é o DIA, e um dia fora da
//     janela de `MAX_DAY_SKEW_DAYS` é descartado. Sem isso, um cliente com
//     relógio errado (ou alguém brincando) cria chaves arbitrárias no
//     namespace e polui o agregado que deveria arbitrar decisões de produto.
//
// ALLOWLIST, NUNCA DENYLIST. `EVENT_SCHEMA` enumera os eventos e, por evento,
// exatamente quais props existem e em que faixa. Qualquer coisa fora disso
// derruba o EVENTO inteiro (não "limpa o campo"): denylist esquece o campo que
// ninguém previu, que é justamente o campo pelo qual um texto de usuário
// entraria aqui.
//
// BINDING: reusa `DIGIAPP_SAVES`, com prefixo `m:` — de propósito. O aviso do
// CLAUDE.md é que `wrangler deploy` remove binding não declarado; pedir um
// namespace novo transformaria "instrumentar o funil" num risco de deploy.
// Prefixo próprio no namespace que já existe custa zero e não colide com
// `ent:`/`ord:` (`_entitlements.js`) nem com o saveId cru (32–64 hex).
//
// FRONTEIRA: `EVENT_SCHEMA` está DUPLICADO em `src/utils/telemetry.ts` —
// Pages Functions não importam de `src/`. Há teste de PARIDADE travando as duas
// cópias (footgun 9: regra copiada é regra que diverge em silêncio).
// ---------------------------------------------------------------------------

import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/** Prefixo da chave de agregado diário. Ver "BINDING" acima. */
export const METRICS_PREFIX = 'm:';

/**
 * Espelho do `EVENT_SCHEMA` do cliente. `null` = evento sem props.
 * Ver o teste de paridade antes de mexer em qualquer linha daqui.
 */
export const EVENT_SCHEMA = {
  install: null,
  onboarding_step: { step: { min: 0, max: 45 }, funnel: { min: 0, max: 2 } },
  demo_pick: null,
  first_task_done: null,
  day_active: { effort: { min: 0, max: 500 } },
  unlock_view: null,
  purchase: null,
};

/**
 * Teto do corpo. Um lote cheio (100 eventos) dá ~4 KB; 16 KB é folga larga e
 * ainda 300× menor que o teto do save. O motivo é o mesmo do `MAX_STATE_BYTES`
 * de `save.js`: sem teto, um cliente com bug enche o namespace de graça.
 */
export const MAX_BODY_BYTES = 16 * 1024;

/** Eventos por lote. Casa com o `MAX_BATCH` do cliente. */
export const MAX_EVENTS = 100;

/**
 * Quantos dias de defasagem um evento pode ter. Existe porque a fila do cliente
 * sobrevive entre sessões: quem ficou offline uma semana ainda tem evento
 * legítimo de sete dias atrás. Além disso, o dia do cliente é LOCAL, então
 * ±1 já seria necessário só por fuso.
 */
export const MAX_DAY_SKEW_DAYS = 7;

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const ID_RE = /^[0-9a-f]{32}$/;

/** Teto por IP. Amortecedor de CUSTO (ver `_rateLimit.js`), não segurança. */
const RATE = { limit: 60, windowMs: 60_000 };

// ---------------------------------------------------------------------------
// Funções puras — o que os testes travam
// ---------------------------------------------------------------------------

/** Dia UTC do servidor em `YYYY-MM-DD`. */
export function serverDay(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** Distância em dias entre dois `YYYY-MM-DD`. `NaN` se algum não for data. */
export function dayDistance(a, b) {
  const ta = Date.parse(`${a}T00:00:00Z`);
  const tb = Date.parse(`${b}T00:00:00Z`);
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return NaN;
  return Math.abs(ta - tb) / 86400000;
}

/**
 * Valida um evento contra a allowlist.
 * @returns o registro saneado, ou `null` se qualquer coisa não bater.
 */
export function sanitizeRecord(record, today) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;

  const event = record.e;
  if (typeof event !== 'string') return null;
  // `Object.prototype.hasOwnProperty` e não `EVENT_SCHEMA[event]`: sem isso,
  // `e: "constructor"` acha um valor no protótipo e passa pela allowlist.
  if (!Object.prototype.hasOwnProperty.call(EVENT_SCHEMA, event)) return null;
  const schema = EVENT_SCHEMA[event];

  const day = record.d;
  if (typeof day !== 'string' || !DAY_RE.test(day)) return null;
  const skew = dayDistance(day, today);
  if (!Number.isFinite(skew) || skew > MAX_DAY_SKEW_DAYS) return null;

  // Campo desconhecido no PRÓPRIO registro (não só nas props) também derruba:
  // é por um campo extra a mais que um `taskName` chegaria aqui.
  for (const key of Object.keys(record)) {
    if (key !== 'e' && key !== 'd' && key !== 'p') return null;
  }

  const props = record.p;
  if (!schema) {
    if (props !== undefined) return null;
    return { e: event, d: day };
  }
  if (!props || typeof props !== 'object' || Array.isArray(props)) return null;

  const out = {};
  for (const key of Object.keys(props)) {
    const rule = schema[key];
    if (!rule) return null;
    const raw = props[key];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
    const n = Math.round(raw);
    if (n < rule.min || n > rule.max) return null;
    out[key] = n;
  }
  for (const key of Object.keys(schema)) if (!(key in out)) return null;

  return { e: event, d: day, p: out };
}

/**
 * Valida o lote inteiro.
 * @returns {{ ok: true, events: Array<{ e: string, d: string, p?: object }> }
 *         | { ok: false, reason: string }} `events` já agrupados por dia.
 */
export function sanitizeBatch(body, today = serverDay()) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, reason: 'body' };
  }
  if (body.v !== 1) return { ok: false, reason: 'version' };
  // O pseudônimo é validado e JOGADO FORA aqui mesmo. Ele não é lido de novo em
  // nenhum ponto abaixo desta linha — essa é a garantia inteira do princípio 3.
  if (typeof body.id !== 'string' || !ID_RE.test(body.id)) {
    return { ok: false, reason: 'id' };
  }
  if (!Array.isArray(body.events)) return { ok: false, reason: 'events' };
  if (body.events.length === 0 || body.events.length > MAX_EVENTS) {
    return { ok: false, reason: 'events' };
  }
  for (const key of Object.keys(body)) {
    if (key !== 'v' && key !== 'id' && key !== 'events') return { ok: false, reason: 'body' };
  }

  // Evento ruim NÃO derruba o lote: um cliente antigo mandando um evento que
  // não existe mais faria perder também os eventos bons que vieram junto.
  const events = [];
  for (const record of body.events) {
    const clean = sanitizeRecord(record, today);
    if (clean) events.push(clean);
  }
  return { ok: true, events };
}

/**
 * Rótulo do funil no agregado. Espelha `TELEMETRY_FUNNEL` de
 * `src/utils/telemetry.ts` (0 unknown / 1 demo / 2 paid). Sai como TEXTO na
 * chave porque quem vai ler o agregado é uma pessoa, e `onboarding_step.2.7`
 * não diz de qual dos dois usuários opostos aquele 7 é.
 */
const FUNNEL_LABEL = ['unknown', 'demo', 'paid'];

/**
 * Soma eventos num agregado do dia. PURA — recebe e devolve o objeto contado.
 *
 * Formato (tudo número, tudo somado sobre todos os usuários):
 *   `install`, `demo_pick`, `first_task_done`, `unlock_view`, `purchase`,
 *   `day_active`               → contagem de eventos
 *   `onboarding_step.<funil>.<n>` → quantos chegaram ao passo n em CADA funil
 *                                (demo/paid/unknown) — o drop-off por caminho
 *   `effort_sum`               → soma do peso de esforço do dia
 *
 * O north star sai daqui: `effort_sum / day_active` = peso de esforço real
 * concluído por usuário ativo. Nada mais é preciso guardar para lê-lo.
 */
export function applyAggregate(agg, events) {
  const out = { ...(agg && typeof agg === 'object' && !Array.isArray(agg) ? agg : {}) };
  const bump = (key, by = 1) => {
    const cur = typeof out[key] === 'number' && Number.isFinite(out[key]) ? out[key] : 0;
    out[key] = cur + by;
  };
  for (const record of events) {
    bump(record.e);
    // Chave SEMPRE com o funil. Sem ele, o passo 7 do demo e o passo 7 do
    // ritual pago viravam o mesmo número — a média de duas populações que nunca
    // se encontram, que é o mesmo que não medir.
    if (record.e === 'onboarding_step') {
      const funnel = FUNNEL_LABEL[record.p.funnel] ?? 'unknown';
      bump(`onboarding_step.${funnel}.${record.p.step}`);
    }
    if (record.e === 'day_active') bump('effort_sum', record.p.effort);
  }
  return out;
}

/** Agrupa por dia — uma leitura+escrita de KV por dia, não por evento. */
export function groupByDay(events) {
  const byDay = new Map();
  for (const record of events) {
    if (!byDay.has(record.d)) byDay.set(record.d, []);
    byDay.get(record.d).push(record);
  }
  return byDay;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS });
  }

  const gate = takeToken('metrics', clientKey(request), RATE);
  if (!gate.ok) return tooManyRequests(gate.retryAfter, CORS);

  // Lemos como TEXTO para poder aplicar o teto ANTES de parsear — `json()` num
  // corpo de 5 MB já custou a CPU antes de qualquer validação nossa.
  const raw = await request.text().catch(() => null);
  if (raw === null || raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: 'Invalid body' }, { status: 400, headers: CORS });
  }
  let body = null;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400, headers: CORS });
  }

  const result = sanitizeBatch(body);
  if (!result.ok) {
    return Response.json({ error: 'Invalid batch' }, { status: 400, headers: CORS });
  }
  // Lote válido cujos eventos foram todos recusados: 202, não erro. O cliente
  // não deve tentar de novo, e não há nada que ele possa consertar.
  if (result.events.length === 0) {
    return Response.json({ ok: true, accepted: 0 }, { status: 202, headers: CORS });
  }

  // Sem binding, a telemetria simplesmente não grava. NÃO é 500: o cliente
  // dispara e esquece, e um endpoint de métrica não tem o direito de parecer
  // uma falha do app. O `console.warn` é para quem opera, não para o usuário.
  if (!env?.DIGIAPP_SAVES) {
    console.warn('metrics: KV DIGIAPP_SAVES não vinculado — agregado descartado');
    return Response.json({ ok: true, accepted: 0 }, { status: 202, headers: CORS });
  }

  // Read-modify-write. O KV não tem transação (mesma limitação documentada em
  // `_entitlements.js`): escritas concorrentes podem perder uma contagem. Para
  // uma métrica de produto isso é ruído aceitável — o que NÃO seria aceitável é
  // uma escrita por evento, que multiplicaria o custo de KV pelo tráfego.
  let accepted = 0;
  for (const [day, records] of groupByDay(result.events)) {
    const key = METRICS_PREFIX + day;
    try {
      const current = await env.DIGIAPP_SAVES.get(key, { type: 'json' }).catch(() => null);
      const next = applyAggregate(current, records);
      // TTL de 2 anos: agregado sem dono é lixo com custo. Renovado a cada
      // escrita, então um dia ativo nunca expira no meio da coleta.
      await env.DIGIAPP_SAVES.put(key, JSON.stringify(next), { expirationTtl: 86400 * 730 });
      accepted += records.length;
    } catch (err) {
      console.warn('metrics: falha ao gravar agregado', { day, error: String(err?.name ?? err) });
    }
  }

  return Response.json({ ok: true, accepted }, { headers: CORS });
}
