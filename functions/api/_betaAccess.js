// ACESSO DO BETA FECHADO (release/beta-1, decisão do dono 11/10/2026;
// `abuso-e-custo.md` V2.4). O app é web pública no workers.dev: qualquer conta
// Google com e-mail verificado loga. Sem lista, 20 contas secam o teto global
// de IA dos 15 testadores.
//
//   · `BETA_EMAILS`  (secret) — e-mails separados por vírgula (ou `;`/espaço/quebra
//     de linha), comparados NORMALIZADOS (`normalizeEmail`: trim + minúsculas —
//     a mesma régua do saveId; ponto e `+tag` do Gmail são outra conta).
//   · `BETA_CLOSED`  (var/secret, `1`/`true`/…) — beta FECHADO: quem não está na
//     lista loga, mas NÃO acessa save, IA nem compra (403 `beta-closed`); o app
//     mostra a tela "beta fechado" com a identidade do Soulmon.
//   · Flag desligada: só as rotas de IA exigem a lista (quando ela existe). Sem
//     lista e sem flag: aberto (comportamento anterior).
//
// FAIL-CLOSED: com a regra ligada e sem e-mail verificado (login desligado,
// token inválido), recusa — não dá para provar que a pessoa está na lista.

import { flagOn } from './_killSwitch.js';

/** Mesma régua de `normalizeEmail` (`_auth.js`): trim + minúsculas, nada mais.
 *  Cópia local para este módulo não depender do `_auth.js` (que os testes
 *  substituem por dublê); paridade travada em `betaAccess.test.js`. */
export const normalizeEmail = email => String(email ?? '').trim().toLowerCase();

/**
 * Forma CANÔNICA só para comparar com a lista do beta (gate adversarial C1):
 * trim + minúsculas e, no Gmail (`gmail.com`/`googlemail.com`), sem pontos e sem
 * `+tag` no nome — o Google entrega os dois no mesmo endereço, e um testador que
 * loga com `a.na+x@gmail.com` não pode ficar trancado fora por isso. NÃO muda o
 * saveId (que segue `normalizeEmail`): é só a régua da allowlist.
 */
export function canonBetaEmail(email) {
  const e = normalizeEmail(email);
  const at = e.lastIndexOf('@');
  if (at < 1) return e;
  let local = e.slice(0, at);
  let domain = e.slice(at + 1);
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.split('+')[0].replace(/\./g, '');
    domain = 'gmail.com';
  }
  return `${local}@${domain}`;
}

/** Lista canônica, sem vazios. */
export function parseBetaEmails(raw) {
  return [...new Set(String(raw ?? '').split(/[,;\s]+/).map(canonBetaEmail).filter(e => e.includes('@')))];
}

export const isBetaClosed = env => flagOn(env?.BETA_CLOSED);

/**
 * A regra vale para esta rota?
 * @param {'ai'|'core'} tipo  `ai` = chat/sprite/transcrição/sugestões; `core` = save/compra/resto.
 */
export function betaRuleApplies(env, tipo) {
  if (isBetaClosed(env)) return true;
  return tipo === 'ai' && parseBetaEmails(env?.BETA_EMAILS).length > 0;
}

/** O e-mail (já verificado pelo token) está na lista? */
export function betaAllows(env, email) {
  const e = canonBetaEmail(email);
  if (!e || !e.includes('@')) return false;
  return parseBetaEmails(env?.BETA_EMAILS).includes(e);
}

/**
 * @param {{ email?: string }|null|undefined} auth resultado de `authorizeSaveAccess`
 * @returns {null | { status: 403, reason: 'beta-closed' }}
 */
export function betaGate(env, auth, tipo) {
  if (!betaRuleApplies(env, tipo)) return null;
  if (betaAllows(env, auth?.email)) return null;
  return { status: 403, reason: 'beta-closed' };
}

export const BETA_CLOSED_MESSAGE = {
  pt: 'O Soulmon está em teste fechado e esta conta ainda não está na lista. Se você recebeu um convite, entre com o mesmo e-mail do convite.',
  en: 'Soulmon is in a closed test and this account is not on the list yet. If you got an invite, sign in with the same e-mail it was sent to.',
};
