import { describe, it, expect } from 'vitest';
import { MISSIONS, getMissionProgress, isMissionComplete, isShopItemUnlocked, type MissionState } from './missions';
import { SHOP_ITEMS, DROP_EVO_ITEMS } from './shop';
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

describe('missions — shop unlock gating', () => {
  it('every mission unlocks a distinct shop item, with CSS defined for bg rewards', () => {
    const rewards = MISSIONS.map(m => m.bgReward);
    expect(new Set(rewards).size).toBe(rewards.length);
    for (const id of rewards) {
      const item = SHOP_ITEMS.find(i => i.id === id);
      expect(item, id).toBeDefined();
      expect(item!.unlock).toEqual({ kind: 'mission', missionId: MISSIONS.find(m => m.bgReward === id)!.id });
      if (item!.kind === 'bg') expect(PET_BACKGROUNDS[id]?.css).toBeTruthy();
    }
  });

  it('mission-gated item unlocks only when the mission completes', () => {
    const item = SHOP_ITEMS.find(i => i.id === 'bg-mission-kills-100') ?? SHOP_ITEMS.find(i => i.id === 'bg-mission-coliseum')!;
    const at = (kills: number) => getMissionProgress({ ...base, dungeonKills: kills });
    expect(isMissionComplete('mission-kills-100', at(99))).toBe(false);
    expect(isMissionComplete('mission-kills-100', at(100))).toBe(true);
    expect(isShopItemUnlocked(item, [], at(99))).toBe(false);
    expect(isShopItemUnlocked(item, [], at(100))).toBe(true);
  });

  it('drop-gated items unlock after their first drop; plain items are always unlocked', () => {
    const digimental = DROP_EVO_ITEMS.find(i => i.id === 'digimental-courage')!;
    const progress = getMissionProgress(base);
    expect(isShopItemUnlocked(digimental, [], progress)).toBe(false);
    expect(isShopItemUnlocked(digimental, ['digimental-courage'], progress)).toBe(true);

    const chip = SHOP_ITEMS.find(i => i.id === 'chip-virus')!;
    expect(isShopItemUnlocked(chip, [], progress)).toBe(true);
    // Glitchtama must NOT be sold at all
    expect([...SHOP_ITEMS, ...DROP_EVO_ITEMS].some(i => i.id === 'glitchtama')).toBe(false);
  });
});
