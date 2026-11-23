// "REVISAR MEU SOULMON" - rota do JOGADOR (Ajuda > Revisar meu Soulmon). Logica em `_spriteReview.js` (leia o cabecalho de la).
// E O UNICO CAMINHO: nao ha rota de admin para consertar sprite nem upload de imagem; a fila do GM (`/gm/reviews`) so LE.
//
//   POST { id, formId, spriteUrl, soulmonId?, stage?, element?, note?, prompt? }   -> cria o report na fila e dispara a avaliacao (waitUntil);
//                                                                                    reenvio com o report parado/falho o reabre (mesmo gesto do jogador)
//   POST { action: 'continue', id, reportId }                                      -> roda a regeneracao (requisicao longa, como generate-sprite)
//   POST { action: 'ack', id, reportId }                                           -> o app aplicou o conserto
//   GET  ?id=<saveId>                                                              -> os reports recentes da conta (estado + antes/depois)
//
// Tudo exige o ID token do PROPRIO save (`authorizeSaveAccess`). Kill-switch `REVIEW_DISABLED`. A chave do Claude (`ANTHROPIC_API_KEY`,
// secret do Worker) so e lida em `_spriteReview.js`; sem ela o report fica `pendente-sem-chave`.

import { kv } from './_kv.js';
import { authorizeSaveAccess, authStatus } from './_auth.js';
import { VALID_ID } from './_entitlements.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import { flagOn } from './_killSwitch.js';
import {
  sanitizeReportBody, createReport, notificarEquipe, takeDaily, evaluateReport, regenerateReport, advanceReport, ackReport, listByAccount, readReport, userView,
  REPORT_ID_RE, STATUS,
} from './_spriteReview.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
const json = (obj, status = 200) => Response.json(obj, { status, headers: { 'Cache-Control': 'no-store', ...CORS } });
// O prompt do app (reserva) pode chegar a 12000 caracteres.
const MAX_BODY_BYTES = 40 * 1024;

export async function onRequestOptions() { return new Response(null, { status: 204, headers: CORS }); }

export async function onRequestGet({ request, env }) {
  if (flagOn(env?.REVIEW_DISABLED)) return json({ error: 'review-disabled' }, 503);
  const gate = takeToken('review-get', clientKey(request), { limit: 30, windowMs: 60_000 });
  if (!gate.ok) return tooManyRequests(gate.retryAfter, CORS);
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!VALID_ID.test(id)) return json({ error: 'invalid-save-id' }, 400);
  const auth = await authorizeSaveAccess(request, env, id);
  if (!auth.ok) return json({ error: auth.reason }, authStatus(auth));
  if (!kv(env)) return json({ error: 'unavailable' }, 503);
  const reports = await listByAccount(env, id);
  return json({ reports: reports.map(userView) });
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (flagOn(env?.REVIEW_DISABLED)) return json({ error: 'review-disabled' }, 503);
  const gate = takeToken('review-post', clientKey(request), { limit: 10, windowMs: 10 * 60_000 });
  if (!gate.ok) return tooManyRequests(gate.retryAfter, CORS);
  const declared = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return json({ error: 'invalid-body' }, 413);
  const raw = await request.text().catch(() => null);
  if (raw === null || raw.length > MAX_BODY_BYTES) return json({ error: 'invalid-body' }, 400);
  let body = null;
  try { body = JSON.parse(raw); } catch { return json({ error: 'invalid-body' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'invalid-body' }, 400);

  const id = typeof body.id === 'string' ? body.id : '';
  if (!VALID_ID.test(id)) return json({ error: 'invalid-save-id' }, 400);
  // Autentica ANTES de qualquer leitura/escrita.
  const auth = await authorizeSaveAccess(request, env, id);
  if (!auth.ok) return json({ error: auth.reason }, authStatus(auth));
  if (!kv(env)) return json({ error: 'unavailable' }, 503);
  const origin = new URL(request.url).origin;
  /** Segundo plano (waitUntil); sem ele (teste) espera. */
  const bg = async promise => {
    if (typeof waitUntil === 'function') { waitUntil(promise.catch(err => console.error('review bg:', err?.message))); return; }
    await promise;
  };

  const action = body.action ?? 'report';
  if (action === 'continue' || action === 'ack') {
    const reportId = typeof body.reportId === 'string' && REPORT_ID_RE.test(body.reportId) ? body.reportId : null;
    if (!reportId) return json({ error: 'invalid-report-id' }, 400);
    const r = await readReport(env, reportId);
    if (!r || r.saveId !== id) return json({ error: 'not-found' }, 404);
    if (action === 'ack') return json({ report: userView((await ackReport(env, id, reportId)) ?? r) });
    return json({ report: userView((await advanceReport(env, reportId, { origin })) ?? r) });
  }
  if (action !== 'report') return json({ error: 'invalid-body' }, 400);

  const clean = sanitizeReportBody(body);
  if (clean.error) return json({ error: clean.error }, 400);
  const created = await createReport(env, clean);
  if (!created.ok) return json({ error: created.error }, created.status);
  const reportId = created.report.id;
  if (created.created && created.equipe) {
    // 2o/3o pedido do dia depois de um `sem-problema`: sem IA, vai por e-mail para a equipe (e fica guardado na KV).
    await bg(notificarEquipe(env, created.report, created.equipe, { origin, takeDaily }).then(() => undefined));
  } else if (created.created) {
    // Avalia e, se o veredito for regenerar, ja tenta regenerar no mesmo segundo plano (o Workers pode cortar o waitUntil ~30 s depois da
    // resposta; o que ficar pela metade o app retoma na proxima checagem, via `continue`).
    await bg((async () => {
      const r = await evaluateReport(env, reportId, { origin });
      if (r?.status === STATUS.REGENERAR) await regenerateReport(env, reportId, { origin });
    })());
  }
  const fresh = (await readReport(env, reportId)) ?? created.report;
  return json({ ok: true, created: created.created, report: userView(fresh) });
}
