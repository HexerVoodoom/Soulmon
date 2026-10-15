// Catálogo + verificação de compra, por LOJA.
//
// O entitlement (`_entitlements.js`) é uma carteira só, por conta (e-mail →
// saveId). Este módulo é a "caixa registradora": cada loja tem a sua, porque
// cada uma exige que a COMPRA aconteça dentro dela —
//
//   • Google Play: conteúdo digital comprado no app Android tem que passar
//     pelo Play Billing. Mas a política de conteúdo multiplataforma permite
//     CONSUMIR no Android o que foi comprado em outro lugar.
//   • Steam: o que for vendido para a versão Steam passa pelo pagamento da
//     Steam (MicroTxn/DLC).
//
// Comprar é por loja; gastar é em qualquer lugar. É por isso que os dois
// provedores escrevem no MESMO registro de entitlement.
//
// Disciplina que vale para TODOS os provedores: sem credencial configurada, a
// rota responde 503 e **não concede nada**. Nunca conceder benefício sem
// conseguir verificar de verdade.

/** SKU da assinatura cosmética trimestral — id do produto de assinatura no Play Console. */
export const SUBSCRIPTION_SKU = 'soulmon_cosmetic_quarterly';

/**
 * O que cada SKU concede. Os ids precisam bater EXATAMENTE com os produtos
 * criados no Google Play Console. Preço e moeda são definidos lá (não aqui) —
 * a loja é a fonte da verdade do valor cobrado.
 */
export const PRODUCTS = {
  // ASSINATURA COSMÉTICA TRIMESTRAL (D10, docs/ASSINATURA-SPEC.md). Não concede
  // tier nem Créditos: o que ela abre é a vitrine do trimestre (bg/furniture), e
  // isso vive em `ent.sub.until`, que só a Google escreve. `grantTier:null` e
  // `grantCredits:0` são travados por teste de catálogo.
  [SUBSCRIPTION_SKU]: { kind: 'subscription', grantTier: null, grantCredits: 0, consumable: false },
  'soulmon.unlock.full': { grantTier: 'paid', grantCredits: 0, consumable: false },
  'soulmon.credits.60': { grantTier: null, grantCredits: 60, consumable: true },
  'soulmon.credits.150': { grantTier: null, grantCredits: 150, consumable: true },
  'soulmon.credits.400': { grantTier: null, grantCredits: 400, consumable: true },
};

/**
 * Steam identifica item por NÚMERO (`itemid` do InitTxn), não por string. Este
 * mapa liga o número ao mesmo produto do catálogo, para os dois provedores
 * concederem exatamente a mesma coisa.
 *
 * O desbloqueio completo NÃO está aqui de propósito: na Steam ele vem da posse
 * do app (a loja cobra pelo jogo), não de uma microtransação — ver
 * `verifySteamOwnership`.
 */
export const STEAM_ITEMS = {
  101: 'soulmon.credits.60',
  102: 'soulmon.credits.150',
  103: 'soulmon.credits.400',
};

// ── OAuth2 via conta de serviço, para a Play (mesmo padrão de workers/fcm.js) ─
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

/** Só para os testes: zera o cache do token da Play entre casos. */
export function _resetPlayTokenCache() {
  cachedToken = null;
  cachedExpiry = 0;
}

// ──────────────────────────────────────────────────────────── Google Play ──

/**
 * Pergunta à Google se a compra existe, está paga e é do nosso pacote.
 *
 * @returns {Promise<{ ok: true, orderId: string, product: object }
 *                 | { ok: false, reason: string, status?: number }>}
 */
