// BETA-FULL (decisão do dono, 18/10/2026): e-mail da allowlist `BETA_EMAILS` entra
// como se JÁ tivesse o plano pago (versão cheia, Soulmon próprio), sem comprar.
//
// Mesmo desenho do papel de admin (`_admin.js`): o efeito é DERIVADO NA LEITURA, a
// partir de um ID token VERIFICADO (assinatura, aud, iss, exp e `email_verified ===
// true`, tudo em `verifyIdToken`). NUNCA é gravado em `ent:<saveId>` — por isso
//   · tirar o e-mail da lista revoga na próxima leitura;
//   · `reconcilePurchases`/restaurar compra não revogam nem duplicam nada (o registro
//     de cobrança continua dizendo só o que foi pago);
//   · uma compra real depois soma por cima sem conflito (tier já é `paid`).
// Fail-closed: sem projeto Firebase, sem lista, sem token válido, e-mail fora da lista
// ou token de OUTRO save → não é beta-full. Nada vem do corpo nem de cabeçalho do
// cliente além do Bearer token. Sem PII nos logs (nem e-mail, nem saveId).

import { verifyIdToken, emailToSaveId, bearerToken } from './_auth.js';
import { betaAllows, parseBetaEmails } from './_betaAccess.js';

/**
 * @param {any} env
 * @param {Request} request
 * @param {string} [saveId] quando vem, o token tem de ser DO DONO daquele save.
 * @returns {Promise<{ betaFull: boolean }>}
 */
export async function verifiedBetaFull(env, request, saveId) {
  try {
    const projectId = env?.FIREBASE_PROJECT_ID;
    if (!projectId) return { betaFull: false };
    if (parseBetaEmails(env?.BETA_EMAILS).length === 0) return { betaFull: false };
    const claims = await verifyIdToken(bearerToken(request), projectId);
    if (!claims || !betaAllows(env, claims.email)) return { betaFull: false };
    if (saveId !== undefined && (await emailToSaveId(claims.email)) !== saveId) return { betaFull: false };
    return { betaFull: true };
  } catch {
    return { betaFull: false };
  }
}

/** Visão pública do beta-full: tier efetivo `paid`; créditos (saldo real) intactos. Não toca no `ent`. */
export function betaFullPublicView(view) {
  return { ...view, tier: 'paid', provider: view.provider ?? 'beta', betaFull: true };
}

export function logBetaFull(route) {
  console.log(JSON.stringify({ event: 'beta_full_session', route }));
}
