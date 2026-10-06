/**
 * The Dungeon on the Combat v3 core (story PR4) — gates AC1, AC2, AC5, AC6, AC7 and AC10 of the story.
 * Every simulation is N = 600+ runs over 15 levels × 4 builds × 7 families (the declared sample of the core:
 * `RULER_LEVELS`, `REFERENCE_BUILDS`, `SPECIAL_FAMILIES`), on the SAME functions the screen plays
 * (`utils/dungeonFight.ts`), so the gate cannot drift from the game.
 *
 * RANGES, not points (risk R1: the sequence of 6 fights with carried HP and energy is sensitive to the
 * coefficients). Each gate has a RED sibling that feeds a sabotaged table and expects the gate to fail.
 * The constants were fitted with `_medir/` (see `builder/balanco-motores.md` §3 and contexto §2.18) —
 * recalibrate by measuring, never by hand.
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DUNGEON_FLOOR_GROWTH, DUNGEON_MIN_HITS, DUNGEON_SLOTS, LADDER_TIERS, buildDungeonWave, dungeonFoe,
} from './dungeon';
import { simulateDungeonRunV3, type DungeonSkill } from './dungeonFight';
import { displayHits, hitsToKnockOut } from './combate/curve';
import { hitUnit } from './combate/fight';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS, combatantAt } from './combate/level';
import { mulberry32 } from './combate/rng';
import { CHEER, PVE_FAMILY_POWER, SPECIAL_FAMILIES, type SpecialFamily } from './combate/specials';

vi.setConfig({ testTimeout: 180_000 });

/** The declared table (the one measured in contexto §2.18) — a change here is a change of balance and needs a new measurement. */
const DECLARED = {
  hp: [0.945, 0.95, 0.955, 0.955, 0.96, 0.965],
  power: [0.026, 0.038, 0.04, 0.06, 0.089, 0.096],
  growth: { hp: 0.14, power: 0.11 },
  /** Floor of the median time per enemy (the story's 20 s). */
  durationFloor: 20,
};

const fam = (i: number): SpecialFamily => SPECIAL_FAMILIES[((i % 7) + 7) % 7];
const mean = (a: readonly number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
const median = (a: readonly number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const pct = (x: number) => `${(100 * x).toFixed(1)}%`;

/** The cell of run `s`: 15 levels × 4 builds × 7 families. */
const cell = (s: number) => ({
  level: RULER_LEVELS[s % RULER_LEVELS.length],
  build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]],
  family: fam(s >> 4),
});

describe('the declared table', () => {
  it('slots, growth and the Dungeon family power', () => {
    expect(DUNGEON_SLOTS.map((s) => s.hp)).toEqual(DECLARED.hp);
    expect(DUNGEON_SLOTS.map((s) => s.power)).toEqual(DECLARED.power);
    expect(DUNGEON_SLOTS.map((s) => !!s.special)).toEqual([false, false, false, false, false, true]);
    expect(DUNGEON_SLOTS).toHaveLength(LADDER_TIERS.length);
    expect({ ...DUNGEON_FLOOR_GROWTH }).toEqual(DECLARED.growth);
    expect(PVE_FAMILY_POWER.dungeon).toEqual({ direct: 1, dot: 1.1, heal: 0.8, shield: 1, atkBuff: 1.3, defDebuff: 1.3, spdBuff: 1.5 });
  });
  it('dungeonFoe(L, slot, floor) = the balanced mirror of L with hp × slot.hp × (1 + g·(f−1)) and bonus slot.power × (1 + p·(f−1)) − 1', () => {
    for (const L of RULER_LEVELS) {
      const b = combatantAt(L, REFERENCE_BUILDS.balanced);
      const f = dungeonFoe(L, 3, 3);
      expect(f.combatant.hp).toBeCloseTo(b.hp * DUNGEON_SLOTS[3].hp * (1 + DUNGEON_FLOOR_GROWTH.hp * 2), 9);
      expect(f.combatant.bonus).toBeCloseTo(DUNGEON_SLOTS[3].power * (1 + DUNGEON_FLOOR_GROWTH.power * 2) - 1, 9);
      expect(f.combatant.atk).toBe(b.atk);
      expect(f.combatant.def).toBe(b.def);
      expect(f.special).toBeNull();
      expect(dungeonFoe(L, 5, 1).special?.family).toBe('direct'); // the mega casts
    }
  });
});

