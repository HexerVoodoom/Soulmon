import { describe, it, expect } from 'vitest';
import {
  specialMissionKindFor, specialMissionReached, resolveSpecialMission, specialMissionGaugeBonus,
  markSpecialMissionCredited, tomorrowSpecialKind, sanitizeSpecialMission,
  SPECIAL_MISSION_GAUGE_WEIGHT, type SpecialMissionInputs, type SpecialMissionState,
} from './specialMissions';
import { sanitizeStepGoal, DEFAULT_STEP_GOAL } from './steps';

const day = (n: number) => new Date(2026, 9, 1 + n).toDateString();
const inp = (o: Partial<SpecialMissionInputs> = {}): SpecialMissionInputs => ({
  hasSteps: false, stepsDayKey: day(0), ...o,
});

describe('kindFor', () => {
  it('sem sensor é sempre rest por 14 dias', () => {
    for (let i = 0; i < 14; i++) expect(specialMissionKindFor(day(i), false)).toBe('rest');
  });
  it('com sensor alterna estritamente', () => {
    const k = Array.from({ length: 14 }, (_, i) => specialMissionKindFor(day(i), true));
    for (let i = 1; i < k.length; i++) expect(k[i]).not.toBe(k[i - 1]);
    expect(new Set(k)).toEqual(new Set(['steps', 'rest']));
  });
  it('chave ilegível vira rest; amanhã é o oposto de hoje', () => {
    expect(specialMissionKindFor('lixo', true)).toBe('rest');
    for (let i = 0; i < 6; i++) {
      expect(tomorrowSpecialKind(day(i), true)).toBe(specialMissionKindFor(day(i + 1), true));
      expect(tomorrowSpecialKind(day(i), true)).not.toBe(specialMissionKindFor(day(i), true));
    }
    expect(tomorrowSpecialKind(day(0), false)).toBe('rest');
  });
});

describe('resolve', () => {
  const stepsDay = [0, 1, 2].map(day).find((d) => specialMissionKindFor(d, true) === 'steps')!;
  it('steps vira rest quando o sensor some', () => {
    const prev: SpecialMissionState = { day: stepsDay, kind: 'steps', done: false };
    expect(resolveSpecialMission(prev, stepsDay, inp({ stepsDayKey: stepsDay })).kind).toBe('rest');
  });
  it('latch de steps com meta padrão e escolhida', () => {
    const i = inp({ hasSteps: true, stepsDayKey: stepsDay, steps: { date: stepsDay, today: DEFAULT_STEP_GOAL } });
    const a = resolveSpecialMission(undefined, stepsDay, i);
    expect(a).toMatchObject({ kind: 'steps', done: true, doneDays: [stepsDay] });
    const b = resolveSpecialMission(undefined, stepsDay, { ...i, stepGoal: 10000 });
    expect(b.done).toBe(false);
    const c = resolveSpecialMission(undefined, stepsDay, { ...i, stepGoal: 3000, steps: { date: stepsDay, today: 3000 } });
    expect(c.done).toBe(true);
    // latch: passos caem, continua feita
    expect(resolveSpecialMission(a, stepsDay, { ...i, steps: { date: stepsDay, today: 0 } }).done).toBe(true);
  });
  it('passos de outro dia não contam', () => {
    const i = inp({ hasSteps: true, stepsDayKey: stepsDay, steps: { date: day(-5), today: 99999 } });
    expect(resolveSpecialMission(undefined, stepsDay, i).done).toBe(false);
  });
  it('rest exige onTime e date do dia', () => {
    const d = day(0);
    const mk = (nights: { date: string; onTime: boolean }[]) => resolveSpecialMission(undefined, d, inp({ rest: { nights } }));
    expect(mk([{ date: d, onTime: true }]).done).toBe(true);
    expect(mk([{ date: d, onTime: false }]).done).toBe(false);
    expect(mk([{ date: day(-1), onTime: true }]).done).toBe(false);
    expect(mk([]).done).toBe(false);
    expect(resolveSpecialMission(undefined, d, inp()).done).toBe(false);
  });
  it('virada preserva doneDays/creditedDays e zera done', () => {
    const prev: SpecialMissionState = { day: day(0), kind: 'rest', done: true, doneDays: [day(0)], creditedDays: [day(-1)] };
    const r = resolveSpecialMission(prev, day(1), inp());
    expect(r).toEqual({ day: day(1), kind: 'rest', done: false, doneDays: [day(0)], creditedDays: [day(-1)] });
    expect(Object.keys(resolveSpecialMission(undefined, day(1), inp()))).toEqual(['day', 'kind', 'done']);
  });
  it('mesma referência sem mudança', () => {
    const prev: SpecialMissionState = { day: day(0), kind: 'rest', done: false };
    expect(resolveSpecialMission(prev, day(0), inp())).toBe(prev);
    const done: SpecialMissionState = { ...prev, done: true, doneDays: [day(0)] };
    expect(resolveSpecialMission(done, day(0), inp())).toBe(done);
  });
});

