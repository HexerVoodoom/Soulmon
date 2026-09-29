// Papel de ADMINISTRADOR/GM do dono — decidido SÓ no servidor.
//
// Quem é admin: o e-mail de um ID token do Firebase VERIFICADO (assinatura,
// aud, iss, exp e `email_verified === true` — tudo em `verifyIdToken`, que é
// reusado, nunca copiado) que esteja em `ADMIN_EMAILS` (secret; vírgula ou
// espaço). FAIL-CLOSED em três pontos:
//   · sem `ADMIN_EMAILS` (ou vazia) → ninguém é admin;
//   · sem `FIREBASE_PROJECT_ID` (modo aberto do `_auth.js`) → ninguém é admin,
//     mesmo com o saveId certo: o saveId é CALCULÁVEL a partir do e-mail, então
//     nunca é prova de nada;
//   · com `saveId` pedido, o token tem de ser DO DONO daquele save — o admin só
//     tem poder sobre a PRÓPRIA conta (nenhuma impersonação, nenhuma rota que
//     leia/escreva outro saveId).
// `email_verified` é o que barra o atacante que cria conta e-mail/senha com o
// e-mail do dono sem acesso à caixa dele.
//
// Os efeitos são DERIVADOS NA LEITURA e nunca gravados em `ent:<saveId>` (o
// registro de cobrança continua dizendo só o que foi pago).
// Nada vem do corpo nem de cabeçalho do cliente além do Bearer token.

import { verifyIdToken, emailToSaveId, normalizeEmail, bearerToken } from './_auth.js';

/** Multiplicador ÚNICO dos tetos POR CONTA de IA para o admin. O global não muda. */
export const ADMIN_AI_CAP_MULTIPLIER = 3;

/**
 * Sub-teto MENSAL próprio do admin para sprite (contador `ai:sprite:@admin:<mês UTC>`,
 * TTL de mês, sem PII). O admin nunca consome mais que isto do teto global
 * (`globalMonth`): pior caso 40 x R$ 0,101 = ~R$ 4/mês. Estourar devolve o MESMO
 * erro do teto global mensal (503 `ai-monthly-budget-reached`), sem revelar o papel.
 */
export const ADMIN_SPRITE_MONTHLY_CAP = 40;

/**
 * Saldo de Créditos EXIBIDO ao admin — não existe em `ent:`, não é dinheiro.
 * Só para o cliente não recusar localmente um gesto que o servidor aceitaria
 * (`spend` do admin não debita).
 */
export const ADMIN_CREDITS_DISPLAY = 999_999;

/** `ADMIN_EMAILS` → Set de e-mails normalizados (mesma régua do saveId). */
export function parseAdminEmails(raw) {
  if (typeof raw !== 'string') return new Set();
  return new Set(raw.split(/[\s,;]+/).map(normalizeEmail).filter(e => e.includes('@')));
}

export function isAdminEmail(env, email) {
  if (typeof email !== 'string' || !email) return false;
  return parseAdminEmails(env?.ADMIN_EMAILS).has(normalizeEmail(email));
}

/**
 * @param {any} env
 * @param {Request} request
 * @param {string} [saveId] quando vem, o admin só vale se o token for DESTE save.
 * @returns {Promise<{ admin: boolean }>}
 */
export async function verifiedAdmin(env, request, saveId) {
  try {
    const projectId = env?.FIREBASE_PROJECT_ID;
    if (!projectId) return { admin: false };
    if (parseAdminEmails(env?.ADMIN_EMAILS).size === 0) return { admin: false };
    const claims = await verifyIdToken(bearerToken(request), projectId);
    if (!claims || !isAdminEmail(env, claims.email)) return { admin: false };
    if (saveId !== undefined && (await emailToSaveId(claims.email)) !== saveId) return { admin: false };
    return { admin: true };
  } catch {
    return { admin: false };
  }
}

/** Visão pública para o admin: tier efetivo `paid` e o saldo de exibição. Não toca no `ent`. */
export function adminPublicView(view) {
  return { ...view, tier: 'paid', credits: ADMIN_CREDITS_DISPLAY, admin: true };
}

/** Auditoria sem PII: nem e-mail, nem saveId. */
export function logAdminSession(route) {
  console.log(JSON.stringify({ event: 'admin_session', route }));
}
