// Autenticação do Pub/Sub PUSH (RTDN da Google Play).
//
// Uma assinatura de push "autenticada" faz o Pub/Sub mandar, em cada entrega,
// `Authorization: Bearer <JWT OIDC>` assinado pela Google (RS256) em nome da
// SERVICE ACCOUNT DE PUSH que o dono configurou na assinatura. Sem conferir
// isso, `POST /api/rtdn` seria um endpoint público que qualquer um aciona —
// e cada acionamento custa uma chamada à quota da Play.
//
// O que é conferido (e por quê):
//   · assinatura RS256 contra o JWKS da Google (`oauth2/v3/certs`);
//   · `iss`  = accounts.google.com  (quem emitiu);
//   · `aud`  = RTDN_AUDIENCE        (o JWT foi emitido PARA este endpoint: um
//                                    token de outro serviço não serve aqui);
//   · `email`= RTDN_PUSH_SA_EMAIL e `email_verified` (a conta de push NOSSA —
//                                    outro projeto Google também assina com a
//                                    mesma chave, então `aud` sozinho não basta);
//   · `exp`/`iat`.
// O corpo da mensagem NUNCA é confiado depois disso: ele só dispara uma nova
// consulta à Google (ver rtdn.js).
//
// Referência: https://cloud.google.com/pubsub/docs/authenticate-push-subscriptions

const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);
const FORCE_MIN_GAP_MS = 60_000;

let cache = null;
let cacheExpiry = 0;
let cacheFetchedAt = 0;

/** Só para os testes. */
export function _resetPubsubJwksCache() {
  cache = null;
  cacheExpiry = 0;
  cacheFetchedAt = 0;
}

async function getJwks(force = false) {
  const now = Date.now();
  if (cache && now < cacheExpiry && !force) return cache;
  if (cache && force && now - cacheFetchedAt < FORCE_MIN_GAP_MS) return cache;
  try {
    const res = await fetch(JWKS_URL);
    if (!res.ok) throw new Error(`jwks ${res.status}`);
    const data = await res.json();
    const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] ?? 3600);
    cache = data.keys || [];
    cacheExpiry = now + maxAge * 1000;
    cacheFetchedAt = now;
    return cache;
  } catch (err) {
    if (cache) { cacheFetchedAt = now; cacheExpiry = now + FORCE_MIN_GAP_MS; return cache; }
    throw err;
  }
}

function b64urlToBytes(s) {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Variáveis exigidas. Sem elas o endpoint recusa tudo (fail-closed). */
export function pubsubAuthConfigured(env) {
  return !!(env?.RTDN_AUDIENCE && env?.RTDN_PUSH_SA_EMAIL);
}

/**
 * @returns {Promise<boolean>} `true` só com JWT válido da conta de push configurada.
 *   NUNCA lança, e nunca loga o JWT.
 */
export async function verifyPubsubPush(request, env, now = Math.floor(Date.now() / 1000)) {
  try {
    if (!pubsubAuthConfigured(env)) return false;
    const header = request.headers.get('Authorization') ?? '';
    if (!header.startsWith('Bearer ')) return false;
    const jwt = header.slice('Bearer '.length).trim();
    const parts = jwt.split('.');
    if (parts.length !== 3) return false;

    const dec = new TextDecoder();
    const head = JSON.parse(dec.decode(b64urlToBytes(parts[0])));
    const payload = JSON.parse(dec.decode(b64urlToBytes(parts[1])));
    if (head.alg !== 'RS256' || !head.kid) return false;

    if (!ISSUERS.has(payload.iss)) return false;
    if (payload.aud !== env.RTDN_AUDIENCE) return false;
    if (payload.email_verified !== true) return false;
    if (String(payload.email ?? '').toLowerCase() !== String(env.RTDN_PUSH_SA_EMAIL).toLowerCase()) return false;
    if (typeof payload.exp !== 'number' || payload.exp <= now) return false;
    if (typeof payload.iat === 'number' && payload.iat > now + 300) return false;

    let jwk = (await getJwks()).find(k => k.kid === head.kid);
    if (!jwk) jwk = (await getJwks(true)).find(k => k.kid === head.kid);
    if (!jwk) return false;

    const key = await crypto.subtle.importKey(
      'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'],
    );
    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
  } catch {
    return false;
  }
}
