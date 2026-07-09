import { describe, it, expect } from 'vitest';
import { MISSIONS, getMissionProgress, isMissionClaimable, type MissionState } from './missions';
import { PET_BACKGROUNDS } from './backgrounds';

const base: MissionState = {
  evolutionStage: 'veemon',
  unlockedEvolutions: ['veemon'],
  dungeonKills: 0,
  dungeonRunsCompleted: 0,
  dinoBest: 0,
  totalPerfectDays: 0,
};

describe('missions — progress', () => {
  it('stage missions trigger on reaching the level (current OR unlocked forms)', () => {
    const p0 = getMissionProgress(base);
    expect(p0['mission-champion']).toBe(0);
    expect(p0['mission-mega']).toBe(0);

    // Current form at champion (item form counts too)
    const champ = getMissionProgress({ ...base, evolutionStage: 'greymon' });
    expect(champ['mission-champion']).toBe(1);
    expect(champ['mission-mega']).toBe(0);

    // Ever-unlocked mega counts even after degeneration back to rookie
    const mega = getMissionProgress({ ...base, evolutionStage: 'veemon', unlockedEvolutions: ['imperialdramon'] });
    expect(mega['mission-champion']).toBe(1);
    expect(mega['mission-mega']).toBe(1);
  });

  it('counter missions clamp at the target', () => {
    const p = getMissionProgress({ ...base, dungeonKills: 250, dinoBest: 5000, totalPerfectDays: 31, dungeonRunsCompleted: 10 });
    expect(p['mission-kills-100']).toBe(100);
    expect(p['mission-dino-1000']).toBe(1000);
    expect(p['mission-perfect-30']).toBe(30);
    expect(p['mission-runs-3']).toBe(3);
  });
});

describe('missions — claim', () => {
  const kills = MISSIONS.find(m => m.id === 'mission-kills-100')!;

  it('claimable only when complete and background not yet owned', () => {
    expect(isMissionClaimable(kills, { ...base, dungeonKills: 99 }, [])).toBe(false);
    expect(isMissionClaimable(kills, { ...base, dungeonKills: 100 }, [])).toBe(true);
    expect(isMissionClaimable(kills, { ...base, dungeonKills: 100 }, [kills.bgReward])).toBe(false);
  });

  it('every mission rewards a distinct background with CSS defined', () => {
    const bgs = MISSIONS.map(m => m.bgReward);
    expect(new Set(bgs).size).toBe(bgs.length);
    for (const bg of bgs) expect(PET_BACKGROUNDS[bg]?.css).toBeTruthy();
  });
});
