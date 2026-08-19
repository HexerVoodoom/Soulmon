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
  freshStartHasSomethingToClear,
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

// Save com histórico de verdade: um hábito com dias registrados na janela. É o
// mínimo que faz o painel semanal ter o que dizer (ver `weeklyReportHasSubstance`).
function comHistorico(over: Partial<RitualState> = {}, ref: Date = SUN): RitualState {
  return base({
    activities: [{ id: 'h1', name: 'Ler', emoji: '📖' }],
    habitRhythms: {
      h1: { ...emptyRhythm(), done: [key(-1, ref), key(-2, ref)], missed: [key(-3, ref)], totalDone: 2 },
    },
    ...over,
  });
}

describe('needsWeeklyReport', () => {
  // ATUALIZADO: estes casos usavam `base()` (save vazio) e codificavam o
  // comportamento antigo — "domingo basta". O calendário passou a ser condição
  // necessária, não suficiente; por isso o estado dos casos ganhou histórico.
  it('só no domingo', () => {
    expect(needsWeeklyReport(comHistorico(), SUN)).toBe(true);
    expect(needsWeeklyReport(comHistorico(), MON)).toBe(false);
    expect(needsWeeklyReport(comHistorico(), WED)).toBe(false);
  });

  it('uma vez por semana', () => {
    const shown = comHistorico({ lastWeeklyReportDate: dayKeyOf(SUN) });
    expect(needsWeeklyReport(shown, SUN)).toBe(false);
    // domingo seguinte: volta a valer (o histórico acompanha a janela móvel)
    const proximo = comHistorico({ lastWeeklyReportDate: dayKeyOf(SUN) }, day(7, SUN));
    expect(needsWeeklyReport(proximo, day(7, SUN))).toBe(true);
  });

  // REGRESSÃO — quem instala no SÁBADO recebia, no domingo, um painel de zeros
  // na segunda sessão da vida do save: nenhum hábito (todos filtrados por
  // `window > 0`), "0 tarefas · 0 pontos de esforço", "0 sonhos".
  it('não estreia no dia 2 de vida, sem NADA para mostrar', () => {
    const recemInstalado = base({
      // Instalou no sábado: os hábitos existem, mas ainda não viveram virada
      // nenhuma — nenhum ritmo, nenhuma tarefa concluída, nenhum sonho.
      activities: [{ id: 'h1', name: 'Ler', emoji: '📖' }, { id: 'h2', name: 'Correr', emoji: '🏃' }],
    });
    const painel = weeklyReport(recemInstalado, SUN);
    expect(painel.perHabit.every(l => l.window === 0)).toBe(true);
    expect(painel.tasksDone).toBe(0);
    expect(painel.effortDone).toBe(0);
    expect(painel.dreams).toBe(0);

    expect(needsWeeklyReport(recemInstalado, SUN)).toBe(false);

    // E a supressão NÃO acumula: o portão é "domingo de uma semana ainda não
    // relatada", nunca uma fila de relatórios pendentes. No domingo seguinte,
    // já com histórico, o relatório aparece normalmente.
    expect(needsWeeklyReport(comHistorico({}, day(7, SUN)), day(7, SUN))).toBe(true);
  });

  it('uma tarefa concluída na semana já basta — o critério é ter o que dizer', () => {
    const soTarefa = base({
      completedTasks: [{ id: 't1', category: 'work', completedAt: day(-2, SUN).toISOString(), effort: 2 }],
    });
    expect(needsWeeklyReport(soTarefa, SUN)).toBe(true);
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
  // ATUALIZADO: os casos usavam `base()` (nenhuma tarefa, nenhum adiamento) e
  // codificavam o comportamento antigo — "é segunda, logo tem oferta". O
  // recomeço é perdão de dívida, e oferecê-lo a quem não deve nada APRESENTA a
  // dívida; por isso agora ele exige cobrança pendente de verdade.
  const comDivida = (over: Partial<RitualState> = {}) =>
    base({ tasks: [task('adiada', { postponedCount: 3 })], ...over });

  it('só aparece em marco, e uma vez só', () => {
    expect(freshStartOffer(comDivida(), WED, 'pt-BR')).toBeNull();

    const offer = freshStartOffer(comDivida(), MON, 'pt-BR');
    expect(offer?.title).toBe('Semana nova');

    const en = freshStartOffer(comDivida(), FIRST, 'en');
    expect(en?.title).toBe('A new month');

    const done = comDivida({ lastFreshStartDate: dayKeyOf(MON) });
    expect(freshStartOffer(done, MON, 'pt-BR')).toBeNull();
  });

  // REGRESSÃO — usuário novo (instalou no fim de semana, cai numa segunda)
  // recebia "as cobranças pendentes zeram" antes de ter adiado o que quer que
  // fosse: o app ensinando a alguém que acabou de chegar que ele já acumulou
  // dívida.
  it('não oferece perdão de dívida a quem nunca adiou nada', () => {
    expect(freshStartHasSomethingToClear(base())).toBe(false);
    expect(freshStartOffer(base(), MON, 'pt-BR')).toBeNull();
    expect(freshStartOffer(base(), FIRST, 'en')).toBeNull();
    // O calendário continua respondendo sobre calendário quando perguntado sozinho.
    expect(isFreshStartDay(MON)).toBe(true);
    expect(isFreshStartDay(MON, base())).toBe(false);
    expect(isFreshStartDay(MON, comDivida())).toBe(true);
  });

  it('tarefa inerte/descartada não é cobrança pendente', () => {
    const inerte = base({ tasks: [task('x', { postponedCount: 4, status: 'someday' })] });
    expect(freshStartHasSomethingToClear(inerte)).toBe(false);
    expect(freshStartOffer(inerte, MON, 'pt-BR')).toBeNull();
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
