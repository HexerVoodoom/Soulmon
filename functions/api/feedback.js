// ---------------------------------------------------------------------------
// FEEDBACK / SUGESTÃO / BUG — POST /api/feedback (dono, 04/11/2026).
//
// O botão do besourinho na Home abre um modal do Soulmon (`FeedbackModal`) em vez
// de abrir o app de e-mail da pessoa. O texto chega AQUI e este Worker o entrega
// na caixa de revisão (`soulmon.revisor@gmail.com`).
//
// ENTREGA (nada se perde):
//   1. a mensagem é gravada ANTES na KV (`feedback:<dia>:<id>`, TTL 90 dias): é o
//      fallback e o histórico. O dono lê com `GET /api/feedback?day=AAAA-MM-DD` +
//      `X-Metrics-Key` (mesmo segredo de `/api/crash`);
//   2. se houver `RESEND_API_KEY` (secret), manda o e-mail via Resend (fetch, sem
//      SDK). Sem a chave, ou se o envio falhar, a mensagem JÁ está guardada e a
//      resposta continua `ok` (`delivered: 'stored'`): a pessoa não reescreve.
//      Só quando nem a KV grava a resposta é 503 e o cliente mantém o texto e
//      oferece "tentar de novo".
//   Configuração do dono: `RESEND_API_KEY` (secret) e, opcional, `FEEDBACK_FROM`
//   (remetente de domínio verificado no Resend) e `FEEDBACK_TO`.
//
// O QUE GUARDA (allowlist): type, message (1–2000), ver, build, plat, lang. NUNCA
// grava nem manda identidade (uid, e-mail, saveId), IP ou user agent. O token do
// Firebase, se vier, só serve ao limite por conta (a chave do balde é um hash).
//
// SEGURANÇA: o e-mail é TEXTO PURO (sem HTML, nada a injetar), assunto sem quebra
// de linha (anti header-injection), mensagem sem caracteres de controle.
// ABUSO: balde por IP e por conta + teto diário de gravações do isolate
// (amortecedor, ver `_rateLimit.js`; o teto global de verdade é a regra de Rate
// Limiting do painel da Cloudflare em `/api/feedback`).
// ---------------------------------------------------------------------------

import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import { kv, kvOrThrow } from './_kv.js';
import { METRICS_KEY_HEADER, secretEquals, serverDay } from './metrics.js';
import { bearerToken, verifyIdToken } from './_auth.js';
import { flagOn } from './_killSwitch.js';

export const FEEDBACK_PREFIX = 'feedback:';
export const FEEDBACK_TTL_SECONDS = 90 * 24 * 60 * 60;
export const FEEDBACK_TO_DEFAULT = 'soulmon.revisor@gmail.com';
export const TYPES = ['feedback', 'suggestion', 'bug'];
export const LANGS = ['pt-BR', 'en'];
export const PLATS = ['apk', 'web'];
export const MAX_MESSAGE = 2000;
export const MAX_BODY_BYTES = 8 * 1024;
export const MAX_WRITES_PER_DAY = 300;
const VER_RE = /^[0-9A-Za-z.+-]{1,32}$/;
const RATE_IP = { limit: 5, windowMs: 10 * 60_000 };
const RATE_ACCOUNT = { limit: 5, windowMs: 10 * 60_000 };
const READ_RATE = { limit: 30, windowMs: 60_000 };
const ALLOWED_KEYS = ['type', 'message', 'ver', 'build', 'plat', 'lang'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': `Content-Type, Authorization, ${METRICS_KEY_HEADER}`,
};
const json = (obj, status = 200) => Response.json(obj, { status, headers: { 'Cache-Control': 'no-store', ...CORS } });

let escritas = { day: '', n: 0 };
/** Só para teste. */
export function resetFeedbackMemory() { escritas = { day: '', n: 0 }; }

/** Tira caracteres de controle (menos \n e \t) e de direção, normaliza quebras e apara. */
export function cleanMessage(text) {
  return String(text)
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g, '')
    .trim();
}

/** Valida contra a allowlist. @returns o registro saneado ou `{ error }`. */
export function sanitizeFeedback(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'invalid-body' };
  for (const k of Object.keys(body)) if (!ALLOWED_KEYS.includes(k)) return { error: 'invalid-body' };
  if (!TYPES.includes(body.type)) return { error: 'invalid-type' };
  if (typeof body.message !== 'string') return { error: 'invalid-message' };
  const message = cleanMessage(body.message);
  if (message.length < 1) return { error: 'invalid-message' };
  if (message.length > MAX_MESSAGE) return { error: 'message-too-long' };
  if (typeof body.ver !== 'string' || !VER_RE.test(body.ver)) return { error: 'invalid-body' };
  if (typeof body.build !== 'string' || !VER_RE.test(body.build)) return { error: 'invalid-body' };
  if (!PLATS.includes(body.plat)) return { error: 'invalid-body' };
  if (!LANGS.includes(body.lang)) return { error: 'invalid-body' };
  return { type: body.type, message, ver: body.ver, build: body.build, plat: body.plat, lang: body.lang };
}

const TYPE_LABEL = { feedback: 'Feedback', suggestion: 'Sugestão', bug: 'Bug' };

