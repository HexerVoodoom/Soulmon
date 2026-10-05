/**
 * Combat v3 — the damage curve and the attack rhythm (story PR1).
 *
 * The unit of every attribute is the HIT: "how many hits does A need to knock
 * B out". The count is FRACTIONAL (the HP bar moves in fractions, contexto
 * §2.5); only the number shown to the player is rounded.
 *
 * Owner's d0 examples (all attributes 1, HP 10): 10 hits; ATK 2 → 9; DEF 2 → 11.
 */

/** Softening constant of the curve: one point ≈ 1/K of the hits. */
export const CURVE_K = 8;

/** Attacks per window at SPD 1. */
export const BASE_ATTACKS_PER_WINDOW = 9;

/** A fighter as the core sees it. `bonus` is the already-capped damage bonus (0.05 = 5%). */
export interface Combatant {
  readonly level: number;
  readonly atk: number;
  readonly def: number;
  readonly spd: number;
  readonly hp: number;
  readonly bonus: number;
}

/** hits = HP·(1+DEF/K) / (1+ATK/K) / (1+bonus). Fractional. */
export function hitsToKnockOut(
  attacker: Pick<Combatant, 'atk' | 'bonus'>,
  defender: Pick<Combatant, 'hp' | 'def'>,
): number {
  return (defender.hp * (1 + defender.def / CURVE_K)) / (1 + attacker.atk / CURVE_K) / (1 + attacker.bonus);
}

/** What the player reads: the fractional count rounded to the nearest hit. */
export function displayHits(hits: number): number {
  return Math.round(hits);
}

/** Rhythm: 9·(1+SPD/K)/(1+1/K) attacks per window (9 at SPD 1). */
export function attacksPerWindow(spd: number): number {
  return (BASE_ATTACKS_PER_WINDOW * (1 + spd / CURVE_K)) / (1 + 1 / CURVE_K);
}
