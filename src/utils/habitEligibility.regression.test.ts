import { describe, it, expect } from 'vitest';
import {
  computeDailyReset,
  activitiesForWeekDay,
  registeredForDay,
  dailyGoalFor,
  restWeekKeyFor,
} from './dailyReset';
import {
  habitCountsOn,
  needsIntervention,
  dayKeyOf,
  emptyRhythm,
  type HabitRhythm,
} from './habitRhythm';
import { checkInPlan } from './rituals';
import { plannedEffort } from './taskTriage';
import { REST_SHIELD_EARN_EVERY_DAYS, HABIT_WEIGHT } from '../types/taskModel';

// ===========================================================================
// TRÊS BUGS MEDIDOS, TRÊS TRAVAS
//
// Cada bloco abaixo reproduz o cenário exato da auditoria. Todos falhavam antes
// da correção — não por detalhe de asserção, mas porque o app cobrava coração
// num dia não devido (🔴), porque `needsIntervention` era inalcançável (🔴) e
// porque três módulos respondiam coisas diferentes à mesma pergunta (🟡).
// ===========================================================================

const MON_17 = new Date(2026, 7, 17, 12, 0, 0);
const WED_19 = new Date(2026, 7, 19, 12, 0, 0);
const THU_20 = new Date(2026, 7, 20, 12, 0, 0);
const FRI_21 = new Date(2026, 7, 21, 12, 0, 0);

function rhythmDoneOn(day: Date): HabitRhythm {
  return { ...emptyRhythm(), done: [dayKeyOf(day)], totalDone: 1, lastCompletedDate: dayKeyOf(day) };
}

/** Save mínimo que `computeDailyReset` sabe ler. */
function save(over: Record<string, any> = {}): any {
  return {
    activities: [],
    tasks: [],
    completedTasks: [],
    healthPoints: 3,
    maxHealthPoints: 3,
    energyPoints: 0,
    perfectDays: 0,
    totalXP: 0,
    virusPoints: 0,
    dataPoints: 0,
    vaccinePoints: 0,
    evolutionStage: 'rookie',
    unlockedEvolutions: [],
    degeneratedByHP: false,
    currentBranch: 'data',
    lastDayWasPerfect: false,
    maxActivityCap: 4,
    // P2 — ESTE SAVE JÁ GASTOU A FOLGA DA SEMANA. Sem isto ela absorveria a
    // primeira perda de coração e os testes de cobrança abaixo mediriam a
    // folga, não a regra de elegibilidade que eles existem para provar.
    // `restWeekKey: undefined` NÃO serve: a virada lê ausência de semana como
    // "a folga daquela semana estava inteira", que é o certo para save antigo.
    restDaysLeft: 0,
    // A semana tem de ser a do dia JULGADO (o `lastResetDate` deste save):
    // semana que não bate é lida pela virada como "a folga daquela semana
    // estava inteira" — que é o certo para save antigo, e o oposto do que
    // estes testes precisam.
    restWeekKey: restWeekKeyFor(new Date(over.lastResetDate ?? Date.now())),
    ...over,
  };
}

const EVERY_3_FROM_COMPLETION = {
  id: 'h1',
  name: 'Correr',
  emoji: '🏃',
  category: 'exercicio',
  steps: [] as any[],
  // O CreateModal escreve a semana toda no campo antigo, por compatibilidade com
  // o widget Android. Está aqui de propósito: é exatamente o detalhe do qual as
  // três cópias da regra dependiam sem saber.
  weekDays: [0, 1, 2, 3, 4, 5, 6],
  schedule: { kind: 'everyNDays' as const, n: 3, from: 'completion' as const },
  completedToday: false,
  lastCompletedDate: undefined as string | undefined,
};

// ---------------------------------------------------------------------------
// BUG 1 🔴 — recorrência flexível inflava a meta TODO dia e cobrava coração
// ---------------------------------------------------------------------------

