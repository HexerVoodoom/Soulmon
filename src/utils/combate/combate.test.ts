/**
 * Combat v3 core — acceptance gates of story PR1 (run combate-v3-01).
 *
 * DECLARED SAMPLE (V1): builds = `REFERENCE_BUILDS` (level.ts), families =
 * `SPECIAL_FAMILIES` (specials.ts), ruler levels = `RULER_LEVELS` (level.ts).
 * The test keeps no list of its own.
 *
 * DECLARED N AND TOLERANCES (CI-sized; the spike used 200/150/6000):
 * - N_SEEDS_TTK = 60 seeds per point for gap / +1 level / DEF P95 / bonus cap.
 * - N_SEEDS_RULER = 40 paired seeds per ruler cell (15 levels × 4 builds).
 * - N_SEEDS_UPSET = 3000 fights for the 5% upset rate, IC95 normal.
 * - Bonus cap gate tolerance: 5% + 0.5 pp (sampling).
 *
 * RED PROOF (criterion 9): every gate is a pure function of its inputs, and
 * each has a sibling "RED" test that feeds a sabotaged input and asserts the
 * gate FAILS — proving the assertion can go red.
 */

import { describe, expect, it } from 'vitest';
import { combinedBonus, COMBAT_BONUS_CAP } from './bonus';
import { attacksPerWindow, displayHits, hitsToKnockOut, type Combatant } from './curve';
import { fight, type FightOptions } from './fight';
import {
  autoHp, combatantAt, distributePoints, MAX_LEVEL, REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS,
  STAGE_LEVEL_CAPS, stageBase, stageOfLevel, type ShareBounds, SHARE_BOUNDS,
} from './level';
import { mulberry32 } from './rng';
import { pairedDelta, rulerBaseline, rulerBounds } from './ruler';
import { SPECIAL_FAMILIES, SPECIAL_POWER, specialOf, type SpecialFamily } from './specials';

const N_SEEDS_TTK = 60;
const N_SEEDS_RULER = 40;
const N_SEEDS_UPSET = 3000;
const BONUS_TOL = 0.005;

const levels = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);

/** Mean advantage of A over B: Σ tA / Σ tB − 1 (tX = time X is knocked out). */
function meanAdv(A: Combatant, B: Combatant, S: number, opts: Partial<FightOptions> = {}): { adv: number; times: number[] } {
  let a = 0, b = 0;
  const times: number[] = [];
  for (let s = 1; s <= S; s++) {
    const r = fight({ combatant: A, special: null }, { combatant: B, special: null }, { seed: s * 104729 + A.level, ...opts });
    a += r.timeA; b += r.timeB; times.push(r.timeA, r.timeB);
  }
  return { adv: a / b - 1, times };
}

function gateBuildGap(bounds: ShareBounds): number {
  let worst = 0;
  for (const L of levels) {
    const st = REFERENCE_BUILD_NAMES.map((n) => combatantAt(L, REFERENCE_BUILDS[n], 0, bounds));
    for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) {
      const g = meanAdv(st[i], st[j], N_SEEDS_TTK).adv;
      if (Math.abs(g) > Math.abs(worst)) worst = g;
    }
  }
  return worst;
}

function gateLevelUp(nextOf: (L: number, w: (typeof REFERENCE_BUILDS)[keyof typeof REFERENCE_BUILDS]) => Combatant): number {
  let worst = Infinity;
  for (const L of levels.slice(0, -1)) for (const n of REFERENCE_BUILD_NAMES) {
    const w = REFERENCE_BUILDS[n];
    const g = meanAdv(nextOf(L, w), combatantAt(L, w), N_SEEDS_TTK).adv;
    worst = Math.min(worst, g);
  }
  return worst;
}

function gateDefP95(hpScale: number): number {
  let worst = 0;
  for (const L of levels) {
    const d = combatantAt(L, REFERENCE_BUILDS.def);
    const ts = meanAdv(d, d, N_SEEDS_TTK, { hpScale }).times.sort((x, y) => x - y);
    worst = Math.max(worst, ts[Math.floor(0.95 * ts.length)]);
  }
  return worst;
}

