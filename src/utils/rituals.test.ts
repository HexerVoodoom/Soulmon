import { describe, it, expect } from 'vitest';
import {
  needsCheckIn,
  checkInPlan,
  completeCheckIn,
  needsWeeklyReport,
  weeklyReport,
  stackingSuggestion,
  isFreshStartDay,
  freshStartOffer,
  applyFreshStart,
} from './rituals';
import type { RitualState } from './rituals';
import { emptyRhythm, dayKeyOf } from './habitRhythm';
import type { HabitRhythm } from './habitRhythm';
import { createRestState } from './restWindow';
import { MAX_DAILY_FOCUS } from '../types/taskModel';

// Quarta-feira, meio-dia. Todas as datas do arquivo saem daqui.
const WED = new Date(2026, 7, 19, 12, 0, 0);
const SUN = new Date(2026, 7, 16, 12, 0, 0); // domingo
const MON = new Date(2026, 7, 17, 12, 0, 0); // segunda
const FIRST = new Date(2026, 8, 1, 12, 0, 0); // dia 1 (terça)

function day(offset: number, from: Date = WED): Date {
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + offset);
  return d;
}

function key(offset: number, from: Date = WED): string {
  return dayKeyOf(day(offset, from));
}

function task(id: string, extra: Record<string, unknown> = {}) {
  return { id, name: id, completed: false, ...extra };
}

function base(over: Partial<RitualState> = {}): RitualState {
  return { activities: [], tasks: [], completedTasks: [], ...over };
}

// ---------------------------------------------------------------------------
// Check-in
// ---------------------------------------------------------------------------

describe('needsCheckIn', () => {
  it('pede check-in quando nunca houve um', () => {
    expect(needsCheckIn(base(), WED)).toBe(true);
  });

  it('cala no mesmo dia e volta a pedir no dia seguinte', () => {
    const state = base({ lastCheckInDate: dayKeyOf(WED) });
    expect(needsCheckIn(state, WED)).toBe(false);
    expect(needsCheckIn(state, new Date(2026, 7, 19, 23, 30))).toBe(false);
    expect(needsCheckIn(state, day(1))).toBe(true);
  });
});

describe('checkInPlan — carryOver', () => {
  it('pega só a pendência de ONTEM (não a de hoje, nem a de anteontem, nem a concluída)', () => {
    const state = base({
      tasks: [
        task('ontem-start', { startDate: key(-1) }),
        task('ontem-focus', { focusDate: key(-1) }),
        task('hoje', { startDate: key(0) }),
        task('anteontem', { startDate: key(-2) }),
        task('ontem-feita', { startDate: key(-1), completed: true }),
        task('ontem-someday', { startDate: key(-1), status: 'someday' }),
      ],
    });
    const plan = checkInPlan(state, WED);
    expect(plan.carryOver.map(t => t.id).sort()).toEqual(['ontem-focus', 'ontem-start']);
  });
});

describe('checkInPlan — suggestedFocus', () => {
  it('prioriza a tarefa assombrada', () => {
    const state = base({
      tasks: [
        task('leve', { effort: 1 }),
        task('assombrada', { createdAt: day(-30).toISOString() }),
        task('media', { effort: 2 }),
      ],
    });
    const plan = checkInPlan(state, WED);
    expect(plan.suggestedFocus[0].id).toBe('assombrada');
  });

  it('nunca sugere mais de 3', () => {
    const state = base({
      tasks: Array.from({ length: 9 }, (_, i) => task(`t${i}`)),
    });
    expect(checkInPlan(state, WED).suggestedFocus).toHaveLength(MAX_DAILY_FOCUS);
    expect(MAX_DAILY_FOCUS).toBe(3);
  });

  it('avisa (sem bloquear) quando o dia está sobrecarregado', () => {
    const light = base({ tasks: [task('a', { startDate: key(0), effort: 1 })] });
    expect(checkInPlan(light, WED).overcommitted).toBe(false);

    const heavy = base({
      tasks: [
        task('a', { startDate: key(0), effort: 3 }),
        task('b', { startDate: key(0), effort: 3 }),
        task('c', { startDate: key(0), effort: 3 }),
      ],
    });
    const plan = checkInPlan(heavy, WED);
    expect(plan.plannedEffort).toBe(9);
    expect(plan.overcommitted).toBe(true);
  });
});