export async function verifyPlayPurchase(env, { productId, purchaseToken, saveId }) {
  const rawAccount = env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  const packageName = env.ANDROID_PACKAGE_NAME;
  if (!rawAccount || !packageName) return { ok: false, reason: 'billing-not-configured' };

  // `hasOwn`: "constructor"/"toString" vindos do cliente não podem passar por produto (herança de Object.prototype).
  const product = typeof productId === 'string' && Object.hasOwn(PRODUCTS, productId) ? PRODUCTS[productId] : undefined;
  if (!product) return { ok: false, reason: 'unknown-product' };
  if (!purchaseToken || typeof purchaseToken !== 'string') return { ok: false, reason: 'missing-token' };

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(rawAccount);
  } catch {
    return { ok: false, reason: 'billing-misconfigured' };
  }

  let purchase;
  try {
    const token = await getAccessToken(serviceAccount);
    const endpoint = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
    const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      // 404 = token inexistente/inválido para este produto — compra forjada.
      return { ok: false, reason: 'invalid-purchase', status: res.status };
    }
    purchase = await res.json();
  } catch (err) {
    console.error('billing verify error (play):', String(err?.message ?? err).slice(0, 120));
    return { ok: false, reason: 'verification-failed' };
  }

  // purchaseState: 0 = comprado, 1 = cancelado, 2 = pendente.
  if (purchase.purchaseState !== 0) {
    return { ok: false, reason: 'not-purchased', status: purchase.purchaseState };
  }

  if (!isPlayPurchaseBoundTo(purchase, saveId, env)) {
    return { ok: false, reason: 'account-mismatch' };
  }

  // `consumed`: a Play já marcou o consumível como consumido (créditos gastos/entregues).
  return Object.assign(
    { ok: /** @type {const} */ (true), orderId: `play:${purchase.orderId}`, product },
    { consumed: purchase.consumptionState === 1 },
  );
}

/**
 * A compra da Play pertence a ESTA conta?
 *
 * É a trava que realmente mata a clonagem de conta paga. O registro global de
 * comprovantes (`claimOrder`) é best-effort — o KV é eventualmente consistente
 * e deixa passar o mesmo recibo em contas diferentes. Aqui quem diz de quem é
 * a compra é a própria Google: recibo alheio não vale em conta nenhuma, e isso
 * independe de timing, de região e de o Firebase estar ligado.
 *
 * O cliente tem que chamar `setObfuscatedAccountId(saveId)` ao abrir o fluxo de
 * compra (ver docs/BILLING-SETUP.md). Enquanto o plugin de billing não fizer
 * isso, o campo vem vazio — e aí a recusa só acontece com
 * `PLAY_REQUIRE_ACCOUNT_BINDING === 'true'`, para não derrubar a compra de quem
 * está num app antigo. **Ligue a flag assim que a versão nova estiver no ar.**
 *
 * Função separada e exportada porque `verifyPlayPurchase` precisa de credencial
 * de serviço real para rodar: sem isto, a regra ficaria sem teste.
 */
export function isPlayPurchaseBoundTo(purchase, saveId, env = {}) {
  const bound = purchase?.obfuscatedExternalAccountId;
  if (bound) return !!saveId && String(bound) === String(saveId);
  return env.PLAY_REQUIRE_ACCOUNT_BINDING !== 'true';
}

/**
 * A compra foi reembolsada/cancelada? Usado pela conferência de reembolso.
 *
 * Devolve `null` quando NÃO DEU PARA SABER (sem credencial, rede fora, resposta
 * estranha). Quem chama trata `null` como "mantém o benefício" — na dúvida
 * nunca se tira o que o jogador pagou.
 *
 * @returns {Promise<boolean|null>}
 */
export async function isPlayPurchaseVoided(env, { productId, purchaseToken }) {
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
    // 404 = a Play não conhece mais esse token. Pode ser compra apagada, mas
    // também pode ser mudança de produto/pacote — ambíguo demais para revogar.
    if (!res.ok) return null;
    const purchase = await res.json();
    // purchaseState: 0 = comprado, 1 = cancelado/reembolsado, 2 = pendente.
    if (purchase.purchaseState === 1) return true;
    if (purchase.purchaseState === 0) return false;
    return null;
  } catch (err) {
    console.error('refund check error (play):', String(err?.message ?? err).slice(0, 120));
    return null;
  }
}

