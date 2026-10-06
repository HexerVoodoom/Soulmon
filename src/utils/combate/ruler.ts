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
import { simulateArenaRunV3 } from '../arena';
import { REFERENCE_BUILDS, REFERENCE_BUILD_NAMES, RULER_LEVELS, stageOfLevel, type StatWeights } from './level';
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

// ─────────────── area × single paired ruler (PR3a/PR3b, contexto §2.15 P2) ───────────────

export interface GroupRunResult {
  readonly won: boolean;
  /** Total seconds of the run (only meaningful when won). */
  readonly total: number;
  readonly rounds: readonly number[];
}

/**
 * One 5-round run of the group Arena with the pet using `area`. Pure in (cell, seed). It is the Arena's OWN
 * run (`simulateArenaRunV3`: `ARENA_FOES`, `ARENA_ROUND_COMP`, `ARENA_ROUND_GROWTH`, `ROUND_CLEAR_HEAL` and the
 * v3 ring/dodge tables of `utils/arena.ts`), so the ruler measures what the game plays — the PR3a copy is gone.
 */
export function groupRun(L: number, build: StatWeights, family: SpecialFamily, area: 'single' | 'area', seed: number, areaEfficiency?: number): GroupRunResult {
  const r = simulateArenaRunV3({ level: L, build, family, area }, seed, 'media', areaEfficiency);
  return { won: r.won, total: r.total, rounds: r.rounds };
}

export interface AreaDelta {
  /** Win rate of the area minus the single, in points of probability (0.02 = 2pp). */
  readonly dWin: number;
  /** Mean time of the WON runs, area ÷ single − 1. */
  readonly dTime: number;
  readonly winSingle: number;
  readonly winArea: number;
}

/** Paired area × single over `runs` cells (same seeds on both sides) for one family. */
export function areaDelta(family: SpecialFamily, runs: number, areaEfficiency?: number): AreaDelta {
  const builds = REFERENCE_BUILD_NAMES;
  let ws = 0, wa = 0, ts = 0, ta = 0, ns = 0, na = 0;
  for (let s = 0; s < runs; s++) {
    const L = RULER_LEVELS[s % RULER_LEVELS.length];
    const build = REFERENCE_BUILDS[builds[(s >> 2) % builds.length]];
    const a = groupRun(L, build, family, 'single', s, areaEfficiency);
    const b = groupRun(L, build, family, 'area', s, areaEfficiency);
    if (a.won) { ws++; ts += a.total; ns++; }
    if (b.won) { wa++; ta += b.total; na++; }
  }
  return { dWin: (wa - ws) / runs, dTime: ta / Math.max(1, na) / (ts / Math.max(1, ns)) - 1, winSingle: ws / runs, winArea: wa / runs };
}
