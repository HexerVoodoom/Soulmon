/**
 * REGISTRO §65 — reafirmar o dia: o hábito que a pessoa NÃO marcou para aquele dia não aparecia na lista e a virada NÃO o
 * julga (sem falta, sem gasto de escudo). A meta do dia e o coração seguem a regra de sempre (só a lista e a constância mudam).
 */
import { describe, it, expect } from 'vitest';
import { computeDailyReset, restWeekKeyFor } from './dailyReset';
import { emptyRhythm } from './habitRhythm';

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

describe('a virada e o dia reafirmado (REGISTRO §65)', () => {
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

  it('a meta do dia e o total NÃO mudam com o que ficou de fora (decisão do dono: a meta segue a regra atual)', () => {
    const plano = { day: '2026-08-04', offered: ['h1', 'h2'], picked: [], confirmed: true };
    const com: any = computeDailyReset(estado({ dayPlan: plano }) as any, { now: QUARTA } as any);
    const sem: any = computeDailyReset(estado() as any, { now: QUARTA } as any);
    expect(com.lastDayReport.required).toBe(sem.lastDayReport.required);
    expect(com.lastDayReport.total).toBe(sem.lastDayReport.total);
    expect(com.lastDayReport.heartsLost).toBe(sem.lastDayReport.heartsLost);
  });
});
