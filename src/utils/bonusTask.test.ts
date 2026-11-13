import { describe, it, expect } from 'vitest';
import { computeDailyReset } from './dailyReset';
import { bonusTaskGaugeBonus, isBonusActivity, sanitizeBonusTask, BONUS_TASK_GAUGE_WEIGHT } from './bonusTask';

const NOW = new Date(2026, 9, 13, 0, 5);
const ONTEM = new Date(2026, 9, 12).toDateString();
const habito = (done: boolean) => ({
  id: 'h1', name: 'Alongar', category: 'health', emoji: '', steps: [],
  completedToday: done, lastCompletedDate: done ? ONTEM : undefined,
});
const st = (done: number, total: number, over: Record<string, unknown> = {}) => ({
  activities: [], completedTasks: [], healthPoints: 3, maxHealthPoints: 3, perfectDays: 0, totalXP: 0,
  powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0, evolutionStage: 'rookie', unlockedEvolutions: ['rookie'],
  degeneratedByHP: false, currentBranch: 'harmony', lastDayWasPerfect: false, energyPoints: 0,
  lastResetDate: ONTEM, evolutionPoints: 7,
  lastDayReport: { saveDay: 30 },
  tasks: Array.from({ length: total }, (_, i) => ({ id: `t${i}`, name: 'x', category: 'work', emoji: '', completed: i < done })),
  ...over,
});

describe('tarefa bônus — regra pura', () => {
  it('sanitiza o save', () => {
    expect(sanitizeBonusTask({ day: ONTEM, activityId: 'h1' })).toEqual({ day: ONTEM, activityId: 'h1' });
    expect(sanitizeBonusTask({ day: '', activityId: 'h1' })).toBeUndefined();
    expect(sanitizeBonusTask('x')).toBeUndefined();
    expect(sanitizeBonusTask(undefined)).toBeUndefined();
  });
  it('só é bônus no próprio dia', () => {
    const s = { day: ONTEM, activityId: 'h1' };
    expect(isBonusActivity(s, 'h1', ONTEM)).toBe(true);
    expect(isBonusActivity(s, 'h2', ONTEM)).toBe(false);
    expect(isBonusActivity(s, 'h1', NOW.toDateString())).toBe(false);
  });
  it('paga só se a atividade foi concluída no dia dela', () => {
    const s = { day: ONTEM, activityId: 'h1' };
    expect(bonusTaskGaugeBonus(s, [habito(true)], ONTEM)).toBe(BONUS_TASK_GAUGE_WEIGHT);
    expect(bonusTaskGaugeBonus(s, [habito(false)], ONTEM)).toBe(0);
    expect(bonusTaskGaugeBonus(undefined, [habito(true)], ONTEM)).toBe(0);
  });
});

describe('tarefa bônus na virada: +1 ACIMA do teto diário', () => {
  it('dia no teto (rookie = 4) + bônus concluído = 5; não mexe em selo/coração', () => {
    const bonusTask = { day: ONTEM, activityId: 'h1' };
    const sem: any = computeDailyReset(st(9, 9, { activities: [habito(true)] }) as any, { now: NOW });
    const com: any = computeDailyReset(st(9, 9, { activities: [habito(true)], bonusTask }) as any, { now: NOW });
    expect(sem.evolutionPoints).toBe(7 + 4);
    expect(com.evolutionPoints).toBe(7 + 4 + 1);
    expect(com.lastDayReport.bonusTaskBonus).toBe(1);
    expect(com.lastDayReport.specialBonus).toBe(0);
    for (const k of ['lastDayWasPerfect', 'perfectDays', 'healthPoints', 'gamePoints']) expect(com[k]).toEqual(sem[k]);
    // A virada encerra a tarefa bônus: a segunda não paga de novo.
    expect(com.bonusTask).toBeUndefined();
  });
  it('bônus aceito e NÃO concluído não rende nada', () => {
    const r: any = computeDailyReset(st(9, 9, { activities: [habito(false)], bonusTask: { day: ONTEM, activityId: 'h1' } }) as any, { now: NOW });
    expect(r.evolutionPoints).toBe(7 + 4);
    expect(r.lastDayReport.bonusTaskBonus).toBe(0);
  });
});