describe('AC1. the ladder climbs in HITS: the mega slot takes at least 1 more displayed hit each floor', () => {
  const hitsOf = (L: number, floor: number, knobs?: Parameters<typeof dungeonFoe>[3]) => {
    const pl = combatantAt(L, REFERENCE_BUILDS.balanced);
    return displayHits(hitsToKnockOut(pl, dungeonFoe(L, 5, floor, knobs).combatant) / hitUnit(L));
  };
  it('floors 1..6, every level of the ruler (L1 measured: see the log)', () => {
    console.log(`[AC1] L1 mega: ${[1, 2, 3, 4, 5, 6].map((f) => hitsOf(1, f)).join('/')}`);
    for (const L of RULER_LEVELS) for (let n = 1; n <= 5; n++) expect(hitsOf(L, n + 1), `L${L} floor ${n}→${n + 1}`).toBeGreaterThanOrEqual(hitsOf(L, n) + 1);
  });
  it('RED: a floor growth in HP of 0.05 does not climb a hit per floor at L1', () => {
    const knobs = { growth: { hp: 0.05, power: DUNGEON_FLOOR_GROWTH.power } };
    const ok = [1, 2, 3, 4, 5].every((n) => hitsOf(1, n + 1, knobs) >= hitsOf(1, n, knobs) + 1);
    expect(ok).toBe(false);
  });
});

describe('AC2. the floor of 3 hits (F2)', () => {
  const weakest = (knobs?: Parameters<typeof dungeonFoe>[3]) => {
    const L = 40;
    const top = combatantAt(L, REFERENCE_BUILDS.atk, 0.05);
    const foe = dungeonFoe(L, 0, 1, knobs).combatant;
    // ATK-pure level-40 player, 5% bonus, with the element advantage (one displayed hit less: hits × 0.9)
    return displayHits((hitsToKnockOut(top, foe) / hitUnit(L)) * 0.9);
  };
  it('the weakest foe (slot 0, floor 1) takes ≥ 3 displayed hits from the strongest attacker', () => {
    console.log(`[AC2] slot 0 floor 1 vs ATK-pure L40 + element: ${weakest()} hits`);
    expect(weakest()).toBeGreaterThanOrEqual(DUNGEON_MIN_HITS);
  });
  it('the floor holds even when the table is sabotaged (hp × 0.2) ...', () => {
    expect(weakest({ hp: 0.2 })).toBeGreaterThanOrEqual(DUNGEON_MIN_HITS);
  });
  it('RED: ... and without the floor the same sabotaged table falls under 3', () => {
    expect(weakest({ hp: 0.2, noFloor: true })).toBeLessThan(DUNGEON_MIN_HITS);
  });
});

