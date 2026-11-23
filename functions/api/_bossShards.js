/**
 * Fragmento de Boss (03/11/2026): espelho de `sanitizeBossShards` (`src/utils/bossShards.ts`; paridade em
 * `bossShards.parity.test.js`). Só a FORMA (inteiro 0..1.000.000); nunca recusa o save.
 */
export const BOSS_SHARDS_MAX = 1000000;

/** @param {unknown} raw */
export function sanitizeBossShards(raw) {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return undefined;
  return Math.min(BOSS_SHARDS_MAX, Math.max(0, Math.floor(raw)));
}
