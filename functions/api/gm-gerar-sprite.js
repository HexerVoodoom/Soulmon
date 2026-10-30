// GERAR SPRITE PELO GM — só para o GM (dono).
//
// `POST /api/gm-gerar-sprite` com `Authorization: Bearer <ID token Firebase>` e corpo
// `{ prompt, model?: 'alpha'|'flare', n?: 1..4 }`. Gera pelo MESMO caminho de
// `generate-sprite.js` (`_spriteGen.js`: API Higgsfield com `HF_CREDENTIALS`, polling,
// chroma-key pela cor do prompt, republicação em `/api/sprite-image?k=...`), mas sem
// cota/lock/save de jogador. Quem pode: o e-mail do token VERIFICADO em `ADMIN_EMAILS`
// (`verifiedAdmin`); qualquer outro caso é 403 `forbidden` idêntico. Sem e-mail em URL/log.
//
// Cada imagem fica registrada sob `sprite:gm:<timestamp>:<i>` (nunca em chave de save).

import { kv, kvOrThrow } from './_kv.js';
import { verifiedAdmin } from './_admin.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import { MAX_PROMPT_CHARS } from './generate-sprite.js';
import { generateHf, hfCredentials, republicar, isRefusal } from './_spriteGen.js';

const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
const forbidden = () => Response.json({ error: 'forbidden' }, { status: 403, headers });
const bad = (error, status = 400) => Response.json({ error }, { status, headers });
const MODELS = ['alpha', 'flare'];
const MAX_N = 4;

export async function onRequestPost({ request, env }) {
  const gate = takeToken('gm-gerar-sprite', clientKey(request), { limit: 10, windowMs: 60_000 });
  if (!gate.ok) return tooManyRequests(gate.retryAfter);
  if (!(await verifiedAdmin(env, request)).admin) return forbidden();
  if (!kv(env)) return bad('Unavailable', 503);

  let body = null;
  try { body = await request.json(); } catch { return bad('invalid json'); }
  const prompt = body?.prompt;
  if (typeof prompt !== 'string' || !prompt.trim()) return bad('invalid prompt');
  if (prompt.length > MAX_PROMPT_CHARS) return bad('prompt too long');
  const model = body.model ?? 'alpha';
  if (!MODELS.includes(model)) return bad('invalid model');
  const n = body.n ?? 1;
  if (!Number.isInteger(n) || n < 1 || n > MAX_N) return bad('invalid n');
  if (!hfCredentials(env)) return bad('not configured', 503);

  const stamp = Date.now();
  const store = kvOrThrow(env);
  const results = await Promise.allSettled(
    Array.from({ length: n }, async (_, i) => {
      const data = await generateHf(env, model, prompt, undefined);
      const url = await republicar(env, request, data);
      if (!url) throw new Error('republish failed');
      await store.put(`sprite:gm:${stamp}:${i}`, JSON.stringify({ image: url, at: stamp, model }));
      return url;
    }),
  );
  const images = results.filter(r => r.status === 'fulfilled').map(r => r.value);
  const failed = results.filter(r => r.status === 'rejected');
  failed.forEach(r => console.error('gm-gerar-sprite: falha', r.reason?.message));
  console.log(JSON.stringify({ event: 'gm_gerar_sprite', model, n, ok: images.length }));
  if (!images.length) {
    const refused = failed.some(r => isRefusal(r.reason));
    return bad(refused ? 'refused' : 'generation failed', refused ? 422 : 502);
  }
  return Response.json({ images }, { headers });
}
