// Cloud save do estado do jogo.
//
// IMPORTANTE — modelo de confiança: este endpoint grava o que o CLIENTE mandar.
// Portanto tudo aqui é dado não confiável. Campos que envolvem dinheiro real
// (`accountTier`, `credits`) são REMOVIDOS do que o cliente envia e servidos a
// partir do registro de entitlement (ver _entitlements.js), que só o servidor
// escreve. Sem isso, bastava editar o localStorage para virar assinante ou se
// dar créditos infinitos.

import { VALID_ID, readEntitlement, publicView } from './_entitlements.js';
import { authorizeSaveAccess } from './_auth.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/** Campos que o cliente NUNCA define — sempre vêm do entitlement do servidor. */
const SERVER_OWNED_FIELDS = ['accountTier', 'credits'];

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const saveId = url.searchParams.get('id');

  if (!saveId || !VALID_ID.test(saveId)) {
    return Response.json({ error: 'Invalid save ID' }, { status: 400, headers: CORS });
  }

  if (!env.DIGIAPP_SAVES) {
    return Response.json({ error: 'Storage not bound — add KV binding DIGIAPP_SAVES in Cloudflare dashboard' }, { status: 500, headers: CORS });
  }

  // Só o dono do e-mail que gerou este saveId pode ler ou escrever. Enquanto
  // FIREBASE_PROJECT_ID não estiver configurado isto passa direto (ver _auth.js).
  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) {
    return Response.json({ error: auth.reason }, { status: auth.reason === 'forbidden' ? 403 : 401, headers: CORS });
  }

  if (request.method === 'GET') {
    const raw = await env.DIGIAPP_SAVES.get(saveId);
    if (!raw) return Response.json({ found: false }, { headers: CORS });
    const state = JSON.parse(raw);
    // Sobrepõe com a verdade do servidor — o que estiver gravado no save é
    // apenas um espelho e pode estar desatualizado (ou ter sido forjado).
    const ent = publicView(await readEntitlement(env, saveId));
    state.accountTier = ent.tier;
    state.credits = ent.credits;
    return Response.json({ found: true, state }, { headers: CORS });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body?.state) return Response.json({ error: 'Missing state' }, { status: 400, headers: CORS });
    const state = { ...body.state };
    for (const field of SERVER_OWNED_FIELDS) delete state[field];
    await env.DIGIAPP_SAVES.put(saveId, JSON.stringify(state), { expirationTtl: 86400 * 365 });
    return Response.json({ ok: true }, { headers: CORS });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS });
}