describe('🔴 hábito de intervalo não é cobrado num dia em que não era devido', () => {
  // Cenário MEDIDO: `everyNDays n=3 from:'completion'`, concluído em 17/ago.
  // Virada avaliando 19/ago (só 2 dias depois → NÃO devido). Antes: `isDueOn`
  // dizia false e o laço de ritmo não escrevia nada, mas `registeredForDay`
  // devolvia 1, `dailyGoalFor` 1 e `dailyDone` 0 → heartsLost 1, HP 3→2.
  const estado = save({
    activities: [EVERY_3_FROM_COMPLETION],
    habitRhythms: { h1: rhythmDoneOn(MON_17) },
    lastResetDate: WED_19.toDateString(),
  });

  it('a meta de 19/ago é ZERO — os dois lados da razão usam a mesma regra', () => {
    const dia = WED_19.toDateString();
    expect(activitiesForWeekDay(estado, WED_19.getDay(), dia)).toHaveLength(0);
    expect(registeredForDay(estado, WED_19.getDay(), dia)).toBe(0);
    expect(dailyGoalFor(estado, WED_19.getDay(), dia)).toBe(0);
  });

  it('a virada de 20/ago (avaliando 19) NÃO tira coração', () => {
    const next = computeDailyReset(estado, { now: THU_20 });
    expect(next.lastDayReport.heartsLost).toBe(0);
    expect(next.healthPoints).toBe(3);
    // E o dia continua ESTRUTURALMENTE possível: sem nada devido, não há razão
    // para o relatório declarar dívida.
    expect(next.lastDayReport.required).toBe(0);
    // O ritmo também não registra falta nenhuma num dia não devido.
    expect(next.habitRhythms.h1.missed).toHaveLength(0);
  });

  it('mas no dia DEVIDO a falta continua custando — nada foi relaxado', () => {
    // 20/ago são 3 dias depois de 17/ago: devido. A virada de 21 avalia 20.
    const devido = save({
      ...estado,
      lastResetDate: THU_20.toDateString(),
    });
    const dia = THU_20.toDateString();
    expect(registeredForDay(devido, THU_20.getDay(), dia)).toBe(HABIT_WEIGHT);
    const next = computeDailyReset(devido, { now: FRI_21 });
    expect(next.lastDayReport.heartsLost).toBe(1);
    expect(next.habitRhythms.h1.missed).toEqual([dia]);
  });
});

describe('🔴 "3x por semana" não pede 7 na meta da semana', () => {
  const tresPorSemana = {
    ...EVERY_3_FROM_COMPLETION,
    id: 'h2',
    schedule: { kind: 'timesPerWeek' as const, target: 3 },
  };

  it('conta enquanto a meta semanal não foi cumprida, e para depois', () => {
    // Semana de domingo 16/ago. Duas conclusões: ainda conta.
    const duas: HabitRhythm = {
      ...emptyRhythm(),
      done: [dayKeyOf(new Date(2026, 7, 16)), dayKeyOf(MON_17)],
      totalDone: 2,
    };
    expect(habitCountsOn(tresPorSemana, duas, WED_19)).toBe(true);

    // Três conclusões: meta da semana cumprida — os dias restantes ficam de
    // graça. Fazer a mais nunca vira dívida.
    const tres: HabitRhythm = {
      ...duas,
      done: [...duas.done, dayKeyOf(new Date(2026, 7, 18))],
      totalDone: 3,
    };
    expect(habitCountsOn(tresPorSemana, tres, WED_19)).toBe(false);

    // O dia em que a meta FOI cumprida continua contando — senão o crédito da
    // conclusão sumiria junto com a cobrança.
    expect(habitCountsOn(tresPorSemana, tres, new Date(2026, 7, 18, 12))).toBe(true);
  });

  it('a semana inteira somada nunca passa do alvo declarado', () => {
    let r: HabitRhythm = emptyRhythm();
    let cobrados = 0;
    for (let d = 16; d <= 22; d++) {
      const dia = new Date(2026, 7, d, 12, 0, 0);
      if (habitCountsOn(tresPorSemana, r, dia)) {
        cobrados++;
        r = { ...r, done: [...r.done, dayKeyOf(dia)], totalDone: r.totalDone + 1 };
      }
    }
    expect(cobrados).toBe(3); // era 7
  });
});

// ---------------------------------------------------------------------------
// BUG 2 🔴 — escudo ganho TODO DIA matava o "never miss twice"
// ---------------------------------------------------------------------------

