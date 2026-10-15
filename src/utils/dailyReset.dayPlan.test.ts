/**
 * REGISTRO §66 — reafirmar o dia: o hábito que a pessoa NÃO marcou para aquele dia não aparecia na lista e a virada NÃO o
 * julga (sem falta, sem gasto de escudo). A meta do dia e o coração seguem a regra de sempre (só a lista e a constância mudam).
 */
import { describe, it, expect } from 'vitest';
import { computeDailyReset, restWeekKeyFor, dailyGoalFor } from './dailyReset';
import { emptyRhythm } from './habitRhythm';
import { playerDayIso } from './playerDay';

const QUARTA = new Date('2026-08-05T12:00:00');
const ONTEM = new Date('2026-08-04T12:00:00');

const habito = (id: string) => ({
  id, category: 'health', steps: [], weekDays: [0, 1, 2, 3, 4, 5, 6],
  completedToday: false, lastCompletedDate: undefined,
});

const estado = (over: Record<string, unknown> = {}) => ({
  activities: [habito('h1'), habito('h2')], tasks: [], healthPoints: 3, maxHealthPoints: 3, energyPoints: 10,
  perfectDays: 0, totalXP: 0, powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0,
  evolutionStage: 'rookie', unlockedEvolutions: ['rookie'], currentBranch: 'harmony' as const,
  maxActivityCap: 6,
  lastResetDate: ONTEM.toDateString(),
  lastDayReport: { date: new Date('2026-08-03T12:00:00').toDateString(), saveDay: 90 },
  restDaysLeft: 0,
  restWeekKey: restWeekKeyFor(new Date('2026-08-03T12:00:00')),
  habitRhythms: { h1: emptyRhythm(), h2: emptyRhythm() },
  ...over,
});

describe('a virada e o dia reafirmado (REGISTRO §66)', () => {
  it('hábito NÃO marcado naquele dia: sem falta registrada na constância', () => {
    const plano = { day: '2026-08-04', offered: ['h1', 'h2'], picked: ['h2'], confirmed: true };
    const s: any = computeDailyReset(estado({ dayPlan: plano }) as any, { now: QUARTA } as any);
    // h1 ficou de fora: o ritmo dele não ganhou nenhum dia (nem feito, nem perdido).
    expect(s.habitRhythms.h1).toEqual(emptyRhythm());
    // h2 foi marcado e não feito: segue sendo julgado como sempre.
    expect(s.habitRhythms.h2).not.toEqual(emptyRhythm());
  });

  it('sem plano, ou plano de outro dia: todos julgados como antes', () => {
    for (const dayPlan of [undefined, { day: '2026-08-01', offered: ['h1'], picked: [], confirmed: true }]) {
      const s: any = computeDailyReset(estado({ dayPlan }) as any, { now: QUARTA } as any);
      expect(s.habitRhythms.h1).not.toEqual(emptyRhythm());
      expect(s.habitRhythms.h2).not.toEqual(emptyRhythm());
    }
  });

  it('meta limitada ao marcado: marcou 2 (de 4 cadastradas) e fez os 2 -> dia completo, sem perda de coração', () => {
    const acts = ['h1', 'h2', 'h3', 'h4'].map(id => ({ ...habito(id), completedToday: id <= 'h2', lastCompletedDate: id <= 'h2' ? ONTEM.toDateString() : undefined }));
    const plano = { day: '2026-08-04', offered: ['h1', 'h2', 'h3', 'h4'], picked: ['h1', 'h2'], confirmed: true };
    const s: any = computeDailyReset(estado({ activities: acts, dayPlan: plano, evolutionStage: 'champion', unlockedEvolutions: ['rookie', 'champion'], habitRhythms: {} }) as any, { now: QUARTA } as any);
    expect(s.lastDayReport.required).toBe(2);
    expect(s.lastDayReport.total).toBe(2);
    expect(s.lastDayReport.done).toBe(2);
    expect(s.lastDayReport.wasPerfect).toBe(true);
    expect(s.lastDayReport.heartsLost).toBe(0);
  });

  it('marcou 0: sem perda e sem "dia completo" falso', () => {
    const plano = { day: '2026-08-04', offered: ['h1', 'h2'], picked: [], confirmed: true };
    const s: any = computeDailyReset(estado({ dayPlan: plano }) as any, { now: QUARTA } as any);
    expect(s.lastDayReport.required).toBe(0);
    expect(s.lastDayReport.total).toBe(0);
    expect(s.lastDayReport.wasPerfect).toBe(false);
    expect(s.lastDayReport.heartsLost).toBe(0);
    expect(s.totalPerfectDays ?? 0).toBe(0);
  });

  it('sem plano: a meta é a de sempre e o não-feito custa coração (controle)', () => {
    const s: any = computeDailyReset(estado() as any, { now: QUARTA } as any);
    expect(s.lastDayReport.required).toBeGreaterThan(0);
  });

  it('dia do JOGADOR: plano gravado no dia do jogador vale mesmo com o dia do aparelho diferente', () => {
    // âncora UTC+14: o dia do jogador de "2026-08-04 12:00 local" pode ser outro; o plano é achado pelo dia do jogador.
    const tz = { offsetMs: 14 * 3600_000 };
    const dia = playerDayIso(new Date('2026-08-04T12:00:00'), tz as any);
    const plano = { day: dia, offered: ['h1', 'h2'], picked: [], confirmed: true };
    const s: any = computeDailyReset(estado({ dayPlan: plano, playerDayTz: tz }) as any, { now: QUARTA } as any);
    expect(s.lastDayReport.required).toBe(0);
    expect(s.habitRhythms.h1).toEqual(emptyRhythm());
  });

  it('ao vivo: dailyGoalFor (o G do "Missão N/G") segue o marcado e nunca passa dele', () => {
    const acts = ['h1', 'h2', 'h3', 'h4'].map(habito);
    const base = { evolutionStage: 'champion', activities: acts, tasks: [] as any[] };
    const dia = new Date('2026-08-04T12:00:00');
    const plano = { day: '2026-08-04', offered: ['h1', 'h2', 'h3', 'h4'], picked: ['h1', 'h3'], confirmed: true };
    expect(dailyGoalFor(base as any, dia.getDay(), dia.toDateString())).toBeGreaterThanOrEqual(2);
    expect(dailyGoalFor({ ...base, dayPlan: plano } as any, dia.getDay(), dia.toDateString())).toBe(2);
    expect(dailyGoalFor({ ...base, dayPlan: { ...plano, picked: [] } } as any, dia.getDay(), dia.toDateString())).toBe(0);
  });
});
