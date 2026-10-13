import { describe, it, expect } from 'vitest';
import {
  activityBucket, taskIsForToday, isRitualOpen, ritualOpenKey, parseRitualOpen, serializeRitualOpen, RITUAL_OPEN_MAX,
} from './atividadesLista';

describe('activityBucket — Habits (todo dia) × Scheduled (dias específicos)', () => {
  it('7 dias = Habit; semanal, dias alternados, mensal e N×/semana = Scheduled', () => {
    expect(activityBucket({ schedule: { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] } })).toBe('habit');
    expect(activityBucket({ weekDays: [0, 1, 2, 3, 4, 5, 6] })).toBe('habit');
    expect(activityBucket({ schedule: { kind: 'weekdays', days: [1] } })).toBe('scheduled');
    expect(activityBucket({ schedule: { kind: 'weekdays', days: [1, 3, 5] } })).toBe('scheduled');
    expect(activityBucket({ schedule: { kind: 'everyNDays', n: 2, from: 'schedule' } })).toBe('scheduled');
    expect(activityBucket({ schedule: { kind: 'everyNDays', n: 30, from: 'completion' } })).toBe('scheduled');
    expect(activityBucket({ schedule: { kind: 'timesPerWeek', target: 3 } })).toBe('scheduled');
  });
});

describe('taskIsForToday — início futuro fica fora da Home', () => {
  const agora = new Date(2026, 9, 14, 10, 0, 0);
  it('sem data, hoje e passado = de hoje; amanhã = não', () => {
    expect(taskIsForToday({}, agora)).toBe(true);
    expect(taskIsForToday({ startDate: '2026-10-14' }, agora)).toBe(true);
    expect(taskIsForToday({ startDate: '2026-10-01' }, agora)).toBe(true);
    expect(taskIsForToday({ startDate: '2026-10-15' }, agora)).toBe(false);
    expect(taskIsForToday({ startDate: 'lixo' }, agora)).toBe(true);
  });
});

describe('isRitualOpen — aberta com pendente, recolhida quando tudo feito', () => {
  it('padrão: aberta com filho pendente; recolhida com todos concluídos', () => {
    expect(isRitualOpen({}, 'a', false)).toBe(true);
    expect(isRitualOpen({}, 'a', true)).toBe(false);
    expect(isRitualOpen(undefined, 'a', false)).toBe(true);
  });
  it('a escolha manual vale só para o MESMO estado de conclusão', () => {
    const o = { [ritualOpenKey('a', false)]: false };
    expect(isRitualOpen(o, 'a', false)).toBe(false); // recolhida de propósito
    expect(isRitualOpen(o, 'a', true)).toBe(false);  // concluiu: recolhe por padrão
    const p = { [ritualOpenKey('a', false)]: true };
    expect(isRitualOpen(p, 'a', true)).toBe(false);  // a escolha antiga não segura aberta a concluída
  });
});

describe('persistência da escolha (parse/serialize)', () => {
  it('ida e volta; lixo vira {}; só booleanos entram', () => {
    const o = { 'a|p': false, 'b|d': true };
    expect(parseRitualOpen(serializeRitualOpen(o))).toEqual(o);
    expect(parseRitualOpen(null)).toEqual({});
    expect(parseRitualOpen('{')).toEqual({});
    expect(parseRitualOpen('[1]')).toEqual({});
    expect(parseRitualOpen('{"a":1,"b":true}')).toEqual({ b: true });
    expect(Object.keys(parseRitualOpen('{"__proto__":true}'))).toEqual([]);
  });
  it('o teto guarda as entradas mais recentes', () => {
    const grande: Record<string, boolean> = {};
    for (let i = 0; i < RITUAL_OPEN_MAX + 50; i++) grande[`k${i}|p`] = true;
    const volta = parseRitualOpen(serializeRitualOpen(grande));
    expect(Object.keys(volta)).toHaveLength(RITUAL_OPEN_MAX);
    expect(volta[`k${RITUAL_OPEN_MAX + 49}|p`]).toBe(true);
    expect(volta['k0|p']).toBeUndefined();
  });
});
