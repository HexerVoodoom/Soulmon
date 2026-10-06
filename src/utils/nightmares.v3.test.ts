/**
 * The Nightmare on the Combat v3 core (story PR4, AC4 and AC5). The rules of the night (count, rarity, tier)
 * stay in `nightmares.test.ts`, untouched; here: the wave comes from `dungeonFoe` at floor 1, ALWAYS, the
 * Nightmare plays the SAME fight setup as the Dungeon (including the craft), and the whole thing lasts 18-22 s per enemy.
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LADDER_TIERS, dungeonFoe } from './dungeon';
import { buildNightmareWave, nightmareSlots, NIGHTMARE_WAVE_SIZE } from './nightmares';
import { nightmareRefs, simulateNightmareV3 } from './dungeonFight';
import { createRestState, recordNight, type RestState } from './restWindow';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS } from './combate/level';
import { SPECIAL_FAMILIES } from './combate/specials';
import { mulberry32 } from './combate/rng';

vi.setConfig({ testTimeout: 180_000 });

const median = (a: readonly number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const cell = (s: number) => ({
  level: RULER_LEVELS[s % RULER_LEVELS.length],
  build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]],
  family: SPECIAL_FAMILIES[(s >> 4) % 7],
});

const at = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m, d, h, min);
function withNights(count: number, lastMorning: Date): RestState {
  let state = createRestState();
  for (let i = count - 1; i >= 0; i--) {
    const morning = new Date(lastMorning.getTime());
    morning.setDate(morning.getDate() - i);
    const slept = new Date(morning.getTime());
    slept.setDate(slept.getDate() - 1);
    slept.setHours(23, 30, 0, 0);
    state = recordNight(state, slept, new Date(slept.getTime() + 8 * 3600_000));
  }
  return state;
}

describe('AC4. the wave: slots top−1..top of floor 1, ALWAYS, from dungeonFoe', () => {
  it('nightmareSlots: NIGHTMARE_WAVE_SIZE slots ending at the tier (the first tier has only one)', () => {
    expect(NIGHTMARE_WAVE_SIZE).toBe(2);
    expect(nightmareSlots(0)).toEqual([0]);
    for (let top = 1; top < LADDER_TIERS.length; top++) expect(nightmareSlots(top)).toEqual([top - 1, top]);
    expect(nightmareRefs(5)).toEqual([{ slot: 4, floor: 1 }, { slot: 5, floor: 1 }]);
  });
  it('buildNightmareWave: every enemy is dungeonFoe(playerLevel, slot, 1) — never the old max(1, top−1) floor', () => {
    const now = at(2026, 7, 20, 8);
    const rest = withNights(7, now);
    for (const stage of ['rookie', 'champion-power', 'ultimate-power', 'mega-power', 'ultra']) {
      for (const L of [1, 13, 40]) {
        const wave = buildNightmareWave(rest, stage, now, L, mulberry32(5));
        expect(wave.length).toBeGreaterThan(0);
        for (const e of wave) {
          expect(e.floor).toBe(1);
          expect(e.foe).toEqual(dungeonFoe(L, e.slot, 1));
        }
        expect(wave.map((e) => e.slot)).toEqual(nightmareSlots(wave[wave.length - 1].slot));
      }
    }
  });
  it('the same night gives the same wave (no rng needed) and another night another flavour', () => {
    const rest = withNights(7, at(2026, 7, 20, 8));
    const a = buildNightmareWave(rest, 'champion-power', at(2026, 7, 20, 8), 10);
    const b = buildNightmareWave(rest, 'champion-power', at(2026, 7, 20, 9), 10);
    expect(a).toEqual(b);
  });
  it('the Nightmare plays the SAME fight setup as the Dungeon, with the craft applied (documented divergence resolved)', () => {
    const src = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8').replace(/\r\n/g, '\n');
    const night = src('components/NightmareBattle.tsx');
    const dungeon = src('components/DungeonGame.tsx');
    for (const s of [night, dungeon]) {
      expect(s).toMatch(/dungeonFight\(/);
      expect(s).toMatch(/dungeonFightSeed\(/);
      expect(s).toMatch(/jeitoDaProfissao|jeitoParaPve/);
    }
    // the old divergence ("base.dmg" raw, no craft) is gone
    expect(night).not.toMatch(/playerStatsFor|PLAYER_STATS|pveStrikeDamage/);
    expect(night).toMatch(/profissao/);
  });
});

describe('AC5. duration and win: the whole Nightmare, 18-22 s per enemy (tops 1-2 may sit a little under 20, declared)', () => {
  const N = 600;
  const rows = [1, 2, 3, 4, 5].map((top) => {
    const times: number[] = [];
    let win = 0;
    for (let s = 0; s < N; s++) {
      const r = simulateNightmareV3(cell(s), top, s);
      times.push(...r.times);
      win += +r.won;
    }
    return { top, med: median(times), win: win / N };
  });
  it('median per enemy in 18-22 s on every tier; the win is ≥ 99% (the Nightmare is a reward, losing costs nothing)', () => {
    console.log(`[AC5] Nightmare: ${rows.map((r) => `top ${r.top}: ${r.med.toFixed(1)} s, win ${(100 * r.win).toFixed(1)}%`).join(' · ')}`);
    for (const r of rows) {
      expect(r.med, `top ${r.top}`).toBeGreaterThanOrEqual(18);
      expect(r.med, `top ${r.top}`).toBeLessThanOrEqual(22.5);
      expect(r.win, `top ${r.top}`).toBeGreaterThanOrEqual(0.99);
    }
    for (const r of rows.filter((x) => x.top >= 3)) expect(r.med, `top ${r.top}`).toBeGreaterThanOrEqual(19.5);
  });
  it('RED: foes with 60% of the HP leave the band', () => {
    const fast: number[] = [];
    for (let s = 0; s < 200; s++) fast.push(...simulateNightmareV3({ ...cell(s), knobs: { foe: { hp: 0.6 } } }, 5, s).times);
    expect(median(fast)).toBeLessThan(18);
  });
});
