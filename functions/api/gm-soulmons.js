// LISTA DE SOULMONS GERADOS — só para o GM (dono). Item M12.
//
// `GET /api/gm-soulmons?cursor=<opaco>` com `Authorization: Bearer <ID token Firebase>`.
// Quem pode: o e-mail do token VERIFICADO em `ADMIN_EMAILS` (`verifiedAdmin`, o
// mesmo critério das demais rotas de admin; secret `ADMIN_EMAILS`). Qualquer
// outro caso — sem token, token inválido, não-GM, `ADMIN_EMAILS` vazio, Firebase
// desligado — é 403 `forbidden` idêntico, sem vazar nada. Sem e-mail em URL.
//
// Fonte: `sprite:img:<saveId>:<formId>` (cache da geração). O e-mail vem do
// próprio registro (gravado, de forma aditiva, por `generate-sprite.js` a partir
// de agora; gerações antigas ficam com `email: null`). O nome vem do perfil
// público (`profile:<saveId>`). Paginação por cursor da KV, 24 por página.

import { kv, kvOrThrow } from './_kv.js';
import { verifiedAdmin } from './_admin.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';

const PAGE = 24;
const CURSOR_OK = /^[A-Za-z0-9_=-]{1,2048}$/;
const KEY = /^sprite:img:([^:]+):(.+)$/;
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
const forbidden = () => Response.json({ error: 'forbidden' }, { status: 403, headers });

export async function onRequestGet({ request, env }) {
  const gate = takeToken('gm-soulmons', clientKey(request), { limit: 30, windowMs: 60_000 });
  if (!gate.ok) return tooManyRequests(gate.retryAfter);
  if (!(await verifiedAdmin(env, request)).admin) return forbidden();
  if (!kv(env)) return Response.json({ error: 'Unavailable' }, { status: 503, headers });

  const cursor = new URL(request.url).searchParams.get('cursor');
  if (cursor && !CURSOR_OK.test(cursor)) return Response.json({ error: 'invalid-cursor' }, { status: 400, headers });

  const store = kvOrThrow(env);
  const page = await store.list({ prefix: 'sprite:img:', limit: PAGE, ...(cursor ? { cursor } : {}) });
  const nomes = new Map();
  const items = [];
  for (const k of page.keys) {
    const m = KEY.exec(k.name);
    if (!m) continue;
    let rec = null;
    try { rec = JSON.parse((await store.get(k.name)) || 'null'); } catch { rec = null; }
    if (!rec || typeof rec.image !== 'string') continue;
    const [, saveId, formId] = m;
    if (!nomes.has(saveId)) {
      let nome = null;
      try { const raw = await store.get(`profile:${saveId}`); nome = raw ? (JSON.parse(raw)?.name ?? null) : null; } catch { nome = null; }
      nomes.set(saveId, typeof nome === 'string' ? nome.slice(0, 80) : null);
    }
    items.push({
      image: rec.image,
      name: nomes.get(saveId),
      email: typeof rec.email === 'string' ? rec.email : null,
      at: typeof rec.at === 'number' ? rec.at : null,
      formId,
      provider: typeof rec.provider === 'string' ? rec.provider : null,
    });
  }
  console.log(JSON.stringify({ event: 'gm_soulmons_list', n: items.length }));
  return Response.json({ items, cursor: page.list_complete ? null : page.cursor }, { headers });
}