describe('completeCheckIn', () => {
  it('grava os focos (até 3) e a data do ritual', () => {
    const state = base({ tasks: [task('a'), task('b'), task('c'), task('d')] });
    const next = completeCheckIn(state, ['a', 'b', 'c', 'd'], dayKeyOf(WED));

    expect(next.lastCheckInDate).toBe(dayKeyOf(WED));
    expect(needsCheckIn(next, WED)).toBe(false);
    const focused = (next.tasks ?? []).filter(t => t.focusDate === dayKeyOf(WED));
    expect(focused.map(t => t.id)).toEqual(['a', 'b', 'c']);
  });
});

// ---------------------------------------------------------------------------
// Relatório semanal
// ---------------------------------------------------------------------------

describe('needsWeeklyReport', () => {
  it('só no domingo', () => {
    expect(needsWeeklyReport(base(), SUN)).toBe(true);
    expect(needsWeeklyReport(base(), MON)).toBe(false);
    expect(needsWeeklyReport(base(), WED)).toBe(false);
  });

  it('uma vez por semana', () => {
    const shown = base({ lastWeeklyReportDate: dayKeyOf(SUN) });
    expect(needsWeeklyReport(shown, SUN)).toBe(false);
    // domingo seguinte: volta a valer
    expect(needsWeeklyReport(shown, day(7, SUN))).toBe(true);
  });
});

describe('weeklyReport', () => {
  it('não quebra com histórico vazio', () => {
    const report = weeklyReport(base(), SUN);
    expect(report.perHabit).toEqual([]);
    expect(report.bestHabitId).toBeNull();
    expect(report.dominantCategory).toBeNull();
    expect(report.tasksDone).toBe(0);
    expect(report.effortDone).toBe(0);
    expect(report.dreams).toBe(0);
  });

  it('lê constância, melhor hábito, categoria dominante e esforço concluído', () => {
    const forte: HabitRhythm = { ...emptyRhythm(), done: [key(-1, SUN), key(-2, SUN), key(-3, SUN)], totalDone: 30 };
    const fraco: HabitRhythm = { ...emptyRhythm(), done: [key(-1, SUN)], missed: [key(-2, SUN), key(-3, SUN)], totalDone: 1 };

    const report = weeklyReport(
      base({
        activities: [
          { id: 'h1', name: 'Ler', emoji: '📖' },
          { id: 'h2', name: 'Correr', emoji: '🏃' },
        ],
        habitRhythms: { h1: forte, h2: fraco },
        completedTasks: [
          { id: 't1', category: 'work', completedAt: day(-1, SUN).toISOString(), effort: 3 },
          { id: 't2', category: 'work', completedAt: day(-2, SUN).toISOString(), effort: 1 },
          { id: 't3', category: 'health', completedAt: day(-2, SUN).toISOString() },
          // fora da semana corrente: não entra
          { id: 't4', category: 'health', completedAt: day(-20, SUN).toISOString(), effort: 3 },
        ],
        rest: { ...createRestState(), dreams: ['dream-aurora', 'dream-campfire'] },
      }),
      SUN,
    );

    expect(report.perHabit).toHaveLength(2);
    expect(report.bestHabitId).toBe('h1');
    expect(report.perHabit[0].tier).toBe('sapling');
    expect(report.dominantCategory).toBe('work');
    expect(report.tasksDone).toBe(3);
    expect(report.effortDone).toBe(3 + 1 + 1);
    expect(report.dreams).toBe(2);
  });
});

