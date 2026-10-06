/**
 * Combat v3 — Soulmon level, points and automatic HP (story PR1; contexto §2.7/§2.8).
 *
 * The level defines the TOTAL of points (1 per level, only ATK/DEF/SPD); the
 * branch decides the DISTRIBUTION, bounded by a ceiling (45%) and a floor (15%)
 * per attribute. HP grows by itself with the level and never costs a point.
 * Everything is a pure function of (level, weights): the same level always
 * yields the same stats, so degeneration (level goes down) and recovery are
 * exact by construction.
 */

import { STAGE_LEVEL_CAPS } from '../../types/progression';
import type { Combatant } from './curve';

/**
 * Level ceiling per stage (6/13/21/30/40): owned by `types/progression.ts`,
 * derived from `FORM_REQUIREMENTS.cap`. Re-exported for the core.
 */
export { STAGE_LEVEL_CAPS };

export const MAX_LEVEL = STAGE_LEVEL_CAPS[STAGE_LEVEL_CAPS.length - 1];

/** Share ceiling and floor of one attribute over the level's points (§2.8, §2.10). */
export const MAX_SHARE = 0.45;
export const MIN_SHARE = 0.15;

/** HP = HP_BASE · 1.5^stage · (1 + L/HP_LEVEL_DIVISOR). */
export const HP_BASE = 10;
export const HP_LEVEL_DIVISOR = 10;
export const STAGE_FACTOR = 1.5;

export interface StatWeights {
  readonly atk: number;
  readonly def: number;
  readonly spd: number;
}

export interface Points {
  readonly atk: number;
  readonly def: number;
  readonly spd: number;
}

/**
 * The declared sample of builds every balance gate measures (story PR1, V1):
 * the three extremes the caps allow and the balanced one. Tests iterate THIS
 * list; they never keep their own.
 */
export const REFERENCE_BUILDS: Readonly<Record<'atk' | 'def' | 'spd' | 'balanced', StatWeights>> = {
  atk: { atk: 1, def: 0, spd: 0 },
  def: { atk: 0, def: 1, spd: 0 },
  spd: { atk: 0, def: 0, spd: 1 },
  balanced: { atk: 1 / 3, def: 1 / 3, spd: 1 / 3 },
};
export type ReferenceBuild = keyof typeof REFERENCE_BUILDS;
export const REFERENCE_BUILD_NAMES = Object.keys(REFERENCE_BUILDS) as ReferenceBuild[];

/** Clamps any input to an integer level in [1, MAX_LEVEL]. Dirty input never throws. */
export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
}

/** Stage index (0 = rookie … 4 = ultra) of a level. */
export function stageOfLevel(level: number): number {
  const L = clampLevel(level);
  return STAGE_LEVEL_CAPS.findIndex((cap) => L <= cap);
}

/** Lowest level of a stage. */
export function firstLevelOfStage(stage: number): number {
  return stage <= 0 ? 1 : STAGE_LEVEL_CAPS[stage - 1] + 1;
}

/** Base ATK/DEF/SPD of a stage: ceil(1.5^s). */
export function stageBase(stage: number): number {
  return Math.ceil(STAGE_FACTOR ** stage);
}

/** Automatic HP: 10·1.5^s·(1+L/10). */
export function autoHp(level: number): number {
  const L = clampLevel(level);
  return HP_BASE * STAGE_FACTOR ** stageOfLevel(L) * (1 + L / HP_LEVEL_DIVISOR);
}

export interface ShareBounds {
  readonly maxShare: number;
  readonly minShare: number;
}
export const SHARE_BOUNDS: ShareBounds = { maxShare: MAX_SHARE, minShare: MIN_SHARE };

const ORDER = ['atk', 'spd', 'def'] as const;

function cleanWeights(w: StatWeights): StatWeights {
  const c = (x: number) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : 0);
  const atk = c(w.atk), def = c(w.def), spd = c(w.spd);
  const sum = atk + def + spd;
  return sum > 0 ? { atk: atk / sum, def: def / sum, spd: spd / sum } : REFERENCE_BUILDS.balanced;
}

/**
 * Distributes exactly L points over ATK/DEF/SPD.
 * - every attribute starts at its floor floor(minShare·L);
 * - each remaining point goes to the attribute furthest below its weighted
 *   target, never past the ceiling max(ceil(L/3), floor(maxShare·L));
 * - ties break in the fixed order ATK, SPD, DEF (deterministic).
 * Invariant: atk + def + spd === L for every L and every weight.
 */
export function distributePoints(level: number, weights: StatWeights, bounds: ShareBounds = SHARE_BOUNDS): Points {
  const L = clampLevel(level);
  const w = cleanWeights(weights);
  const cap = Math.max(Math.ceil(L / 3), Math.floor(bounds.maxShare * L));
  const floor = Math.min(Math.floor(bounds.minShare * L), Math.floor(L / 3));
  const p = { atk: floor, def: floor, spd: floor };
  for (let n = 3 * floor + 1; n <= L; n++) {
    let best: (typeof ORDER)[number] | null = null;
    let bestNeed = -Infinity;
    for (const a of ORDER) {
      if (p[a] >= cap) continue;
      const need = w[a] * n - p[a];
      if (need > bestNeed + 1e-9) {
        best = a;
        bestNeed = need;
      }
    }
    // 3·cap ≥ L always, so some attribute is below its cap.
    p[best as (typeof ORDER)[number]]++;
  }
  return p;
}

/** Full combatant at a level for a branch. `bonus` must already be capped (see `bonus.ts`). */
export function combatantAt(level: number, weights: StatWeights, bonus = 0, bounds: ShareBounds = SHARE_BOUNDS): Combatant {
  const L = clampLevel(level);
  const b = stageBase(stageOfLevel(L));
  const p = distributePoints(L, weights, bounds);
  return { level: L, atk: b + p.atk, def: b + p.def, spd: b + p.spd, hp: autoHp(L), bonus };
}

/** Levels sampled by the ruler: first, middle and last of every stage (15 levels). */
export const RULER_LEVELS: readonly number[] = [
  ...new Set(
    STAGE_LEVEL_CAPS.flatMap((cap, s) => {
      const lo = firstLevelOfStage(s);
      return [lo, Math.round((lo + cap) / 2), cap];
    }),
  ),
];
