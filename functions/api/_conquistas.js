/**
 * Conquistas pagas (30/10/2026): espelho de `sanitizeConquistasPagas` (`src/utils/achievements.ts`; paridade em `conquistas.parity.test.js`).
 * Lista fechada de ids, sem repetir. Os Pontos de Conquista NÃO são gravados (derivados no cliente). Nunca recusa o save.
 */
export const ACHIEVEMENT_IDS = [
  'perfect-day', 'habit-7', 'habit-21', 'habit-66', 'first-evolution', 'mega-form', 'dungeon-10', 'tournament-champion', 'dias-completos-30',
  'dex-base-all', 'dex-fused-25', 'dex-fused-50', 'dex-fused-100', 'dex-fused-all', 'dex-all',
];

/** @param {unknown} raw */
export function sanitizeConquistasPagas(raw) {
  if (!Array.isArray(raw)) return undefined;
  return ACHIEVEMENT_IDS.filter((id) => raw.includes(id));
}