function gateRuler(
  powerOf: (f: SpecialFamily) => number,
  families: readonly SpecialFamily[] = SPECIAL_FAMILIES,
): { failed: string[]; worst: Record<string, number> } {
  const failed: string[] = [];
  const worst: Record<string, number> = Object.fromEntries(families.map((f) => [f, 0]));
  RULER_LEVELS.forEach((L, li) => REFERENCE_BUILD_NAMES.forEach((n, bi) => {
    const c = combatantAt(L, REFERENCE_BUILDS[n]);
    const cell = li * REFERENCE_BUILD_NAMES.length + bi;
    const base = rulerBaseline(c, N_SEEDS_RULER, cell);
    for (const fam of families) {
      const d = pairedDelta(c, { family: fam, power: powerOf(fam) }, N_SEEDS_RULER, cell, base);
      const [lo, hi] = rulerBounds(fam, L);
      if (Math.abs(d) > Math.abs(worst[fam])) worst[fam] = d;
      if (d < lo - 1e-9 || d > hi + 1e-9) failed.push(`${fam}@L${L}/${n}: ${(100 * d).toFixed(1)}%`);
    }
  }));
  return { failed, worst };
}

/** All bonus sums the four sources can reach at 0/1/2.5/5% each. */
function bonusSums(): number[] {
  const v = [0, 0.01, 0.025, 0.05];
  const sums = new Set<number>();
  for (const t of v) for (const e of v) for (const c of v) for (const r of v) sums.add(+(t + e + c + r).toFixed(4));
  return [...sums];
}

function gateBonus(toBonus: (sum: number) => number): number {
  let worst = 0;
  for (const sum of bonusSums()) for (const L of [1, 17, MAX_LEVEL]) {
    const base = combatantAt(L, REFERENCE_BUILDS.balanced);
    const z = meanAdv(base, base, N_SEEDS_TTK).adv;
    worst = Math.max(worst, meanAdv({ ...base, bonus: toBonus(sum) }, base, N_SEEDS_TTK).adv - z);
  }
  return worst;
}

/** Win rate of the weaker side (no bonus) vs a 5% bonus, ties = ½, IC95 normal. */
function gateUpset(variance: FightOptions['variance']): { p: number; ic: number } {
  const ref = specialOf('direct');
  let w = 0;
  for (let s = 0; s < N_SEEDS_UPSET; s++) {
    const L = RULER_LEVELS[s % RULER_LEVELS.length];
    const n = REFERENCE_BUILD_NAMES[Math.floor(s / RULER_LEVELS.length) % REFERENCE_BUILD_NAMES.length];
    const weak = combatantAt(L, REFERENCE_BUILDS[n]);
    const strong = combatantAt(L, REFERENCE_BUILDS[n], combinedBonus({ talent: 0.05 }));
    const r = fight({ combatant: strong, special: ref }, { combatant: weak, special: ref }, { seed: s * 7919 + 13, variance });
    if (r.winner === 'draw') w += 0.5;
    else if (r.winner === 'B') w++;
  }
  const p = w / N_SEEDS_UPSET;
  return { p, ic: 1.96 * Math.sqrt((p * (1 - p)) / N_SEEDS_UPSET) };
}

// ───────────────────────────── conformance ─────────────────────────────

describe('rng', () => {
  it('mulberry32(42) conformance vector', () => {
    const r = mulberry32(42);
    expect([r(), r(), r()].map((x) => x.toFixed(6))).toEqual(['0.601104', '0.448291', '0.852466']);
  });
});

