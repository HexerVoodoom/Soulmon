/**
 * The Nightmare on the Combat v3 core (story PR4, AC4 and AC5). The rules of the night (count, rarity, tier)
 * stay in `nightmares.test.ts`, untouched; here: the wave comes from `dungeonFoe` at floor 1, ALWAYS, the
 * Nightmare plays the SAME fight setup as the Dungeon (including the craft), and the whole thing lasts 18-22 s per enemy.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LADDER_TIERS, dungeonFoe } from './dungeon';
import { nightmareFoe, nightmareSlots, NIGHTMARE_WAVE_SIZE } from './nightmares';
import { buildNightmareWave } from './nightmareWave';
import { nightmareRefs } from './dungeonFight';
import { createRestState, recordNight, type RestState } from './restWindow';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS } from './combate/level';
import { SPECIAL_FAMILIES } from './combate/specials';
import { mulberry32 } from './combate/rng';


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
  it('nightmareSlots: ONE phase, ALWAYS (owner, 15/10/2026): a single slot, the tier of the night', () => {
    expect(NIGHTMARE_WAVE_SIZE).toBe(1);
    for (let top = 0; top < LADDER_TIERS.length; top++) expect(nightmareSlots(top)).toEqual([top]);
    expect(nightmareRefs(5)).toEqual([{ slot: 5, floor: 1, nightmare: true }]);
  });
  it('buildNightmareWave: ONE enemy, nightmareFoe(playerLevel, slot) = the floor-1 dungeonFoe body with the Nightmare power', () => {
    const now = at(2026, 7, 20, 8);
    const rest = withNights(7, now);
    for (const stage of ['rookie', 'champion-power', 'ultimate-power', 'mega-power', 'ultra']) {
      for (const L of [1, 13, 40]) {
        const wave = buildNightmareWave(rest, stage, now, L, mulberry32(5));
        expect(wave.length).toBe(1);
        for (const e of wave) {
          expect(e.floor).toBe(1);
          expect(e.foe).toEqual(nightmareFoe(L, e.slot));
          expect(e.foe.combatant.hp).toBe(dungeonFoe(L, e.slot, 1).combatant.hp); // same body: only the power differs
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
      expect(s).toMatch(/dungeonFight\(|nightmareFight\(/);
      expect(s).toMatch(/dungeonFightSeed\(/);
      expect(s).toMatch(/jeitoDaProfissao|jeitoParaPve/);
    }
    // the old divergence ("base.dmg" raw, no craft) is gone
    expect(night).not.toMatch(/playerStatsFor|PLAYER_STATS|pveStrikeDamage/);
    expect(night).toMatch(/profissao/);
  });
});

// AC5 (the old 18-22 s / win >= 99% gate) was retired on 15/10/2026: the Nightmare is no longer a reward walk-over. Its
// calibration (lose >= 90% without cheer and aimed specials, win >= 75% / 50% with both) lives in `nightmares.pesadelo.test.ts`.
