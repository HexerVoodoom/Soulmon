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
//   POST /api/billing?action=verify   { id, productId: 'soulmon_cosmetic_quarterly', purchaseToken }
//        → ASSINATURA cosmética (D10): verifica em `purchases.subscriptionsv2`, vínculo de conta
//          sempre exigido, claim da raiz da cadeia linkedPurchaseToken, vigência = a da Google,
//          acknowledge no servidor. Responde { ok, tier, credits, adsLeft, subActive, subUntil }.
//          Os avisos em tempo real chegam em /api/rtdn (rtdn.js). Nunca concede tier nem Créditos.
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

import { VALID_ID, publicView, applyVerifiedPurchase, applySubscriptionState, claimOrder, lookupOrderOwner } from './_entitlements.js';
import { isBillingDisabled, BILLING_DISABLED_MESSAGE } from './_killSwitch.js';
import { betaGate, BETA_CLOSED_MESSAGE } from './_betaAccess.js';
import { authorizeSaveAccess, authStatus } from './_auth.js';
import {
  verifyPlayPurchase, verifySteamOwnership, verifySteamPurchase,
  verifyPlaySubscription, acknowledgePlaySubscription, PRODUCTS, maskToken, sha256Hex,
} from './_billing.js';
import { kv } from './_kv.js';

export { PRODUCTS } from './_billing.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (obj, status = 200) => Response.json(obj, { status, headers: CORS });

/**
 * Kill-switch `BILLING_DISABLED` (`_killSwitch.js`): com a var ligada, só passa
 * comprovante que JÁ é desta conta (restaurar / reconciliar / renovar). Pedido
 * novo ou de outra conta → 503 `billing-disabled`, ANTES do claim e do
 * reconhecimento — a Play estorna o não reconhecido em 3 dias.
 * @returns {Promise<Response|null>} resposta de recusa, ou `null` para seguir.
 */
