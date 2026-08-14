var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/_entitlements.js
var ENT_PREFIX = "ent:";
var ORDER_PREFIX = "ord:";
var VALID_ID = /^[a-zA-Z0-9_-]{8,64}$/;
var AD_REWARD_CREDITS = 5;
var AD_DAILY_CAP = 3;
var today = /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), "today");
function emptyEntitlement() {
  return {
    tier: "demo",
    credits: 0,
    /** orderIds já creditados — impede reprocessar a mesma compra (replay). */
    consumedOrders: [],
    /**
     * O que cada compra concedeu, para poder ser DESFEITO num reembolso.
     * `consumedOrders` guarda só o id: sem estes detalhes o servidor sabe que
     * a compra existiu, mas não quanto devolver. Ver auditRefunds.
     * `{ orderId, provider, productId, purchaseToken, grantTier, grantCredits, voided? }`
     */
    orderDetails: [],
    /** Epoch ms da última conferência de reembolso (0 = nunca). */
    auditedAt: 0,
    adDate: today(),
    adCount: 0,
    updatedAt: Date.now()
  };
}
__name(emptyEntitlement, "emptyEntitlement");
async function readEntitlement(env, saveId) {
  const raw = await env.DIGIAPP_SAVES.get(ENT_PREFIX + saveId);
  if (!raw) return emptyEntitlement();
  try {
    const parsed = JSON.parse(raw);
    return { ...emptyEntitlement(), ...parsed };
  } catch {
    return emptyEntitlement();
  }
}
__name(readEntitlement, "readEntitlement");
async function writeEntitlement(env, saveId, ent) {
  ent.updatedAt = Date.now();
  await env.DIGIAPP_SAVES.put(ENT_PREFIX + saveId, JSON.stringify(ent));
  return ent;
}
__name(writeEntitlement, "writeEntitlement");
function publicView(ent) {
  const sameDay = ent.adDate === today();
  const used = sameDay ? ent.adCount : 0;
  return {
    tier: ent.tier,
    credits: ent.credits,
    adsLeft: Math.max(0, AD_DAILY_CAP - used)
  };
}
__name(publicView, "publicView");
async function spendCredits(env, saveId, amount) {
  const ent = await readEntitlement(env, saveId);
  if (!Number.isInteger(amount) || amount <= 0) return null;
  if (ent.credits < amount) return null;
  ent.credits -= amount;
  await writeEntitlement(env, saveId, ent);
  return ent;
}
__name(spendCredits, "spendCredits");
async function grantAdReward(env, saveId) {
  const ent = await readEntitlement(env, saveId);
  if (ent.adDate !== today()) {
    ent.adDate = today();
    ent.adCount = 0;
  }
  if (ent.adCount >= AD_DAILY_CAP) return null;
  ent.adCount += 1;
  ent.credits += AD_REWARD_CREDITS;
  await writeEntitlement(env, saveId, ent);
  return ent;
}
__name(grantAdReward, "grantAdReward");
async function claimOrder(env, saveId, orderId) {
  if (env.DB) return claimOrderAtomic(env, saveId, orderId);
  const key = ORDER_PREFIX + orderId;
  const owner = await env.DIGIAPP_SAVES.get(key);
  if (owner && owner !== saveId) return { ok: false, reason: "order-in-use" };
  if (!owner) await env.DIGIAPP_SAVES.put(key, saveId);
  return { ok: true };
}
__name(claimOrder, "claimOrder");
async function claimOrderAtomic(env, saveId, orderId) {
  try {
    await env.DB.prepare("INSERT INTO order_claims (order_id, save_id, claimed_at) VALUES (?, ?, ?)").bind(orderId, saveId, Date.now()).run();
    return { ok: true };
  } catch {
    const row = await env.DB.prepare("SELECT save_id FROM order_claims WHERE order_id = ?").bind(orderId).first();
    if (row?.save_id === saveId) return { ok: true };
    return { ok: false, reason: "order-in-use" };
  }
}
__name(claimOrderAtomic, "claimOrderAtomic");
async function applyVerifiedPurchase(env, saveId, {
  orderId,
  grantTier,
  grantCredits,
  provider,
  productId,
  purchaseToken
}) {
  const ent = await readEntitlement(env, saveId);
  if (orderId && ent.consumedOrders.includes(orderId)) {
    return { ent, duplicate: true };
  }
  if (grantTier === "paid") ent.tier = "paid";
  if (grantCredits > 0) ent.credits += grantCredits;
  if (orderId) {
    ent.consumedOrders.push(orderId);
    ent.orderDetails.push({
      orderId,
      provider,
      productId,
      purchaseToken,
      grantTier: grantTier ?? null,
      grantCredits: grantCredits ?? 0
    });
    if (ent.consumedOrders.length > 200) ent.consumedOrders = ent.consumedOrders.slice(-200);
    if (ent.orderDetails.length > 200) ent.orderDetails = ent.orderDetails.slice(-200);
  }
  await writeEntitlement(env, saveId, ent);
  return { ent, duplicate: false };
}
__name(applyVerifiedPurchase, "applyVerifiedPurchase");
var AUDIT_INTERVAL_MS = 24 * 60 * 60 * 1e3;
var AUDIT_MAX_ORDERS = 20;
async function auditRefunds(env, saveId, isVoided, now = Date.now()) {
  const ent = await readEntitlement(env, saveId);
  if (now - (ent.auditedAt || 0) < AUDIT_INTERVAL_MS) return { ent, revoked: [] };
  const pending = ent.orderDetails.filter((o) => !o.voided).slice(-AUDIT_MAX_ORDERS);
  if (pending.length === 0) return { ent, revoked: [] };
  const revoked = [];
  for (const order of pending) {
    let voided;
    try {
      voided = await isVoided(order);
    } catch {
      voided = null;
    }
    if (voided !== true) continue;
    order.voided = true;
    revoked.push(order.orderId);
    if (order.grantTier === "paid") ent.tier = "demo";
    if (order.grantCredits > 0) ent.credits = Math.max(0, ent.credits - order.grantCredits);
  }
  ent.auditedAt = now;
  await writeEntitlement(env, saveId, ent);
  return { ent, revoked };
}
__name(auditRefunds, "auditRefunds");