describe('1. owner d0 examples', () => {
  const one = { level: 1, atk: 1, def: 1, spd: 1, hp: 10, bonus: 0 };
  it('10 / 9 / 11 hits shown', () => {
    expect(displayHits(hitsToKnockOut(one, one))).toBe(10);
    expect(displayHits(hitsToKnockOut({ ...one, atk: 2 }, one))).toBe(9);
    expect(displayHits(hitsToKnockOut(one, { ...one, def: 2 }))).toBe(11);
    expect(hitsToKnockOut(one, { ...one, def: 2 })).toBeCloseTo(11.111, 3); // fractional internally
    expect(attacksPerWindow(1)).toBe(9);
  });
  it('RED: rounding up (ceil) instead of round would show 12, not 11', () => {
    expect(Math.ceil(hitsToKnockOut(one, { ...one, def: 2 }))).not.toBe(11);
  });
});

describe('level', () => {
  it('stage caps derive from FORM_REQUIREMENTS: 6/13/21/30/40', () => {
    expect(STAGE_LEVEL_CAPS).toEqual([6, 13, 21, 30, 40]);
    expect([1, 6, 7, 13, 14, 40].map(stageOfLevel)).toEqual([0, 0, 1, 1, 2, 4]);
    expect([0, 1, 2, 3, 4].map(stageBase)).toEqual([1, 2, 3, 4, 6]);
    expect(autoHp(1)).toBeCloseTo(11, 9);
    expect(autoHp(40)).toBeCloseTo(10 * 1.5 ** 4 * 5, 9);
  });
  it('points total = L, ceiling 45% and floor 15% for every level and build', () => {
    for (const L of levels) for (const n of REFERENCE_BUILD_NAMES) {
      const p = distributePoints(L, REFERENCE_BUILDS[n]);
      expect(p.atk + p.def + p.spd).toBe(L);
      const cap = Math.max(Math.ceil(L / 3), Math.floor(SHARE_BOUNDS.maxShare * L));
      for (const v of [p.atk, p.def, p.spd]) {
        expect(v).toBeLessThanOrEqual(cap);
        expect(v).toBeGreaterThanOrEqual(Math.min(Math.floor(SHARE_BOUNDS.minShare * L), Math.floor(L / 3)));
      }
    }
  });
  it('dirty input never throws and never breaks the total', () => {
    const p = distributePoints(Number.NaN, { atk: -1, def: Number.NaN, spd: Infinity });
    expect(p.atk + p.def + p.spd).toBe(1);
    expect(combatantAt(999, REFERENCE_BUILDS.atk).level).toBe(MAX_LEVEL);
  });
  it('degeneration is exact: same level → same stats', () => {
    const path = [10, 11, 12, 13, 9, 8, 9, 13, 21, 17, 21];
    const seen = new Map<number, string>();
    for (const L of path) {
      const k = JSON.stringify(combatantAt(L, REFERENCE_BUILDS.balanced));
      if (seen.has(L)) expect(k).toBe(seen.get(L));
      seen.set(L, k);
    }
  });
});

describe('bonus', () => {
  it('min(sum, 5%), dirty sources count as 0', () => {
    expect(combinedBonus({ talent: 0.03, equipment: 0.03, commerce: 0.03, rebirth: 0.03 })).toBe(COMBAT_BONUS_CAP);
    expect(combinedBonus({ talent: 0.02, equipment: -1, commerce: Number.NaN })).toBe(0.02);
  });
});

// ───────────────────────────── balance gates ─────────────────────────────

describe('2. build gap ≤10% (mean TTK, L=1..40, all pairs of REFERENCE_BUILDS)', () => {
  it('passes', () => {
    const g = gateBuildGap(SHARE_BOUNDS);
    console.log(`[gate 2] worst build gap ${(100 * g).toFixed(1)}%`);
    expect(Math.abs(g)).toBeLessThanOrEqual(0.1);
  });
  it('RED: without the 45% ceiling / 15% floor (pure builds) the gap breaks 10%', () => {
    expect(Math.abs(gateBuildGap({ maxShare: 1, minShare: 0 }))).toBeGreaterThan(0.1);
  });
});

