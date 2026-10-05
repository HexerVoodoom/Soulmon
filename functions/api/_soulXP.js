/**
 * XP e level do Soulmon, do lado do SERVIDOR (combate v3, PR2).
 *
 * Mirror de `src/utils/soulXP.ts` (Pages Functions nao importam de `src/`):
 * so a parte que o servidor precisa — XP, level e teto por estagio. O servidor
 * NUNCA aceita level nem stats vindos do cliente; recalcula destes fatos do
 * save (`evolutionStage`, `perfectDays`). Travado por
 * `functions/api/soulXP.parity.test.js`, que deriva os tetos de
 * `FORM_REQUIREMENTS` do app e exige o mesmo level nos dois lados.
 */

// Ordem e `cap` de FORM_REQUIREMENTS (rookie..ultra): 6/7/8/9/10.
const STAGE_ORDER = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];
const STAGE_CAPS_EACH = [6, 7, 8, 9, 10];

/** @type {number[]} */
export const STAGE_LEVEL_CAPS = STAGE_CAPS_EACH.reduce((/** @type {number[]} */ acc, c) => [...acc, (acc[acc.length - 1] ?? 0) + c], []);
export const MAX_LEVEL = STAGE_LEVEL_CAPS[STAGE_LEVEL_CAPS.length - 1];
export const XP_PER_LEVEL = 100;
/** XP de um dia completo com a meta cumprida (66 + 34). */
export const XP_FULL_DAY = 100;

function safe(n) {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0;
}

/** Indice do estagio a partir do id ('champion-power' -> 1). Desconhecido -> rookie. */
export function stageIndexOf(stage) {
  if (typeof stage !== 'string') return 0;
  const prefix = stage.split('-')[0];
  const i = STAGE_ORDER.indexOf(prefix);
  return i < 0 ? 0 : i;
}

export function levelCapFor(stage) {
  return STAGE_LEVEL_CAPS[stageIndexOf(stage)];
}

/** @param {{ evolutionStage?: string, perfectDays?: number }} state */
export function soulXP(state) {
  const s = stageIndexOf(state?.evolutionStage);
  const firstLevel = s <= 0 ? 1 : STAGE_LEVEL_CAPS[s - 1] + 1;
  return (firstLevel - 1) * XP_PER_LEVEL + Math.floor(safe(state?.perfectDays)) * XP_FULL_DAY;
}

export function levelFor(xp) {
  return Math.min(MAX_LEVEL, 1 + Math.floor(safe(xp) / XP_PER_LEVEL));
}

/** @param {{ evolutionStage?: string, perfectDays?: number }} state */
export function soulLevel(state) {
  return Math.min(levelFor(soulXP(state)), levelCapFor(state?.evolutionStage));
}
