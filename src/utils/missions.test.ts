import { describe, it, expect } from 'vitest';
import { MISSIONS, getMissionProgress, isMissionComplete, isShopItemUnlocked, sanitizeMissionsClaimed, completedMissionIds, hasUnclaimedMission, type MissionState } from './missions';
import { SHOP_ITEMS } from './shop';
import { PET_BACKGROUNDS } from './backgrounds';

const base: MissionState = {
  evolutionStage: 'veemon',
  unlockedEvolutions: ['veemon'],
  dungeonKills: 0,
  dungeonRunsCompleted: 0,
  dinoBest: 0,
  totalPerfectDays: 0,
  missionPerfectDays: 0,
};

describe('missions — progress', () => {
  it('stage missions trigger on reaching the level (current OR unlocked forms)', () => {
    const p0 = getMissionProgress(base);
    expect(p0['mission-champion']).toBe(0);
    expect(p0['mission-mega']).toBe(0);

    /* ⚠️ Este caso usava ids de espécie de outra franquia ('greymon',
       'veemon', 'imperialdramon') porque `getStageLevel` os reconhecia por
       `LEGACY_FORM_TIERS`. A tabela foi apagada em 07/09/2026 — ver
       `types/progression.ts`. Os ids do ESQUEMA DA ÁRVORE testam a mesma
       regra e são os únicos que um save real carrega. */
    // Current form at champion (item form counts too)
    const champ = getMissionProgress({ ...base, evolutionStage: 'champion-power' });
    expect(champ['mission-champion']).toBe(1);
    expect(champ['mission-mega']).toBe(0);

    // Ever-unlocked mega counts even after degeneration back to rookie
    const mega = getMissionProgress({ ...base, evolutionStage: 'rookie', unlockedEvolutions: ['champion-power', 'mega-harmony'] });
    expect(mega['mission-champion']).toBe(1);
    expect(mega['mission-mega']).toBe(1);
  });

  it('counter missions clamp at the target', () => {
    const p = getMissionProgress({ ...base, dungeonKills: 250, dinoBest: 5000, totalPerfectDays: 31, missionPerfectDays: 31, dungeonRunsCompleted: 10 });
    expect(p['mission-kills-100']).toBe(100);
    expect(p['mission-dino-1000']).toBe(1000);
    expect(p['mission-perfect-30']).toBe(30);
    expect(p['mission-runs-3']).toBe(3);
  });
});

describe('missions — conquistas de reconhecimento (rodada 6)', () => {
  it('sem cenário não pede resgate, não acende o "?" e usa só contadores do save', () => {
    const novas = MISSIONS.filter(m => !m.bgReward);
    expect(novas.length).toBeGreaterThanOrEqual(10);
    const cheio = getMissionProgress({ ...base, dungeonKills: 9999, dungeonRunsCompleted: 99, feats: { barrageBest: 5000, zipSolved: 99, patchesSolved: 99, rogueFloors: 99, dinoNormalBest: 9999, dinoDashSmashed: 99, pptNormalWins: 99, clanShopBuys: 9, regens: 2, focusPrepared: 99, rankTier: 4 } });
    for (const m of novas) expect(cheio[m.id], m.id).toBe(m.target);
    expect(hasUnclaimedMission(cheio, [...MISSIONS.filter(m => m.bgReward).map(m => m.id)])).toBe(false);
    expect(completedMissionIds(cheio).every(id => !!MISSIONS.find(m => m.id === id)!.bgReward)).toBe(true);
  });
  it('save antigo (sem feats) = tudo zero nas novas; voz sem cobrança nem contagem de tarefas', () => {
    const p = getMissionProgress(base);
    for (const m of MISSIONS.filter(x => !x.bgReward && !/rift/.test(x.id))) expect(p[m.id], m.id).toBe(0);
    for (const m of MISSIONS) expect(`${m.namePt} ${m.descPt} ${m.nameEn} ${m.descEn}`).not.toMatch(/tarefa|task|streak|sequência|perder|lose|não esqueça/i);
  });
});

describe('missions — shop unlock gating', () => {
  it('every mission unlocks a distinct shop item, with CSS defined for bg rewards', () => {
    const rewards = MISSIONS.map(m => m.bgReward).filter((x): x is string => !!x);
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
    expect(isShopItemUnlocked(item, at(99))).toBe(false);
    expect(isShopItemUnlocked(item, at(100))).toBe(true);
  });

  it('plain (unlock-less) items are always unlocked; Glitchtama is never sold', () => {
    const progress = getMissionProgress(base);
    const chip = SHOP_ITEMS.find(i => i.id === 'chip-power')!;
    expect(isShopItemUnlocked(chip, progress)).toBe(true);
    expect(SHOP_ITEMS.some(i => i.id === 'glitchtama')).toBe(false);
  });
});

describe('resgate explícito da conquista (REGISTRO §56)', () => {
  const item = { id: 'bg-x', unlock: { kind: 'mission', missionId: 'mission-dino-1000' } } as unknown as Parameters<typeof isShopItemUnlocked>[0];
  const feito = { 'mission-dino-1000': 1000 };
  it('cumprir NÃO basta: sem o resgate a compra segue fechada; resgatada, abre. Resgatar só libera (não há item a conceder aqui)', () => {
    expect(isShopItemUnlocked(item, feito, false, [])).toBe(false);
    expect(isShopItemUnlocked(item, feito, false, ['mission-dino-1000'])).toBe(true);
    expect(isShopItemUnlocked(item, { 'mission-dino-1000': 999 }, false, ['mission-dino-1000'])).toBe(false);
  });
  it('save não migrado (claimed ausente): a liberação segue automática, ninguém perde acesso', () => {
    expect(isShopItemUnlocked(item, feito)).toBe(true);
  });
  it('migração: os ids cumpridos agora; pendência só existe com o campo presente', () => {
    expect(completedMissionIds(feito)).toEqual(['mission-dino-1000']);
    expect(hasUnclaimedMission(feito, undefined)).toBe(false);
    expect(hasUnclaimedMission(feito, [])).toBe(true);
    expect(hasUnclaimedMission(feito, completedMissionIds(feito))).toBe(false);
  });
  it('sanitize: só ids do catálogo, sem repetição', () => {
    expect(sanitizeMissionsClaimed(null)).toBeUndefined();
    expect(sanitizeMissionsClaimed(['mission-mega', 'mission-mega', 'x', 3])).toEqual(['mission-mega']);
  });
});