async function recusaSeLojaFechada(env, saveId, orderId) {
  if (!isBillingDisabled(env)) return null;
  const dono = orderId ? await lookupOrderOwner(env, orderId) : null;
  if (dono && dono === saveId) return null;
  console.log(JSON.stringify({ event: 'billing.killswitch.refused', saveIdPrefix: String(saveId).slice(0, 8) }));
  return json({ ok: false, reason: 'billing-disabled', message: BILLING_DISABLED_MESSAGE }, 503);
}

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
  'account-mismatch': 403,
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get('action') !== 'verify') return json({ error: 'Unknown action' }, 400);

  const provider = url.searchParams.get('provider') ?? 'play';
  if (provider !== 'play' && provider !== 'steam') return json({ error: 'Unknown provider' }, 400);

  if (!kv(env)) return json({ error: 'Storage not bound' }, 500);

  const body = await request.json().catch(() => null);
  const saveId = body?.id;
  if (!saveId || !VALID_ID.test(saveId)) return json({ error: 'Invalid save ID' }, 400);

  // Impede creditar a compra numa conta que não é a de quem está comprando.
  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) return json(auth.reason === 'beta-closed' ? { ok: false, error: auth.reason, reason: auth.reason, message: BETA_CLOSED_MESSAGE } : { error: auth.reason }, authStatus(auth));
  // Beta fechado: fora da lista não compra (nem restaura) — `_betaAccess.js`.
  if (betaGate(env, auth, 'core')) return json({ ok: false, reason: 'beta-closed', message: BETA_CLOSED_MESSAGE }, 403);

  // ASSINATURA (SKU `kind:'subscription'`): outro recurso da Google, outro
  // efeito (vigência da vitrine, nunca tier/Créditos). Ramo à parte de propósito.
  if (provider === 'play' && PRODUCTS[body?.productId]?.kind === 'subscription') {
    return handleSubscription(env, saveId, body);
  }

  let result;
  if (provider === 'play') {
    result = await verifyPlayPurchase(env, {
      productId: body?.productId,
      purchaseToken: body?.purchaseToken,
      // A Google devolve de quem é a compra; sem isto, um recibo real de outra
      // conta seria aceito aqui (ver verifyPlayPurchase).
      saveId,
    });
  } else if (body?.orderId) {
    // Steam: microtransação (pacote de créditos). Exige o MESMO ticket da posse
    // — sem ele, um `orderid` adivinhado creditaria a compra de outra pessoa.
    result = await verifySteamPurchase(env, { orderId: body.orderId, ticket: body?.ticket });
  } else if (body?.ticket) {
    // Steam: posse do app = desbloqueio completo (a loja já cobrou pelo jogo).
    result = await verifySteamOwnership(env, { ticket: body.ticket });
  } else {
    result = { ok: false, reason: 'missing-token' };
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
  const fechada = await recusaSeLojaFechada(env, saveId, result.orderId);
  if (fechada) return fechada;

  const claim = await claimOrder(env, saveId, result.orderId);
  if (!claim.ok) {
    return json({ ok: false, reason: claim.reason }, STATUS_BY_REASON[claim.reason]);
  }

  const { ent, duplicate } = await applyVerifiedPurchase(env, saveId, {
    orderId: result.orderId,
    grantTier: result.product.grantTier,
    grantCredits: result.product.grantCredits,
    // Guardado para o reembolso saber o que desfazer depois (ver auditRefunds).
    provider,
    // Só o caminho da Steam devolve `productId` (verifySteamTxn); na Play quem
    // informa é o cliente. O cast documenta isso em vez de mentir no @returns
    // de verifySteamOwnership, que de fato não tem o campo.
    productId: provider === 'play' ? body.productId : /** @type {{ productId?: string }} */ (result).productId,
    purchaseToken: provider === 'play' ? body.purchaseToken : undefined,
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

/**
 * Assinatura cosmética: verifica NA GOOGLE (`subscriptionsv2`), reivindica a
 * cadeia (um comprovante, uma conta), grava a vigência que a Google informou e
 * reconhece no servidor. Nada do corpo da requisição além do `purchaseToken`
 * é lido — vigência forjada pelo cliente é ignorada por construção.
 */
async function handleSubscription(env, saveId, body) {
  const result = await verifyPlaySubscription(env, { purchaseToken: body?.purchaseToken, saveId });
  if (!result.ok) {
    console.log(JSON.stringify({ event: 'billing.sub.refused', saveIdPrefix: String(saveId).slice(0, 8), reason: result.reason }));
    return json({ ok: false, reason: result.reason, status: result.status }, STATUS_BY_REASON[result.reason] ?? 402);
  }

  const fechada = await recusaSeLojaFechada(env, saveId, result.orderId);
  if (fechada) return fechada;

  // A chave é a RAIZ da cadeia linkedPurchaseToken: renovação, reassinatura e
  // troca de plano caem no mesmo claim, e a 2ª conta recebe 409.
  const claim = await claimOrder(env, saveId, result.orderId);
  if (!claim.ok) return json({ ok: false, reason: claim.reason }, STATUS_BY_REASON[claim.reason]);

  const s = result.subscription;
  const { ent, changed } = await applySubscriptionState(env, saveId, {
    rootHash: await sha256Hex(s.rootToken),
    until: s.until,
    state: s.state,
    entitled: s.entitled,
    test: s.test,
  });

  // Reconhecer DEPOIS de conceder (a Play estorna em 3 dias o que ninguém reconhece).
  const acked = await acknowledgePlaySubscription(env, { purchaseToken: body.purchaseToken, ackPending: s.ackPending });
  console.log(JSON.stringify({
    event: 'billing.sub.verified', saveIdPrefix: String(saveId).slice(0, 8),
    token: maskToken(body.purchaseToken), state: s.state, test: s.test, acked,
  }));

  return json({ ok: true, duplicate: !changed, ...publicView(ent) });
}