// ───────────────────────────────────────────────────── Google Play: assinatura ──
//
// Assinatura NÃO usa `purchases.products`: o recurso é `purchases.subscriptionsv2`
// (mesmo escopo `androidpublisher` e mesma conta de serviço — a spec D10 dizia
// "outro escopo", e estava errada; muda o endpoint e a permissão no Console).
//
// Disciplina (docs/ASSINATURA-SPEC.md, threat-model R1..R10):
//  · a vigência (`until`) é o `expiryTime` que a GOOGLE devolve — nenhum campo do
//    corpo da requisição escreve vigência;
//  · o vínculo com a conta (`obfuscatedExternalAccountId`) é SEMPRE exigido, sem
//    a flag de compatibilidade que o vitalício tem: código novo, sem app antigo;
//  · a chave de unicidade é a RAIZ da cadeia `linkedPurchaseToken`, não o
//    `orderId` de cada renovação — senão toda renovação abriria um claim novo
//    e uma reassinatura/troca de plano abriria uma 2ª conta;
//  · falha de rede/Google = `verification-failed`: nada é concedido nem retirado
//    na dúvida (fail-closed para conceder, conservador para retirar).

const ANDROID_PUBLISHER_APPS = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';

/** Estados em que a pessoa TEM direito à vitrine. `CANCELED` = não renova, mas o pago vai até `expiryTime`. */
export const SUB_ENTITLED_STATES = new Set([
  'SUBSCRIPTION_STATE_ACTIVE',
  'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
  'SUBSCRIPTION_STATE_CANCELED',
]);

/** Quantos elos da cadeia `linkedPurchaseToken` seguimos até a raiz. */
export const SUB_CHAIN_MAX_HOPS = 5;

/** `sha256` hex — a chave da cadeia em `order_claims` não guarda o token cru. */
export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(String(text)));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Token mascarado para log (R9): nunca o valor inteiro. */
export function maskToken(token) {
  const t = String(token ?? '');
  return t.length <= 8 ? '***' : `${t.slice(0, 4)}...${t.slice(-2)}(${t.length})`;
}

/** `play:sub:<sha256 da RAIZ da cadeia>` — a chave única em `order_claims`/`ord:`. */
export async function subscriptionOrderId(rootToken) {
  return `play:sub:${await sha256Hex(rootToken)}`;
}

function playSubConfig(env) {
  const rawAccount = env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  const packageName = env.ANDROID_PACKAGE_NAME;
  if (!rawAccount || !packageName) return { error: 'billing-not-configured' };
  try {
    return { serviceAccount: JSON.parse(rawAccount), packageName };
  } catch {
    return { error: 'billing-misconfigured' };
  }
}

/**
 * GET `purchases.subscriptionsv2/tokens/{token}`.
 *
 * @returns {Promise<{ ok: true, sub: any }
 *                 | { ok: false, reason: string, status?: number }>}
 */
