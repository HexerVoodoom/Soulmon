// ---------------------------------------------------------------------------
// RELATÓRIO DE FALHA (crash) — leve, próprio, sem SDK de terceiro.
//
// Par servidor de `src/utils/crashReport.ts`. Existe porque a métrica-norte do
// beta fechado é "zero crash bloqueante" e, até aqui, só a Play Console media
// isso (com 12–15 testadores quase não há sinal) — o `ErrorBoundary` só fazia
// `console.error` em DEV.
//
// O QUE GUARDA (e só isso — é allowlist, não denylist):
//   `kind` (boundary | error | rejection), `msg` (≤200), `stack` (≤800),
//   `ver` (versão do app), `route` (caminho SEM query/hash/ids, ≤80),
//   `plat` (apk | web). Campo desconhecido derruba o relatório inteiro.
// O QUE NUNCA GUARDA: identidade, IP, user agent, saveId, e-mail, conteúdo do
//   usuário, hora com precisão. A mensagem e o stack passam de novo por
//   `scrub` AQUI, mesmo que o cliente já tenha limpado: o servidor não confia
//   no cliente.
//
// FORMA: agrupa por ASSINATURA (hash de kind+msg+primeiro frame). Uma chave
// `crash:<dia>:<assinatura>` com { n, first, last, ... }. Nada por pessoa,
// nada por sessão: mil usuários batendo no mesmo bug são uma linha com n=1000.
//
// CUSTO / ABUSO (amortecedor, não segurança — ver `_rateLimit.js`):
//   · rate limit por IP (RATE);
//   · teto de assinaturas NOVAS por dia (`MAX_SIGNATURES_PER_DAY`) — o resto só
//     incrementa as que já existem;
//   · TTL de 14 dias em toda chave (`expirationTtl`): o dado se apaga sozinho.
//
// LEITURA: GET com `X-Metrics-Key` (o mesmo segredo `METRICS_ADMIN_KEY` de
// `/api/metrics`; sem ele a rota responde 404 — fail-closed). Script:
// `scripts/crash-report.mjs`.
//
// BINDING: reusa a KV de saves com prefixo `crash:` (ver `metrics.js`, "BINDING":
// namespace novo = risco de deploy). Play Data Safety: "Registros de falhas /
// Diagnóstico de falhas — coletado, NÃO vinculado ao usuário, NÃO compartilhado"
// (`docs/PLAY-DATA-SAFETY.md`).
// ---------------------------------------------------------------------------

import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import { kv, kvOrThrow } from './_kv.js';
import { METRICS_KEY_HEADER, secretEquals, dayRange, serverDay } from './metrics.js';

export const CRASH_PREFIX = 'crash:';
/** 14 dias. Mínimo de TTL da KV é 60s; isto é bem acima. */
export const CRASH_TTL_SECONDS = 14 * 24 * 60 * 60;
export const MAX_BODY_BYTES = 4 * 1024;
export const MAX_MSG = 200;
export const MAX_STACK = 800;
export const MAX_ROUTE = 80;
export const MAX_SIGNATURES_PER_DAY = 100;
export const MAX_READ_DAYS = 14;
export const KINDS = ['boundary', 'error', 'rejection'];
export const PLATS = ['apk', 'web'];
const VER_RE = /^[0-9A-Za-z.+-]{1,32}$/;
const SIG_RE = /^[0-9a-f]{16}$/;
/** Teto por IP. Um app em crash-loop manda poucos; 10/min é folga larga. */
const RATE = { limit: 10, windowMs: 60_000 };
const READ_RATE = { limit: 60, windowMs: 60_000 };

// ---------------------------------------------------------------------------
// Funções puras — o que os testes travam
// ---------------------------------------------------------------------------

/**
 * Tira do texto o que poderia identificar alguém ou conter conteúdo: e-mail,
 * URL (fica só o caminho, sem query/hash), JWT, sequências longas de hex/base64
 * e de dígitos. Pura. ESPELHA `scrub` de `src/utils/crashReport.ts` (há teste
 * de paridade por vetor de casos, footgun 9).
 */
export function scrub(text, max) {
  let s = typeof text === 'string' ? text : '';
  s = s
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email]')
    .replace(/\beyJ[\w-]{5,}\.[\w-]{5,}\.[\w-]*/g, '[token]')
    .replace(/\bhttps?:\/\/[^\s/?#)'"]+([^\s?#)'"]*)(\?[^\s#)'"]*)?(#[^\s)'"]*)?/g, '$1')
    .replace(/\b[0-9a-fA-F]{24,}\b/g, '[id]')
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, '[id]')
    .replace(/\d{7,}/g, '[n]');
  return s.slice(0, max);
}

