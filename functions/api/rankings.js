// ---------------------------------------------------------------------------
// /api/rankings — ranking genérico por jogo e período (BACKLOG-BETA3 M8).
// Regras e armazenamento: `_rankings.js`.
//
//   POST /api/rankings            { id, game, score, period? }  → submete (melhor score do período)
//   GET  /api/rankings?game=&period=&id=&top=                   → top N + a posição/faixa de `id`
//
// `id` = saveId do jogador; as DUAS chamadas exigem o ID token (Bearer) que
// derive esse saveId — `authorizeSaveAccess`, a mesma das outras rotas.
// ---------------------------------------------------------------------------

import { kv } from './_kv.js';
import { authorizeSaveAccess, authStatus } from './_auth.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import {
  DEFAULT_PERIOD, cleanScore, isPeriod, isRankedGame, readBoard, scoreIsPlausible, submitScore, TOP_DEFAULT,
} from './_rankings.js';
import { readRiftLayers } from './_dayCounters.js';
import { closePreviousMonth, readMyPrize, RIFT_GAME } from './_riftPayout.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
const json = (obj, status = 200) => Response.json(obj, { status, headers: CORS });
const VALID_ID = /^[a-zA-Z0-9_-]{8,64}$/;

/** Limites por janela de 1 min: por IP e, no submit, por conta. */
export const LIMIT_IP = { limit: 60, windowMs: 60_000 };
export const LIMIT_SUBMIT = { limit: 20, windowMs: 60_000 };

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return onRequestOptions();
  if (request.method !== 'GET' && request.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  if (!kv(env)) return json({ error: 'storage-not-bound' }, 503);

  const gate = takeToken('rankings', clientKey(request), LIMIT_IP);
  if (!gate.ok) return tooManyRequests(gate.retryAfter, CORS);

  const url = new URL(request.url);
  let body = {};
  if (request.method === 'POST') {
    try { body = await request.json(); } catch { return json({ error: 'invalid json' }, 400); }
  }
  const q = request.method === 'POST' ? body : Object.fromEntries(url.searchParams);

  const game = q.game;
  if (!isRankedGame(game)) return json({ error: 'unknown game' }, 400);
  // Endless Rift (M6): SEMPRE mensal, o cliente não escolhe.
  const period = game === RIFT_GAME ? 'monthly' : (q.period ?? DEFAULT_PERIOD);
  if (!isPeriod(period)) return json({ error: 'invalid period' }, 400);

  const id = q.id;
  if (!VALID_ID.test(id || '')) return json({ error: 'invalid id' }, 400);
  const auth = await authorizeSaveAccess(request, env, id);
  if (!auth.ok) {
    return json(auth.reason === 'account-deleted' ? { error: auth.reason, deletedAt: auth.deletedAt } : { error: auth.reason }, authStatus(auth));
  }

  // Fechamento preguiçoso do mês anterior do Endless Rift (`_riftPayout.js`): idempotente, nunca lança.
  await closePreviousMonth(env);

  if (request.method === 'POST') {
    const score = cleanScore(q.score, game);
    if (score === null || !scoreIsPlausible(game, score)) return json({ error: 'invalid score' }, 400);
    // Endless Rift paga Creditos: o score nao pode passar das camadas que o SERVIDOR viu comecadas no mes (`_dayCounters.js`). 409 se passar.
    if (game === RIFT_GAME) {
      const lastro = await readRiftLayers(kv(env), id);
      if (score > lastro) return json({ error: 'score-exceeds-recorded-layers', recorded: lastro }, 409);
    }
    const g2 = takeToken('rankings-submit', id, LIMIT_SUBMIT);
    if (!g2.ok) return tooManyRequests(g2.retryAfter, CORS);
    const r = await submitScore(env, { game, period, saveId: id, score });
    const board = await readBoard(env, { game, period, saveId: id, top: TOP_DEFAULT });
    return json({ ok: true, improved: r.improved, best: r.best, ...board });
  }

  const top = Number(q.top);
  const board = await readBoard(env, { game, period, saveId: id, top: Number.isFinite(top) && top > 0 ? top : TOP_DEFAULT });
  // Só leitura: o prêmio de Créditos do mês fechado (o servidor já creditou; o cliente nunca credita).
  const prize = game === RIFT_GAME ? await readMyPrize(env, id) : undefined;
  return json({ ok: true, ...board, ...(prize !== undefined ? { prize } : {}) });
}
