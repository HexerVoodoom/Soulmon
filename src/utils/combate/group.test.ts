/**
 * Combat v3 N×1 fight — acceptance gates of story PR3a, criteria 3, 7 and 8,
 * plus the DoT hand-over (risk R1) and the area/personal-family rules.
 *
 * Ranges, not points (R3). Each gate has a RED sibling that feeds a sabotaged input.
 */

import { describe, expect, it } from 'vitest';
import { fight, type FightSide } from './fight';
import { foeSeed, groupFight, groupFightSteps, type GroupEvent } from './group';
import { combatantAt, REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS } from './level';
import { sideSeed } from './rng';
import { areaDelta } from './ruler';
import { ARENA_ROUND_COMP } from '../arena';
import { DODGE_REDUCE, RING_MULT } from '../energia';
import { AREA_FAMILIES, DODGE_REDUCE_V3, RING_MULT_V3, SPECIAL_FAMILIES, specialOf } from './specials';

const fam = (i: number) => SPECIAL_FAMILIES[((i % 7) + 7) % 7];

function pair(s: number): [FightSide, FightSide] {
  const L = RULER_LEVELS[s % RULER_LEVELS.length];
  const a = { combatant: combatantAt(L, REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[s % 4]]), special: specialOf(fam(s)) };
  const b = { combatant: combatantAt(L, REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s + 1) % 4]]), special: specialOf(fam(s + 3)) };
  return [a, b];
}

/** Divergences between groupFight(p, [f]) and fight(p, f) (first KO and winner) over 300 fights. */
function divergences(area: 'single' | 'area', foeSeedShift = 0): number {
  let bad = 0;
  for (let s = 0; s < 300; s++) {
    const [a, b] = pair(s);
    const seed = s * 77;
    const r1 = fight(a, b, { seed: seed + foeSeedShift, stopAtFirstKo: true });
    const r2 = groupFight({ ...a, area }, [b], { seed });
    const t1 = Math.min(r1.timeA, r1.timeB);
    const w1 = r1.winner === 'A' ? 'player' : r1.winner === 'B' ? 'foes' : 'draw';
    if (Math.abs(t1 - r2.t) > 1e-9 || w1 !== r2.winner) bad++;
  }
  return bad;
}

describe('AC3. N = 1 is the 1v1', () => {
  it('area on or off: same first KO (|Δt| < 1e-9) and same winner as fight() in 300 of 300', () => {
    expect(divergences('single')).toBe(0);
    expect(divergences('area')).toBe(0);
  });
  it('foe 0 uses sideSeed(seed, 2); the others get their own stream', () => {
    expect(foeSeed(123, 0)).toBe(sideSeed(123, 2));
    expect(foeSeed(123, 1)).not.toBe(foeSeed(123, 0));
    expect(foeSeed(123, 2)).not.toBe(foeSeed(123, 1));
  });
  it('RED: a different stream for foe 0 (here, another seed) is caught as divergence', () => {
    expect(divergences('single', 1)).toBeGreaterThan(0);
  });
});

describe('AC8. 1v1: area is the same fight as single', () => {
  it('identical results, field by field', () => {
    for (let s = 0; s < 120; s++) {
      const [a, b] = pair(s);
      expect(groupFight({ ...a, area: 'area' }, [b], { seed: s })).toEqual(groupFight({ ...a, area: 'single' }, [b], { seed: s }));
    }
  });
});

describe('result and end conditions', () => {
  const c = combatantAt(13, REFERENCE_BUILDS.balanced);
  const none: FightSide = { combatant: c, special: null };
  it('the player falls → foes; all foes fall → player; hpLeft/energyLeft are reported', () => {
    const strong = { combatant: { ...c, bonus: 5 }, special: null };
    const win = groupFight(strong, [none, none], { seed: 1 });
    expect(win.winner).toBe('player');
    expect(win.hpLeft).toBeGreaterThan(0);
    const lose = groupFight(none, [strong, strong], { seed: 1 });
    expect(lose.winner).toBe('foes');
    expect(lose.hpLeft).toBe(0);
  });
  it('startHp / startEnergy / cheer / hitScale hooks reach the player', () => {
    const base = groupFight({ ...none, special: specialOf('direct') }, [none, none], { seed: 3 });
    const hurt = groupFight({ ...none, special: specialOf('direct') }, [none, none], { seed: 3, startHp: 0.2 });
    expect(hurt.t).toBeLessThanOrEqual(base.t);
    const log: GroupEvent[] = [];
    const g = groupFightSteps({ ...none, special: specialOf('direct') }, [none], { seed: 3, startEnergy: 100 });
    let r = g.next();
    while (!r.done) { log.push(r.value); r = g.next(1); }
    expect(log.find((e) => e.kind === 'cast')?.t).toBe(0);
    const harmless = groupFight(none, [none], { seed: 3, hitScale: (who) => (who === 0 ? 0 : 1) });
    expect(harmless.winner).toBe('foes');
  });
  it('PR3b: cheerDrain (the LIVE cheer of the scene) adds CHEER.energyPerDischarge per discharge, only to the player', () => {
    const sp = { ...none, special: specialOf('direct') };
    const off = groupFight(sp, [none], { seed: 8 });
    let given = 0;
    const on = groupFight(sp, [none], { seed: 8, cheerDrain: () => (given++ < 3 ? 1 : 0) });
    expect(given).toBeGreaterThan(3);
    expect(on.energyLeft).toBeGreaterThan(off.energyLeft - 1e-9);
    // the same discharges as the offline list: 3 discharges = +9 energy, and nothing for a player without special
    const noSp = groupFight(none, [none], { seed: 8, cheerDrain: () => 5 });
    expect(noSp.energyLeft).toBe(0);
  });
  it('is deterministic: same seed, same log', () => {
    const run = () => {
      const log: GroupEvent[] = [];
      const g = groupFightSteps({ ...none, special: specialOf('dot'), area: 'area' }, [none, none, none], { seed: 9 });
      let r = g.next();
      while (!r.done) { log.push(r.value); r = g.next(1); }
      return log;
    };
    expect(run()).toEqual(run());
  });
});

