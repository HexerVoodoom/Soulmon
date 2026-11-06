// Carta de teste do Mensageiro (§244): POST /api/gm-carta-teste.
//
// `Authorization: Bearer <ID token Firebase>` de um e-mail em `ADMIN_EMAILS` (`verifiedAdmin`). O destino vem do PRÓPRIO token,
// nunca do corpo: o admin só escreve para a conta dele. Qualquer outro caso é 403 idêntico. Sem prêmio, e no máximo uma por dia (`mid` do dia).
import { bearerToken, emailToSaveId, verifyIdToken } from './_auth.js';
import { verifiedAdmin } from './_admin.js';
import { kv } from './_kv.js';
import { enqueueMail } from './_mensageiro.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';

const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };

export async function onRequestPost({ request, env }) {
  const g = takeToken('gm-carta-teste', clientKey(request), { limit: 10, windowMs: 60_000 });
  if (!g.ok) return tooManyRequests(g.retryAfter);
  if (!(await verifiedAdmin(env, request)).admin) return Response.json({ error: 'forbidden' }, { status: 403, headers });
  const store = kv(env);
  if (!store) return Response.json({ error: 'Unavailable' }, { status: 503, headers });
  const claims = await verifyIdToken(bearerToken(request), env.FIREBASE_PROJECT_ID);
  if (!claims) return Response.json({ error: 'forbidden' }, { status: 403, headers });
  const id = await emailToSaveId(claims.email);
  const now = Date.now();
  const sent = await enqueueMail(env, store, id, {
    mid: `gm-teste:${new Date(now).toISOString().slice(0, 10)}`,
    bodyPt: 'Carta de teste do Papus. Se você leu isto, o correio funciona.',
    bodyEn: 'Test letter from Papus. If you can read this, the mail works.',
    at: now,
  });
  return Response.json({ ok: true, status: sent ? 'sent' : 'already' }, { headers });
}
