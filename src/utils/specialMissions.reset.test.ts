import { describe, it, expect } from 'vitest';
import { computeDailyReset } from './dailyReset';
import { resolveSpecialMission } from './specialMissions';

const NOW = new Date(2026, 9, 13, 0, 5);
const ONTEM = new Date(2026, 9, 12).toDateString();
const st = (done: number, total: number, over: Record<string, unknown> = {}) => ({
  activities: [], completedTasks: [], healthPoints: 3, maxHealthPoints: 3, perfectDays: 0, totalXP: 0,
  powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0, evolutionStage: 'rookie', unlockedEvolutions: ['rookie'],
  degeneratedByHP: false, currentBranch: 'harmony', lastDayWasPerfect: false, energyPoints: 0,
  lastResetDate: ONTEM, evolutionPoints: 7,
  lastDayReport: { saveDay: 30 },
  tasks: Array.from({ length: total }, (_, i) => ({ id: `t${i}`, name: 'x', category: 'work', emoji: '', completed: i < done })),
  ...over,
});
const mission = { day: ONTEM, kind: 'rest', done: true, doneDays: [ONTEM] };

describe('missão especial na virada', () => {
  it('soma 1 acima do teto, sem mexer em selo/coração/bits', () => {
    for (const [done, total] of [[3, 5], [9, 9], [0, 4]] as const) {
      const sem: any = computeDailyReset(st(done, total) as any, { now: NOW });
      const com: any = computeDailyReset(st(done, total, { specialMission: mission }) as any, { now: NOW });
      expect(com.evolutionPoints).toBe(sem.evolutionPoints + 1);
      expect(com.lastDayReport.specialBonus).toBe(1);
      expect(sem.lastDayReport.specialBonus).toBe(0);
      expect(com.lastDayReport.gaugeGain).toBe(sem.lastDayReport.gaugeGain + 1);
      for (const k of ['lastDayWasPerfect', 'totalPerfectDays', 'perfectDays', 'healthPoints', 'gamePoints', 'missionPerfectDays']) {
        expect(com[k]).toEqual(sem[k]);
      }
    }
    // dia que já bateu o teto (9/9 no rookie = 4) continua ganhando o +1
    const cheio: any = computeDailyReset(st(9, 9, { specialMission: mission }) as any, { now: NOW });
    expect(cheio.evolutionPoints).toBe(7 + 4 + 1);
  });
  it('segunda virada não credita de novo', () => {
    const r1: any = computeDailyReset(st(3, 5, { specialMission: mission }) as any, { now: NOW });
    expect(r1.specialMission.creditedDays).toEqual([ONTEM]);
    const r2: any = computeDailyReset(st(3, 5, { specialMission: r1.specialMission }) as any, { now: NOW });
    expect(r2.lastDayReport.specialBonus).toBe(0);
    expect(r2.evolutionPoints).toBe(10);
  });
  it('doneDays de outro dia vale 0', () => {
    const r: any = computeDailyReset(st(3, 5, { specialMission: { ...mission, doneDays: [new Date(2026, 9, 1).toDateString()] } }) as any, { now: NOW });
    expect(r.evolutionPoints).toBe(10);
    expect(r.lastDayReport.specialBonus).toBe(0);
  });
});

describe('bônus não se perde quando D+1 resolve antes da virada', () => {
  it('resolve D+1 com noite D+1 gravada, depois a virada julga D: bônus 1; segunda virada 0', () => {
    const D1 = new Date(2026, 9, 13).toDateString();
    const nights = [{ date: D1, onTime: true, sleptAt: new Date(2026, 9, 12, 22, 0).toISOString() }];
    const resolved = resolveSpecialMission(mission as any, D1, { hasSteps: false, stepsDayKey: D1, rest: { nights } });
    expect(resolved.done).toBe(true);
    expect(resolved.doneDays).toEqual([ONTEM, D1]);
    const r1: any = computeDailyReset(st(3, 5, { specialMission: resolved }) as any, { now: NOW });
    expect(r1.lastDayReport.specialBonus).toBe(1);
    const r2: any = computeDailyReset(st(3, 5, { specialMission: r1.specialMission }) as any, { now: NOW });
    expect(r2.lastDayReport.specialBonus).toBe(0);
  });
});