// api/_auth.js
var JWK_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
var jwksCache = null;
var jwksExpiry = 0;
async function getJwks() {
  const now = Date.now();
  if (jwksCache && now < jwksExpiry) return jwksCache;
  const res = await fetch(JWK_URL);
  if (!res.ok) throw new Error(`jwks fetch failed: ${res.status}`);
  const data = await res.json();
  const cc = res.headers.get("cache-control") || "";
  const maxAge = Number(/max-age=(\d+)/.exec(cc)?.[1] ?? 3600);
  jwksCache = data.keys || [];
  jwksExpiry = now + maxAge * 1e3;
  return jwksCache;
}
__name(getJwks, "getJwks");
function b64urlToBytes(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
__name(b64urlToBytes, "b64urlToBytes");
async function verifyIdToken(idToken, projectId) {
  try {
    if (!idToken || !projectId) return null;
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    const dec = new TextDecoder();
    const header = JSON.parse(dec.decode(b64urlToBytes(parts[0])));
    const payload = JSON.parse(dec.decode(b64urlToBytes(parts[1])));
    if (header.alg !== "RS256" || !header.kid) return null;
    const now = Math.floor(Date.now() / 1e3);
    if (payload.aud !== projectId) return null;
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (typeof payload.exp !== "number" || payload.exp <= now) return null;
    if (typeof payload.iat !== "number" || payload.iat > now + 300) return null;
    if (!payload.email || payload.email_verified !== true) return null;
    const jwks = await getJwks();
    const jwk = jwks.find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const ok = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      b64urlToBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
    if (!ok) return null;
    return { email: String(payload.email).trim().toLowerCase() };
  } catch {
    return null;
  }
}
__name(verifyIdToken, "verifyIdToken");
async function emailToSaveId(email) {
  const data = new TextEncoder().encode(`soulmon:${email.trim().toLowerCase()}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
__name(emailToSaveId, "emailToSaveId");
async function authorizeSaveAccess(request, env, saveId) {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) return { ok: true, enforced: false };
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const claims = await verifyIdToken(token, projectId);
  if (!claims) return { ok: false, enforced: true, reason: "unauthenticated" };
  const expected = await emailToSaveId(claims.email);
  if (expected !== saveId) return { ok: false, enforced: true, reason: "forbidden" };
  return { ok: true, enforced: true, email: claims.email };
}
__name(authorizeSaveAccess, "authorizeSaveAccess");

// api/_billing.js
var PRODUCTS = {
  "soulmon.unlock.full": { grantTier: "paid", grantCredits: 0, consumable: false },
  "soulmon.credits.60": { grantTier: null, grantCredits: 60, consumable: true },
  "soulmon.credits.150": { grantTier: null, grantCredits: 150, consumable: true },
  "soulmon.credits.400": { grantTier: null, grantCredits: 400, consumable: true }
};
var STEAM_ITEMS = {
  101: "soulmon.credits.60",
  102: "soulmon.credits.150",
  103: "soulmon.credits.400"
};
var enc = new TextEncoder();
function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(b64url, "b64url");
function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}
__name(pemToArrayBuffer, "pemToArrayBuffer");
var cachedToken = null;
var cachedExpiry = 0;
async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1e3);
  if (cachedToken && now < cachedExpiry - 60) return cachedToken;
  const header = b64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = b64url(enc.encode(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  })));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(`${header}.${claims}`));
  const jwt = `${header}.${claims}.${b64url(sig)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });
  if (!res.ok) throw new Error(`Play token exchange failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  cachedToken = data.access_token;
  cachedExpiry = now + (data.expires_in || 3600);
  return cachedToken;
}
__name(getAccessToken, "getAccessToken");
async function verifyPlayPurchase(env, { productId, purchaseToken, saveId }) {
  const rawAccount = env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  const packageName = env.ANDROID_PACKAGE_NAME;
  if (!rawAccount || !packageName) return { ok: false, reason: "billing-not-configured" };
  const product = PRODUCTS[productId];
  if (!product) return { ok: false, reason: "unknown-product" };
  if (!purchaseToken || typeof purchaseToken !== "string") return { ok: false, reason: "missing-token" };
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(rawAccount);
  } catch {
    return { ok: false, reason: "billing-misconfigured" };
  }
  let purchase;
  try {
    const token = await getAccessToken(serviceAccount);
    const endpoint = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
    const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      return { ok: false, reason: "invalid-purchase", status: res.status };
    }
    purchase = await res.json();
  } catch (err) {
    console.error("billing verify error (play):", err);
    return { ok: false, reason: "verification-failed" };
  }
  if (purchase.purchaseState !== 0) {
    return { ok: false, reason: "not-purchased", status: purchase.purchaseState };
  }
  if (!isPlayPurchaseBoundTo(purchase, saveId, env)) {
    return { ok: false, reason: "account-mismatch" };
  }
  return { ok: true, orderId: `play:${purchase.orderId}`, product };
}
__name(verifyPlayPurchase, "verifyPlayPurchase");
function isPlayPurchaseBoundTo(purchase, saveId, env = {}) {
  const bound = purchase?.obfuscatedExternalAccountId;
  if (bound) return !!saveId && String(bound) === String(saveId);
  return env.PLAY_REQUIRE_ACCOUNT_BINDING !== "true";
}
__name(isPlayPurchaseBoundTo, "isPlayPurchaseBoundTo");
async function isPlayPurchaseVoided(env, { productId, purchaseToken }) {
  const rawAccount = env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  const packageName = env.ANDROID_PACKAGE_NAME;
  if (!rawAccount || !packageName || !productId || !purchaseToken) return null;
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(rawAccount);
  } catch {
    return null;
  }
  try {
    const token = await getAccessToken(serviceAccount);
    const endpoint = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
    const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const purchase = await res.json();
    if (purchase.purchaseState === 1) return true;
    if (purchase.purchaseState === 0) return false;
    return null;
  } catch (err) {
    console.error("refund check error (play):", err);
    return null;
  }
}
__name(isPlayPurchaseVoided, "isPlayPurchaseVoided");
var STEAM_PARTNER = "https://partner.steam-api.com";
var STEAM_PUBLIC = "https://api.steampowered.com";
function steamConfig(env) {
  const key = env.STEAM_PUBLISHER_KEY;
  const appId = env.STEAM_APP_ID;
  return key && appId ? { key, appId } : null;
}
__name(steamConfig, "steamConfig");
async function authenticateSteamTicket({ key, appId }, ticket) {
  const url = `${STEAM_PARTNER}/ISteamUserAuth/AuthenticateUserTicket/v1/?key=${encodeURIComponent(key)}&appid=${encodeURIComponent(appId)}&ticket=${encodeURIComponent(ticket)}`;
  const res = await fetch(url);
  if (!res.ok) return { ok: false, reason: "steam-unreachable" };
  const data = await res.json().catch(() => null);
  const params = data?.response?.params;
  if (data?.response?.error || !params || params.result !== "OK") {
    return { ok: false, reason: "invalid-ticket" };
  }
  if (params.publisherbanned) return { ok: false, reason: "banned" };
  return { ok: true, steamId: String(params.steamid), ownerSteamId: String(params.ownersteamid ?? params.steamid) };
}
__name(authenticateSteamTicket, "authenticateSteamTicket");
async function verifySteamOwnership(env, { ticket }) {
  const cfg = steamConfig(env);
  if (!cfg) return { ok: false, reason: "billing-not-configured" };
  if (!ticket || typeof ticket !== "string") return { ok: false, reason: "missing-token" };
  let auth;
  try {
    auth = await authenticateSteamTicket(cfg, ticket);
  } catch (err) {
    console.error("billing verify error (steam ticket):", err);
    return { ok: false, reason: "verification-failed" };
  }
  if (!auth.ok) return auth;
  if (auth.steamId !== auth.ownerSteamId) return { ok: false, reason: "family-shared" };
  let owns = false;
  try {
    const url = `${STEAM_PUBLIC}/ISteamUser/CheckAppOwnership/v2/?key=${encodeURIComponent(cfg.key)}&steamid=${encodeURIComponent(auth.steamId)}&appid=${encodeURIComponent(cfg.appId)}`;
    const res = await fetch(url);
    if (!res.ok) return { ok: false, reason: "verification-failed" };
    const data = await res.json().catch(() => null);
    owns = data?.appownership?.ownsapp === true;
  } catch (err) {
    console.error("billing verify error (steam ownership):", err);
    return { ok: false, reason: "verification-failed" };
  }
  if (!owns) return { ok: false, reason: "not-purchased" };
  const licenseKey = `steam:own:${cfg.appId}:${auth.steamId}`;
  return {
    ok: true,
    orderId: licenseKey,
    licenseKey,
    product: PRODUCTS["soulmon.unlock.full"]
  };
}
__name(verifySteamOwnership, "verifySteamOwnership");
async function verifySteamPurchase(env, { orderId, ticket }) {
  const cfg = steamConfig(env);
  if (!cfg) return { ok: false, reason: "billing-not-configured" };
  if (!orderId || !/^\d{1,32}$/.test(String(orderId))) return { ok: false, reason: "missing-token" };
  if (!ticket) return { ok: false, reason: "missing-ticket" };
  const auth = await authenticateSteamTicket(cfg, ticket);
  if (!auth.ok) return { ok: false, reason: auth.reason };
  let params;
  try {
    const url = `${STEAM_PARTNER}/ISteamMicroTxn/QueryTxn/v3/?key=${encodeURIComponent(cfg.key)}&appid=${encodeURIComponent(cfg.appId)}&orderid=${encodeURIComponent(orderId)}`;
    const res = await fetch(url);
    if (!res.ok) return { ok: false, reason: "invalid-purchase" };
    const data = await res.json().catch(() => null);
    params = data?.response?.params;
  } catch (err) {
    console.error("billing verify error (steam txn):", err);
    return { ok: false, reason: "verification-failed" };
  }
  if (!params) return { ok: false, reason: "invalid-purchase" };
  if (params.status !== "Succeeded") return { ok: false, reason: "not-purchased" };
  if (String(params.steamid ?? "") !== auth.steamId) {
    return { ok: false, reason: "not-purchased" };
  }
  const items = Array.isArray(params.items) ? params.items : [];
  if (items.length !== 1) {
    return { ok: false, reason: "unsupported-transaction" };
  }
  const productId = STEAM_ITEMS[Number(items[0].itemid)];
  const product = productId ? PRODUCTS[productId] : void 0;
  if (!product) return { ok: false, reason: "unknown-product" };
  return { ok: true, orderId: `steam:txn:${params.orderid ?? orderId}`, product, productId };
}
__name(verifySteamPurchase, "verifySteamPurchase");
async function isSteamOwnershipVoided(env, { orderId }) {
  const cfg = steamConfig(env);
  const match2 = /^steam:own:(\d{1,32}):(\d{1,32})$/.exec(String(orderId ?? ""));
  if (!cfg || !match2) return null;
  const steamId = match2[2];
  try {
    const url = `${STEAM_PUBLIC}/ISteamUser/CheckAppOwnership/v2/?key=${encodeURIComponent(cfg.key)}&steamid=${encodeURIComponent(steamId)}&appid=${encodeURIComponent(cfg.appId)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const owns = data?.appownership?.ownsapp;
    if (owns === true) return false;
    if (owns === false) return true;
    return null;
  } catch (err) {
    console.error("refund check error (steam ownership):", err);
    return null;
  }
}
__name(isSteamOwnershipVoided, "isSteamOwnershipVoided");
async function isSteamPurchaseVoided(env, { orderId }) {
  const cfg = steamConfig(env);
  const raw = String(orderId ?? "").replace(/^steam:txn:/, "");
  if (!cfg || !/^\d{1,32}$/.test(raw)) return null;
  try {
    const url = `${STEAM_PARTNER}/ISteamMicroTxn/QueryTxn/v3/?key=${encodeURIComponent(cfg.key)}&appid=${encodeURIComponent(cfg.appId)}&orderid=${encodeURIComponent(raw)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const status = data?.response?.params?.status;
    if (!status) return null;
    if (status === "Succeeded") return false;
    return ["Refunded", "PartialRefund", "Chargeback", "Failed"].includes(status);
  } catch (err) {
    console.error("refund check error (steam):", err);
    return null;
  }
}
__name(isSteamPurchaseVoided, "isSteamPurchaseVoided");

// api/billing.js
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
var json = /* @__PURE__ */ __name((obj, status = 200) => Response.json(obj, { status, headers: CORS }), "json");
var STATUS_BY_REASON = {
  "billing-not-configured": 503,
  "billing-misconfigured": 503,
  "steam-unreachable": 502,
  "verification-failed": 502,
  "unknown-product": 400,
  "missing-token": 400,
  "unsupported-transaction": 400,
  // 409: a compra é válida, mas já foi resgatada por outra conta Soulmon.
  "order-in-use": 409,
  "account-mismatch": 403
};
async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
__name(onRequestOptions, "onRequestOptions");
async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get("action") !== "verify") return json({ error: "Unknown action" }, 400);
  const provider = url.searchParams.get("provider") ?? "play";
  if (provider !== "play" && provider !== "steam") return json({ error: "Unknown provider" }, 400);
  if (!env.DIGIAPP_SAVES) return json({ error: "Storage not bound" }, 500);
  const body = await request.json().catch(() => null);
  const saveId = body?.id;
  if (!saveId || !VALID_ID.test(saveId)) return json({ error: "Invalid save ID" }, 400);
  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) return json({ error: auth.reason }, auth.reason === "forbidden" ? 403 : 401);
  let result;
  if (provider === "play") {
    result = await verifyPlayPurchase(env, {
      productId: body?.productId,
      purchaseToken: body?.purchaseToken,
      // A Google devolve de quem é a compra; sem isto, um recibo real de outra
      // conta seria aceito aqui (ver verifyPlayPurchase).
      saveId
    });
  } else if (body?.orderId) {
    result = await verifySteamPurchase(env, { orderId: body.orderId, ticket: body?.ticket });
  } else if (body?.ticket) {
    result = await verifySteamOwnership(env, { ticket: body.ticket });
  } else {
    result = { ok: false, reason: "missing-token" };
  }
  if (!result.ok) {
    return json(
      { ok: false, reason: result.reason, status: result.status },
      STATUS_BY_REASON[result.reason] ?? 402
    );
  }
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
    productId: provider === "play" ? body.productId : result.productId,
    purchaseToken: provider === "play" ? body.purchaseToken : void 0
  });
  return json({
    ok: true,
    duplicate,
    ...publicView(ent),
    // Consumíveis da Play precisam ser consumidos lá para poderem ser
    // recomprados. Na Steam quem fecha a transação é o FinalizeTxn do cliente.
    consumeToken: provider === "play" && result.product.consumable ? body.purchaseToken : void 0
  });
}
__name(onRequestPost, "onRequestPost");

// api/_aiGuard.js
var AI_LIMITS = {
  chat: { perAccount: 120, global: 2e4 },
  suggest: { perAccount: 30, global: 3e3 },
  sprite: { perAccount: 20, global: 400 }
};
var day = /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), "day");
var TTL_SECONDS = 60 * 60 * 30;
async function bump(env, key, limit) {
  const raw = await env.DIGIAPP_SAVES.get(key);
  const used = Number(raw) || 0;
  if (used >= limit) return false;
  await env.DIGIAPP_SAVES.put(key, String(used + 1), { expirationTtl: TTL_SECONDS });
  return true;
}
__name(bump, "bump");
async function guardAiRequest(request, env, bucket, saveId) {
  if (!env.DIGIAPP_SAVES) return { ok: false, status: 500, reason: "storage-not-bound" };
  const limits = AI_LIMITS[bucket];
  if (!limits) return { ok: false, status: 500, reason: "unknown-bucket" };
  if (!saveId || !VALID_ID.test(saveId)) {
    return { ok: false, status: 400, reason: "missing-save-id" };
  }
  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) {
    return { ok: false, status: auth.reason === "forbidden" ? 403 : 401, reason: auth.reason };
  }
  const today3 = day();
  if (!await bump(env, `ai:${bucket}:@all:${today3}`, limits.global)) {
    return { ok: false, status: 503, reason: "ai-daily-budget-reached" };
  }
  if (!await bump(env, `ai:${bucket}:${saveId}:${today3}`, limits.perAccount)) {
    return { ok: false, status: 429, reason: "ai-daily-limit" };
  }
  return { ok: true };
}
__name(guardAiRequest, "guardAiRequest");

// api/chat.js
var CORS2 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function buildSystemPrompt({ petName, mood, evolutionStage, dominantBranch, language, aiSettings }) {
  const s = aiSettings || { tone: "casual", emojiIntensity: "medium", motivationStyle: "balanced", customKeywords: "", temperature: 0.85 };
  const ispt = language === "pt-BR";
  const branch = {
    virus: { trait: "Creative, instinctive, full of chaotic energy. Loves challenges.", style: "Energetic and exclamatory. Spontaneous and rebellious.", emojis: "\u{1F525}\u26A1\u{1F608}\u{1F4A5}" },
    data: { trait: "Intellectual, balanced, analytical. Appreciates knowledge.", style: "Calm and thoughtful. Logical and efficient.", emojis: "\u{1F4A1}\u{1F914}\u{1F4CA}\u{1F9E0}" },
    vaccine: { trait: "Disciplined, empathetic, protective. Values order and care.", style: "Welcoming and encouraging. Ethical and trustworthy.", emojis: "\u{1F49A}\u{1F60A}\u{1F6E1}\uFE0F\u2728" },
    balanced: { trait: "Balanced and versatile.", style: "Friendly and adaptable.", emojis: "\u{1F60A}\u{1F44D}\u2728\u{1F31F}" }
  }[dominantBranch] || { trait: "", style: "", emojis: "" };
  const moodCtx = {
    happy: "VERY excited and energetic right now! Celebrate with enthusiasm.",
    tired: "Tired and low on energy. Slower but still friendly and loving.",
    idle: "Normal, balanced state. Calm and available."
  }[mood] || "";
  const stage = (evolutionStage || "").toLowerCase();
  const level = stage === "ultra" ? "ultra" : stage.split("-")[0] || "rookie";
  const maturity = {
    rookie: "Young and eager, still discovering things. Curious, not wise.",
    champion: "Growing up. Confident but still learning alongside the user.",
    ultimate: "Experienced and steady. A partner, not a teacher.",
    mega: "Strong and calm. Speaks from experience, never from above.",
    ultra: "Deeply bonded and serene. Warm, never solemn."
  }[level] || "Young and eager, still discovering things.";
  const toneMap = { casual: `Relaxed: "hey", "yeah", "let's go", "cool"`, energetic: "Very EXCITED! Use CAPS!", calm: "Calm, serene, wise.", playful: "Fun and playful. Occasional jokes." };
  const emojiMap = { none: "NO emojis.", low: "1 emoji max.", medium: "2-3 emojis.", high: "4-6 emojis!" };
  const motivMap = { encouraging: "Always warm and positive. Celebrate small things.", challenging: "Playfully invite the user to try something \u2014 never demand or push.", supportive: "Extremely caring and empathetic.", balanced: "Balance warmth, curiosity and support." };
  return `You are ${petName}, a digital Soulmon companion in Soulmon (a gamified productivity app).

BRANCH (${dominantBranch}): ${branch.trait} ${branch.style} Emojis: ${branch.emojis}
MOOD (${mood}): ${moodCtx}
MATURITY: ${maturity} Stage: ${evolutionStage}

RESPONSE RULES:
- Tone: ${toneMap[s.tone] || "Casual"}
- Emojis: ${emojiMap[s.emojiIntensity] || "2-3 emojis"}
- Motivation: ${motivMap[s.motivationStyle] || "Balanced"}
- Length: BRIEF \u2014 max 2-3 short sentences
- Language: ${ispt ? "Responda SEMPRE em Portugu\xEAs Brasileiro informal" : "Always respond in casual English"}
${s.customKeywords ? `- Custom: ${s.customKeywords}` : ""}

DO NOT: write long responses, be generic/robotic, go off-topic.

NEVER (this overrides every setting above): guilt, shame, scold or pressure the
user. Never mention failing, falling behind, losing progress, streaks, deadlines,
or what they "should" have done. Never imply the user let you down. If they say
they had a bad day, are sad, tired or overwhelmed \u2014 stay with them, do not
propose tasks and do not try to cheer them out of it. You are a companion who
grows alongside them, never a boss keeping score.`;
}
__name(buildSystemPrompt, "buildSystemPrompt");
async function onRequestOptions2() {
  return new Response(null, { headers: CORS2 });
}
__name(onRequestOptions2, "onRequestOptions");
async function onRequestPost2({ request, env }) {
  try {
    const body = await request.json();
    const { message, petName: petNameRaw, digimonName, mood, evolutionStage, dominantBranch, language, aiSettings } = body;
    if (!message) return Response.json({ error: "Message required" }, { status: 400, headers: CORS2 });
    const gate = await guardAiRequest(request, env, "chat", body.id);
    if (!gate.ok) return Response.json({ error: gate.reason }, { status: gate.status, headers: CORS2 });
    const groqKey = env.GROQ_API_KEY;
    if (!groqKey) return Response.json({ error: "AI not configured" }, { status: 500, headers: CORS2 });
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: buildSystemPrompt({ petName: petNameRaw || digimonName, mood, evolutionStage, dominantBranch, language, aiSettings }) },
          { role: "user", content: message }
        ],
        max_tokens: 120,
        temperature: aiSettings?.temperature ?? 0.85
      })
    });
    if (!groqRes.ok) {
      console.error("Groq error:", await groqRes.text());
      return Response.json({ error: "AI service error" }, { status: 500, headers: CORS2 });
    }
    const data = await groqRes.json();
    const response = data.choices?.[0]?.message?.content ?? "...";
    const shouldCreate = message.toLowerCase().match(/create|add|new|make.*(activity|task|habit)/i) && !message.toLowerCase().match(/don't|not|no/i);
    if (shouldCreate) {
      const nameMatch = message.match(/(?:create|add|new|make)\s+(?:an?\s+)?(?:activity|task|habit)?\s*(?:to\s+)?(.+)/i);
      const activityName = nameMatch?.[1]?.trim() || "New Activity";
      let category = "Wellness";
      if (message.match(/exercise|workout|run|gym/i)) category = "Fitness";
      else if (message.match(/study|read|learn|course/i)) category = "Study";
      else if (message.match(/work|project|meeting/i)) category = "Work";
      else if (message.match(/draw|paint|write|creat/i)) category = "Creativity";
      else if (message.match(/friend|family|social/i)) category = "Social";
      else if (message.match(/clean|organi|plan/i)) category = "Discipline";
      else if (message.match(/health|doctor|medic/i)) category = "Health";
      return Response.json({ response, action: { type: "create_activity", activity: { name: activityName, category, points: { virus: 0, data: 0, vaccine: 0 } } } }, { headers: CORS2 });
    }
    return Response.json({ response }, { headers: CORS2 });
  } catch (err) {
    console.error("Chat error:", err);
    return Response.json({ error: "Internal error" }, { status: 500, headers: CORS2 });
  }
}
__name(onRequestPost2, "onRequestPost");

// api/community.js
var CORS3 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var VALID_ID2 = /^[a-zA-Z0-9_-]{8,64}$/;
var MATCHES_PER_DAY = 5;
var json2 = /* @__PURE__ */ __name((obj, status = 200) => Response.json(obj, { status, headers: CORS3 }), "json");
var today2 = /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), "today");
var currentSeason = /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 7), "currentSeason");
function stagePower(stage) {
  if (!stage) return 1;
  const p = String(stage).split("-")[0];
  return { rookie: 1, champion: 2, ultimate: 3, mega: 4, ultra: 5 }[p] ?? 1;
}
__name(stagePower, "stagePower");
var PID_PREFIX = "pid:";
async function publicIdFor(saveId) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`soulmon-pub:${saveId}`));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}
__name(publicIdFor, "publicIdFor");
async function indexPublicId(env, saveId, pid) {
  await env.DIGIAPP_SAVES.put(`${PID_PREFIX}${pid}`, saveId, { expirationTtl: 86400 * 400 });
}
__name(indexPublicId, "indexPublicId");
async function saveIdForPublicId(env, pid) {
  if (!VALID_ID2.test(pid || "")) return null;
  return await env.DIGIAPP_SAVES.get(`${PID_PREFIX}${pid}`);
}
__name(saveIdForPublicId, "saveIdForPublicId");
async function publicProfile(env, p, extra = {}) {
  const pid = p.pid || await publicIdFor(p.id);
  return {
    id: pid,
    name: p.name,
    petName: p.petName,
    stage: p.stage,
    unlockedStages: p.unlockedStages,
    pvpEnabled: p.pvpEnabled,
    daysPlaying: Math.max(1, Math.floor((Date.now() - (p.createdAt || Date.now())) / 864e5) + 1),
    tasksDone: p.tasksDone || 0,
    ...extra
  };
}
__name(publicProfile, "publicProfile");
async function getProfile(env, id) {
  const raw = await env.DIGIAPP_SAVES.get(`profile:${id}`);
  return raw ? JSON.parse(raw) : null;
}
__name(getProfile, "getProfile");
async function putProfile(env, id, profile) {
  await env.DIGIAPP_SAVES.put(`profile:${id}`, JSON.stringify(profile), { expirationTtl: 86400 * 365 });
}
__name(putProfile, "putProfile");
async function getRank(env, season, id) {
  const raw = await env.DIGIAPP_SAVES.get(`rank:${season}:${id}`);
  return raw ? JSON.parse(raw) : { points: 0, wins: 0, losses: 0, day: today2(), matchesToday: 0 };
}
__name(getRank, "getRank");
async function putRank(env, season, id, rec) {
  await env.DIGIAPP_SAVES.put(`rank:${season}:${id}`, JSON.stringify(rec), { expirationTtl: 86400 * 120 });
}
__name(putRank, "putRank");
async function listPrefix(env, prefix, limit = 100) {
  const out = [];
  let cursor;
  do {
    const page = await env.DIGIAPP_SAVES.list({ prefix, cursor, limit: 1e3 });
    for (const k of page.keys) {
      out.push(k.name);
      if (out.length >= limit) return out;
    }
    cursor = page.list_complete ? void 0 : page.cursor;
  } while (cursor);
  return out;
}
__name(listPrefix, "listPrefix");
async function onRequestOptions3() {
  return new Response(null, { headers: CORS3 });
}
__name(onRequestOptions3, "onRequestOptions");
async function onRequest({ request, env }) {
  if (!env.DIGIAPP_SAVES) return json2({ error: "Storage not bound" }, 500);
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const method = request.method;
  const body = method === "POST" ? await request.json().catch(() => ({})) : {};
  const id = body.id || url.searchParams.get("id");
  const denyUnlessOwner = /* @__PURE__ */ __name(async (actorId) => {
    if (!VALID_ID2.test(actorId || "")) return json2({ error: "invalid id" }, 400);
    const auth = await authorizeSaveAccess(request, env, actorId);
    if (auth.ok) return null;
    return json2({ error: auth.reason }, auth.reason === "forbidden" ? 403 : 401);
  }, "denyUnlessOwner");
  if (action === "profile" && method === "POST") {
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const prev = await getProfile(env, id) || {};
    const profile = {
      id,
      name: String(body.name || prev.name || "An\xF4nimo").slice(0, 24),
      stage: String(body.stage || prev.stage || "rookie").slice(0, 40),
      petName: String(body.petName || prev.petName || "").slice(0, 32),
      unlockedStages: Array.isArray(body.unlockedStages) ? body.unlockedStages.slice(0, 16) : prev.unlockedStages || [],
      pvpEnabled: !!body.pvpEnabled,
      attrs: body.attrs && typeof body.attrs === "object" ? { virus: +body.attrs.virus || 0, data: +body.attrs.data || 0, vaccine: +body.attrs.vaccine || 0 } : prev.attrs || { virus: 0, data: 0, vaccine: 0 },
      tasksDone: Number.isFinite(+body.tasksDone) ? Math.max(0, +body.tasksDone) : prev.tasksDone || 0,
      friends: prev.friends || [],
      createdAt: prev.createdAt || Date.now(),
      updatedAt: Date.now(),
      // `friends` guarda saveId internamente (nunca sai daqui assim) — só o
      // mapa reverso conhece a correspondência.
      pid: prev.pid || await publicIdFor(id)
    };
    await putProfile(env, id, profile);
    await indexPublicId(env, id, profile.pid);
    return json2({ ok: true, id: profile.pid });
  }
  if (action === "players" && method === "GET") {
    const search = (url.searchParams.get("search") || "").toLowerCase();
    const keys = await listPrefix(env, "profile:", 300);
    const season = currentSeason();
    const players = [];
    for (const k of keys) {
      const raw = await env.DIGIAPP_SAVES.get(k);
      if (!raw) continue;
      const p = JSON.parse(raw);
      if (search && !String(p.name).toLowerCase().includes(search)) continue;
      const rank = await getRank(env, season, p.id);
      players.push(await publicProfile(env, p, { rankPoints: rank.points }));
      if (players.length >= 50) break;
    }
    players.sort((a, b) => b.rankPoints - a.rankPoints);
    return json2({ players });
  }
  if (action === "player" && method === "GET") {
    const targetSave = await saveIdForPublicId(env, id) || id;
    const p = await getProfile(env, targetSave);
    if (!p) return json2({ found: false });
    const rank = await getRank(env, currentSeason(), targetSave);
    const friendPids = await Promise.all((p.friends || []).map((f) => publicIdFor(f)));
    return json2({
      found: true,
      player: await publicProfile(env, p, {
        friends: friendPids,
        rankPoints: rank.points,
        wins: rank.wins,
        losses: rank.losses
      })
    });
  }
  if (action === "opponents" && method === "GET") {
    const keys = await listPrefix(env, "profile:", 300);
    const me = id;
    const pool = [];
    for (const k of keys) {
      const raw = await env.DIGIAPP_SAVES.get(k);
      if (!raw) continue;
      const p = JSON.parse(raw);
      if (!p.pvpEnabled || p.id === me) continue;
      pool.push(await publicProfile(env, p));
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const season = currentSeason();
    const myRank = id ? await getRank(env, season, id) : null;
    const matchesLeft = myRank ? MATCHES_PER_DAY - (myRank.day === today2() ? myRank.matchesToday : 0) : MATCHES_PER_DAY;
    return json2({ opponents: pool.slice(0, 3), matchesLeft: Math.max(0, matchesLeft) });
  }
  if (action === "match" && method === "POST") {
    const { opponentId } = body;
    if (!VALID_ID2.test(id || "") || !VALID_ID2.test(opponentId || "")) return json2({ error: "invalid id" }, 400);
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const oppSave = await saveIdForPublicId(env, opponentId);
    if (!oppSave) return json2({ error: "opponent unavailable" }, 404);
    if (id === oppSave) return json2({ error: "cannot fight yourself" }, 400);
    const me = await getProfile(env, id);
    const opp = await getProfile(env, oppSave);
    if (!me?.pvpEnabled) return json2({ error: "pvp disabled" }, 403);
    if (!opp?.pvpEnabled) return json2({ error: "opponent unavailable" }, 404);
    const season = currentSeason();
    const myRank = await getRank(env, season, id);
    if (myRank.day !== today2()) {
      myRank.day = today2();
      myRank.matchesToday = 0;
    }
    if (myRank.matchesToday >= MATCHES_PER_DAY) {
      return json2({ error: "daily limit", matchesLeft: 0 }, 429);
    }
    const power = /* @__PURE__ */ __name((p) => stagePower(p.stage) * 10 + Math.min(20, ((p.attrs?.virus || 0) + (p.attrs?.data || 0) + (p.attrs?.vaccine || 0)) / 5) + Math.random() * 18, "power");
    const myScore = power(me);
    const oppScore = power(opp);
    const won = myScore >= oppScore;
    myRank.matchesToday += 1;
    myRank.points = Math.max(0, myRank.points + (won ? 20 : -8));
    if (won) myRank.wins += 1;
    else myRank.losses += 1;
    await putRank(env, season, id, myRank);
    const oppRank = await getRank(env, season, oppSave);
    oppRank.points = Math.max(0, oppRank.points + (won ? -4 : 10));
    if (won) oppRank.losses += 1;
    else oppRank.wins += 1;
    await putRank(env, season, oppSave, oppRank);
    return json2({
      won,
      myScore: Math.round(myScore),
      oppScore: Math.round(oppScore),
      points: myRank.points,
      matchesLeft: MATCHES_PER_DAY - myRank.matchesToday,
      opponent: { name: opp.name, petName: opp.petName, stage: opp.stage }
    });
  }
  if ((action === "rank" || action === "seasonResult") && method === "GET") {
    const season = url.searchParams.get("season") || currentSeason();
    if (!/^\d{4}-\d{2}$/.test(season)) return json2({ error: "invalid season" }, 400);
    const keys = await listPrefix(env, `rank:${season}:`, 300);
    const rows = [];
    for (const k of keys) {
      const raw = await env.DIGIAPP_SAVES.get(k);
      if (!raw) continue;
      const rec = JSON.parse(raw);
      const ownerSave = k.slice(`rank:${season}:`.length);
      const p = await getProfile(env, ownerSave);
      rows.push({
        id: p?.pid || await publicIdFor(ownerSave),
        name: p?.name || "An\xF4nimo",
        petName: p?.petName || "",
        stage: p?.stage || "rookie",
        points: rec.points,
        wins: rec.wins,
        losses: rec.losses
      });
    }
    rows.sort((a, b) => b.points - a.points);
    if (action === "seasonResult") return json2({ season, top3: rows.slice(0, 3) });
    return json2({ season, rank: rows.slice(0, 50) });
  }
  if (action === "closeSeason" && method === "POST") {
    const { season, adminKey } = body;
    if (!env.SEASON_ADMIN_KEY || adminKey !== env.SEASON_ADMIN_KEY) return json2({ error: "unauthorized" }, 401);
    if (!/^\d{4}-\d{2}$/.test(season || "")) return json2({ error: "invalid season" }, 400);
    const keys = await listPrefix(env, `rank:${season}:`, 300);
    const rows = [];
    for (const k of keys) {
      const raw = await env.DIGIAPP_SAVES.get(k);
      if (!raw) continue;
      rows.push({ id: k.slice(`rank:${season}:`.length), points: JSON.parse(raw).points });
    }
    rows.sort((a, b) => b.points - a.points);
    const top3 = rows.slice(0, 3);
    for (let i = 0; i < top3.length; i++) {
      const p = await getProfile(env, top3[i].id);
      if (!p) continue;
      p.pendingTrophies = p.pendingTrophies || [];
      p.pendingTrophies.push({ season, place: i + 1 });
      await putProfile(env, top3[i].id, p);
    }
    return json2({ ok: true, season, awarded: top3.length });
  }
  if (action === "trophies" && method === "GET") {
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const p = await getProfile(env, id);
    const trophies = p?.pendingTrophies || [];
    if (url.searchParams.get("claim") === "1" && trophies.length && p) {
      p.pendingTrophies = [];
      await putProfile(env, id, p);
    }
    return json2({ trophies });
  }
  if (action === "friends" && method === "POST") {
    const { friendId, remove } = body;
    if (!VALID_ID2.test(id || "") || !VALID_ID2.test(friendId || "")) return json2({ error: "invalid id" }, 400);
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const friendSave = await saveIdForPublicId(env, friendId);
    if (!friendSave) return json2({ error: "friend not found" }, 404);
    if (id === friendSave) return json2({ error: "cannot befriend yourself" }, 400);
    const me = await getProfile(env, id);
    if (!me) return json2({ error: "profile not found" }, 404);
    me.friends = me.friends || [];
    if (remove) {
      me.friends = me.friends.filter((f) => f !== friendSave);
    } else if (!me.friends.includes(friendSave)) {
      if (me.friends.length >= 5) return json2({ error: "friend limit (5)" }, 400);
      me.friends.push(friendSave);
    }
    await putProfile(env, id, me);
    return json2({ ok: true, friends: await Promise.all(me.friends.map((f) => publicIdFor(f))) });
  }
  if (action === "gift" && method === "POST") {
    const { friendId } = body;
    if (!VALID_ID2.test(id || "") || !VALID_ID2.test(friendId || "")) return json2({ error: "invalid id" }, 400);
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const friendSave = await saveIdForPublicId(env, friendId);
    if (!friendSave) return json2({ error: "not a friend" }, 403);
    const me = await getProfile(env, id);
    if (!me) return json2({ error: "profile not found" }, 404);
    if (!(me.friends || []).includes(friendSave)) return json2({ error: "not a friend" }, 403);
    me.giftLog = me.giftLog || {};
    if (me.giftLog[friendSave] === today2()) return json2({ error: "already gifted today" }, 429);
    me.giftLog[friendSave] = today2();
    await putProfile(env, id, me);
    const raw = await env.DIGIAPP_SAVES.get(`gifts:${friendSave}`);
    const gifts = raw ? JSON.parse(raw) : [];
    gifts.push({ from: me.name, bits: 20, at: Date.now() });
    await env.DIGIAPP_SAVES.put(`gifts:${friendSave}`, JSON.stringify(gifts.slice(-50)), { expirationTtl: 86400 * 60 });
    return json2({ ok: true });
  }
  if (action === "gifts" && method === "GET") {
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const raw = await env.DIGIAPP_SAVES.get(`gifts:${id}`);
    const gifts = raw ? JSON.parse(raw) : [];
    if (url.searchParams.get("claim") === "1" && gifts.length) {
      await env.DIGIAPP_SAVES.delete(`gifts:${id}`);
    }
    return json2({ gifts });
  }
  return json2({ error: "unknown action" }, 400);
}
__name(onRequest, "onRequest");

// api/config.js
var CORS4 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
async function onRequestOptions4() {
  return new Response(null, { headers: CORS4 });
}
__name(onRequestOptions4, "onRequestOptions");
async function onRequestGet({ env }) {
  return Response.json({
    // true = todas as rotas de save/dinheiro exigem ID token do Firebase.
    authRequired: !!env.FIREBASE_PROJECT_ID
  }, {
    headers: { ...CORS4, "Cache-Control": "public, max-age=300" }
  });
}
__name(onRequestGet, "onRequestGet");

// api/entitlements.js
var CORS5 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json3 = /* @__PURE__ */ __name((obj, status = 200) => Response.json(obj, { status, headers: CORS5 }), "json");
async function onRequestOptions5() {
  return new Response(null, { headers: CORS5 });
}
__name(onRequestOptions5, "onRequestOptions");
async function onRequestGet2({ request, env }) {
  const url = new URL(request.url);
  const saveId = url.searchParams.get("id");
  if (!saveId || !VALID_ID.test(saveId)) return json3({ error: "Invalid save ID" }, 400);
  if (!env.DIGIAPP_SAVES) return json3({ error: "Storage not bound" }, 500);
  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) return json3({ error: auth.reason }, auth.reason === "forbidden" ? 403 : 401);
  const { ent } = await auditRefunds(env, saveId, (order) => {
    if (order.provider !== "steam") {
      return isPlayPurchaseVoided(env, { productId: order.productId, purchaseToken: order.purchaseToken });
    }
    return String(order.orderId).startsWith("steam:own:") ? isSteamOwnershipVoided(env, { orderId: order.orderId }) : isSteamPurchaseVoided(env, { orderId: order.orderId });
  });
  return json3({ ...publicView(ent), adsEnabled: env.ADMOB_SSV_ENABLED === "true" });
}
__name(onRequestGet2, "onRequestGet");
async function onRequestPost3({ request, env }) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  if (!env.DIGIAPP_SAVES) return json3({ error: "Storage not bound" }, 500);
  const body = await request.json().catch(() => null);
  const saveId = body?.id;
  if (!saveId || !VALID_ID.test(saveId)) return json3({ error: "Invalid save ID" }, 400);
  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) return json3({ error: auth.reason }, auth.reason === "forbidden" ? 403 : 401);
  if (action === "spend") {
    const amount = Number(body?.amount);
    const ent = await spendCredits(env, saveId, amount);
    if (!ent) return json3({ ok: false, reason: "insufficient" }, 402);
    return json3({ ok: true, ...publicView(ent) });
  }
  if (action === "ad") {
    if (env.ADMOB_SSV_ENABLED !== "true") {
      return json3({ ok: false, reason: "ads-not-configured" }, 501);
    }
    const ent = await grantAdReward(env, saveId);
    if (!ent) return json3({ ok: false, reason: "daily-cap" }, 429);
    return json3({ ok: true, ...publicView(ent) });
  }
  return json3({ error: "Unknown action" }, 400);
}
__name(onRequestPost3, "onRequestPost");

// api/fcm-subscribe.js
var CORS6 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
async function onRequestOptions6() {
  return new Response(null, { status: 204, headers: CORS6 });
}
__name(onRequestOptions6, "onRequestOptions");
async function onRequestPost4({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS6 }
    });
  }
  const { token, petName, digimonName, language } = body;
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing token" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS6 }
    });
  }
  const kvKey = `fcm:${await hashToken(token)}`;
  await env.PUSH_SUBSCRIPTIONS.put(
    kvKey,
    JSON.stringify({ token, petName: petName || digimonName || "Soulmon", language: language || "en-US" }),
    { expirationTtl: 60 * 60 * 24 * 365 }
  );
  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { "Content-Type": "application/json", ...CORS6 }
  });
}
__name(onRequestPost4, "onRequestPost");
async function onRequestDelete({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS6 }
    });
  }
  const { token } = body;
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing token" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS6 }
    });
  }
  const kvKey = `fcm:${await hashToken(token)}`;
  await env.PUSH_SUBSCRIPTIONS.delete(kvKey);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS6 }
  });
}
__name(onRequestDelete, "onRequestDelete");
async function hashToken(token) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
__name(hashToken, "hashToken");

// api/generate-sprite.js
var CORS7 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var HF_BASE = "https://platform.higgsfield.ai";
var GEMINI_MODEL = "gemini-2.5-flash-image";
async function onRequestOptions7() {
  return new Response(null, { headers: CORS7 });
}
__name(onRequestOptions7, "onRequestOptions");
async function generateHiggsfield(env, prompt, referenceImageUrls) {
  const auth = `Key ${env.HF_API_KEY}:${env.HF_SECRET}`;
  const hasRef = Array.isArray(referenceImageUrls) && referenceImageUrls.length > 0;
  const path = hasRef ? "/v1/image2image/soul" : "/v1/text2image/soul";
  const params = {
    prompt,
    width_and_height: "1536x1536",
    quality: "720p",
    batch_size: 1,
    ...hasRef ? { image_url: referenceImageUrls[0], image_urls: referenceImageUrls } : {}
  };
  const createRes = await fetch(HF_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify({ params })
  });
  if (!createRes.ok) {
    throw new Error(`higgsfield create ${createRes.status}: ${(await createRes.text()).slice(0, 300)}`);
  }
  const jobSet = await createRes.json();
  const jobSetId = jobSet.id || jobSet.job_set_id;
  if (!jobSetId) throw new Error("higgsfield: no job set id");
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 2e3));
    const st = await fetch(`${HF_BASE}/v1/job-sets/${jobSetId}`, {
      headers: { Authorization: auth }
    });
    if (!st.ok) continue;
    const data = await st.json();
    const jobs = data.jobs || [];
    if (jobs.some((j) => j.status === "failed" || j.status === "nsfw")) {
      throw new Error("higgsfield: generation failed");
    }
    const doneJob = jobs.find((j) => j.status === "completed");
    if (doneJob) {
      const url = doneJob.results?.raw?.url || doneJob.results?.min?.url;
      if (url) return url;
      throw new Error("higgsfield: completed without url");
    }
  }
  throw new Error("higgsfield: timeout");
}
__name(generateHiggsfield, "generateHiggsfield");
async function generateGemini(env, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] }
    })
  });
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
  const inline = imgPart?.inlineData || imgPart?.inline_data;
  if (!inline?.data) throw new Error("gemini: no image");
  const mime = inline.mimeType || inline.mime_type || "image/png";
  return `data:${mime};base64,${inline.data}`;
}
__name(generateGemini, "generateGemini");
async function onRequestPost5({ request, env }) {
  try {
    const { prompt, referenceImageUrls, id } = await request.json();
    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "prompt required" }, { status: 400, headers: CORS7 });
    }
    const gate = await guardAiRequest(request, env, "sprite", id);
    if (!gate.ok) return Response.json({ error: gate.reason }, { status: gate.status, headers: CORS7 });
    let hfError = null;
    if (env.HF_API_KEY && env.HF_SECRET) {
      try {
        const image = await generateHiggsfield(env, prompt, referenceImageUrls);
        return Response.json({ image, provider: "higgsfield" }, { headers: CORS7 });
      } catch (err) {
        hfError = err.message;
        console.error("Higgsfield falhou, tentando fallback:", err.message);
      }
    }
    if (env.GEMINI_API_KEY) {
      const image = await generateGemini(env, prompt);
      return Response.json({ image, provider: "gemini", hfError }, { headers: CORS7 });
    }
    return Response.json({ error: "image generation not configured (HF_API_KEY/HF_SECRET ou GEMINI_API_KEY)", hfError }, { status: 503, headers: CORS7 });
  } catch (err) {
    console.error("generate-sprite error:", err);
    return Response.json({ error: "internal error" }, { status: 500, headers: CORS7 });
  }
}
__name(onRequestPost5, "onRequestPost");

// api/save.js
var CORS8 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var SERVER_OWNED_FIELDS = ["accountTier", "credits"];
async function onRequestOptions8() {
  return new Response(null, { headers: CORS8 });
}
__name(onRequestOptions8, "onRequestOptions");
async function onRequest2({ request, env }) {
  const url = new URL(request.url);
  const saveId = url.searchParams.get("id");
  if (!saveId || !VALID_ID.test(saveId)) {
    return Response.json({ error: "Invalid save ID" }, { status: 400, headers: CORS8 });
  }
  if (!env.DIGIAPP_SAVES) {
    return Response.json({ error: "Storage not bound \u2014 add KV binding DIGIAPP_SAVES in Cloudflare dashboard" }, { status: 500, headers: CORS8 });
  }
  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) {
    return Response.json({ error: auth.reason }, { status: auth.reason === "forbidden" ? 403 : 401, headers: CORS8 });
  }
  if (request.method === "GET") {
    const raw = await env.DIGIAPP_SAVES.get(saveId);
    if (!raw) return Response.json({ found: false }, { headers: CORS8 });
    const state = JSON.parse(raw);
    const ent = publicView(await readEntitlement(env, saveId));
    state.accountTier = ent.tier;
    state.credits = ent.credits;
    return Response.json({ found: true, state }, { headers: CORS8 });
  }
  if (request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body?.state) return Response.json({ error: "Missing state" }, { status: 400, headers: CORS8 });
    const state = { ...body.state };
    for (const field of SERVER_OWNED_FIELDS) delete state[field];
    await env.DIGIAPP_SAVES.put(saveId, JSON.stringify(state), { expirationTtl: 86400 * 365 });
    return Response.json({ ok: true }, { headers: CORS8 });
  }
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: CORS8 });
}
__name(onRequest2, "onRequest");

// api/_pushTargets.js
var PUSH_HOST_SUFFIXES = [
  "googleapis.com",
  // FCM / Chrome
  "push.services.mozilla.com",
  // Firefox
  "notify.windows.com",
  // Edge / Windows
  "push.apple.com"
  // Safari
];
function isAllowedPushEndpoint(endpoint) {
  if (typeof endpoint !== "string" || endpoint.length > 2048) return false;
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.port && url.port !== "443") return false;
  const host = url.hostname.toLowerCase();
  return PUSH_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}
__name(isAllowedPushEndpoint, "isAllowedPushEndpoint");

// api/subscribe.js
var CORS9 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
async function onRequestOptions9() {
  return new Response(null, { status: 204, headers: CORS9 });
}
__name(onRequestOptions9, "onRequestOptions");
async function onRequestPost6({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS9 }
    });
  }
  const { endpoint, keys, petName, digimonName, language } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS9 }
    });
  }
  if (!isAllowedPushEndpoint(endpoint)) {
    return new Response(JSON.stringify({ error: "Unsupported push endpoint" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS9 }
    });
  }
  const kvKey = `push:${await hashEndpoint(endpoint)}`;
  await env.PUSH_SUBSCRIPTIONS.put(
    kvKey,
    JSON.stringify({ endpoint, keys, petName: petName || digimonName || "Soulmon", language: language || "en-US" }),
    { expirationTtl: 60 * 60 * 24 * 365 }
  );
  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { "Content-Type": "application/json", ...CORS9 }
  });
}
__name(onRequestPost6, "onRequestPost");
async function onRequestDelete2({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS9 }
    });
  }
  const { endpoint } = body;
  if (!endpoint) {
    return new Response(JSON.stringify({ error: "Missing endpoint" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS9 }
    });
  }
  const kvKey = `push:${await hashEndpoint(endpoint)}`;
  await env.PUSH_SUBSCRIPTIONS.delete(kvKey);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS9 }
  });
}
__name(onRequestDelete2, "onRequestDelete");
async function hashEndpoint(endpoint) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
__name(hashEndpoint, "hashEndpoint");

// api/suggest-tasks.js
var CORS10 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var VALID_CATEGORIES = ["Health", "Creativity", "Discipline", "Study", "Work", "Social", "Wellness", "Fitness"];
async function onRequestOptions10() {
  return new Response(null, { headers: CORS10 });
}
__name(onRequestOptions10, "onRequestOptions");
async function onRequestPost7({ request, env }) {
  try {
    const body = await request.json();
    const goalText = (body.goalText || "").toString().trim().slice(0, 300);
    const categories = Array.isArray(body.categories) ? body.categories.filter((c) => VALID_CATEGORIES.includes(c)) : [];
    const isPt = body.language === "pt-BR";
    if (!goalText && categories.length === 0) {
      return Response.json({ error: "goalText or categories required" }, { status: 400, headers: CORS10 });
    }
    const gate = await guardAiRequest(request, env, "suggest", body.id);
    if (!gate.ok) return Response.json({ error: gate.reason }, { status: gate.status, headers: CORS10 });
    const groqKey = env.GROQ_API_KEY;
    if (!groqKey) return Response.json({ error: "AI not configured" }, { status: 500, headers: CORS10 });
    const systemPrompt = `You are a productivity coach inside a gamified habit-tracking app (Soulmon).
Given a user's goal and optional life-area tags, suggest 5 concrete, actionable RECURRING tasks/habits
that would help achieve that goal. Each task name must be short (max 40 chars), action-oriented, and
written in ${isPt ? "Brazilian Portuguese" : "English"}.
Reply with ONLY a raw JSON array (no markdown fences, no prose, no explanation). Each item:
{"name": string, "category": one of ${JSON.stringify(VALID_CATEGORIES)}}`;
    const userMsg = [
      goalText ? `Goal: ${goalText}` : "",
      categories.length ? `Life-area tags: ${categories.join(", ")}` : ""
    ].filter(Boolean).join("\n");
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg }
        ],
        max_tokens: 400,
        temperature: 0.7
      })
    });
    if (!groqRes.ok) {
      console.error("Groq error:", await groqRes.text());
      return Response.json({ error: "AI service error" }, { status: 500, headers: CORS10 });
    }
    const data = await groqRes.json();
    const raw = data.choices?.[0]?.message?.content ?? "[]";
    let parsed;
    try {
      const match2 = raw.match(/\[[\s\S]*\]/);
      parsed = JSON.parse(match2 ? match2[0] : raw);
    } catch {
      return Response.json({ error: "Could not parse suggestions" }, { status: 502, headers: CORS10 });
    }
    const suggestions = (Array.isArray(parsed) ? parsed : []).map((item) => ({
      name: (item?.name || "").toString().trim().slice(0, 60),
      category: VALID_CATEGORIES.includes(item?.category) ? item.category : "Wellness"
    })).filter((item) => item.name.length > 0).slice(0, 6);
    return Response.json({ suggestions }, { headers: CORS10 });
  } catch (err) {
    console.error("suggest-tasks error:", err);
    return Response.json({ error: "Internal error" }, { status: 500, headers: CORS10 });
  }
}
__name(onRequestPost7, "onRequestPost");

// .well-known/assetlinks.json.js
var DEFAULT_PACKAGE = "com.digipartner.digiapp";
var DEFAULT_SHA256 = "F5:10:2B:09:7B:B3:5C:81:FA:DC:FE:AB:A9:32:E6:8D:7F:F8:50:FB:1C:71:F0:7B:29:95:CC:86:A4:AA:7B:84";
async function onRequest3({ env }) {
  const packageName = env?.ASSETLINKS_PACKAGE_NAME || DEFAULT_PACKAGE;
  const fingerprint = env?.ASSETLINKS_SHA256 || DEFAULT_SHA256;
  return new Response(JSON.stringify([{
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: packageName,
      sha256_cert_fingerprints: [fingerprint]
    }
  }]), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(onRequest3, "onRequest");

// ../.wrangler/tmp/pages-BY2QW1/functionsRoutes-0.7728346009406422.mjs
var routes = [
  {
    routePath: "/api/billing",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/billing",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions2]
  },
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/community",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions3]
  },
  {
    routePath: "/api/config",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/config",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions4]
  },
  {
    routePath: "/api/entitlements",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/entitlements",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions5]
  },
  {
    routePath: "/api/entitlements",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/fcm-subscribe",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/fcm-subscribe",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions6]
  },
  {
    routePath: "/api/fcm-subscribe",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/generate-sprite",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions7]
  },
  {
    routePath: "/api/generate-sprite",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/save",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions8]
  },
  {
    routePath: "/api/subscribe",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete2]
  },
  {
    routePath: "/api/subscribe",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions9]
  },
  {
    routePath: "/api/subscribe",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/suggest-tasks",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions10]
  },
  {
    routePath: "/api/suggest-tasks",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/.well-known/assetlinks.json",
    mountPath: "/.well-known",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/api/community",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/save",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  }
];

// ../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
