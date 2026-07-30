// Entitlements — endpoint público de leitura/gasto de créditos.
// A lógica e as regras de confiança estão em _entitlements.js (leia o cabeçalho
// de lá antes de mexer aqui). Este arquivo só expõe as operações.
//
// Rotas (query ?action=):
//   GET  /api/entitlements?id=<saveId>          → { tier, credits, adsLeft }
//   POST /api/entitlements?action=spend         { id, amount, reason }
//   POST /api/entitlements?action=ad            { id }
//
// NOTA sobre o /api/entitlements?action=ad: hoje ele credita a recompensa
// confiando que o cliente realmente assistiu ao anúncio — a única proteção é
// o teto diário aplicado NO SERVIDOR. Quando o AdMob entrar de verdade, troque
// por Server-Side Verification (SSV): o próprio Google chama uma URL nossa
// assinada, e só aí o crédito é concedido. Até lá o dano máximo é o mesmo
// valor que o jogador ganharia assistindo aos anúncios do dia.

import {
  VALID_ID, readEntitlement, publicView, spendCredits, grantAdReward,
} from './_entitlements.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (obj, status = 200) => Response.json(obj, { status, headers: CORS });

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const saveId = url.searchParams.get('id');
  if (!saveId || !VALID_ID.test(saveId)) return json({ error: 'Invalid save ID' }, 400);
  if (!env.DIGIAPP_SAVES) return json({ error: 'Storage not bound' }, 500);

  const ent = await readEntitlement(env, saveId);
  return json(publicView(ent));
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  if (!env.DIGIAPP_SAVES) return json({ error: 'Storage not bound' }, 500);

  const body = await request.json().catch(() => null);
  const saveId = body?.id;
  if (!saveId || !VALID_ID.test(saveId)) return json({ error: 'Invalid save ID' }, 400);

  if (action === 'spend') {
    const amount = Number(body?.amount);
    const ent = await spendCredits(env, saveId, amount);
    if (!ent) return json({ ok: false, reason: 'insufficient' }, 402);
    return json({ ok: true, ...publicView(ent) });
  }

  if (action === 'ad') {
    const ent = await grantAdReward(env, saveId);
    if (!ent) return json({ ok: false, reason: 'daily-cap' }, 429);
    return json({ ok: true, ...publicView(ent) });
  }

  return json({ error: 'Unknown action' }, 400);
}