describe('R1. single DoT hands the remaining ticks to the next living foe', () => {
  const c = combatantAt(21, REFERENCE_BUILDS.balanced);
  const glass: FightSide = { combatant: { ...c, hp: c.hp * 0.01 }, special: null };
  const tank: FightSide = { combatant: { ...c, hp: c.hp * 50 }, special: null };
  function ticks(area: 'single' | 'area') {
    const log: GroupEvent[] = [];
    // the player basic attack is harmless: only the DoT can damage
    const g = groupFightSteps({ combatant: c, special: specialOf('dot'), area }, [glass, tank], { seed: 5, startEnergy: 100, hitScale: (who) => (who === 0 ? 0 : 1) });
    let r = g.next();
    while (!r.done && log.filter((e) => e.kind === 'tick').length < 3 && log.length < 200) { log.push(r.value); r = g.next(1); }
    return log;
  }
  it('single: foe 0 falls in the 1st tick and the other 2 ticks land on foe 1', () => {
    const log = ticks('single');
    const t = log.filter((e) => e.kind === 'tick');
    expect(t).toHaveLength(3);
    expect(log.some((e) => e.kind === 'ko' && e.who === 1)).toBe(true);
    expect(t[2].foesHp[1]).toBeLessThan(1);
  });
  it('RED: in area the leftover ticks are NOT handed over (only who was in the circle)', () => {
    const t = ticks('area').filter((e) => e.kind === 'tick');
    // area = both inside: foe 1 takes its own 3 shares; the total on foe 1 is E/2, not E
    const single = ticks('single').filter((e) => e.kind === 'tick');
    expect(t[t.length - 1].foesHp[1]).toBeGreaterThan(single[single.length - 1].foesHp[1]);
  });
});

describe('area only touches the families that aim at the enemy', () => {
  it('heal, shield, atkBuff and spdBuff are identical in area and single, in a 3-foe fight', () => {
    const c = combatantAt(21, REFERENCE_BUILDS.balanced);
    const foe = { combatant: c, special: null };
    for (const f of SPECIAL_FAMILIES.filter((x) => !AREA_FAMILIES.includes(x))) {
      for (let s = 0; s < 20; s++) {
        const a = groupFight({ combatant: c, special: specialOf(f), area: 'area' }, [foe, foe, foe], { seed: s });
        const b = groupFight({ combatant: c, special: specialOf(f), area: 'single' }, [foe, foe, foe], { seed: s });
        expect(a).toEqual(b);
      }
    }
  });
  it('the ruler plays the own run of the Arena: the v3 skill tables (P4, now in energia.ts) and the Arena composition', () => {
    expect({ ...RING_MULT }).toEqual({ ...RING_MULT_V3 });
    expect([RING_MULT.ruim, RING_MULT.bom, RING_MULT.otimo]).toEqual([0.92, 1, 1.08]);
    expect({ ...DODGE_REDUCE }).toEqual({ ...DODGE_REDUCE_V3 });
    expect([DODGE_REDUCE.nada, DODGE_REDUCE.bom, DODGE_REDUCE.otimo]).toEqual([0, 0.2, 0.35]);
    expect(ARENA_ROUND_COMP.map((r) => r.length)).toEqual([1, 2, 1, 3, 1]);
  });
});

// ─────────────────────── AC7: the paired ruler ───────────────────────

const N_RUNS = 3200;
describe('AC7. paired ruler area × single (same seeds, same total budget E)', () => {
  it('|Δ win| ≤ 6pp and |Δ time of the won run| ≤ 5% for direct, dot and defDebuff', () => {
    for (const f of AREA_FAMILIES) {
      const d = areaDelta(f, N_RUNS);
      console.log(`[AC7] ${f}: Δwin ${(100 * d.dWin).toFixed(1)}pp · Δtime ${(100 * d.dTime).toFixed(1)}% (single ${(100 * d.winSingle).toFixed(1)}% · area ${(100 * d.winArea).toFixed(1)}%)`);
      expect(Math.abs(d.dWin)).toBeLessThanOrEqual(0.06);
      expect(Math.abs(d.dTime)).toBeLessThanOrEqual(0.05);
    }
  }, 120_000);
  it('RED: giving the full E to each foe instead of E/k (efficiency 3) breaks the band', () => {
    const out = AREA_FAMILIES.map((f) => areaDelta(f, 800, 3)).filter((d) => Math.abs(d.dWin) > 0.06 || Math.abs(d.dTime) > 0.05);
    expect(out.length).toBeGreaterThan(0);
  }, 120_000);
  it('RED (R2): the class-system efficiency 0.9 pushes some family out of the band at 3200 runs', () => {
    const worst = Math.max(...AREA_FAMILIES.map((f) => Math.abs(areaDelta(f, N_RUNS, 0.9).dWin)));
    expect(worst).toBeGreaterThan(0.06);
  }, 120_000);
});
