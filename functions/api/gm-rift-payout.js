// REVISÃO DOS PRÊMIOS DO ENDLESS RIFT — só para o GM (dono). QA beta3, decisão do dono 1.
//
//   GET  /api/gm-rift-payout                              → lista (pendentes primeiro) com a progressão de cada jogador
//   POST /api/gm-rift-payout { month, saveId, action }    → action: 'approve' (credita; idempotente) | 'reject'
//
// `Authorization: Bearer <ID token Firebase>` de um e-mail em `ADMIN_EMAILS` (`verifiedAdmin`, o mesmo critério das demais rotas de
// admin). Qualquer outro caso — sem token, token inválido, não-GM, `ADMIN_EMAILS` vazio, Firebase desligado — é 403 `forbidden`
// idêntico. Sem e-mail em URL. Quem credita é `_riftPayout.js` (`grantRankPrize`: marca de pago dentro do `ent`).

import { kv } from './_kv.js';
import { verifiedAdmin } from './_admin.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import { approveRiftPrize, rejectRiftPrize, listRiftPrizes } from './_riftPayout.js';

const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
const forbidden = () => Response.json({ error: 'forbidden' }, { status: 403, headers });

async function gate(request, env) {
  const g = takeToken('gm-rift-payout', clientKey(request), { limit: 30, windowMs: 60_000 });
  if (!g.ok) return tooManyRequests(g.retryAfter);
  if (!(await verifiedAdmin(env, request)).admin) return forbidden();
  if (!kv(env)) return Response.json({ error: 'Unavailable' }, { status: 503, headers });
  return null;
}

export async function onRequestGet({ request, env }) {
  const bloqueio = await gate(request, env);
  if (bloqueio) return bloqueio;
  const items = await listRiftPrizes(env);
  console.log(JSON.stringify({ event: 'gm_rift_payout_list', n: items.length }));
  return Response.json({ items }, { headers });
}

export async function onRequestPost({ request, env }) {
  const bloqueio = await gate(request, env);
  if (bloqueio) return bloqueio;
  let body = null;
  try { body = await request.json(); } catch { return Response.json({ error: 'invalid json' }, { status: 400, headers }); }
  const { month, saveId, action } = body ?? {};
  if (action !== 'approve' && action !== 'reject') return Response.json({ error: 'invalid action' }, { status: 400, headers });
  const r = action === 'approve' ? await approveRiftPrize(env, month, saveId) : await rejectRiftPrize(env, month, saveId);
  console.log(JSON.stringify({ event: 'gm_rift_payout', action, status: r.status, saveIdPrefix: String(saveId).slice(0, 8) }));
  if (r.status === 'invalid') return Response.json({ error: 'invalid' }, { status: 400, headers });
  if (r.status === 'not-found') return Response.json({ error: 'not-found' }, { status: 404, headers });
  return Response.json({ ok: true, ...r }, { headers });
}