describe('bônus', () => {
  it('1 só no dia julgado e 0 depois de marcado', () => {
    const s: SpecialMissionState = { day: day(1), kind: 'rest', done: false, doneDays: [day(0)] };
    expect(specialMissionGaugeBonus(s, [day(0)])).toBe(SPECIAL_MISSION_GAUGE_WEIGHT);
    expect(SPECIAL_MISSION_GAUGE_WEIGHT).toBe(1);
    expect(specialMissionGaugeBonus(s, [day(5)])).toBe(0);
    expect(specialMissionGaugeBonus(markSpecialMissionCredited(s, [day(0)]), [day(0)])).toBe(0);
    expect(specialMissionGaugeBonus(undefined, [day(0)])).toBe(0);
  });
  it('sem sensor nem janela: done false e bônus 0', () => {
    const r = resolveSpecialMission(undefined, day(0), inp({ rest: { nights: [] } }));
    expect(r.done).toBe(false);
    expect(specialMissionGaugeBonus(r, [day(0)])).toBe(0);
  });
  it('nenhuma função devolve número negativo', () => {
    for (const s of [undefined, { day: 'x', kind: 'rest', done: true, doneDays: ['x'] } as SpecialMissionState]) {
      for (const j of [[], ['x'], ['y']]) expect(specialMissionGaugeBonus(s, j)).toBeGreaterThanOrEqual(0);
    }
    for (const v of [NaN, -5, 0, 1e9, 'a', null, undefined]) expect(sanitizeStepGoal(v)).toBeGreaterThan(0);
  });
});

describe('sanitize', () => {
  it('lixo vira undefined; válido passa', () => {
    for (const x of [null, 1, 'a', [], {}, { day: '', kind: 'rest' }, { day: 'd', kind: 'x' }, { day: 'a'.repeat(41), kind: 'rest' }]) {
      expect(sanitizeSpecialMission(x)).toBeUndefined();
    }
    expect(sanitizeSpecialMission({ day: 'd', kind: 'steps', done: 'true', lastDone: 3, lastCredited: 'c' }))
      .toEqual({ day: 'd', kind: 'steps', done: false, creditedDays: ['c'] });
    expect(sanitizeSpecialMission({ day: 'd', kind: 'rest', done: true, lastDone: 'a', doneDays: ['b', 'b', 3, '', 'c'] }))
      .toEqual({ day: 'd', kind: 'rest', done: true, doneDays: ['b', 'c'] });
    const dez = Array.from({ length: 10 }, (_, i) => `k${i}`);
    expect(sanitizeSpecialMission({ day: 'd', kind: 'rest', done: true, doneDays: dez })!.doneDays).toEqual(dez.slice(-7));
    expect(sanitizeSpecialMission({ day: 'd', kind: 'rest', done: true })).toEqual({ day: 'd', kind: 'rest', done: true });
  });
  it('sanitizeStepGoal', () => {
    expect(sanitizeStepGoal(NaN)).toBe(DEFAULT_STEP_GOAL);
    expect(sanitizeStepGoal('7000')).toBe(DEFAULT_STEP_GOAL);
    expect(sanitizeStepGoal(5)).toBe(1000);
    expect(sanitizeStepGoal(99999)).toBe(30000);
    expect(sanitizeStepGoal(5000.9)).toBe(5000);
    expect(sanitizeStepGoal(Infinity)).toBe(DEFAULT_STEP_GOAL);
  });
  it('reached rest ignora sensor', () => {
    expect(specialMissionReached({ day: 'd', kind: 'rest' }, inp({ rest: { nights: [{ date: 'd', onTime: true }] } }))).toBe(true);
  });
});

describe('descanso: a noite começa na véspera', () => {
  const D = day(0);
  const iso = (d: Date) => d.toISOString();
  const run = (sleptAt: Date) => specialMissionReached(
    { day: D, kind: 'rest' },
    inp({ rest: { nights: [{ date: D, onTime: true, sleptAt: iso(sleptAt) }] } }),
  );
  it('cochilo 22:00 -> 22:05 no próprio dia não conta', () => {
    expect(run(new Date(2026, 9, 1, 22, 0))).toBe(false);
  });
  it('deitar 23:00 de D-1 conta; deitar 00:30 de D (madrugada) conta', () => {
    expect(run(new Date(2026, 8, 30, 23, 0))).toBe(true);
    expect(run(new Date(2026, 9, 1, 0, 30))).toBe(true);
  });
  it('sem sleptAt válido aceita pelo date', () => {
    expect(specialMissionReached({ day: D, kind: 'rest' }, inp({ rest: { nights: [{ date: D, onTime: true }] } }))).toBe(true);
    expect(specialMissionReached({ day: D, kind: 'rest' }, inp({ rest: { nights: [{ date: D, onTime: true, sleptAt: 'lixo' }] } }))).toBe(true);
  });
});
