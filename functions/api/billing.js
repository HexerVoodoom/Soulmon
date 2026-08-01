// Verificação de compra no SERVIDOR — rota única para todas as lojas.
//
// O cliente (app Android ou desktop na Steam) recebe da loja um comprovante:
// `purchaseToken` na Play, `orderid`/session ticket na Steam. Esse comprovante
// sozinho não prova nada para nós — quem manda a requisição é o cliente. Então
// perguntamos à PRÓPRIA LOJA se aquilo existe e está pago, e só então
// concedemos o benefício no entitlement (ver _entitlements.js).
//
// A carteira é UMA SÓ por conta: créditos comprados na Play valem na Steam e
// vice-versa. O que muda por loja é onde a compra acontece (ver _billing.js).
//
// Rotas:
//   POST /api/billing?action=verify[&provider=play]
//        { id, productId, purchaseToken }        → { ok, tier, credits, adsLeft, consumeToken? }
//   POST /api/billing?action=verify&provider=steam
//        { id, orderId }                          → créditos (microtransação)
//        { id, ticket }                           → tier pago (posse do app)
//
// `consumeToken` só volta para produtos CONSUMÍVEIS da Play (pacotes de
// crédito): o app precisa chamar consumeAsync() depois, senão o jogador não
// consegue comprar o mesmo pacote de novo. O desbloqueio completo é uma compra
// NÃO consumível (fica no histórico da conta Google e volta no restore).
//
// Secrets (Cloudflare Pages → Settings → Environment variables):
//   Play:  GOOGLE_PLAY_SERVICE_ACCOUNT, ANDROID_PACKAGE_NAME
//   Steam: STEAM_PUBLISHER_KEY, STEAM_APP_ID
// Sem eles a rota da loja em questão responde 503 e NUNCA concede nada.

import { VALID_ID, publicView, applyVerifiedPurchase, claimOrder } from './_entitlements.js';
import { authorizeSaveAccess } from './_auth.js';
import { verifyPlayPurchase, verifySteamOwnership, verifySteamPurchase } from './_billing.js';

export { PRODUCTS } from './_billing.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (obj, status = 200) => Response.json(obj, { status, headers: CORS });

/** Falha de verificação → status HTTP. 402 = "a loja não confirmou o pagamento". */
const STATUS_BY_REASON = {
  'billing-not-configured': 503,
  'billing-misconfigured': 503,
  'steam-unreachable': 502,
  'verification-failed': 502,
  'unknown-product': 400,
  'missing-token': 400,
  'unsupported-transaction': 400,
  // 409: a compra é válida, mas já foi resgatada por outra conta Soulmon.
  'order-in-use': 409,
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get('action') !== 'verify') return json({ error: 'Unknown action' }, 400);

  const provider = url.searchParams.get('provider') ?? 'play';
  if (provider !== 'play' && provider !== 'steam') return json({ error: 'Unknown provider' }, 400);

  if (!env.DIGIAPP_SAVES) return json({ error: 'Storage not bound' }, 500);

  const body = await request.json().catch(() => null);
  const saveId = body?.id;
  if (!saveId || !VALID_ID.test(saveId)) return json({ error: 'Invalid save ID' }, 400);

  // Impede creditar a compra numa conta que não é a de quem está comprando.
  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) return json({ error: auth.reason }, auth.reason === 'forbidden' ? 403 : 401);

  let result;
  if (provider === 'play') {
    result = await verifyPlayPurchase(env, {
      productId: body?.productId,
      purchaseToken: body?.purchaseToken,
    });
  } else if (body?.ticket) {
    // Steam: posse do app = desbloqueio completo (a loja já cobrou pelo jogo).
    result = await verifySteamOwnership(env, { ticket: body.ticket });
  } else {
    result = await verifySteamPurchase(env, { orderId: body?.orderId });
  }

  if (!result.ok) {
    return json(
      { ok: false, reason: result.reason, status: result.status },
      STATUS_BY_REASON[result.reason] ?? 402,
    );
  }

  // Um comprovante vale para UMA conta, em qualquer loja. Sem isto, tanto o
  // "restaurar compras" da Play quanto a posse do app na Steam poderiam ser
  // resgatados em quantas contas o jogador quisesse (ver claimOrder).
  const claim = await claimOrder(env, saveId, result.orderId);
  if (!claim.ok) {
    return json({ ok: false, reason: claim.reason }, STATUS_BY_REASON[claim.reason]);
  }

  const { ent, duplicate } = await applyVerifiedPurchase(env, saveId, {
    orderId: result.orderId,
    grantTier: result.product.grantTier,
    grantCredits: result.product.grantCredits,
  });

  return json({
    ok: true,
    duplicate,
    ...publicView(ent),
    // Consumíveis da Play precisam ser consumidos lá para poderem ser
    // recomprados. Na Steam quem fecha a transação é o FinalizeTxn do cliente.
    consumeToken: provider === 'play' && result.product.consumable ? body.purchaseToken : undefined,
  });
}