describe('🔴 escudos têm cadência de 7 dias — e o "never miss twice" volta a existir', () => {
  const diario = {
    id: 'h3',
    name: 'Ler',
    emoji: '📖',
    category: 'estudo',
    steps: [] as any[],
    weekDays: [0, 1, 2, 3, 4, 5, 6],
    completedToday: false,
  };

  /** Roda `n` viradas seguidas a partir de `inicio` (a 1ª avalia `inicio - 1`). */
  function viradas(estado: any, inicio: Date, n: number, completar: boolean) {
    let s = estado;
    for (let i = 0; i < n; i++) {
      const now = new Date(inicio.getTime() + i * 86400000);
      const ontem = new Date(now.getTime() - 86400000);
      s = {
        ...s,
        lastResetDate: ontem.toDateString(),
        activities: s.activities.map((a: any) => ({
          ...a,
          completedToday: completar,
          lastCompletedDate: completar ? ontem.toDateString() : undefined,
        })),
      };
      s = computeDailyReset(s, { now });
    }
    return s;
  }

  it('três viradas de boa constância concedem UM escudo, não três', () => {
    const inicial = save({
      activities: [diario],
      habitRhythms: { h3: { ...emptyRhythm(), shields: 0 } },
    });
    const depois = viradas(inicial, THU_20, 3, true);
    expect(depois.habitRhythms.h3.shields).toBe(1);
    expect(depois.habitRhythms.h3.lastShieldAt).toBeTruthy();
  });

  it('a virada é IDEMPOTENTE: rodar duas vezes o mesmo dia não dá dois escudos', () => {
    const inicial = save({
      activities: [diario],
      habitRhythms: { h3: { ...emptyRhythm(), shields: 0 } },
    });
    const uma = viradas(inicial, THU_20, 1, true);
    const duas = computeDailyReset(
      { ...uma, lastResetDate: new Date(THU_20.getTime() - 86400000).toDateString() },
      { now: THU_20 },
    );
    expect(duas.habitRhythms.h3.shields).toBe(uma.habitRhythms.h3.shields);
  });

  it('`needsIntervention` é ALCANÇÁVEL — o pet chega a oferecer a versão reduzida', () => {
    // Antes: cada virada concedia um escudo novo, toda falta era absorvida,
    // `missed[]` parava de crescer e `consecutiveMisses` nunca chegava a 2. O
    // pet NUNCA oferecia a versão reduzida do hábito.
    const inicial = save({
      activities: [diario],
      habitRhythms: { h3: { ...emptyRhythm(), shields: 0 } },
    });
    // 4 dias de boa constância, depois 4 faltas seguidas.
    const bom = viradas(inicial, THU_20, 4, true);
    const inicioRuim = new Date(THU_20.getTime() + 4 * 86400000);
    const ruim = viradas(bom, inicioRuim, 4, false);

    const r: HabitRhythm = ruim.habitRhythms.h3;
    // No máximo um escudo foi concedido na janela toda → nem toda falta foi
    // absorvida, e o registro de falta voltou a crescer.
    expect(r.missed.length).toBeGreaterThanOrEqual(2);
    expect(needsIntervention(r, new Date(inicioRuim.getTime() + 3 * 86400000))).toBe(true);
  });

  it('o segundo escudo só sai depois de REST_SHIELD_EARN_EVERY_DAYS dias', () => {
    const inicial = save({
      activities: [diario],
      habitRhythms: { h3: { ...emptyRhythm(), shields: 0 } },
    });
    const depois = viradas(inicial, THU_20, REST_SHIELD_EARN_EVERY_DAYS + 1, true);
    expect(depois.habitRhythms.h3.shields).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// BUG 3 🟡 — "quais hábitos contam hoje" implementado 3 vezes, de 2 fontes
// ---------------------------------------------------------------------------

describe('🟡 os três consumidores concordam sobre "este hábito conta hoje?"', () => {
  const estado = {
    ...save({
      activities: [EVERY_3_FROM_COMPLETION],
      habitRhythms: { h1: rhythmDoneOn(MON_17) },
    }),
  };

  /** As três respostas, lado a lado, para um dia. */
  function tresLeituras(dia: Date) {
    const dayKey = dia.toDateString();
    return {
      dailyReset: activitiesForWeekDay(estado, dia.getDay(), dayKey).length,
      rituais: checkInPlan(estado, dia).habitsToday.length,
      carga: plannedEffort([], estado.activities, dayKey, estado.habitRhythms) / HABIT_WEIGHT,
    };
  }

  it('19/ago (não devido): os três dizem 0 — antes só a virada dizia', () => {
    const r = tresLeituras(WED_19);
    expect(r).toEqual({ dailyReset: 0, rituais: 0, carga: 0 });
  });

  it('20/ago (devido, 3 dias depois da conclusão): os três dizem 1', () => {
    const r = tresLeituras(THU_20);
    expect(r).toEqual({ dailyReset: 1, rituais: 1, carga: 1 });
  });

  it('o hábito por dia da semana continua respondendo pelo calendário', () => {
    const segQuaSex = {
      ...EVERY_3_FROM_COMPLETION,
      id: 'h4',
      schedule: undefined,
      weekDays: [1, 3, 5],
    };
    const st = save({ activities: [segQuaSex], habitRhythms: {} });
    const quarta = WED_19.toDateString();
    const quinta = THU_20.toDateString();
    expect(activitiesForWeekDay(st, WED_19.getDay(), quarta)).toHaveLength(1);
    expect(checkInPlan(st, WED_19).habitsToday).toHaveLength(1);
    expect(plannedEffort([], st.activities, quarta, {})).toBe(HABIT_WEIGHT);
    expect(activitiesForWeekDay(st, THU_20.getDay(), quinta)).toHaveLength(0);
    expect(checkInPlan(st, THU_20).habitsToday).toHaveLength(0);
    expect(plannedEffort([], st.activities, quinta, {})).toBe(0);
  });
});
