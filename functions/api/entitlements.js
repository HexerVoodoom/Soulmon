// Entitlements — endpoint público de leitura/gasto de créditos.
// A lógica e as regras de confiança estão em _entitlements.js (leia o cabeçalho
// de lá antes de mexer aqui). Este arquivo só expõe as operações.
//
// Rotas (query ?action=):
//   GET  /api/entitlements?id=<saveId>          → { tier, credits, adsLeft }
//   POST /api/entitlements?action=spend         { id, amount, reason }
//   POST /api/entitlements?action=ad            { id }
//
// SOBRE O ANÚNCIO RECOMPENSADO (action=ad): um endpoint aberto que dá crédito
// só porque o cliente pediu é farmável com um `curl` — o jogador ganharia a
// moeda sem gerar receita de anúncio, que é justamente o que deveria pagar a
// conta. Por isso ele fica DESLIGADO por padrão e só responde quando
// ADMOB_SSV_ENABLED === 'true'.
//
// Para ligar de verdade é preciso Server-Side Verification do AdMob: o próprio
// Google chama uma URL nossa assinada quando o anúncio termina, e só essa
// chamada (verificada por assinatura) pode conceder crédito. Enquanto isso não
// existir, a UI esconde a opção (o GET devolve `adsEnabled: false`) em vez de
// mostrar um botão que não deveria funcionar.

import {
  VALID_ID, publicView, spendCredits, grantAdReward, auditRefunds,
} from './_entitlements.js';
import { authorizeSaveAccess } from './_auth.js';
import { isPlayPurchaseVoided, isSteamPurchaseVoided } from './_billing.js';

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

  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) return json({ error: auth.reason }, auth.reason === 'forbidden' ? 403 : 401);

  // Conferência de reembolso, no máximo 1×/dia por conta (auditRefunds decide).
  // Fica aqui, e não num cron, porque é o único ponto por onde toda conta ativa
  // passa — e é justamente quem usa o app que precisa perder o benefício
  // reembolsado. Se a loja não responder, o benefício é MANTIDO.
  const { ent } = await auditRefunds(env, saveId, order => (
    order.provider === 'steam'
      ? isSteamPurchaseVoided(env, { orderId: order.orderId })
      : isPlayPurchaseVoided(env, { productId: order.productId, purchaseToken: order.purchaseToken })
  ));

  return json({ ...publicView(ent), adsEnabled: env.ADMOB_SSV_ENABLED === 'true' });
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  if (!env.DIGIAPP_SAVES) return json({ error: 'Storage not bound' }, 500);

  const body = await request.json().catch(() => null);
  const saveId = body?.id;
  if (!saveId || !VALID_ID.test(saveId)) return json({ error: 'Invalid save ID' }, 400);

  // Gastar crédito alheio seria vandalismo com custo real pro dono.
  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) return json({ error: auth.reason }, auth.reason === 'forbidden' ? 403 : 401);

  if (action === 'spend') {
    const amount = Number(body?.amount);
    const ent = await spendCredits(env, saveId, amount);
    if (!ent) return json({ ok: false, reason: 'insufficient' }, 402);
    return json({ ok: true, ...publicView(ent) });
  }

  if (action === 'ad') {
    // Desligado enquanto não houver verificação real do AdMob — ver nota no
    // topo. Sem isto, `curl` vira máquina de crédito grátis.
    if (env.ADMOB_SSV_ENABLED !== 'true') {
      return json({ ok: false, reason: 'ads-not-configured' }, 501);
    }
    const ent = await grantAdReward(env, saveId);
    if (!ent) return json({ ok: false, reason: 'daily-cap' }, 429);
    return json({ ok: true, ...publicView(ent) });
  }

  return json({ error: 'Unknown action' }, 400);
}
