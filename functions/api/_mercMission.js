/**
 * Guilda dos Mercenários (plano do onboarding velado §11): espelho de `sanitizeMercMission`
 * (`src/utils/mercMission.ts`; paridade em `mercMission.parity.test.js`). Só a FORMA: o servidor
 * não tem o catálogo e não concede nada com isto (os pontos de tipo vivem no save do cliente).
 * Nunca recusa o save.
 */
export const MERC_ORDENS = ['filtrador', 'tecelao', 'rompente'];

/** @param {unknown} raw */
export function sanitizeMercMission(raw) {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = /** @type {Record<string, unknown>} */ (raw);
  if (typeof r.day !== 'string' || r.day.length === 0 || r.day.length > 40) return undefined;
  if (typeof r.ordem !== 'string' || !MERC_ORDENS.includes(r.ordem)) return undefined;
  if (typeof r.activityId !== 'string' || r.activityId.length === 0 || r.activityId.length > 64) return undefined;
  return { day: r.day, ordem: r.ordem, activityId: r.activityId, done: r.done === true };
}