/** Assunto numa linha só, sem CR/LF. */
export function emailSubject(r) {
  return `[Soulmon ${TYPE_LABEL[r.type]}] v${r.ver}`.replace(/[\r\n]+/g, ' ');
}

/** Corpo em TEXTO PURO. */
export function emailText(r, receivedAt) {
  return [
    r.message,
    '',
    '---',
    `Tipo: ${TYPE_LABEL[r.type]}`,
    `Versão: ${r.ver}`,
    `Build: ${r.build}`,
    `Plataforma: ${r.plat}`,
    `Idioma: ${r.lang}`,
    `Recebido: ${receivedAt}`,
  ].join('\n');
}

async function sha(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(d)].slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Envio por Resend. @returns true se aceito. Nunca lança. */
export async function sendEmail(env, r, receivedAt, fetchImpl = fetch) {
  if (!env?.RESEND_API_KEY) return false;
  try {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${String(env.RESEND_API_KEY).trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.FEEDBACK_FROM || 'Soulmon <onboarding@resend.dev>',
        to: [env.FEEDBACK_TO || FEEDBACK_TO_DEFAULT],
        subject: emailSubject(r),
        text: emailText(r, receivedAt),
      }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function receive({ request, env }, fetchImpl) {
  if (flagOn(env?.FEEDBACK_DISABLED)) return json({ error: 'feedback-disabled' }, 503);
  const gate = takeToken('feedback', clientKey(request), RATE_IP);
  if (!gate.ok) return tooManyRequests(gate.retryAfter, CORS);

  const raw = await request.text().catch(() => null);
  if (raw === null || raw.length > MAX_BODY_BYTES) return json({ error: 'invalid-body' }, 400);
  let body = null;
  try { body = JSON.parse(raw); } catch { return json({ error: 'invalid-body' }, 400); }
  const r = sanitizeFeedback(body);
  if (r.error) return json({ error: r.error }, 400);

  // Limite por conta (opcional): token válido amarra o balde à conta; só o hash fica na memória.
  if (env?.FIREBASE_PROJECT_ID && bearerToken(request)) {
    try {
      const claims = await verifyIdToken(bearerToken(request), env.FIREBASE_PROJECT_ID);
      if (claims?.sub) {
        const g = takeToken('feedback-acct', await sha(String(claims.sub)), RATE_ACCOUNT);
        if (!g.ok) return tooManyRequests(g.retryAfter, CORS);
      }
    } catch { /* sem conta: segue só com o balde por IP */ }
  }

  if (!kv(env)) return json({ error: 'unavailable' }, 503);
  const day = serverDay();
  if (escritas.day !== day) escritas = { day, n: 0 };
  if (escritas.n >= MAX_WRITES_PER_DAY) return tooManyRequests(3600, CORS);
  escritas.n++;

  const receivedAt = new Date().toISOString();
  const id = `${Date.now().toString(36)}${crypto.randomUUID().slice(0, 8)}`;
  const key = `${FEEDBACK_PREFIX}${day}:${id}`;
  try {
    // Grava ANTES de tentar o e-mail: nada se perde.
    await kvOrThrow(env).put(key, JSON.stringify({ ...r, at: receivedAt, emailed: false }), { expirationTtl: FEEDBACK_TTL_SECONDS });
  } catch {
    return json({ error: 'unavailable' }, 503);
  }
  const emailed = await sendEmail(env, r, receivedAt, fetchImpl);
  if (emailed) {
    try { await kvOrThrow(env).put(key, JSON.stringify({ ...r, at: receivedAt, emailed: true }), { expirationTtl: FEEDBACK_TTL_SECONDS }); } catch { /* já guardado */ }
  }
  return json({ ok: true, delivered: emailed ? 'email' : 'stored' });
}

async function read({ request, env }) {
  if (!env?.METRICS_ADMIN_KEY) return json({ error: 'not-found' }, 404);
  const gate = takeToken('feedback-read', clientKey(request), READ_RATE);
  if (!gate.ok) return tooManyRequests(gate.retryAfter, CORS);
  if (!secretEquals(request.headers.get(METRICS_KEY_HEADER) ?? '', env.METRICS_ADMIN_KEY)) return json({ error: 'unauthorized' }, 401);
  if (!kv(env)) return json({ error: 'unavailable' }, 503);
  const day = new URL(request.url).searchParams.get('day') ?? serverDay();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return json({ error: 'invalid-day' }, 400);
  const store = kvOrThrow(env);
  const listed = await store.list({ prefix: `${FEEDBACK_PREFIX}${day}:`, limit: 200 });
  const items = [];
  for (const k of listed.keys) {
    const v = await store.get(k.name, { type: 'json' }).catch(() => null);
    if (v && typeof v === 'object') items.push(v);
  }
  return json({ ok: true, day, count: items.length, items });
}

export async function onRequest(ctx, fetchImpl = fetch) {
  const m = ctx.request.method;
  if (m === 'OPTIONS') return new Response(null, { headers: CORS });
  if (m === 'POST') return receive(ctx, fetchImpl);
  if (m === 'GET') return read(ctx);
  return json({ error: 'method-not-allowed' }, 405);
}
