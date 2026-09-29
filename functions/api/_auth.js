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

import { gateTombstone } from './_accountTombstone.js';

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
 * Verifica um ID token do Firebase. Retorna `{ email, authTime }` quando
 * válido, ou null. NUNCA lança — quem chama trata null como "não autenticado".
 *
 * `authTime` é o claim `auth_time` (segundos, epoch) — o instante em que a
 * pessoa fez LOGIN, não o em que o token foi renovado (`iat`). É o que a
 * lápide de conta apagada usa para distinguir "aparelho esquecido com sessão
 * antiga" (bloqueia, 410) de "a pessoa voltou e logou de novo" (reabre). Um
 * token sem `auth_time` numérico é tratado como login de sempre (`0`): nunca
 * reabre nada, que é o lado seguro.
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

    return {
      email: normalizeEmail(payload.email),
      authTime: typeof payload.auth_time === 'number' && Number.isFinite(payload.auth_time) ? payload.auth_time : 0,
    };
  } catch {
    return null;
  }
}

/**
 * A normalização de e-mail, num lugar só: `trim` + minúsculas, e NADA mais
 * (ponto do Gmail e `+tag` contam — são outra conta para o Firebase). Quem
 * compara e-mail (o saveId, a lista de admin em `_admin.js`) usa esta, para as
 * duas réguas nunca divergirem (footgun 9).
 */
export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

/** `Authorization: Bearer <x>` → `x`, ou null. */
export function bearerToken(request) {
  const auth = request?.headers?.get?.('Authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

/**
 * Mesmo derivador de saveId usado no cliente (src/utils/cloudSave.ts).
 * ATENÇÃO: o `.slice(0, 32)` precisa bater EXATAMENTE com o do cliente — sem
 * ele o hash tem 64 caracteres, a comparação nunca casa e todo usuário
 * autenticado tomaria 403.
 */
export async function emailToSaveId(email) {
  const data = new TextEncoder().encode(`soulmon:${normalizeEmail(email)}`);
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
 * LÁPIDE (QA rodada 2, `01-seguranca-r2` §1.3 e `04-dados-r2` §0): a conta
 * apagada é conferida AQUI, e não em cada rota, porque a rodada 1 pôs o 410
 * só em `save.js` e o cliente recriou `profile:`/`pid:` pelo `community.js`
 * 3 s depois da exclusão. Toda rota que autoriza "em nome de `saveId`" passa
 * por esta função — então toda rota herda o 410. A conferência vem DEPOIS da
 * autorização: quem não é o dono não descobre daqui que a conta existiu.
 * Reabertura: login (`auth_time`) posterior à lápide = a pessoa voltou; a
 * lápide sai e a chamada segue (`gateTombstone`). Sem projectId não há
 * `auth_time`, logo lápide vigente sempre bloqueia.
 *
 * @returns {Promise<{ ok: true, enforced: boolean, email?: string, authTime?: number,
 *                     tombstone: { deleted: boolean, reopened: boolean, at?: number } }
 *                 | { ok: false, enforced: boolean, status: 401 | 403 | 410,
 *                     reason: 'unauthenticated' | 'forbidden' | 'account-deleted', deletedAt?: number }>}
 */
export async function authorizeSaveAccess(request, env, saveId) {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    const tombstone = await gateTombstone(env, saveId, 0);
    if (tombstone.deleted) return { ok: false, enforced: false, status: 410, reason: 'account-deleted', deletedAt: tombstone.at };
    return { ok: true, enforced: false, tombstone };
  }

  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const claims = await verifyIdToken(token, projectId);
  if (!claims) return { ok: false, enforced: true, status: 401, reason: 'unauthenticated' };

  const expected = await emailToSaveId(claims.email);
  if (expected !== saveId) return { ok: false, enforced: true, status: 403, reason: 'forbidden' };

  const tombstone = await gateTombstone(env, saveId, claims.authTime);
  if (tombstone.deleted) return { ok: false, enforced: true, status: 410, reason: 'account-deleted', deletedAt: tombstone.at };

  return { ok: true, enforced: true, email: claims.email, authTime: claims.authTime, tombstone };
}

/** Status HTTP de uma recusa de `authorizeSaveAccess` — um lugar só para o mapa. */
export function authStatus(auth) {
  if (typeof auth?.status === 'number') return auth.status;
  if (auth?.reason === 'account-deleted') return 410;
  return auth?.reason === 'forbidden' ? 403 : 401;
}

/**
 * Autoriza uma operação **DESTRUTIVA ou de EXPORTAÇÃO TOTAL** sobre um saveId.
 *
 * Existe separada de `authorizeSaveAccess` de propósito. Aquela é **fail-open**
 * por decisão de migração (`if (!projectId) return { ok: true }`): sem
 * `FIREBASE_PROJECT_ID` ela aceita qualquer chamada, para não derrubar os
 * usuários atuais. Isso é tolerável num save que o cliente já reescreve
 * sozinho; **não é tolerável numa rota que APAGA ou que DESPEJA o dado inteiro
 * da pessoa.** O `saveId` é derivado do e-mail por um algoritmo público — com
 * fail-open, "excluir conta" vira "destruir a conta de quem eu souber o
 * e-mail", e "exportar" vira "baixar a vida de quem eu souber o e-mail".
 *
 * Por isso aqui é **FAIL-CLOSED**, no mesmo espírito de `requirePaidTier`:
 * autorização indeterminável RECUSA. Consequência declarada e aceita — enquanto
 * `FIREBASE_PROJECT_ID` estiver desligado, exportação e exclusão respondem
 * **503 `auth-unavailable`** e ficam INDISPONÍVEIS. Indisponível é melhor que
 * perigosa: a rota volta a existir junto com o login, sem tocar nesta variável.
 *
 * @returns {Promise<{ ok: true, email: string }
 *                 | { ok: false, status: number, reason: 'auth-unavailable' | 'unauthenticated' | 'forbidden' }>}
 */
export async function requireVerifiedOwner(request, env, saveId) {
  const projectId = env?.FIREBASE_PROJECT_ID;
  if (!projectId) return { ok: false, status: 503, reason: 'auth-unavailable' };

  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  let claims = null;
  try {
    claims = await verifyIdToken(token, projectId);
  } catch {
    // `verifyIdToken` promete não lançar, mas a rede do JWK pode. Dúvida nega.
    return { ok: false, status: 503, reason: 'auth-unavailable' };
  }
  if (!claims) return { ok: false, status: 401, reason: 'unauthenticated' };

  const expected = await emailToSaveId(claims.email);
  // Comparação de tamanho fixo (32 hex dos dois lados) — sem early-return por
  // caractere, para não transformar o 403 num oráculo de prefixo do saveId.
  if (expected.length !== String(saveId).length) {
    return { ok: false, status: 403, reason: 'forbidden' };
  }
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ String(saveId).charCodeAt(i);
  if (diff !== 0) return { ok: false, status: 403, reason: 'forbidden' };

  return { ok: true, email: claims.email };
}
