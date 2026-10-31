// LIBERAR UMA NOVA GERAÇÃO DE UMA FORMA (gate adversarial C2, release/beta-1).
//
// A regra do beta é "uma geração por forma, nunca regenerar" (REGISTRO §34). O
// risco aceito é o desenho sair feio e a pessoa ficar presa a ele. Esta rota é a
// válvula do DONO, caso a caso: `POST /api/sprite-admin?action=release-form` com
// `X-Metrics-Key` (= `METRICS_ADMIN_KEY`, comparação de tempo constante; sem a
// variável a rota não existe — 404) e corpo `{ id: <saveId>, formId }`.
//
// Efeito: apaga a arte em cache daquela forma (`sprite:img:<saveId>:<formId>` e a
// do id antigo) e devolve UMA unidade do contador daquela forma (`aiForms`). O
// vitalício NÃO volta — a próxima geração custa como qualquer outra, dentro dos
// tetos de sempre. Script: `node scripts/liberar-forma.mjs`.

import { kv, kvOrThrow } from './_kv.js';
import { METRICS_KEY_HEADER, secretEquals } from './metrics.js';
import { VALID_ID, readEntitlement, writeEntitlement, comEntitlementLegivel } from './_entitlements.js';
import { VALID_FORM_ID } from './_aiGuard.js';
import { legacyFormIdOf } from './_branchLegacy.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';

const json = (o, status = 200) => Response.json(o, { status, headers: { 'Cache-Control': 'no-store' } });

async function onRequestPostBruto({ request, env }) {
  if (!env?.METRICS_ADMIN_KEY) return json({ error: 'Not found' }, 404);
  const gate = takeToken('sprite-admin', clientKey(request), { limit: 20, windowMs: 60_000 });
  if (!gate.ok) return tooManyRequests(gate.retryAfter);
  if (!secretEquals(request.headers.get(METRICS_KEY_HEADER) ?? '', env.METRICS_ADMIN_KEY)) return json({ error: 'Unauthorized' }, 401);
  if (new URL(request.url).searchParams.get('action') !== 'release-form') return json({ error: 'Unknown action' }, 400);
  const body = await request.json().catch(() => null);
  const id = body?.id;
  const formId = body?.formId;
  if (typeof id !== 'string' || !VALID_ID.test(id)) return json({ error: 'invalid-save-id' }, 400);
  if (typeof formId !== 'string' || !VALID_FORM_ID.test(formId)) return json({ error: 'invalid-form-id' }, 400);
  if (!kv(env)) return json({ error: 'Unavailable' }, 503);

  const store = kvOrThrow(env);
  const antigo = legacyFormIdOf(formId);
  await store.delete(`sprite:img:${id}:${formId}`);
  if (antigo) await store.delete(`sprite:img:${id}:${antigo}`);

  const ent = await readEntitlement(env, id);
  const forms = { ...(ent.aiForms || {}) };
  const antes = (Number(forms[formId]) || 0) + (antigo ? Number(forms[antigo]) || 0 : 0);
  if (antigo) delete forms[antigo];
  forms[formId] = Math.max(0, antes - 1);
  ent.aiForms = forms;
  await writeEntitlement(env, id, ent);
  console.log(JSON.stringify({ event: 'sprite.admin.release-form', saveIdPrefix: id.slice(0, 8), formId, antes, depois: forms[formId] }));
  return json({ ok: true, formId, antes, depois: forms[formId] });
}

// `ent:` ilegível vira 503 com log (`_entitlements.js` › `EntitlementIlegivelError`), nunca 500 genérico.
export const onRequestPost = comEntitlementLegivel(onRequestPostBruto, { 'Cache-Control': 'no-store' });
