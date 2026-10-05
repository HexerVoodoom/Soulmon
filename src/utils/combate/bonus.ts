/**
 * Combat v3 — the single damage-bonus cap (story PR1; contexto §2.8/§2.9).
 *
 * Talent, equipment, Commerce and Rebirth may each grant a damage bonus, but
 * they do NOT stack past one global cap: bonus = min(sum, 5%). The cap applies
 * to PvP too (owner's conscious decision, §2.9). This is the only place the
 * sum is taken — no consumer may add the sources by itself.
 */

export const COMBAT_BONUS_CAP = 0.05;

export interface BonusSources {
  readonly talent?: number;
  readonly equipment?: number;
  readonly commerce?: number;
  readonly rebirth?: number;
}

/** Negative, NaN or infinite sources count as 0: dirty input never lowers or explodes the bonus. */
export function combinedBonus(sources: BonusSources): number {
  let sum = 0;
  for (const v of [sources.talent, sources.equipment, sources.commerce, sources.rebirth]) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) sum += v;
  }
  return Math.min(sum, COMBAT_BONUS_CAP);
}
