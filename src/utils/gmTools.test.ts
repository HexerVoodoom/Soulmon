import { describe, it, expect } from 'vitest';
import {
  GM_BALANCE, GM_FORMS, gmGiveBalance, gmUnlockAll, gmGoToForm, gmFillCare, gmAddPerfectDays,
  allBackgroundIds, allFurnitureIds,
} from './gmTools';
import { MISSIONS, getMissionProgress, isMissionComplete } from './missions';
import { getMaxEnergyForStage } from '../types/progression';

const base = () => ({
  gamePoints: 10, emblems: 3, perfectDays: 2, totalPerfectDays: 5, missionPerfectDays: 5,
  ownedBackgrounds: ['bg-room'], ownedFurniture: [] as string[], unlockedEvolutions: ['rookie'],
  dungeonKills: 1, dungeonRunsCompleted: 0, dinoBest: 0,
  evolutionStage: 'rookie', currentBranch: 'harmony' as const,
  healthPoints: 1, maxHealthPoints: 3, energyPoints: 0,
  poopEventsScheduled: [100], poopEventsCompleted: [] as number[], poopEventsShown: [0], poopPenaltyClockAt: 50,
});

describe('gmTools', () => {
  it('saldo: Bits e Emblemas no GM_BALANCE, idempotente, nunca reduz', () => {
    const a = gmGiveBalance(base());
    expect(a.gamePoints).toBe(GM_BALANCE);
    expect(a.emblems).toBe(GM_BALANCE);
    expect(gmGiveBalance(a)).toBe(a);
    const rico = { ...base(), gamePoints: GM_BALANCE + 5, emblems: GM_BALANCE + 9 };
    expect(gmGiveBalance(rico)).toBe(rico);
  });

  it('desbloquear tudo: cenários (mission/guild), decorações (concha), formas e missões — sem tocar dias completos', () => {
    const a = gmUnlockAll(base());
    expect(a.ownedBackgrounds).toEqual(expect.arrayContaining(allBackgroundIds()));
    expect(a.ownedBackgrounds.some(b => b.startsWith('bg-mission-'))).toBe(true);
    expect(a.ownedBackgrounds.some(b => b.startsWith('bg-guild-'))).toBe(true);
    expect(a.ownedFurniture).toEqual(expect.arrayContaining(allFurnitureIds()));
    expect(a.ownedFurniture).toContain('trophy-concha-mare');
    expect(a.unlockedEvolutions).toEqual(expect.arrayContaining([...GM_FORMS]));
    const prog = getMissionProgress({ ...a, evolutionStage: 'rookie' } as never);
    for (const m of MISSIONS) expect(isMissionComplete(m.id, prog)).toBe(true);
    expect(a.perfectDays).toBe(2);
    expect(a.totalPerfectDays).toBe(5);
    expect(gmUnlockAll(a)).toBe(a);
    const veterano = { ...a, dungeonKills: 5000, dungeonRunsCompleted: 40, dinoBest: 8000, missionPerfectDays: 90 };
    expect(gmUnlockAll(veterano)).toBe(veterano);
  });

  it('ir para forma: estágio e galho, HP máximo da forma, id inválido recusado, idempotente', () => {
    const a = gmGoToForm(base(), 'mega-power');
    expect(a.evolutionStage).toBe('mega-power');
    expect(a.currentBranch).toBe('power');
    expect(a.maxHealthPoints).toBe(4);
    expect(a.unlockedEvolutions).toContain('mega-power');
    expect(gmGoToForm(a, 'mega-power')).toBe(a);
    const b = base();
    expect(gmGoToForm(b, 'champion-data')).toBe(b);
    expect(gmGoToForm(b, 'ultra').currentBranch).toBe('harmony');
  });

  it('encher cuidados: HP e energia cheios, cocô limpo, idempotente', () => {
    const a = gmFillCare(base());
    expect(a.healthPoints).toBe(3);
    expect(a.energyPoints).toBe(getMaxEnergyForStage('rookie'));
    expect(a.poopPenaltyClockAt).toBe(0);
    expect(a.poopEventsCompleted).toContain(0);
    expect(gmFillCare(a)).toBe(a);
  });

  it('dias completos: soma N nos dois contadores; N fora de 1..30 recusado', () => {
    const a = gmAddPerfectDays(base(), 7);
    expect(a.perfectDays).toBe(9);
    expect(a.totalPerfectDays).toBe(12);
    const b = base();
    expect(gmAddPerfectDays(b, 0)).toBe(b);
    expect(gmAddPerfectDays(b, 31)).toBe(b);
    expect(gmAddPerfectDays(b, 1.5)).toBe(b);
  });
});