describe('AC5 + AC6. the run: duration per enemy and the ladder of floors (same level, `media` skill)', () => {
  const N = 600;
  const runs = Array.from({ length: N * 2 }, (_, s) => simulateDungeonRunV3(cell(s), s, 'media', 8));
  const reached = (n: number) => runs.filter((r) => r.floorsCleared >= n).length / runs.length;
  const byFloor = (f: number) => runs.flatMap((r) => r.timesByFloor[f] ?? []);

  it('AC5: median time per enemy in 20-29 s on floors 1 to 5', () => {
    const med = [0, 1, 2, 3, 4].map((f) => median(byFloor(f)));
    const p95 = [0, 1, 2, 3, 4].map((f) => [...byFloor(f)].sort((a, b) => a - b)[Math.floor(0.95 * byFloor(f).length)]);
    console.log(`[AC5] median/P95: ${med.map((m, i) => `A${i + 1} ${m.toFixed(1)}/${p95[i].toFixed(1)}`).join(' · ')}`);
    for (const [i, m] of med.entries()) {
      expect(m, `floor ${i + 1}`).toBeGreaterThanOrEqual(DECLARED.durationFloor);
      expect(m, `floor ${i + 1}`).toBeLessThanOrEqual(29);
    }
  });
  it('AC6: floors 1-4 ~98-100%, floor 5 ~30-40%, floor 6 ~0% (the wall is the same for every level)', () => {
    console.log(`[AC6] reach: ${[1, 2, 3, 4, 5, 6].map((n) => `${n}:${pct(reached(n))}`).join(' ')}`);
    for (const n of [1, 2, 3, 4]) expect(reached(n), `floor ${n}`).toBeGreaterThanOrEqual(0.97);
    expect(reached(5)).toBeGreaterThanOrEqual(0.28);
    expect(reached(5)).toBeLessThanOrEqual(0.42);
    expect(reached(6)).toBeLessThanOrEqual(0.03);
  });
  it('RED: a floor growth in power of 3 knocks floor 2 down (the gate can fail)', () => {
    const wall = Array.from({ length: 400 }, (_, s) => simulateDungeonRunV3({ ...cell(s), knobs: { foe: { growth: { hp: DUNGEON_FLOOR_GROWTH.hp, power: 3 } } } }, s, 'media', 3));
    expect(wall.filter((r) => r.floorsCleared >= 2).length / wall.length).toBeLessThan(0.5);
  });
  it('RED: foes with 60% of the HP leave the duration band', () => {
    const fast = Array.from({ length: 300 }, (_, s) => simulateDungeonRunV3({ ...cell(s), knobs: { foe: { hp: 0.6 } } }, s, 'media', 2));
    expect(median(fast.flatMap((r) => r.timesByFloor[0] ?? []))).toBeLessThan(DECLARED.durationFloor);
  });
});

describe('AC10. skill (P4): "does not act" × "plays well" ≤ 25pp, measured in the Dungeon', () => {
  const N = 1200;
  /** Mean share of the `floors` floors cleared (the story's "andares limpos"). */
  const cleared = (skill: DungeonSkill, floors: number, patch: Record<string, unknown> = {}) => {
    let w = 0;
    for (let s = 0; s < N; s++) w += simulateDungeonRunV3({ ...cell(s), ...patch }, s, skill, floors).floorsCleared / floors;
    return w / N;
  };
  /** Share of the runs that FINISH the 5 floors (the analogue of "run won" of the Arena). */
  const finishes = (skill: DungeonSkill, patch: Record<string, unknown> = {}) => {
    let w = 0;
    for (let s = 0; s < N; s++) w += +(simulateDungeonRunV3({ ...cell(s), ...patch }, s, skill, 5).floorsCleared >= 5);
    return w / N;
  };
  it('the story metric (ladder of 3 floors) and the mean share of the 5 floors: the gap is ≤ 25pp and more skill never loses', () => {
    for (const floors of [3, 5]) {
      const none = cleared('nenhuma', floors);
      const media = cleared('media', floors);
      const good = cleared('boa', floors);
      console.log(`[AC10] floors cleared (${floors} floors): nenhuma ${pct(none)} · media ${pct(media)} · boa ${pct(good)} → ${(100 * (good - none)).toFixed(1)}pp`);
      expect(good - none, `${floors} floors`).toBeLessThanOrEqual(0.25);
      expect(good).toBeGreaterThanOrEqual(media);
      expect(media).toBeGreaterThanOrEqual(none);
    }
  });
  it('FINDING (reported to the owner, not gated): the gap in FINISHING the 5 floors — the wall of floor 5 is where skill counts', () => {
    const none = finishes('nenhuma');
    const good = finishes('boa');
    console.log(`[AC10 finding] finishes the 5 floors: nenhuma ${pct(none)} · media ${pct(finishes('media'))} · boa ${pct(good)} → ${(100 * (good - none)).toFixed(1)}pp`);
    expect(good).toBeGreaterThan(none);
  });
  it('RED: the old RING_MULT / DODGE_REDUCE (0.75/1/1.35 · 0/0.5/0.85) open a gap far above 25pp in finishing the run', () => {
    const knobs = { ring: { ruim: 0.75, bom: 1, otimo: 1.35 }, dodge: { nada: 0, bom: 0.5, otimo: 0.85 } } as const;
    const gap = finishes('boa', { knobs }) - finishes('nenhuma', { knobs });
    console.log(`[AC10 RED] old tables, finishing the run: ${(100 * gap).toFixed(1)}pp`);
    expect(gap).toBeGreaterThan(0.25);
    expect(gap).toBeGreaterThan(2 * (finishes('boa') - finishes('nenhuma')));
  });
});

