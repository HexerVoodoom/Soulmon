import { describe, it, expect } from 'vitest';
import { computeDailyReset, MAX_HEARTS_LOST_PER_DAY, restWeekKeyFor } from './dailyReset';
import { pardonLine, pardonReasonOf, type PardonReason } from './pardonReason';

const WEDNESDAY = new Date('2026-08-05T12:00:00');
const MONDAY = new Date('2026-08-03T12:00:00');
const runReset = (prev: any, now: Date = WEDNESDAY) => computeDailyReset(prev, { now });

// Mesmo helper de dailyReset/useDailyReset tests: save veterano, folga da semana gasta.
const baseState = () => ({
  activities: [],
  tasks: [] as any[],
  healthPoints: 3,
  maxHealthPoints: 3,
  energyPoints: 10,
  perfectDays: 0,
  totalXP: 0,
  powerPoints: 0,
  harmonyPoints: 0,
  benevolencePoints: 0,
  evolutionStage: 'rookie',
  unlockedEvolutions: ['rookie'],
  currentBranch: 'harmony' as const,
  maxActivityCap: 6,
  lastResetDate: new Date('2026-08-04T12:00:00').toDateString(),
  lastDayReport: { date: new Date('2026-08-03T12:00:00').toDateString(), saveDay: 90 } as any,
  restDaysLeft: 0,
  restWeekKey: restWeekKeyFor(new Date('2026-08-04T12:00:00')),
});
const tasks = (n: number, done: number) => Array.from({ length: n }, (_, i) => ({ id: `t${i}`, completed: i < done }));
const reasonOf = (prev: any, now?: Date) => runReset(prev, now).lastDayReport.pardonReason;

describe('lastDayReport.pardonReason — um teste por motivo', () => {
  it('absence', () => {
    expect(reasonOf({ ...baseState(), tasks: tasks(4, 0), lastResetDate: new Date('2026-07-20T12:00:00').toDateString() })).toBe('absence');
  });
  it('newSave', () => {
    expect(reasonOf({ ...baseState(), tasks: tasks(4, 0), lastDayReport: { date: 'x', saveDay: 0 } })).toBe('newSave');
  });
  it('returnGrace', () => {
    expect(reasonOf({ ...baseState(), tasks: tasks(4, 0), lastDayReport: { date: 'x', saveDay: 90, returnGraceLeft: 2 } })).toBe('returnGrace');
  });
  it('noneRegistered', () => {
    expect(reasonOf({ ...baseState(), tasks: [] })).toBe('noneRegistered');
  });
  it('restDay', () => {
    expect(reasonOf({ ...baseState(), tasks: tasks(4, 0), restDaysLeft: 1 })).toBe('restDay');
  });
  it('rootFloor', () => {
    expect(reasonOf({ ...baseState(), tasks: tasks(4, 0), healthPoints: 1 })).toBe('rootFloor');
  });
  it('stubborn', () => {
    expect(reasonOf({ ...baseState(), tasks: tasks(10, 0), petPassive: 'teimoso' })).toBe('stubborn');
  });
  it('partialGoal', () => {
    expect(reasonOf({ ...baseState(), tasks: tasks(4, 3) })).toBe('partialGoal');
  });
  it('mondayRelief', () => {
    const sunday = new Date('2026-08-02T12:00:00');
    expect(reasonOf({
      ...baseState(), tasks: tasks(4, 0), healthPoints: 2,
      lastResetDate: sunday.toDateString(), restWeekKey: restWeekKeyFor(sunday),
    }, MONDAY)).toBe('mondayRelief');
  });
  it('none', () => {
    expect(reasonOf({ ...baseState(), tasks: tasks(4, 0) })).toBe('none');
  });
});

describe('pardonReasonOf — save antigo', () => {
  it('usa o campo quando válido', () => expect(pardonReasonOf({ pardonReason: 'stubborn' })).toBe('stubborn'));
  it('ignora valor inválido', () => expect(pardonReasonOf({ pardonReason: 'xx' })).toBe('none'));
  it('fallback welcomeBack/restDayUsed/forgiven/nada', () => {
    expect(pardonReasonOf({ welcomeBack: true })).toBe('absence');
    expect(pardonReasonOf({ restDayUsed: true })).toBe('restDay');
    expect(pardonReasonOf({ forgiven: true })).toBe('newSave');
    expect(pardonReasonOf({})).toBe('none');
    expect(pardonReasonOf(undefined)).toBe('none');
  });
});

describe('pardonLine', () => {
  const comLinha: PardonReason[] = ['returnGrace', 'newSave', 'stubborn', 'rootFloor', 'partialGoal', 'noneRegistered'];
  it.each(comLinha)('%s tem linha EN e PT, sem "!"', r => {
    for (const pt of [true, false]) {
      const l = pardonLine(r, pt);
      expect(l).toBeTruthy();
      expect(l).not.toContain('!');
    }
  });
  it('null onde o modal já tem linha', () => {
    for (const r of ['none', 'absence', 'restDay', 'mondayRelief'] as PardonReason[]) expect(pardonLine(r, true)).toBeNull();
  });
});

describe('TESTE DE BUG — dia vazio com folga gasta, save antigo, sem perdão', () => {
  it('0 de 4 feitas perde MAX_HEARTS_LOST_PER_DAY', () => {
    const r = runReset({ ...baseState(), tasks: tasks(4, 0), healthPoints: 3 });
    expect(r.lastDayReport.heartsLost).toBe(MAX_HEARTS_LOST_PER_DAY);
    expect(r.healthPoints).toBe(3 - MAX_HEARTS_LOST_PER_DAY);
  });
});
