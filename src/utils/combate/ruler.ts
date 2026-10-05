/**
 * Combat v3 — the paired ruler (story PR1; contexto §2.4/§2.9).
 *
 * The ruler compares a special family against the reference (direct) in the
 * mirror, with the SAME seed on both measurements, averaged over many seeds:
 *   Δ = mean_s[ tA/tB (family × direct) − tA/tB (direct × direct) ].
 * Positive Δ = the family wins faster than direct would. HP×3 so that a single
 * special does not decide a short fight. Tolerance ±5%; buffs −15% at rookie.
 */

import type { Combatant } from './curve';
import { fight } from './fight';
import { stageOfLevel } from './level';
import { BUFF_FAMILIES, REFERENCE_FAMILY, specialOf, type Special, type SpecialFamily } from './specials';

export const RULER_HP_SCALE = 3;
export const RULER_TOLERANCE = 0.05;
export const RULER_ROOKIE_BUFF_TOLERANCE = 0.15;

/** Accepted [low, high] Δ for a family at a level. */
export function rulerBounds(family: SpecialFamily, level: number): [number, number] {
  const low = BUFF_FAMILIES.includes(family) && stageOfLevel(level) === 0 ? RULER_ROOKIE_BUFF_TOLERANCE : RULER_TOLERANCE;
  return [-low, RULER_TOLERANCE];
}

/** Seed of the i-th ruler fight of a cell; distinct cells get distinct seeds. */
export function rulerSeed(i: number, cell: number): number {
  return (Math.imul(i + 1, 31337) + Math.imul(cell, 101)) | 0;
}

/** tA/tB of direct × direct per seed: the paired baseline, shared by every family of a cell. */
export function rulerBaseline(c: Combatant, seeds: number, cell = 0): number[] {
  const ref = specialOf(REFERENCE_FAMILY);
  const out: number[] = [];
  for (let i = 0; i < seeds; i++) {
    const m0 = fight({ combatant: c, special: ref }, { combatant: c, special: ref }, { seed: rulerSeed(i, cell), hpScale: RULER_HP_SCALE });
    out.push(m0.timeA / m0.timeB);
  }
  return out;
}

export function pairedDelta(c: Combatant, special: Special, seeds: number, cell = 0, baseline = rulerBaseline(c, seeds, cell)): number {
  const ref = specialOf(REFERENCE_FAMILY);
  let sum = 0;
  for (let i = 0; i < seeds; i++) {
    const m = fight({ combatant: c, special }, { combatant: c, special: ref }, { seed: rulerSeed(i, cell), hpScale: RULER_HP_SCALE });
    sum += m.timeA / m.timeB - baseline[i];
  }
  return sum / seeds;
}
