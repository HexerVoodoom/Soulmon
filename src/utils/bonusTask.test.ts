import { describe, it, expect } from 'vitest';
import { computeDailyReset } from './dailyReset';
import { addBonusTask, bonusActivityIdsOf, bonusTaskGaugeBonus, isBonusActivity, sanitizeBonusTask, BONUS_TASK_GAUGE_WEIGHT } from './bonusTask';

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
    // objeto único (save antigo) vira lista de 1
    expect(sanitizeBonusTask({ day: ONTEM, activityId: 'h1' })).toEqual([{ day: ONTEM, activityId: 'h1' }]);
    expect(sanitizeBonusTask([{ day: ONTEM, activityId: 'h1' }, { day: ONTEM, activityId: 'h1' }, { day: '', activityId: 'x' }, { day: ONTEM, activityId: 'h2' }]))
      .toEqual([{ day: ONTEM, activityId: 'h1' }, { day: ONTEM, activityId: 'h2' }]);
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

describe('várias tarefas bônus no mesmo dia (regressão: slot único perdia a primeira)', () => {
  it('aceitar uma segunda NÃO sobrescreve a primeira; repetir a mesma não duplica', () => {
    let l = addBonusTask(undefined, 'h1', ONTEM);
    l = addBonusTask(l, 'h2', ONTEM);
    l = addBonusTask(l, 'h1', ONTEM);
    expect(bonusActivityIdsOf(l, ONTEM).sort()).toEqual(['h1', 'h2']);
    expect(isBonusActivity(l, 'h1', ONTEM)).toBe(true);
    expect(isBonusActivity(l, 'h2', ONTEM)).toBe(true);
  });
  it('bônus de dia antigo sai ao aceitar um de hoje', () => {
    const l = addBonusTask([{ day: 'antigo', activityId: 'h9' }], 'h1', ONTEM);
    expect(l).toEqual([{ day: ONTEM, activityId: 'h1' }]);
  });
  it('paga +1 POR bônus concluído', () => {
    const l = [{ day: ONTEM, activityId: 'h1' }, { day: ONTEM, activityId: 'h2' }];
    const h2 = (done: boolean) => ({ ...habito(done), id: 'h2' });
    expect(bonusTaskGaugeBonus(l, [habito(true), h2(true)], ONTEM)).toBe(2 * BONUS_TASK_GAUGE_WEIGHT);
    expect(bonusTaskGaugeBonus(l, [habito(true), h2(false)], ONTEM)).toBe(BONUS_TASK_GAUGE_WEIGHT);
  });
  it('na virada: 2 bônus concluídos rendem +2 acima do teto', () => {
    const h2 = { ...habito(true), id: 'h2' };
    const bonusTask = [{ day: ONTEM, activityId: 'h1' }, { day: ONTEM, activityId: 'h2' }];
    const sem: any = computeDailyReset(st(9, 9, { activities: [habito(true), h2] }) as any, { now: NOW });
    const com: any = computeDailyReset(st(9, 9, { activities: [habito(true), h2], bonusTask }) as any, { now: NOW });
    expect(com.evolutionPoints - sem.evolutionPoints).toBe(2);
    expect(com.lastDayReport.bonusTaskBonus).toBe(2);
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

describe('bônus de retorno semanal na virada', () => {
  const janela = { activityId: 'h1', from: new Date(2026, 9, 12).toDateString(), until: new Date(2026, 9, 18).toDateString() };
  const pontos = (over: Record<string, unknown>) =>
    (computeDailyReset(st(9, 9, over) as never, { now: NOW }) as unknown as { evolutionPoints: number }).evolutionPoints;
  it('rende +1 acima do teto quando o hábito foi concluído dentro da janela', () => {
    expect(pontos({ activities: [habito(true)], weeklyBonus: janela }) - pontos({ activities: [habito(true)] })).toBe(1);
  });
  it('janela vencida ou hábito não concluído não rende', () => {
    const vencida = { ...janela, from: new Date(2026, 9, 1).toDateString(), until: new Date(2026, 9, 7).toDateString() };
    const sem = pontos({ activities: [habito(true)] });
    expect(pontos({ activities: [habito(true)], weeklyBonus: vencida })).toBe(sem);
    expect(pontos({ activities: [habito(false)], weeklyBonus: janela })).toBe(7 + 4);
  });
});