/** Caminho sem query/hash e sem segmentos que parecem id. */
export function scrubRoute(route) {
  const s = typeof route === 'string' ? route : '';
  const path = s.split(/[?#]/)[0] || '/';
  return path
    .split('/')
    .map(seg => (/^[0-9a-f-]{8,}$/i.test(seg) || /^\d+$/.test(seg) ? ':id' : seg))
    .join('/')
    .slice(0, MAX_ROUTE);
}

/**
 * Valida o relatório contra a allowlist.
 * @returns o registro saneado ou `null`.
 */
export function sanitizeReport(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  for (const key of Object.keys(body)) {
    if (!['v', 'kind', 'msg', 'stack', 'ver', 'route', 'plat'].includes(key)) return null;
  }
  if (body.v !== 1) return null;
  if (!KINDS.includes(body.kind)) return null;
  if (typeof body.msg !== 'string' || !body.msg) return null;
  if (body.stack !== undefined && typeof body.stack !== 'string') return null;
  if (typeof body.ver !== 'string' || !VER_RE.test(body.ver)) return null;
  if (typeof body.route !== 'string') return null;
  if (!PLATS.includes(body.plat)) return null;
  return {
    kind: body.kind,
    msg: scrub(body.msg, MAX_MSG),
    stack: scrub(body.stack ?? '', MAX_STACK),
    ver: body.ver,
    route: scrubRoute(body.route),
    plat: body.plat,
  };
}

/** Primeira linha de frame do stack (o que identifica ONDE quebrou). */
function topFrame(stack) {
  const line = String(stack).split('\n').map(l => l.trim()).find(l => /^at\s|@/.test(l) || /:\d+:\d+/.test(l));
  return line ?? '';
}

/** Assinatura: 16 hex de SHA-256(kind|msg|primeiro frame). */
export async function signatureOf(report) {
  const data = new TextEncoder().encode(`${report.kind}|${report.msg}|${topFrame(report.stack)}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const json = (obj, status = 200) =>
  Response.json(obj, { status, headers: { 'Cache-Control': 'no-store' } });

/** Hora UTC (`YYYY-MM-DDTHH`): a maior resolução que guardamos. */
const hourNow = () => new Date().toISOString().slice(0, 13);

async function receive({ request, env }) {
  const gate = takeToken('crash', clientKey(request), RATE);
  if (!gate.ok) return tooManyRequests(gate.retryAfter);

  const raw = await request.text().catch(() => null);
  if (raw === null || raw.length > MAX_BODY_BYTES) return json({ error: 'Invalid body' }, 400);
  let body = null;
  try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid body' }, 400); }
  const report = sanitizeReport(body);
  if (!report) return json({ error: 'Invalid body' }, 400);
  if (!kv(env)) return json({ error: 'Unavailable' }, 503);

  const day = serverDay();
  const sig = await signatureOf(report);
  const key = `${CRASH_PREFIX}${day}:${sig}`;
  const store = kvOrThrow(env);

  try {
    const existing = await store.get(key, { type: 'json' });
    if (existing && typeof existing === 'object') {
      existing.n = (Number.isFinite(existing.n) ? existing.n : 0) + 1;
      existing.last = hourNow();
      existing.vers = Array.isArray(existing.vers) ? existing.vers : [];
      if (!existing.vers.includes(report.ver) && existing.vers.length < 5) existing.vers.push(report.ver);
      await store.put(key, JSON.stringify(existing), { expirationTtl: CRASH_TTL_SECONDS });
      return json({ ok: true });
    }
    // Assinatura nova: respeita o teto diário (amostragem do lado do servidor).
    const listed = await store.list({ prefix: `${CRASH_PREFIX}${day}:`, limit: MAX_SIGNATURES_PER_DAY + 1 });
    if (listed.keys.length >= MAX_SIGNATURES_PER_DAY) return json({ ok: true, sampled: false });
    await store.put(
      key,
      JSON.stringify({ ...report, n: 1, first: hourNow(), last: hourNow(), vers: [report.ver] }),
      { expirationTtl: CRASH_TTL_SECONDS },
    );
    return json({ ok: true });
  } catch {
    return json({ error: 'Unavailable' }, 503);
  }
}

export async function onRequestGet({ request, env }) {
  if (!env?.METRICS_ADMIN_KEY) return json({ error: 'Not found' }, 404);
  const gate = takeToken('crash-read', clientKey(request), READ_RATE);
  if (!gate.ok) return tooManyRequests(gate.retryAfter);
  const given = request.headers.get(METRICS_KEY_HEADER);
  if (!secretEquals(given ?? '', env.METRICS_ADMIN_KEY)) return json({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  const to = url.searchParams.get('to') ?? serverDay();
  const from = url.searchParams.get('from') ?? to;
  const days = dayRange(from, to, MAX_READ_DAYS);
  if (!days) return json({ error: 'Invalid range', max_days: MAX_READ_DAYS }, 400);
  if (!kv(env)) return json({ error: 'Unavailable' }, 503);

  const store = kvOrThrow(env);
  const crashes = [];
  for (const day of days) {
    const listed = await store.list({ prefix: `${CRASH_PREFIX}${day}:`, limit: MAX_SIGNATURES_PER_DAY });
    for (const k of listed.keys) {
      const sig = k.name.slice(k.name.lastIndexOf(':') + 1);
      if (!SIG_RE.test(sig)) continue;
      const value = await store.get(k.name, { type: 'json' }).catch(() => null);
      if (value && typeof value === 'object') crashes.push({ day, sig, ...value });
    }
  }
  crashes.sort((a, b) => (b.n ?? 0) - (a.n ?? 0));
  return json({ ok: true, from, to, count: crashes.length, crashes });
}

export async function onRequest({ request, env }) {
  if (request.method === 'GET') return onRequestGet({ request, env });
  if (request.method === 'POST') return receive({ request, env });
  return json({ error: 'Method not allowed' }, 405);
}