describe('PR4b (contexto §2.19): no cheer (torcida) in the Dungeon or the Nightmare — the Soulmon goes alone', () => {
  const ler = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8').replace(/\r\n/g, '\n');
  const semComentarios = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  it('the engine of the sequence has no cheer option', () => {
    expect(semComentarios(ler('utils/dungeonFight.ts'))).not.toMatch(/cheer|DungeonCheer|CHEER/i);
    // the simulation ignores a forged `cheer`: same result with and without the field
    const c = cell(3);
    const a = simulateDungeonRunV3(c, 3, 'media', 5);
    const b = simulateDungeonRunV3({ ...c, cheer: 'teto' } as typeof c, 3, 'media', 5);
    expect(b).toEqual(a);
  });
  for (const tela of ['components/DungeonGame.tsx', 'components/NightmareBattle.tsx']) {
    it(`${tela}: no mascot, no gauge, no tap that cheers, and the hook runs with torcida: false`, () => {
      const src = semComentarios(ler(tela));
      expect(src).not.toMatch(/TorcidaGauge|battle\.cheer|battle\.meter|CHEER_TAPS_FULL/);
      expect(src).not.toMatch(/\bmascot\b/);
      expect(src).toMatch(/torcida:\s*false/);
      expect(src).toMatch(/active=\{false\}/);
    });
  }
});

describe('AC7. no Math.random in the fight or in the wave; the same seed gives the same wave and the same fight', () => {
  const SORTEIO = /Math\s*\.\s*random|crypto\s*\.\s*getRandomValues|Date\s*\.\s*now\s*\(\)\s*%/;
  const semComentarios = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  /** `rollDungeonHeartDrop` KEEPS `Math.random`: it is the heart drop (a raffle), not part of the fight (declared in the story). */
  const semSorteioDeCoracao = (src: string) => src.replace(/export function rollDungeonHeartDrop[\s\S]*$/, '');
  const ler = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8').replace(/\r\n/g, '\n');

  it('dungeon.ts (but the heart drop), nightmares.ts, dungeonFight.ts, DungeonGame.tsx and NightmareBattle.tsx', () => {
    expect(semComentarios(semSorteioDeCoracao(ler('utils/dungeon.ts')))).not.toMatch(SORTEIO);
    for (const f of ['utils/nightmares.ts', 'utils/dungeonFight.ts', 'components/DungeonGame.tsx', 'components/NightmareBattle.tsx']) {
      expect(semComentarios(ler(f)), f).not.toMatch(SORTEIO);
    }
  });
  it('the heart drop is the one place that stays on Math.random (the declared exception)', () => {
    expect(ler('utils/dungeon.ts')).toMatch(/export function rollDungeonHeartDrop[\s\S]*Math\.random\(\)/);
  });
  it('RED: the detector catches a real Math.random (and ignores the name in a comment)', () => {
    expect(semComentarios('const x = Math.random();')).toMatch(SORTEIO);
    expect(semComentarios('const y = 1; // never Math.random\n/* Math.random */')).not.toMatch(SORTEIO);
  });
  it('the same seed gives the same wave (names, sprites, foes) and another seed another one', () => {
    const wave = (seed: number) => buildDungeonWave(3, 'champion-power', mulberry32(seed), 13);
    expect(wave(7)).toEqual(wave(7));
    expect(wave(7).map((e) => e.stage)).not.toEqual(wave(8).map((e) => e.stage));
    expect(wave(7).map((e) => [e.slot, e.floor])).toEqual([[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3]]);
  });
  it('the same seed gives the same run, field by field', () => {
    for (let s = 0; s < 30; s++) expect(simulateDungeonRunV3(cell(s * 7), s, 'media', 5)).toEqual(simulateDungeonRunV3(cell(s * 7), s, 'media', 5));
  });
});
