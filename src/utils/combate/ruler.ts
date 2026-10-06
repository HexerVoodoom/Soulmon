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
import { fight, type FightSide } from './fight';
import { groupFight } from './group';
import { mulberry32 } from './rng';
import { REFERENCE_BUILDS, REFERENCE_BUILD_NAMES, RULER_LEVELS, combatantAt, stageOfLevel, type StatWeights } from './level';
import { BUFF_FAMILIES, DODGE_REDUCE_V3, PVE_FAMILY_POWER, RING_MULT_V3, REFERENCE_FAMILY, specialOf, type Special, type SpecialFamily } from './specials';

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

// ─────────────── area × single paired ruler (PR3a, contexto §2.15 P2) ───────────────

/** Arena foe shapes (hp × power relative to the player's balanced mirror), balanco-motores §6. */
export const RULER_GROUP_FOES = {
  weak: { hp: 0.45, power: 0.12 },
  medium: { hp: 0.95, power: 0.235 },
  boss: { hp: 1.2, power: 0.495, special: true },
} as const;
export type RulerFoeClass = keyof typeof RULER_GROUP_FOES;

/**
 * Declared composition of the 5-round group run (copy of the Arena's
 * `ARENA_ROUND_COMP` while PR3b does not exist; PR3b must replace it by the
 * module's own and keep the test green).
 */
export const RULER_GROUP_COMP: readonly (readonly RulerFoeClass[])[] = [
  ['medium'], ['weak', 'weak'], ['medium'], ['weak', 'weak', 'weak'], ['boss'],
];
/** Per-round growth of the foes and the 30% heal between rounds. */
export const RULER_GROUP_GROWTH = { hp: 0.04, power: 0.13 } as const;
export const RULER_GROUP_HEAL = 0.3;
/** Ring/dodge multipliers of the v3 engine (specials.ts RING_MULT_V3 / DODGE_REDUCE_V3). */
export const RULER_RING = [RING_MULT_V3.ruim, RING_MULT_V3.bom, RING_MULT_V3.otimo] as const;
export const RULER_DODGE = [DODGE_REDUCE_V3.nada, DODGE_REDUCE_V3.bom, DODGE_REDUCE_V3.otimo] as const;
/** The average player: ring ruim/bom/otimo 25/50/25 and dodge nada/bom/otimo 30/40/30. */
const RING_ODDS = [0.25, 0.5, 0.25] as const;
const DODGE_ODDS = [0.3, 0.4, 0.3] as const;

const pickOdds = (r: () => number, p: readonly number[]) => {
  const x = r();
  return x < p[0] ? 0 : x < p[0] + p[1] ? 1 : 2;
};

export interface GroupRunResult {
  readonly won: boolean;
  /** Total seconds of the run (only meaningful when won). */
  readonly total: number;
  readonly rounds: readonly number[];
}

/** One 5-round run of the group Arena with the pet using `area`. Pure in (cell, seed). */
export function groupRun(L: number, build: StatWeights, family: SpecialFamily, area: 'single' | 'area', seed: number, areaEfficiency?: number): GroupRunResult {
  const player: FightSide = { combatant: combatantAt(L, build), special: specialOf(family), area };
  const fam = PVE_FAMILY_POWER.arena[family];
  let hp = 1, en = 0, total = 0;
  const rounds: number[] = [];
  for (let r = 0; r < RULER_GROUP_COMP.length; r++) {
    const rng = mulberry32((seed * 7919 + r) | 0);
    const foes: FightSide[] = RULER_GROUP_COMP[r].map((cls) => {
      const s = RULER_GROUP_FOES[cls];
      const b = combatantAt(L, REFERENCE_BUILDS.balanced);
      return {
        combatant: { ...b, hp: b.hp * s.hp * (1 + RULER_GROUP_GROWTH.hp * r), bonus: s.power * (1 + RULER_GROUP_GROWTH.power * r) - 1 },
        special: 'special' in s ? specialOf('direct') : null,
      };
    });
    const res = groupFight(player, foes, {
      seed: seed * 101 + r, startHp: hp, startEnergy: en, areaEfficiency,
      hitScale: (who) => {
        if (who === 0) return 1;
        const acc = Math.min(1, Math.max(0, 0.7 + (rng() * 2 - 1) * 0.25));
        return acc >= 0.92 ? 0 : (1 - acc) / 0.3;
      },
    }, (who) => (who === 0 ? RULER_RING[pickOdds(rng, RING_ODDS)] * fam : 1 - RULER_DODGE[pickOdds(rng, DODGE_ODDS)]));
    rounds.push(res.t);
    total += res.t;
    if (res.winner !== 'player') return { won: false, total, rounds };
    hp = Math.min(1, res.hpLeft + RULER_GROUP_HEAL);
    en = res.energyLeft;
  }
  return { won: true, total, rounds };
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
