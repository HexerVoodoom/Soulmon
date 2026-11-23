/**
 * RENOMEAR NA HEXSMITH (11/11/2026): trocar o NOME do Soulmon (lápis) ou o NOME DO ESPECIAL (chama) custa `HEX_RENAME_COST` Bits (do saldo; desde §373 o Bit de Crédito também paga)
 * e é do SERVIDOR (`POST /api/save?id=&action=hexRename { kind, nome, baseRevision? }`): valida, debita e grava numa escrita só.
 * Espelho do cliente em `src/utils/hexsmithRename.ts` (`hexsmithRename.parity.test.js` trava o preço e a regra de forma).
 * O nome passa pela MESMA régua do apelido/especial (`nomeEspecialValido`: forma, contato, palavrão PT/EN) e pela de contato de `_coop.js`.
 */
import { nomeEspecialValido } from './_especialNomeRegra.js';
import { sanitizarNomeDeGuilda } from './_coop.js';

export const HEX_RENAME_COST = 200;
export const HEX_RENAME_KINDS = ['pet', 'especial'];

const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

/**
 * @param {Record<string, any>} stored  o state gravado
 * @param {unknown} kind
 * @param {unknown} nomeRaw
 * @param {number} now
 * @returns {{ ok: true, already: boolean, state: Record<string, any> } | { ok: false, reason: 'invalid' | 'rejected' | 'bits' }}
 */
export function renameOnServer(stored, kind, nomeRaw, now = Date.now()) {
  if (!HEX_RENAME_KINDS.includes(/** @type {string} */ (kind))) return { ok: false, reason: 'invalid' };
  if (typeof nomeRaw !== 'string') return { ok: false, reason: 'invalid' };
  const nome = nomeEspecialValido(nomeRaw);
  if (!nome || sanitizarNomeDeGuilda(nome) !== nome) return { ok: false, reason: 'rejected' };
  const atual = kind === 'pet' ? String(stored.soulmonMeta?.petName ?? '') : String(stored.especialNome ?? '');
  if (atual === nome) return { ok: true, already: true, state: stored };
  const gp = num(stored.gamePoints);
  const paidLeft = num(stored.bitsOrigin?.paidLeft);
  if (gp < HEX_RENAME_COST) return { ok: false, reason: 'bits' };
  /** @type {Record<string, any>} */
  const next = { ...stored, gamePoints: gp - HEX_RENAME_COST };
  if (stored.bitsOrigin && typeof stored.bitsOrigin === 'object') {
    const left = Math.min(Math.max(0, paidLeft - HEX_RENAME_COST), next.gamePoints);
    if (left !== paidLeft) next.bitsOrigin = { ...stored.bitsOrigin, paidLeft: left };
  }
  if (kind === 'pet') next.soulmonMeta = { ...(stored.soulmonMeta ?? {}), petName: nome };
  else { next.especialNome = nome; next.especialNomeAt = now; }
  return { ok: true, already: false, state: next };
}
