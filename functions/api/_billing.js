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

/**
 * O que cada SKU concede. Os ids precisam bater EXATAMENTE com os produtos
 * criados no Google Play Console. Preço e moeda são definidos lá (não aqui) —
 * a loja é a fonte da verdade do valor cobrado.
 */
export const PRODUCTS = {
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
export async function verifyPlayPurchase(env, { productId, purchaseToken }) {
  const rawAccount = env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  const packageName = env.ANDROID_PACKAGE_NAME;
  if (!rawAccount || !packageName) return { ok: false, reason: 'billing-not-configured' };

  const product = PRODUCTS[productId];
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
    console.error('billing verify error (play):', err);
    return { ok: false, reason: 'verification-failed' };
  }

  // purchaseState: 0 = comprado, 1 = cancelado, 2 = pendente.
  if (purchase.purchaseState !== 0) {
    return { ok: false, reason: 'not-purchased', status: purchase.purchaseState };
  }
  return { ok: true, orderId: `play:${purchase.orderId}`, product };
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
    console.error('refund check error (play):', err);
    return null;
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
    console.error('billing verify error (steam ticket):', err);
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
    console.error('billing verify error (steam ownership):', err);
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
 * @returns {Promise<{ ok: true, orderId: string, product: object }
 *                 | { ok: false, reason: string }>}
 */
export async function verifySteamPurchase(env, { orderId }) {
  const cfg = steamConfig(env);
  if (!cfg) return { ok: false, reason: 'billing-not-configured' };
  if (!orderId || !/^\d{1,32}$/.test(String(orderId))) return { ok: false, reason: 'missing-token' };

  let params;
  try {
    const url = `${STEAM_PARTNER}/ISteamMicroTxn/QueryTxn/v3/`
      + `?key=${encodeURIComponent(cfg.key)}&appid=${encodeURIComponent(cfg.appId)}&orderid=${encodeURIComponent(orderId)}`;
    const res = await fetch(url);
    if (!res.ok) return { ok: false, reason: 'invalid-purchase' };
    const data = await res.json().catch(() => null);
    params = data?.response?.params;
  } catch (err) {
    console.error('billing verify error (steam txn):', err);
    return { ok: false, reason: 'verification-failed' };
  }
  if (!params) return { ok: false, reason: 'invalid-purchase' };
  if (params.status !== 'Succeeded') return { ok: false, reason: 'not-purchased' };

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
 * A microtransação da Steam foi reembolsada? Reembolso na Steam muda o status
 * da transação (`Refunded` / `PartialRefund` / `Chargeback`).
 *
 * Devolve `null` quando não deu para saber — quem chama mantém o benefício.
 *
 * ⚠️ Não cobre o tier pago vindo da POSSE do app: se o jogador reembolsar o
 * jogo na Steam, a posse deixa de existir e a próxima conferência precisa
 * reconsultar `CheckAppOwnership`. Isso exige o session ticket, que só existe
 * com o app aberto — está registrado como pendência no plano.
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
    console.error('refund check error (steam):', err);
    return null;
  }
}
