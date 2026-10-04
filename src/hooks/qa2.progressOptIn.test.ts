/**
 * QA2 (04/10/2026) — a barra do dia (`doneWeightFor`) contava a conclusão de um
 * item `optInOnly` do catálogo (protocolos de TCC) com peso 1, enquanto a meta
 * (`registeredForDay`) e a VIRADA (`computeDailyReset`) dão peso 0 a ele (V2 da
 * revisão de psicologia, 28/09). Resultado: com 2 hábitos comuns + 1 de TCC, o
 * jogador via "2/2 — dia completo" feito 1 comum + o de TCC, e a virada contava
 * 1/2. A tela prometia um dia que a virada não conta.
 */
import { describe, it, expect } from 'vitest';
import { doneWeightFor } from './useProgressTracking';
import { computeDailyReset, dailyGoalFor, registeredForDay } from '../utils/dailyReset';

const HOJE = new Date(2026, 9, 7, 12); // quarta
const KEY = HOJE.toDateString();

const hab = (id: string, extra: Record<string, unknown> = {}) => ({
  id, name: id, category: 'Health', emoji: '💧', steps: [], weekDays: [0, 1, 2, 3, 4, 5, 6],
  completedToday: false, ...extra,
});
const feito = (a: ReturnType<typeof hab>) => ({ ...a, completedToday: true, lastCompletedDate: KEY });

function estado() {
  return {
    activities: [
      feito(hab('comum-1')),
      hab('comum-2'),
      feito(hab('tcc', { catalogId: 'mente-registro-pensamentos' })),
    ],
    tasks: [],
    completedTasks: [],
    evolutionStage: 'rookie',
    habitRhythms: {},
  };
}

describe('progresso do dia × virada: item optInOnly vale 0', () => {
  it('doneWeightFor não conta o item de TCC', () => {
    expect(doneWeightFor(estado() as any, HOJE.getDay(), KEY)).toBe(1);
  });

  it('a barra (done) e a meta (goal) falam a mesma unidade que a virada', () => {
    const s = estado() as any;
    expect(registeredForDay(s, HOJE.getDay(), KEY)).toBe(2);
    expect(dailyGoalFor(s, HOJE.getDay(), KEY)).toBe(2);
    const feitoUI = doneWeightFor(s, HOJE.getDay(), KEY);
    const amanha = new Date(2026, 9, 8, 9);
    const virou = computeDailyReset({
      ...s, tasks: [], healthPoints: 3, maxHealthPoints: 3, energyPoints: 0, perfectDays: 0, totalXP: 0,
      powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0, unlockedEvolutions: ['rookie'],
      degeneratedByHP: false, currentBranch: 'harmony', lastDayWasPerfect: false, maxActivityCap: 6,
      lastResetDate: KEY, attributesSinceLastEvolution: { power: 0, harmony: 0, benevolence: 0 },
      poopEventsShown: [], poopEventsCompleted: [], lastDayReport: { date: 'x', saveDay: 90 },
    } as any, { now: amanha });
    expect(virou.lastDayReport.done).toBe(feitoUI);
  });
});
