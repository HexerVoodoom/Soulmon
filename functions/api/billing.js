// Google Play Billing — verificação de compra no SERVIDOR.
//
// O app Android abre o fluxo de compra pela Play e recebe um `purchaseToken`.
// Esse token sozinho não prova nada para nós: quem manda a requisição é o
// cliente. Então aqui perguntamos à PRÓPRIA GOOGLE se aquela compra existe,
// se está paga e se é do nosso pacote — e só então concedemos o benefício,
// gravando no entitlement (ver _entitlements.js).
//
// Rotas:
//   POST /api/billing?action=verify  { id, productId, purchaseToken }
//     → { ok, tier, credits, adsLeft, consumeToken? }
//
// `consumeToken` só volta para produtos CONSUMÍVEIS (pacotes de crédito): o
// app precisa chamar consumeAsync() na Play depois, senão o jogador não
// consegue comprar o mesmo pacote de novo. O desbloqueio completo é uma compra
// NÃO consumível (fica no histórico da conta Google e é reaplicada no restore).
//
// Secrets necessários (Cloudflare Pages → Settings → Environment variables):
//   GOOGLE_PLAY_SERVICE_ACCOUNT — JSON da conta de serviço com acesso à
//     Google Play Android Developer API (escopo androidpublisher).
//   ANDROID_PACKAGE_NAME — ex.: com.hexervoodoom.soulmon
// Sem eles a rota responde 503 e NUNCA concede nada (nunca finge cobrar).

import { VALID_ID, publicView, applyVerifiedPurchase } from './_entitlements.js';
import { authorizeSaveAccess } from './_auth.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (obj, status = 200) => Response.json(obj, { status, headers: CORS });

/**
 * Catálogo — o que cada SKU concede. Os ids precisam bater EXATAMENTE com os
 * produtos criados no Google Play Console. Preço e moeda são definidos lá
 * (não aqui) — a Play é a fonte da verdade do valor cobrado.
 */
export const PRODUCTS = {
  'soulmon.unlock.full': { grantTier: 'paid', grantCredits: 0, consumable: false },
  'soulmon.credits.60': { grantTier: null, grantCredits: 60, consumable: true },
  'soulmon.credits.150': { grantTier: null, grantCredits: 150, consumable: true },
  'soulmon.credits.400': { grantTier: null, grantCredits: 400, consumable: true },
};

// ── OAuth2 via conta de serviço (mesmo padrão de workers/fcm.js) ───────────
const enc = new TextEncoder();

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

let cachedToken = null;
let cachedExpiry = 0;

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < cachedExpiry - 60) return cachedToken;

  const header = b64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = b64url(enc.encode(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })));

  const key = await crypto.subtle.importKey(
    'pkcs8', pemToArrayBuffer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(`${header}.${claims}`));
  const jwt = `${header}.${claims}.${b64url(sig)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`Play token exchange failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  cachedToken = data.access_token;
  cachedExpiry = now + (data.expires_in || 3600);
  return cachedToken;
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get('action') !== 'verify') return json({ error: 'Unknown action' }, 400);

  if (!env.DIGIAPP_SAVES) return json({ error: 'Storage not bound' }, 500);

  const rawAccount = env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  const packageName = env.ANDROID_PACKAGE_NAME;
  if (!rawAccount || !packageName) {
    // Nunca conceder nada sem conseguir verificar de verdade.
    return json({ ok: false, reason: 'billing-not-configured' }, 503);
  }

  const body = await request.json().catch(() => null);
  const saveId = body?.id;
  const productId = body?.productId;
  const purchaseToken = body?.purchaseToken;

  if (!saveId || !VALID_ID.test(saveId)) return json({ error: 'Invalid save ID' }, 400);

  // Impede creditar a compra numa conta que não é a de quem está comprando.
  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) return json({ error: auth.reason }, auth.reason === 'forbidden' ? 403 : 401);

  const product = PRODUCTS[productId];
  if (!product) return json({ error: 'Unknown product' }, 400);
  if (!purchaseToken || typeof purchaseToken !== 'string') return json({ error: 'Missing purchaseToken' }, 400);

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(rawAccount);
  } catch {
    return json({ ok: false, reason: 'billing-misconfigured' }, 503);
  }

  let purchase;
  try {
    const token = await getAccessToken(serviceAccount);
    const endpoint = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
    const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      // 404 = token inexistente/inválido para este produto — compra forjada.
      return json({ ok: false, reason: 'invalid-purchase', status: res.status }, 402);
    }
    purchase = await res.json();
  } catch (err) {
    console.error('billing verify error:', err);
    return json({ ok: false, reason: 'verification-failed' }, 502);
  }

  // purchaseState: 0 = comprado, 1 = cancelado, 2 = pendente.
  if (purchase.purchaseState !== 0) {
    return json({ ok: false, reason: 'not-purchased', purchaseState: purchase.purchaseState }, 402);
  }

  const { ent, duplicate } = await applyVerifiedPurchase(env, saveId, {
    orderId: purchase.orderId,
    grantTier: product.grantTier,
    grantCredits: product.grantCredits,
  });

  return json({
    ok: true,
    duplicate,
    ...publicView(ent),
    // Consumíveis precisam ser consumidos na Play para poderem ser recomprados.
    consumeToken: product.consumable ? purchaseToken : undefined,
  });
}