export async function fetchSubscriptionV2(env, purchaseToken) {
  const cfg = playSubConfig(env);
  if (cfg.error) return { ok: false, reason: cfg.error };
  if (!purchaseToken || typeof purchaseToken !== 'string') return { ok: false, reason: 'missing-token' };
  try {
    const token = await getAccessToken(cfg.serviceAccount);
    const res = await fetch(
      `${ANDROID_PUBLISHER_APPS}/${encodeURIComponent(cfg.packageName)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    // 400/404/410 = a Google não conhece (mais) esse token. 5xx/429 = problema DELA.
    if (res.status === 400 || res.status === 404 || res.status === 410) {
      return { ok: false, reason: 'invalid-purchase', status: res.status };
    }
    if (!res.ok) return { ok: false, reason: 'verification-failed', status: res.status };
    const sub = await res.json().catch(() => null);
    if (!sub || typeof sub !== 'object') return { ok: false, reason: 'verification-failed' };
    return { ok: true, sub };
  } catch (err) {
    console.error('billing verify error (play sub):', String(err?.message ?? err).slice(0, 120));
    return { ok: false, reason: 'verification-failed' };
  }
}

/**
 * Sobe a cadeia `linkedPurchaseToken` até a raiz (no máx. `SUB_CHAIN_MAX_HOPS`).
 * Erro TRANSITÓRIO num elo aborta (não adivinha raiz: duas raízes diferentes
 * para a mesma cadeia abririam dois claims). 404/410 num elo antigo = a Google
 * esqueceu; aquele token É a raiz.
 *
 * @returns {Promise<{ ok: true, rootToken: string } | { ok: false, reason: string }>}
 */
export async function resolveSubscriptionRoot(env, purchaseToken, firstSub) {
  let token = purchaseToken;
  let sub = firstSub;
  for (let hop = 0; hop < SUB_CHAIN_MAX_HOPS; hop++) {
    const linked = sub?.linkedPurchaseToken;
    if (!linked || typeof linked !== 'string' || linked === token) return { ok: true, rootToken: token };
    const up = await fetchSubscriptionV2(env, linked);
    if (up.ok) { token = linked; sub = up.sub; continue; }
    if (up.reason === 'invalid-purchase') return { ok: true, rootToken: linked };
    return { ok: false, reason: up.reason };
  }
  // Cadeia anormalmente longa: recusa em vez de truncar a raiz.
  return { ok: false, reason: 'verification-failed' };
}

/**
 * Lê o recurso da Google e devolve o que importa — função PURA (testável sem rede).
 *
 * @param {any} sub
 * @param {{ saveId?: string, now?: number }} [opts]
 * @returns {{ ok: true, entitled: boolean, state: string, until: number, test: boolean, ackPending: boolean }
 *          | { ok: false, reason: string }}
 */
export function interpretSubscription(sub, { saveId, now = Date.now() } = {}) {
  const items = Array.isArray(sub?.lineItems) ? sub.lineItems.filter(li => li?.productId === SUBSCRIPTION_SKU) : [];
  if (items.length === 0) return { ok: false, reason: 'unknown-product' };

  // R6 — SEM trial. Oferta = fase promocional/grátis que o Console não deveria ter.
  // Não concedemos "a mais" por ela (ver BILLING-SETUP: não crie ofertas).
  if (items.some(li => li?.offerDetails?.offerId)) return { ok: false, reason: 'offer-not-allowed' };

  const bound = sub?.externalAccountIdentifiers?.obfuscatedExternalAccountId;
  if (!bound || !saveId || String(bound) !== String(saveId)) return { ok: false, reason: 'account-mismatch' };

  const state = String(sub?.subscriptionState ?? '');
  const expiries = items.map(li => Date.parse(li?.expiryTime)).filter(Number.isFinite);
  const expiry = expiries.length ? Math.max(...expiries) : 0;
  const entitled = SUB_ENTITLED_STATES.has(state) && expiry > now;
  return {
    ok: true,
    entitled,
    state,
    until: entitled ? expiry : Math.min(expiry, now),
    test: !!sub?.testPurchase,
    ackPending: sub?.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING',
  };
}

/**
 * Verifica uma assinatura vinda do app. Só devolve `ok:true` se a Google diz que
 * está VIGENTE, do nosso SKU e DESTA conta.
 *
 * @returns {Promise<{ ok: true, orderId: string, product: any, subscription: any }
 *                 | { ok: false, reason: string, status?: number }>}
 */
export async function verifyPlaySubscription(env, { purchaseToken, saveId }) {
  const got = await fetchSubscriptionV2(env, purchaseToken);
  if (!got.ok) return got;

  const read = interpretSubscription(got.sub, { saveId });
  if (!read.ok) return read;
  if (!read.entitled) return { ok: false, reason: 'not-active' };

  const root = await resolveSubscriptionRoot(env, purchaseToken, got.sub);
  if (!root.ok) return root;

  return {
    ok: true,
    orderId: await subscriptionOrderId(root.rootToken),
    product: PRODUCTS[SUBSCRIPTION_SKU],
    subscription: { ...read, rootToken: root.rootToken },
  };
}

/**
 * Reconhece a assinatura NO SERVIDOR (a Play estorna em 3 dias o que ninguém
 * reconheceu; app fechado entre o verify e o ack é o caso real). Idempotente:
 * só chama se a Google diz `PENDING`, e o ack repetido não é erro.
 * Falha aqui NÃO desfaz nada — o cliente e o RTDN reconciliam.
 *
 * @returns {Promise<boolean>} true = reconhecida ou já estava.
 */
export async function acknowledgePlaySubscription(env, { purchaseToken, ackPending = true }) {
  if (!ackPending) return true;
  const cfg = playSubConfig(env);
  if (cfg.error) return false;
  try {
    const token = await getAccessToken(cfg.serviceAccount);
    const res = await fetch(
      `${ANDROID_PUBLISHER_APPS}/${encodeURIComponent(cfg.packageName)}/purchases/subscriptions/${encodeURIComponent(SUBSCRIPTION_SKU)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' },
    );
    // 400 "already acknowledged" é o estado desejado.
    if (res.ok || res.status === 400) return true;
    console.error('billing ack error (play sub):', res.status, maskToken(purchaseToken));
    return false;
  } catch (err) {
    console.error('billing ack error (play sub):', String(err?.message ?? err).slice(0, 120), maskToken(purchaseToken));
    return false;
  }
}

// ────────────────────────────────────────────────────────────────── Steam ──
//
// ⚠️ ANTES DE LIGAR: confira os nomes/versões das interfaces na documentação
// atual do Steamworks (Valve versiona as interfaces e já mudou algumas). O
// FORMATO da resposta é sempre `{ response: { params: {...}, result? } }`, mas
// o número da versão no path pode mudar. Nada aqui foi testado contra a Valve —
// não existe App ID ainda (ver desktop/STEAM.md).

const STEAM_PARTNER = 'https://partner.steam-api.com';
const STEAM_PUBLIC = 'https://api.steampowered.com';

function steamConfig(env) {
  const key = env.STEAM_PUBLISHER_KEY;
  const appId = env.STEAM_APP_ID;
  return key && appId ? { key, appId } : null;
}

/**
 * Valida o *session ticket* que o cliente Steam emitiu para este app e devolve
 * o SteamID de quem está rodando.
 *
 * Por que não confiar no SteamID que o cliente manda: ele é público. Qualquer
 * um poderia mandar o SteamID de outra pessoa e herdar o benefício dela. O
 * ticket é assinado pela Valve e só o dono da sessão consegue produzir.
 *
 * @returns {Promise<{ ok: true, steamId: string, ownerSteamId: string }
 *                 | { ok: false, reason: string }>}
 */
async function authenticateSteamTicket({ key, appId }, ticket) {
  const url = `${STEAM_PARTNER}/ISteamUserAuth/AuthenticateUserTicket/v1/`
    + `?key=${encodeURIComponent(key)}&appid=${encodeURIComponent(appId)}&ticket=${encodeURIComponent(ticket)}`;
  const res = await fetch(url);
  if (!res.ok) return { ok: false, reason: 'steam-unreachable' };
  const data = await res.json().catch(() => null);
  const params = data?.response?.params;
  if (data?.response?.error || !params || params.result !== 'OK') {
    return { ok: false, reason: 'invalid-ticket' };
  }
  if (params.publisherbanned) return { ok: false, reason: 'banned' };
  // `ownersteamid` é o dono da licença (difere de `steamid` em Family Sharing).
  return { ok: true, steamId: String(params.steamid), ownerSteamId: String(params.ownersteamid ?? params.steamid) };
}

/**
 * Posse do app na Steam → tier pago.
 *
 * Na Steam o "desbloqueio completo" não é uma microtransação: a própria loja
 * cobra pelo app. Quem tem o app é `paid`.
 *
 * ## Family Sharing (a parte que importa)
 *
 * Em Family Sharing o ticket traz `steamid` (quem está jogando) DIFERENTE de
 * `ownersteamid` (quem comprou). Checar a posse no dono e conceder mesmo assim
 * seria um furo: o tier é gravado na conta Soulmon de QUEM PEDIU, então cada
 * amigo com acesso à biblioteca ganharia uma conta paga própria a partir de
 * uma compra só.
 *
 * Por isso exigimos `steamid === ownersteamid`: só o dono da licença ganha o
 * tier. Quem pegou emprestado joga (a Steam permite), mas não herda a compra.
 *
 * Isso ainda não impede o DONO de logar com 10 e-mails diferentes e criar 10
 * contas pagas — essa metade é resolvida em `claimSteamLicense`
 * (_entitlements.js), que amarra a licença a uma conta só.
 *
 * @returns {Promise<{ ok: true, orderId: string, product: object, licenseKey: string }
 *                 | { ok: false, reason: string }>}
 */
export async function verifySteamOwnership(env, { ticket }) {
  const cfg = steamConfig(env);
  if (!cfg) return { ok: false, reason: 'billing-not-configured' };
  if (!ticket || typeof ticket !== 'string') return { ok: false, reason: 'missing-token' };

  let auth;
  try {
    auth = await authenticateSteamTicket(cfg, ticket);
  } catch (err) {
    console.error('billing verify error (steam ticket):', String(err?.message ?? err).slice(0, 120));
    return { ok: false, reason: 'verification-failed' };
  }
  if (!auth.ok) return auth;

  // Family Sharing: está jogando com a licença de outra pessoa. Pode jogar,
  // mas não herda a compra (ver o bloco de doc acima).
  if (auth.steamId !== auth.ownerSteamId) return { ok: false, reason: 'family-shared' };

  let owns = false;
  try {
    const url = `${STEAM_PUBLIC}/ISteamUser/CheckAppOwnership/v2/`
      + `?key=${encodeURIComponent(cfg.key)}&steamid=${encodeURIComponent(auth.steamId)}&appid=${encodeURIComponent(cfg.appId)}`;
    const res = await fetch(url);
    if (!res.ok) return { ok: false, reason: 'verification-failed' };
    const data = await res.json().catch(() => null);
    owns = data?.appownership?.ownsapp === true;
  } catch (err) {
    console.error('billing verify error (steam ownership):', String(err?.message ?? err).slice(0, 120));
    return { ok: false, reason: 'verification-failed' };
  }
  if (!owns) return { ok: false, reason: 'not-purchased' };

  // orderId estável por (dono, app): reprocessar é idempotente pelo mesmo
  // mecanismo de replay das compras da Play. `licenseKey` é o mesmo valor,
  // usado para amarrar a licença a UMA conta Soulmon (claimSteamLicense).
  const licenseKey = `steam:own:${cfg.appId}:${auth.steamId}`;
  return {
    ok: true,
    orderId: licenseKey,
    licenseKey,
    product: PRODUCTS['soulmon.unlock.full'],
  };
}

/**
 * Microtransação da Steam (pacote de créditos) já finalizada pelo cliente.
 * Consultamos a Valve pelo `orderid` e só creditamos se o status for
 * `Succeeded`.
 *
 * `productId` sai daqui (a Steam é quem diz qual item foi comprado); no caminho
 * da Play quem informa é o cliente. `billing.js` escolhe a origem por provider.
 *
 * @returns {Promise<{ ok: true, orderId: string, product: object, productId: string }
 *                 | { ok: false, reason: string }>}
 */
export async function verifySteamPurchase(env, { orderId, ticket }) {
  const cfg = steamConfig(env);
  if (!cfg) return { ok: false, reason: 'billing-not-configured' };
  if (!orderId || !/^\d{1,32}$/.test(String(orderId))) return { ok: false, reason: 'missing-token' };
  if (!ticket) return { ok: false, reason: 'missing-ticket' };

  // O `orderid` NÃO é uma credencial: quem gera é o parceiro (contador ou
  // timestamp), então ids vizinhos são adivinháveis. Sem amarrar a transação a
  // quem está pedindo, dava para varrer o espaço de ids e resgatar a compra de
  // outro jogador antes dele — ele pagava a Valve e não recebia nada.
  //
  // Mesma razão pela qual verifySteamOwnership exige ticket: o SteamID é
  // público, o ticket é assinado pela Valve e só o dono da sessão produz.
  // O try/catch é o MESMO de verifySteamOwnership, e a ausência dele aqui era
  // uma assimetria com consequência: `authenticateSteamTicket` faz `fetch`, e
  // com a Valve inalcançável (DNS, TLS, timeout) a exceção subia por esta
  // função até `onRequestPost` — que não tem try/catch. O jogador recebia um
  // 500 cru da Cloudflare em vez de `502 verification-failed`. Falha fechado
  // nos dois casos (nada é concedido), mas o irmão já sabia responder direito.
  let auth;
  try {
    auth = await authenticateSteamTicket(cfg, ticket);
  } catch (err) {
    console.error('billing verify error (steam ticket):', String(err?.message ?? err).slice(0, 120));
    return { ok: false, reason: 'verification-failed' };
  }
  if (!auth.ok) return { ok: false, reason: auth.reason };

  let params;
  try {
    const url = `${STEAM_PARTNER}/ISteamMicroTxn/QueryTxn/v3/`
      + `?key=${encodeURIComponent(cfg.key)}&appid=${encodeURIComponent(cfg.appId)}&orderid=${encodeURIComponent(orderId)}`;
    const res = await fetch(url);
    if (!res.ok) return { ok: false, reason: 'invalid-purchase' };
    const data = await res.json().catch(() => null);
    params = data?.response?.params;
  } catch (err) {
    console.error('billing verify error (steam txn):', String(err?.message ?? err).slice(0, 120));
    return { ok: false, reason: 'verification-failed' };
  }
  if (!params) return { ok: false, reason: 'invalid-purchase' };
  if (params.status !== 'Succeeded') return { ok: false, reason: 'not-purchased' };

  // A trava: a transação tem que ser DESTA sessão. O QueryTxn já devolve de
  // quem ela é — antes esse campo era lido para os itens e o dono era jogado
  // fora.
  if (String(params.steamid ?? '') !== auth.steamId) {
    return { ok: false, reason: 'not-purchased' };
  }

  const items = Array.isArray(params.items) ? params.items : [];
  if (items.length !== 1) {
    // Uma transação = um pacote. Mais de um item significaria um fluxo de
    // compra que este servidor não sabe converter em crédito — recusar é
    // melhor do que adivinhar e creditar errado.
    return { ok: false, reason: 'unsupported-transaction' };
  }
  const productId = STEAM_ITEMS[Number(items[0].itemid)];
  const product = productId ? PRODUCTS[productId] : undefined;
  if (!product) return { ok: false, reason: 'unknown-product' };

  return { ok: true, orderId: `steam:txn:${params.orderid ?? orderId}`, product, productId };
}

/**
 * O jogador ainda possui o app na Steam? Cobre o reembolso do JOGO (que é de
 * onde vem o tier pago na Steam), não de uma microtransação.
 *
 * Não precisa de session ticket: o ticket só serve para DESCOBRIR o SteamID, e
 * ele já está gravado no próprio `orderId` da licença
 * (`steam:own:<appid>:<steamid>`, ver verifySteamOwnership). Com o SteamID em
 * mãos, `CheckAppOwnership` responde a qualquer momento.
 *
 * @returns {Promise<boolean|null>} `true` = não possui mais (reembolsou).
 */
export async function isSteamOwnershipVoided(env, { orderId }) {
  const cfg = steamConfig(env);
  const match = /^steam:own:(\d{1,32}):(\d{1,32})$/.exec(String(orderId ?? ''));
  if (!cfg || !match) return null;
  const steamId = match[2];

  try {
    const url = `${STEAM_PUBLIC}/ISteamUser/CheckAppOwnership/v2/`
      + `?key=${encodeURIComponent(cfg.key)}&steamid=${encodeURIComponent(steamId)}&appid=${encodeURIComponent(cfg.appId)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const owns = data?.appownership?.ownsapp;
    if (owns === true) return false;
    if (owns === false) return true;
    return null;
  } catch (err) {
    console.error('refund check error (steam ownership):', String(err?.message ?? err).slice(0, 120));
    return null;
  }
}

/**
 * A microtransação da Steam foi reembolsada? Reembolso na Steam muda o status
 * da transação (`Refunded` / `PartialRefund` / `Chargeback`).
 *
 * Devolve `null` quando não deu para saber — quem chama mantém o benefício.
 *
 * @returns {Promise<boolean|null>}
 */
export async function isSteamPurchaseVoided(env, { orderId }) {
  const cfg = steamConfig(env);
  const raw = String(orderId ?? '').replace(/^steam:txn:/, '');
  if (!cfg || !/^\d{1,32}$/.test(raw)) return null;

  try {
    const url = `${STEAM_PARTNER}/ISteamMicroTxn/QueryTxn/v3/`
      + `?key=${encodeURIComponent(cfg.key)}&appid=${encodeURIComponent(cfg.appId)}&orderid=${encodeURIComponent(raw)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const status = data?.response?.params?.status;
    if (!status) return null;
    if (status === 'Succeeded') return false;
    return ['Refunded', 'PartialRefund', 'Chargeback', 'Failed'].includes(status);
  } catch (err) {
    console.error('refund check error (steam):', String(err?.message ?? err).slice(0, 120));
    return null;
  }
}
