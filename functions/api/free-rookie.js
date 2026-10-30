// POST /api/free-rookie {id, formId, prompt, promptFallback?} — rookie grátis por e-mail (D6/D20). Ver `_freeGen.js`.
// Reusa o fluxo de `generate-sprite` (cotas, teto, lock, chroma); `__freeGen` só existe no env montado AQUI
// (o cliente não consegue ligá-lo) e libera apenas o portão de tier. Referências do cliente são descartadas (D20).
import { authorizeSaveAccess, authStatus } from './_auth.js';
import { kvOrThrow } from './_kv.js';
import { freeRookie } from './_freeGen.js';
import { onRequestPost as generateSprite } from './generate-sprite.js';

export async function onRequestPost({ request, env }) {
  const corpo = await request.json().catch(() => null);
  if (!corpo || typeof corpo.id !== 'string' || typeof corpo.formId !== 'string' || typeof corpo.prompt !== 'string') {
    return Response.json({ error: 'bad-request' }, { status: 400 });
  }
  const auth = await authorizeSaveAccess(request, env, corpo.id);
  if (!auth.ok) return Response.json({ error: auth.reason }, { status: authStatus(auth) });
  const { id, formId, prompt, promptFallback } = corpo;
  const generate = async () => {
    const req = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ id, formId, prompt, promptFallback }), // sem referenceImageUrls, sem regenerate
    });
    const r = await generateSprite({ request: req, env: { ...env, __freeGen: true } });
    return r.ok ? await r.json().catch(() => null) : null;
  };
  const out = await freeRookie(kvOrThrow(env), id, generate);
  return Response.json(out);
}
