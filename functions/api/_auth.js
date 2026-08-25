// Autenticação — verificação de ID token do Firebase Auth.
//
// Problema que isto resolve: o `saveId` é o hash do e-mail. Sem prova de que a
// pessoa REALMENTE é dona daquele e-mail, qualquer um que o conheça consegue
// ler e sobrescrever o save alheio. Aqui o cliente passa a mandar um ID token
// assinado pelo Google, e o servidor confere a assinatura antes de aceitar.
//
// Verificamos o token à mão (firebase-admin não roda em Workers), usando o
// endpoint JWK do Google — que o WebCrypto importa direto, sem precisar
// destrinchar certificado X.509 na unha.
//
// Referência: https://firebase.google.com/docs/auth/admin/verify-id-tokens

const JWK_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let jwksCache = null;
let jwksExpiry = 0;

async function getJwks() {
  const now = Date.now();
  if (jwksCache && now < jwksExpiry) return jwksCache;
  const res = await fetch(JWK_URL);
  if (!res.ok) throw new Error(`jwks fetch failed: ${res.status}`);
  const data = await res.json();
  // As chaves rotacionam — respeita o max-age informado pelo Google.
  const cc = res.headers.get('cache-control') || '';
  const maxAge = Number(/max-age=(\d+)/.exec(cc)?.[1] ?? 3600);
  jwksCache = data.keys || [];
  jwksExpiry = now + maxAge * 1000;
  return jwksCache;
}

function b64urlToBytes(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Verifica um ID token do Firebase. Retorna { email } quando válido, ou null.
 * NUNCA lança — quem chama trata null como "não autenticado".
 */
export async function verifyIdToken(idToken, projectId) {
  try {
    if (!idToken || !projectId) return null;
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;

    const dec = new TextDecoder();
    const header = JSON.parse(dec.decode(b64urlToBytes(parts[0])));
    const payload = JSON.parse(dec.decode(b64urlToBytes(parts[1])));

    if (header.alg !== 'RS256' || !header.kid) return null;

    const now = Math.floor(Date.now() / 1000);
    if (payload.aud !== projectId) return null;
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (typeof payload.exp !== 'number' || payload.exp <= now) return null;
    // Tolera 5min de relógio adiantado, mas rejeita token "do futuro".
    if (typeof payload.iat !== 'number' || payload.iat > now + 300) return null;
    // Sem e-mail confirmado não há prova de posse — que é justamente o ponto.
    if (!payload.email || payload.email_verified !== true) return null;

    const jwks = await getJwks();
    const jwk = jwks.find(k => k.kid === header.kid);
    if (!jwk) return null;

    const key = await crypto.subtle.importKey(
      'jwk', jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'],
    );
    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', key,
      b64urlToBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!ok) return null;

    return { email: String(payload.email).trim().toLowerCase() };
  } catch {
    return null;
  }
}

/**
 * Mesmo derivador de saveId usado no cliente (src/utils/cloudSave.ts).
 * ATENÇÃO: o `.slice(0, 32)` precisa bater EXATAMENTE com o do cliente — sem
 * ele o hash tem 64 caracteres, a comparação nunca casa e todo usuário
 * autenticado tomaria 403.
 */
export async function emailToSaveId(email) {
  const data = new TextEncoder().encode(`soulmon:${email.trim().toLowerCase()}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

/**
 * Autoriza uma operação sobre um saveId.
 *
 * Modo estrito (FIREBASE_PROJECT_ID configurado): exige um Bearer token válido
 * cujo e-mail derive exatamente o saveId pedido.
 *
 * Modo aberto (sem FIREBASE_PROJECT_ID): aceita, para não derrubar os usuários
 * atuais no meio da migração. Ligue a variável assim que a versão com login
 * estiver publicada — enquanto ela estiver ausente, a proteção NÃO está ativa.
 *
 * @returns {Promise<{ ok: true, enforced: boolean, email?: string }
 *                 | { ok: false, enforced: true, reason: 'unauthenticated' | 'forbidden' }>}
 */
export async function authorizeSaveAccess(request, env, saveId) {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) return { ok: true, enforced: false };

  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const claims = await verifyIdToken(token, projectId);
  if (!claims) return { ok: false, enforced: true, reason: 'unauthenticated' };

  const expected = await emailToSaveId(claims.email);
  if (expected !== saveId) return { ok: false, enforced: true, reason: 'forbidden' };

  return { ok: true, enforced: true, email: claims.email };
}
