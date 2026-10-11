// RTDN — Real-time Developer Notifications da Google Play (Pub/Sub PUSH).
//
//   POST /api/rtdn      Authorization: Bearer <OIDC do Pub/Sub>
//        { message: { data: <base64 DeveloperNotification>, messageId }, subscription }
//
// A notificação diz "algo mudou", NUNCA o quê. O payload não é confiado: ele só
// aponta um `purchaseToken`, e a verdade vem de um novo GET em
// `purchases.subscriptionsv2` (docs/ASSINATURA-SPEC.md, threat-model R7).
//
//   · autenticação: JWT OIDC do Pub/Sub (`_pubsubAuth.js`) — sem ele, 401;
//   · idempotência: por `messageId` (D1 `rtdn_messages` / KV) — reentrega não
//     repete a consulta;
//   · resposta: 2xx quando a mensagem foi tratada OU não há nada a fazer;
//     5xx quando a Google/nosso armazenamento falhou, para o Pub/Sub tentar de
//     novo com recuo;
//   · só o ESTADO da assinatura é escrito (`ent.sub`). Nada de tier, Créditos
//     ou item entregue — fechar a vitrine nunca retira o que a pessoa já tem;
//   · log estruturado, token sempre mascarado (R9).
//
// Variáveis: RTDN_AUDIENCE (a URL exata do endpoint configurada como audience na
// assinatura push), RTDN_PUSH_SA_EMAIL (a service account de push),
// ANDROID_PACKAGE_NAME e GOOGLE_PLAY_SERVICE_ACCOUNT (as de sempre).

import { verifyPubsubPush, pubsubAuthConfigured } from './_pubsubAuth.js';
import {
  fetchSubscriptionV2, interpretSubscription, resolveSubscriptionRoot, subscriptionOrderId,
  acknowledgePlaySubscription, sha256Hex, maskToken,
} from './_billing.js';
import { applySubscriptionState, lookupOrderOwner, rtdnSeen, rtdnMarkSeen } from './_entitlements.js';
import { kv } from './_kv.js';

const json = (obj, status = 200) => Response.json(obj, { status });
const log = (event, extra = {}) => console.log(JSON.stringify({ event, ...extra }));

/** Base64 (padrão ou url-safe) → texto UTF-8, ou null. */
function decodeData(data) {
  try {
    const b64 = String(data).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    return new TextDecoder().decode(Uint8Array.from(raw, c => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

/**
 * Reconsulta a Google para um token e fecha/abre a vitrine da conta dona.
 * @returns {Promise<{ status: number, outcome: string }>}
 */
async function reconcileToken(env, purchaseToken, kind) {
  const got = await fetchSubscriptionV2(env, purchaseToken);
  if (!got.ok) {
    // A Google não conhece o token: nada a reconciliar (e reentregar não muda isso).
    if (got.reason === 'invalid-purchase') return { status: 200, outcome: 'token-unknown' };
    return { status: 503, outcome: got.reason };
  }

  const root = await resolveSubscriptionRoot(env, purchaseToken, got.sub);
  if (!root.ok) return { status: 503, outcome: root.reason };
  const orderId = await subscriptionOrderId(root.rootToken);

  const owner = await lookupOrderOwner(env, orderId);
  if (!owner) {
    // Compra que o app ainda não verificou (o aviso chega antes do verify, ou o
    // app fechou). Não criamos claim aqui; só garantimos o reconhecimento, para a
    // Play não estornar em 3 dias. O benefício chega quando o app abrir e
    // reconciliar (queryPurchases → /api/billing).
    const peek = interpretSubscription(got.sub, { saveId: got.sub?.externalAccountIdentifiers?.obfuscatedExternalAccountId });
    if (peek.ok && peek.entitled) await acknowledgePlaySubscription(env, { purchaseToken, ackPending: peek.ackPending });
    return { status: 200, outcome: 'unclaimed' };
  }

  const read = interpretSubscription(got.sub, { saveId: owner });
  if (!read.ok) return { status: 200, outcome: `ignored-${read.reason}` };

  const { changed } = await applySubscriptionState(env, owner, {
    rootHash: await sha256Hex(root.rootToken),
    until: read.until,
    state: read.state,
    entitled: read.entitled,
    test: read.test,
  });
  if (read.entitled) await acknowledgePlaySubscription(env, { purchaseToken, ackPending: read.ackPending });
  log('rtdn.sub.reconciled', {
    kind, saveIdPrefix: String(owner).slice(0, 8), token: maskToken(purchaseToken),
    state: read.state, entitled: read.entitled, changed,
  });
  return { status: 200, outcome: read.entitled ? 'active' : 'closed' };
}

export async function onRequestPost({ request, env }) {
  // Sem configuração o endpoint não aceita nada (nem 401 informativo).
  if (!pubsubAuthConfigured(env) || !env.ANDROID_PACKAGE_NAME) return json({ error: 'rtdn-not-configured' }, 503);
  if (!(await verifyPubsubPush(request, env))) return json({ error: 'Unauthorized' }, 401);
  if (!kv(env)) return json({ error: 'Storage not bound' }, 500);

  const envelope = await request.json().catch(() => null);
  const messageId = typeof envelope?.message?.messageId === 'string' ? envelope.message.messageId : '';
  if (!/^[0-9A-Za-z_-]{1,64}$/.test(messageId)) {
    log('rtdn.malformed', { why: 'messageId' });
    return json({ ok: true, ignored: 'malformed' }); // 2xx: reentregar não conserta
  }

  // Dedupe é otimização, não trava: falha dela (migração 0003 pendente) não derruba o aviso.
  try {
    if (await rtdnSeen(env, messageId)) return json({ ok: true, duplicate: true });
  } catch (err) {
    log('rtdn.dedupe.unavailable', { err: String(err?.message ?? err).slice(0, 80) });
  }

  const text = decodeData(envelope?.message?.data);
  let note = null;
  try { note = text ? JSON.parse(text) : null; } catch { note = null; }
  if (!note || typeof note !== 'object') {
    log('rtdn.malformed', { why: 'data', messageId });
    return json({ ok: true, ignored: 'malformed' });
  }
  if (note.packageName !== env.ANDROID_PACKAGE_NAME) {
    log('rtdn.wrong-package', { messageId });
    return json({ ok: true, ignored: 'package' });
  }

  let result = { status: 200, outcome: 'ignored' };
  try {
    if (note.testNotification) {
      log('rtdn.test', { messageId });
      result = { status: 200, outcome: 'test' };
    } else if (note.subscriptionNotification?.purchaseToken) {
      result = await reconcileToken(env, String(note.subscriptionNotification.purchaseToken), 'subscription');
    } else if (note.voidedPurchaseNotification?.purchaseToken && Number(note.voidedPurchaseNotification.productType) === 1) {
      // Reembolso de assinatura: fecha a vitrine FUTURA se a Google confirmar.
      result = await reconcileToken(env, String(note.voidedPurchaseNotification.purchaseToken), 'voided');
    }
    // oneTimeProductNotification / voided de produto: o vitalício segue a
    // conferência diária (auditRefunds); nada a fazer aqui.
  } catch (err) {
    log('rtdn.error', { messageId, err: String(err?.message ?? err).slice(0, 80) });
    return json({ ok: false, error: 'retry' }, 500);
  }

  if (result.status >= 500) return json({ ok: false, reason: result.outcome }, result.status);

  try { await rtdnMarkSeen(env, messageId); } catch (err) {
    log('rtdn.dedupe.unavailable', { err: String(err?.message ?? err).slice(0, 80) });
  }
  return json({ ok: true, outcome: result.outcome });
}