describe('stackingSuggestion', () => {
  it('devolve null com pouco dado', () => {
    expect(stackingSuggestion(base(), SUN, 'pt-BR')).toBeNull();

    const magro = base({
      activities: [
        { id: 'h1', name: 'Ler' },
        { id: 'h2', name: 'Correr' },
      ],
      habitRhythms: {
        h1: { ...emptyRhythm(), done: [key(-1, SUN)] },
        h2: { ...emptyRhythm(), missed: [key(-1, SUN)] },
      },
    });
    expect(stackingSuggestion(magro, SUN, 'pt-BR')).toBeNull();
    expect(stackingSuggestion(magro, SUN, 'en')).toBeNull();
  });

  it('ancora o fraco no forte, em PT e em EN', () => {
    const state = base({
      activities: [
        { id: 'h1', name: 'Estudo' },
        { id: 'h2', name: 'Exercício' },
      ],
      habitRhythms: {
        // 5 feitos, todos na terça-feira do histórico → âncora clara
        h1: {
          ...emptyRhythm(),
          done: [key(-1, SUN), key(-2, SUN), key(-3, SUN), key(-4, SUN), key(-5, SUN)],
          totalDone: 5,
        },
        h2: {
          ...emptyRhythm(),
          done: [key(-1, SUN)],
          missed: [key(-2, SUN), key(-3, SUN), key(-4, SUN), key(-5, SUN)],
          totalDone: 1,
        },
      },
    });

    const pt = stackingSuggestion(state, SUN, 'pt-BR');
    expect(pt).toContain('Estudo');
    expect(pt).toContain('Exercício');
    expect(pt).toContain('Que tal');

    const en = stackingSuggestion(state, SUN, 'en');
    expect(en).toContain('Estudo');
    expect(en).toContain('How about');
    expect(en).not.toBe(pt);
  });
});

// ---------------------------------------------------------------------------
// Fresh start
// ---------------------------------------------------------------------------

describe('isFreshStartDay', () => {
  it('é segunda-feira', () => {
    expect(MON.getDay()).toBe(1);
    expect(isFreshStartDay(MON)).toBe(true);
  });

  it('é o dia 1 do mês, mesmo não sendo segunda', () => {
    expect(FIRST.getDate()).toBe(1);
    expect(FIRST.getDay()).not.toBe(1);
    expect(isFreshStartDay(FIRST)).toBe(true);
  });

  it('não é um dia comum', () => {
    expect(isFreshStartDay(WED)).toBe(false);
    expect(isFreshStartDay(SUN)).toBe(false);
  });
});

describe('freshStartOffer', () => {
  it('só aparece em marco, e uma vez só', () => {
    expect(freshStartOffer(base(), WED, 'pt-BR')).toBeNull();

    const offer = freshStartOffer(base(), MON, 'pt-BR');
    expect(offer?.title).toBe('Semana nova');

    const en = freshStartOffer(base(), FIRST, 'en');
    expect(en?.title).toBe('A new month');

    const done = base({ lastFreshStartDate: dayKeyOf(MON) });
    expect(freshStartOffer(done, MON, 'pt-BR')).toBeNull();
  });
});

describe('applyFreshStart', () => {
  it('zera as cobranças pendentes das tarefas ativas', () => {
    const state = base({
      tasks: [
        task('ativa', { postponedCount: 5 }),
        task('inerte', { postponedCount: 4, status: 'someday' }),
      ],
    });
    const next = applyFreshStart(state, MON);
    expect(next.tasks?.find(t => t.id === 'ativa')?.postponedCount).toBe(0);
    // `someday` não é cobrança pendente: já está fora do jogo, e mexer nela
    // seria alterar histórico que ninguém pediu para alterar.
    expect(next.tasks?.find(t => t.id === 'inerte')?.postponedCount).toBe(4);
    expect(next.lastFreshStartDate).toBe(dayKeyOf(MON));
  });

  it('NUNCA apaga progresso: evolução, dias perfeitos, marcos de hábito e sonhos ficam intactos', () => {
    const rhythm: HabitRhythm = {
      ...emptyRhythm(),
      done: [key(-1, MON), key(-2, MON)],
      totalDone: 66,
      shields: 2,
    };
    const state = {
      ...base({
        tasks: [task('a', { postponedCount: 9 })],
        habitRhythms: { h1: rhythm },
        rest: { ...createRestState(), dreams: ['dream-on-the-moon', 'dream-aurora'] },
      }),
      evolutionStage: 'mega',
      perfectDays: 42,
      unlockedEvolutions: ['rookie', 'champion'],
    };

    const next = applyFreshStart(state, MON);

    expect(next.evolutionStage).toBe('mega');
    expect(next.perfectDays).toBe(42);
    expect(next.unlockedEvolutions).toEqual(['rookie', 'champion']);
    expect(next.habitRhythms?.h1.totalDone).toBe(66);
    expect(next.habitRhythms?.h1.done).toEqual(rhythm.done);
    expect(next.habitRhythms?.h1.shields).toBe(2);
    expect(next.rest?.dreams).toEqual(['dream-on-the-moon', 'dream-aurora']);

    // e o objeto de ritmo sequer é tocado
    expect(next.habitRhythms?.h1).toBe(rhythm);
  });
});
