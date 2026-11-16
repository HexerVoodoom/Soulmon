import { describe, it, expect } from 'vitest';
import {
  mondayOf, lastWeekRange, weeklyRetro, pickHardest, needsWeeklyRetro, makeWeeklyBonus, isWeeklyBonusOn,
  weeklyBonusGaugeBonus, weeklyBonusActivityToday, recordWeekStage, evolvedLastWeek, sanitizeWeeklyBonus,
  type RetroState, type RetroHabitLine,
} from './weeklyRetro';
import type { HabitRhythm } from './habitRhythm';

// Segunda 16/11/2026. A semana contada é 09/11 (seg) a 15/11 (dom).
const MON = new Date(2026, 10, 16, 9, 0, 0);
const k = (d: number) => new Date(2026, 10, d).toDateString();
const rhythm = (done: number[], missed: number[] = [], shielded: number[] = []): HabitRhythm => ({
  done: done.map(k), missed: missed.map(k), shielded: shielded.map(k), shields: 0, totalDone: done.length,
});
const state = (over: Partial<RetroState> = {}): RetroState => ({
  activities: [{ id: 'a', name: 'Ler' }, { id: 'b', name: 'Correr' }],
  habitRhythms: { a: rhythm([9, 10, 11, 12], [13]), b: rhythm([9], [10, 11, 12, 13]) },
  completedTasks: [],
  ...over,
});

describe('semana', () => {
  it('segunda e a semana anterior', () => {
    expect(mondayOf(new Date(2026, 10, 15)).getDate()).toBe(9); // domingo volta à segunda anterior
    expect(mondayOf(MON).getDate()).toBe(16);
    const r = lastWeekRange(MON);
    expect([r.from.getDate(), r.to.getDate()]).toEqual([9, 15]);
  });
});

describe('contagens', () => {
  it('conta por hábito dentro de seg a dom e ignora fora da janela', () => {
    const s = state({ habitRhythms: { a: rhythm([2, 9, 10, 16], [11]), b: rhythm([]) } });
    const r = weeklyRetro(s, MON);
    expect(r.habits).toHaveLength(1);
    expect(r.habits[0]).toMatchObject({ id: 'a', done: 2, due: 3 });
    expect(r.totalHabitDone).toBe(2);
  });
  it('escudo conta como feito', () => {
    const r = weeklyRetro(state({ habitRhythms: { a: rhythm([9], [10], [11]) } }), MON);
    expect(r.habits[0]).toMatchObject({ done: 2, due: 3 });
  });
  it('tarefas pontuais só da semana passada', () => {
    const t = (id: string, d: number) => ({ id, name: id, completedAt: new Date(2026, 10, d, 12).toISOString() });
    const r = weeklyRetro(state({ completedTasks: [t('x', 8), t('y', 9), t('z', 15), t('w', 16)] }), MON);
    expect(r.tasks.map(x => x.id)).toEqual(['y', 'z']);
    expect(r.tasksDone).toBe(2);
  });
});

describe('o hábito mais difícil', () => {
  it('menor taxa vence', () => {
    expect(weeklyRetro(state(), MON).hardest?.id).toBe('b');
  });
  const line = (id: string, done: number, due: number): RetroHabitLine => ({ id, name: id, emoji: '', done, due, rate: done / due });
  it('empate de taxa: mais dias perdidos; persistindo, o primeiro', () => {
    expect(pickHardest([line('a', 1, 2), line('b', 2, 4)])?.id).toBe('b');
    expect(pickHardest([line('a', 1, 2), line('b', 1, 2)])?.id).toBe('a');
  });
  it('todos em 100% ou sem dias devidos: ninguém', () => {
    expect(pickHardest([line('a', 3, 3)])).toBeNull();
    expect(pickHardest([line('a', 0, 0)])).toBeNull();
    expect(pickHardest([])).toBeNull();
  });
});

