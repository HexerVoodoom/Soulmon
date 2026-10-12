// TOP CONSUMIDORES DE IA (release/beta-1; `abuso-e-custo.md` §4). Leitura do
// DONO: `GET /api/top-ai?day=AAAA-MM-DD` com `X-Metrics-Key` (= `METRICS_ADMIN_KEY`,
// o mesmo segredo de `/api/metrics` e `/api/crash`; sem a variável, 404).
//
// Lista as chaves `ai:<bucket>:<saveId>:<dia>` (1 `list` por bucket, 4 por
// leitura) e devolve o top 20 por bucket com o saveId TRUNCADO em 8 caracteres —
// o bastante para o dono reconhecer a mesma conta em dias seguidos, pouco para
// virar índice de pessoa. Marca quem passou de 80 % da cota diária.
// Script: `node scripts/top-consumidores.mjs`.

import { kv, kvOrThrow } from './_kv.js';
import { METRICS_KEY_HEADER, secretEquals, serverDay } from './metrics.js';
import { AI_LIMITS } from './_aiGuard.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';

export const BUCKETS = ['chat', 'sprite', 'transcribe', 'suggest'];
export const TOP_N = 20;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const json = (o, status = 200) => Response.json(o, { status, headers: { 'Cache-Control': 'no-store' } });

/** Pura: chaves + valores → ranking truncado. */
export function ranking(bucket, entradas, limites = AI_LIMITS) {
  const teto = limites[bucket]?.perAccountByTier?.paid ?? limites[bucket]?.perAccount ?? 0;
  return entradas
    .filter(e => e.saveId && !e.saveId.startsWith('@'))
    .map(e => ({ bucket, saveIdPrefix: e.saveId.slice(0, 8), n: e.n, acima80: teto > 0 && e.n >= teto * 0.8 }))
    .sort((a, b) => b.n - a.n)
    .slice(0, TOP_N);
}

export async function onRequestGet({ request, env }) {
  if (!env?.METRICS_ADMIN_KEY) return json({ error: 'Not found' }, 404);
  const gate = takeToken('top-ai', clientKey(request), { limit: 30, windowMs: 60_000 });
  if (!gate.ok) return tooManyRequests(gate.retryAfter);
  if (!secretEquals(request.headers.get(METRICS_KEY_HEADER) ?? '', env.METRICS_ADMIN_KEY)) return json({ error: 'Unauthorized' }, 401);
  const day = new URL(request.url).searchParams.get('day') ?? serverDay();
  if (!DAY_RE.test(day)) return json({ error: 'Invalid day' }, 400);
  if (!kv(env)) return json({ error: 'Unavailable' }, 503);
  const store = kvOrThrow(env);
  const out = {};
  for (const bucket of BUCKETS) {
    const listed = await store.list({ prefix: `ai:${bucket}:`, limit: 1000 });
    const entradas = [];
    for (const k of listed.keys) {
      const partes = k.name.split(':'); // ai:<bucket>:<saveId>:<dia>
      if (partes.length !== 4 || partes[3] !== day) continue;
      entradas.push({ saveId: partes[2], n: Number(await store.get(k.name)) || 0 });
    }
    out[bucket] = ranking(bucket, entradas);
  }
  return json({ ok: true, day, top: out });
}
