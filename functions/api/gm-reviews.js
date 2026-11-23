// FILA DE REVISOES DE SOULMON - so para o GM (dono), SOMENTE LEITURA. Painel `/gm/reviews`.
//
// `GET /api/gm-reviews?cursor=` com `Authorization: Bearer <ID token Firebase>`: lista os reports com status, veredito do Claude e o
// antes/depois do sprite. NAO conserta nada e nao aceita escrita: o conserto e automatico e nasce do fluxo do proprio jogador
// (`review-soulmon.js`). Quem pode ler: e-mail do token VERIFICADO em `ADMIN_EMAILS` (`verifiedAdmin`); qualquer outro caso e 403
// `forbidden` identico.

import { kv, kvOrThrow } from './_kv.js';
import { verifiedAdmin } from './_admin.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import { REVIEW_PREFIX, REPORT_ID_RE, readReport } from './_spriteReview.js';

const PAGE = 30;
const CURSOR_OK = /^[A-Za-z0-9_=-]{1,2048}$/;
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
const forbidden = () => Response.json({ error: 'forbidden' }, { status: 403, headers });

/** O que o GM ve de um report (a nota do jogador e texto livre: a pagina a poe com textContent). */
export function gmView(r) {
  return {
    id: r.id, saveIdPrefix: String(r.saveId ?? '').slice(0, 8), formId: r.formId, soulmonId: r.soulmonId ?? null, stage: r.stage ?? null,
    element: r.element ?? null, note: r.note ?? '', status: r.status, detail: r.detail ?? null,
    verdict: r.verdict ?? null, method: r.method ?? null, chroma: r.chroma ?? null, saveSync: r.saveSync ?? null, model: r.model ?? null,
    applied: r.applied === true,
    beforeUrl: r.beforeUrl ?? (r.beforeKey ? `/api/sprite-image?k=${r.beforeKey}` : null), afterUrl: r.afterUrl ?? null,
    createdAt: r.createdAt ?? null, updatedAt: r.updatedAt ?? null,
  };
}

export async function onRequestGet({ request, env }) {
  const gate = takeToken('gm-reviews', clientKey(request), { limit: 30, windowMs: 60_000 });
  if (!gate.ok) return tooManyRequests(gate.retryAfter);
  if (!(await verifiedAdmin(env, request)).admin) return forbidden();
  if (!kv(env)) return Response.json({ error: 'Unavailable' }, { status: 503, headers });
  const cursor = new URL(request.url).searchParams.get('cursor');
  if (cursor && !CURSOR_OK.test(cursor)) return Response.json({ error: 'invalid-cursor' }, { status: 400, headers });
  const page = await kvOrThrow(env).list({ prefix: REVIEW_PREFIX, limit: PAGE, ...(cursor ? { cursor } : {}) });
  const items = [];
  for (const k of page.keys) {
    const id = k.name.slice(REVIEW_PREFIX.length);
    if (!REPORT_ID_RE.test(id)) continue;
    const r = await readReport(env, id);
    if (r) items.push(gmView(r));
  }
  items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return Response.json({ items, cursor: page.list_complete ? null : page.cursor }, { headers });
}