describe('3. +1 level ≥2% of TTK', () => {
  it('passes', () => {
    const g = gateLevelUp((L, w) => combatantAt(L + 1, w));
    console.log(`[gate 3] worst +1 level ${(100 * g).toFixed(1)}%`);
    expect(g).toBeGreaterThanOrEqual(0.02);
  });
  it('RED: a level-up that grants nothing fails', () => {
    expect(gateLevelUp((L, w) => combatantAt(L, w))).toBeLessThan(0.02);
  });
});

describe('4. pure DEF mirror P95 ≤40 s', () => {
  it('passes', () => {
    const p = gateDefP95(1);
    console.log(`[gate 4] DEF×DEF P95 ${p.toFixed(1)} s`);
    expect(p).toBeLessThanOrEqual(40);
  });
  it('RED: doubling HP pushes P95 past 40 s', () => {
    expect(gateDefP95(2)).toBeGreaterThan(40);
  });
});

describe('5. paired ruler: 7 families ±5%, buffs −15% at rookie (HP×3)', () => {
  it('passes for every family of SPECIAL_FAMILIES', () => {
    const r = gateRuler((f) => SPECIAL_POWER[f]);
    console.log(`[gate 5] worst Δ per family ${JSON.stringify(Object.fromEntries(Object.entries(r.worst).map(([k, v]) => [k, +(100 * v).toFixed(1)])))}`);
    expect(r.failed).toEqual([]);
  });
  it('RED: dot with p×1.5 fails the ruler', () => {
    const r = gateRuler(() => 1.5, ['dot']);
    expect(r.failed.some((x) => x.startsWith('dot@'))).toBe(true);
  });
});

describe('6. bonus ceiling by ratio of means ≤5% + tol', () => {
  it('passes with min(sum, 5%)', () => {
    const g = gateBonus((sum) => Math.min(sum, COMBAT_BONUS_CAP));
    console.log(`[gate 6] worst bonus edge ${(100 * g).toFixed(2)}%`);
    expect(g).toBeLessThanOrEqual(COMBAT_BONUS_CAP + BONUS_TOL);
  });
  it('RED: stacked bonus (no cap) breaks the ceiling', () => {
    expect(gateBonus((sum) => sum)).toBeGreaterThan(COMBAT_BONUS_CAP + BONUS_TOL);
  });
});

describe('7. weaker by 5% wins 25–40% (IC95)', () => {
  it('passes with AR(1) ρ0.9 σ15%', () => {
    const r = gateUpset(undefined);
    console.log(`[gate 7] weaker wins ${(100 * r.p).toFixed(1)}% ±${(100 * r.ic).toFixed(1)}`);
    expect(r.p - r.ic).toBeGreaterThanOrEqual(0.25);
    expect(r.p + r.ic).toBeLessThanOrEqual(0.4);
  });
  it('RED: without variance the weaker never wins', () => {
    const r = gateUpset(null);
    expect(r.p - r.ic >= 0.25 && r.p + r.ic <= 0.4).toBe(false);
  });
});

describe('8. determinism', () => {
  const c = combatantAt(17, REFERENCE_BUILDS.balanced);
  const run = (seed: number) => fight({ combatant: c, special: specialOf('dot') }, { combatant: c, special: specialOf('spdBuff') }, { seed });
  it('same seed → same fight', () => {
    expect(run(123)).toEqual(run(123));
  });
  it('RED: the comparison detects a different seed', () => {
    expect(run(124)).not.toEqual(run(123));
  });
  it('a draw is a valid result (mirror without variance)', () => {
    expect(fight({ combatant: c, special: null }, { combatant: c, special: null }, { seed: 1, variance: null, phases: [0.5, 0.5] }).winner).toBe('draw');
  });
});

describe('10. declared sample comes from the module', () => {
  it('7 families and 4 builds × 15 levels', () => {
    expect(SPECIAL_FAMILIES).toHaveLength(7);
    expect(REFERENCE_BUILD_NAMES).toHaveLength(4);
    expect(RULER_LEVELS).toHaveLength(15);
  });
});