describe('quando abre', () => {
  it('só na segunda, uma vez por semana, e só com algo a contar', () => {
    expect(needsWeeklyRetro(state(), MON)).toBe(true);
    expect(needsWeeklyRetro(state(), new Date(2026, 10, 17))).toBe(false); // terça
    expect(needsWeeklyRetro(state({ lastWeeklyRetroDate: MON.toDateString() }), new Date(2026, 10, 16, 20))).toBe(false);
    expect(needsWeeklyRetro(state({ lastWeeklyRetroDate: k(9) }), MON)).toBe(true);
  });
  it('semana sem dados: silêncio', () => {
    expect(needsWeeklyRetro({ activities: [], habitRhythms: {}, completedTasks: [] }, MON)).toBe(false);
    expect(weeklyRetro({}, MON).hardest).toBeNull();
  });
});

describe('bônus de retorno', () => {
  const b = makeWeeklyBonus('b', MON);
  it('vale de segunda a domingo e expira depois', () => {
    expect(b).toEqual({ activityId: 'b', from: k(16), until: k(22) });
    expect(isWeeklyBonusOn(b, k(16))).toBe(true);
    expect(isWeeklyBonusOn(b, k(22))).toBe(true);
    expect(isWeeklyBonusOn(b, k(23))).toBe(false);
    expect(isWeeklyBonusOn(b, k(15))).toBe(false);
    expect(isWeeklyBonusOn(undefined, k(16))).toBe(false);
  });
  it('só paga com a conclusão real e dentro da janela', () => {
    const feito = (day: string) => [{ id: 'b', completedToday: true, lastCompletedDate: day }];
    expect(weeklyBonusGaugeBonus(b, feito(k(18)), k(18))).toBe(1);
    expect(weeklyBonusGaugeBonus(b, [{ id: 'b', completedToday: false }], k(18))).toBe(0); // ver o cartão não conta
    expect(weeklyBonusGaugeBonus(b, feito(k(23)), k(23))).toBe(0); // expirou
    expect(weeklyBonusGaugeBonus(b, [{ id: 'a', completedToday: true, lastCompletedDate: k(18) }], k(18))).toBe(0);
  });
  it('selo da Home só dentro da janela', () => {
    expect(weeklyBonusActivityToday(b, k(20))).toBe('b');
    expect(weeklyBonusActivityToday(b, k(24))).toBeUndefined();
  });
  it('save sujo vira undefined', () => {
    expect(sanitizeWeeklyBonus({ activityId: 1 })).toBeUndefined();
    expect(sanitizeWeeklyBonus({ activityId: 'a', from: 'lixo', until: k(22) })).toBeUndefined();
    expect(sanitizeWeeklyBonus(b)).toEqual(b);
  });
});

describe('evoluiu nesta semana', () => {
  it('registra a forma da semana uma vez só', () => {
    const l1 = recordWeekStage(undefined, MON, 'rookie');
    expect(recordWeekStage(l1, new Date(2026, 10, 18), 'champion-a')).toBe(l1);
    expect(recordWeekStage(l1, new Date(2026, 10, 23), 'champion-a')).toHaveLength(2);
  });
  it('subiu de forma entre o início da semana passada e hoje', () => {
    const lista = [{ week: k(9), stage: 'rookie' }, { week: k(16), stage: 'champion-a' }];
    expect(evolvedLastWeek(lista, MON, 'champion-a')).toBe('rookie');
  });
  it('mesma forma, sem registro e queda não contam', () => {
    expect(evolvedLastWeek([{ week: k(9), stage: 'champion-a' }], MON, 'champion-a')).toBeNull();
    expect(evolvedLastWeek(undefined, MON, 'champion-a')).toBeNull();
    expect(evolvedLastWeek([{ week: k(2), stage: 'rookie' }], MON, 'champion-a')).toBeNull();
    expect(evolvedLastWeek([{ week: k(9), stage: 'champion-a' }], MON, 'rookie')).toBeNull();
  });
});
