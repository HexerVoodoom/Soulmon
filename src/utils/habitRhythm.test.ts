import { describe, it, expect } from 'vitest';
import {
  emptyRhythm,
  dayKeyOf,
  isDueOn,
  weeklyProgress,
  constancy,
  habitTier,
  milestoneReached,
  attributeMultiplier,
  earnShield,
  applyMissedDay,
  consecutiveMisses,
  needsIntervention,
  completeHabit,
  HabitRhythm,
} from './habitRhythm';
import {
  HABIT_MILESTONES,
  REST_SHIELD_MAX,
  MISS_INTERVENTION_AT,
  CONSTANCY_WINDOW_DAYS,
} from '../types/taskModel';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Meio-dia de propósito: nenhum teste pode depender de hora nem de fuso. */
const TODAY = new Date(2026, 7, 19, 12, 0, 0); // 19/ago/2026

function ago(days: number, from: Date = TODAY): Date {
  return new Date(from.getTime() - days * DAY_MS);
}

function key(days: number): string {
  return dayKeyOf(ago(days));
}

/** Um rhythm com N dias seguidos concluídos, terminando ontem+1 (= hoje - offset). */
function withDone(days: number[], extra: Partial<HabitRhythm> = {}): HabitRhythm {
  const done = days.map(key);
  return {
    ...emptyRhythm(),
    done,
    totalDone: done.length,
    lastCompletedDate: done[done.length - 1],
    ...extra,
  };
}

describe('isDueOn — cada tipo de Schedule', () => {
  it('weekdays: só nos dias da semana escolhidos', () => {
    const today = TODAY.getDay();
    const other = (today + 1) % 7;
    const r = emptyRhythm();
    expect(isDueOn({ kind: 'weekdays', days: [today] }, r, TODAY)).toBe(true);
    expect(isDueOn({ kind: 'weekdays', days: [other] }, r, TODAY)).toBe(false);
  });

  it('timesPerWeek: sempre elegível — quem julga é weeklyProgress', () => {
    const r = emptyRhythm();
    for (let i = 0; i < 7; i++) {
      expect(isDueOn({ kind: 'timesPerWeek', target: 3 }, r, ago(i))).toBe(true);
    }
  });

  it("everyNDays from:'schedule': a cada N dias a partir de uma âncora estável", () => {
    const schedule = { kind: 'everyNDays', n: 3, from: 'schedule' } as const;
    // A âncora é a primeira conclusão registrada.
    const r = withDone([9]);
    expect(isDueOn(schedule, r, ago(9))).toBe(true);
    expect(isDueOn(schedule, r, ago(6))).toBe(true);
    expect(isDueOn(schedule, r, ago(3))).toBe(true);
    expect(isDueOn(schedule, r, ago(8))).toBe(false);
    expect(isDueOn(schedule, r, ago(7))).toBe(false);
  });

  it("everyNDays from:'completion': devido hoje quando nunca foi feito", () => {
    expect(
      isDueOn({ kind: 'everyNDays', n: 3, from: 'completion' }, emptyRhythm(), TODAY),
    ).toBe(true);
  });

  it("everyNDays from:'completion': conta da CONCLUSÃO, não da data prevista", () => {
    const schedule = { kind: 'everyNDays', n: 3, from: 'completion' } as const;
    const r = withDone([1]); // feito ontem
    expect(isDueOn(schedule, r, TODAY)).toBe(false);
    expect(isDueOn(schedule, r, ago(-1))).toBe(false); // amanhã: 2 dias
    expect(isDueOn(schedule, r, ago(-2))).toBe(true); // depois de amanhã: 3 dias
  });

  it("everyNDays from:'completion' NÃO acumula atrasadas após um sumiço longo", () => {
    const schedule = { kind: 'everyNDays', n: 3, from: 'completion' } as const;
    const r = withDone([30]); // sumiu por um mês

    // Volta e encontra UMA ocorrência devida — não dez.
    expect(isDueOn(schedule, r, TODAY)).toBe(true);

    // Ao concluir, o relógio reinicia daí; nada de dívida acumulada.
    const after = completeHabit(r, dayKeyOf(TODAY));
    expect(isDueOn(schedule, after, TODAY)).toBe(false);
    expect(isDueOn(schedule, after, ago(-1))).toBe(false);
    expect(isDueOn(schedule, after, ago(-3))).toBe(true);
  });
});

describe('weeklyProgress', () => {
  it('conta as conclusões da semana corrente (domingo a sábado)', () => {
    const sunday = new Date(2026, 7, 16, 12); // domingo
    expect(sunday.getDay()).toBe(0);
    const wednesday = new Date(2026, 7, 19, 12);
    const previousFriday = new Date(2026, 7, 14, 12);

    const r: HabitRhythm = {
      ...emptyRhythm(),
      done: [dayKeyOf(sunday), dayKeyOf(wednesday), dayKeyOf(previousFriday)],
      totalDone: 3,
    };
    expect(weeklyProgress(r, { kind: 'timesPerWeek', target: 3 }, wednesday)).toEqual({
      done: 2,
      target: 3,
    });
  });

  it('alvo 0 para formatos sem meta semanal', () => {
    expect(weeklyProgress(emptyRhythm(), { kind: 'weekdays', days: [1] }, TODAY).target).toBe(0);
  });
});

describe('constancy — a média móvel que substitui o streak', () => {
  it('conta só dias devidos e devolve a razão da janela', () => {
    const r: HabitRhythm = {
      ...emptyRhythm(),
      done: [key(0), key(1), key(2), key(3), key(5)],
      missed: [key(4), key(6)],
      totalDone: 5,
    };
    const c = constancy(r, TODAY);
    expect(c).toEqual({ done: 5, window: 7, ratio: 5 / 7 });
  });

  it('UMA FALHA NÃO ZERA A CONSTÂNCIA (regra inegociável)', () => {
    const perfect = constancy(withDone([0, 1, 2, 3, 4, 5, 6]), TODAY);
    expect(perfect.ratio).toBe(1);

    const withOneMiss = constancy(
      { ...withDone([0, 1, 2, 3, 4, 5]), missed: [key(6)] },
      TODAY,
    );
    // Custo de ~14%, jamais 100%. Se algum dia isto virar 0, o produto morreu.
    expect(withOneMiss.ratio).toBeCloseTo(6 / 7, 5);
    expect(withOneMiss.ratio).toBeGreaterThan(0.8);
  });

  it('dia protegido por escudo conta como FEITO', () => {
    const r: HabitRhythm = {
      ...withDone([0, 1, 2, 3, 4, 5]),
      shielded: [key(6)],
    };
    const c = constancy(r, TODAY);
    expect(c.done).toBe(7);
    expect(c.ratio).toBe(1);
  });

  it('hábito novo não começa em 0% (progresso dotado)', () => {
    expect(constancy(emptyRhythm(), TODAY).ratio).toBe(1);
  });

  it('ignora dias fora da janela', () => {
    const r = withDone([0, CONSTANCY_WINDOW_DAYS + 3]);
    expect(constancy(r, TODAY).done).toBe(1);
  });
});

describe('marcos de maturidade', () => {
  const [sprout, sapling, tree] = HABIT_MILESTONES;

  it('os quatro estágios seguem HABIT_MILESTONES', () => {
    expect(habitTier(0)).toBe('seed');
    expect(habitTier(sprout - 1)).toBe('seed');
    expect(habitTier(sprout)).toBe('sprout');
    expect(habitTier(sapling - 1)).toBe('sprout');
    expect(habitTier(sapling)).toBe('sapling');
    expect(habitTier(tree - 1)).toBe('sapling');
    expect(habitTier(tree)).toBe('tree');
    expect(habitTier(tree + 500)).toBe('tree');
  });

  it('milestoneReached dispara UMA vez, no cruzamento', () => {
    expect(milestoneReached(sprout - 1, sprout)).toBe('sprout');
    expect(milestoneReached(sapling - 1, sapling)).toBe('sapling');
    expect(milestoneReached(tree - 1, tree)).toBe('tree');
    expect(milestoneReached(sprout, sprout + 1)).toBeNull();
    expect(milestoneReached(sprout, sprout)).toBeNull();
    expect(milestoneReached(tree, sprout)).toBeNull();
  });

  it('o rendimento de atributo só sobe — nunca desce', () => {
    expect(attributeMultiplier(0)).toBe(1);
    expect(attributeMultiplier(sprout)).toBeCloseTo(1.1, 5);
    expect(attributeMultiplier(sapling)).toBeCloseTo(1.2, 5);
    expect(attributeMultiplier(tree)).toBeCloseTo(1.3, 5);
    let previous = 0;
    for (let i = 0; i <= tree + 10; i++) {
      const m = attributeMultiplier(i);
      expect(m).toBeGreaterThanOrEqual(previous);
      previous = m;
    }
  });
});

describe('escudos de descanso', () => {
  it('ganha com boa constância, respeitando o teto', () => {
    let r = withDone([0, 1, 2, 3, 4, 5, 6]);
    for (let i = 0; i < REST_SHIELD_MAX + 2; i++) r = earnShield(r, TODAY);
    expect(r.shields).toBe(REST_SHIELD_MAX);
  });

  it('não ganha com constância ruim nem sem histórico', () => {
    const bad: HabitRhythm = {
      ...withDone([0, 1]),
      missed: [key(2), key(3), key(4), key(5), key(6)],
    };
    expect(earnShield(bad, TODAY).shields).toBe(0);
    expect(earnShield(emptyRhythm(), TODAY).shields).toBe(0);
  });

  it('é CONSUMIDO AUTOMATICAMENTE na falta — sem ação do usuário', () => {
    const r = { ...withDone([1, 2]), shields: 1 };
    const after = applyMissedDay(r, dayKeyOf(TODAY));
    expect(after.shields).toBe(0);
    expect(after.shielded).toContain(dayKeyOf(TODAY));
    expect(after.missed).toHaveLength(0);
  });

  it('sem escudo, a falta é registrada como falta', () => {
    const after = applyMissedDay(withDone([1]), dayKeyOf(TODAY));
    expect(after.missed).toEqual([dayKeyOf(TODAY)]);
    expect(after.shielded).toHaveLength(0);
  });

  it('applyMissedDay é idempotente — nunca gasta dois escudos pelo mesmo dia', () => {
    const r = { ...withDone([1]), shields: 2 };
    const once = applyMissedDay(r, dayKeyOf(TODAY));
    const twice = applyMissedDay(once, dayKeyOf(TODAY));
    expect(twice.shields).toBe(1);
    expect(twice.shielded).toHaveLength(1);
  });
});

describe('never miss twice', () => {
  it('UMA falha não gera nada visível', () => {
    const r = applyMissedDay(withDone([1, 2, 3]), dayKeyOf(TODAY));
    expect(consecutiveMisses(r, TODAY)).toBe(1);
    expect(needsIntervention(r, TODAY)).toBe(false);
  });

  it('DUAS seguidas disparam a intervenção', () => {
    let r = withDone([2, 3]);
    r = applyMissedDay(r, key(1));
    r = applyMissedDay(r, key(0));
    expect(consecutiveMisses(r, TODAY)).toBe(MISS_INTERVENTION_AT);
    expect(needsIntervention(r, TODAY)).toBe(true);
  });

  it('dia protegido por escudo NÃO conta como falta', () => {
    let r: HabitRhythm = { ...withDone([3]), shields: 1 };
    r = applyMissedDay(r, key(1)); // escudo consumido aqui
    r = applyMissedDay(r, key(0)); // esta sim é falta
    expect(r.shielded).toEqual([key(1)]);
    expect(consecutiveMisses(r, TODAY)).toBe(1);
    expect(needsIntervention(r, TODAY)).toBe(false);
  });

  it('concluir quebra a sequência de faltas', () => {
    let r = applyMissedDay(applyMissedDay(withDone([3]), key(2)), key(1));
    expect(needsIntervention(r, TODAY)).toBe(true);
    r = completeHabit(r, dayKeyOf(TODAY));
    expect(consecutiveMisses(r, TODAY)).toBe(0);
    expect(needsIntervention(r, TODAY)).toBe(false);
  });
});

describe('completeHabit', () => {
  it('é idempotente — marcar duas vezes no mesmo dia não duplica', () => {
    const first = completeHabit(emptyRhythm(), dayKeyOf(TODAY));
    const second = completeHabit(first, dayKeyOf(TODAY));
    expect(second.done).toEqual([dayKeyOf(TODAY)]);
    expect(second.totalDone).toBe(1);
    expect(second).toBe(first);
  });

  it('atualiza lastCompletedDate e apaga a falta do mesmo dia', () => {
    const missed = applyMissedDay(emptyRhythm(), dayKeyOf(TODAY));
    const done = completeHabit(missed, dayKeyOf(TODAY));
    expect(done.missed).toHaveLength(0);
    expect(done.lastCompletedDate).toBe(dayKeyOf(TODAY));
    expect(done.totalDone).toBe(1);
  });

  it('não devolve escudo já gasto', () => {
    const r = applyMissedDay({ ...emptyRhythm(), shields: 1 }, dayKeyOf(TODAY));
    const done = completeHabit(r, dayKeyOf(TODAY));
    expect(done.shields).toBe(0);
  });

  it('nunca existe um streak que zera', () => {
    let r = emptyRhythm();
    for (let i = 6; i >= 0; i--) r = completeHabit(r, key(i));
    r = applyMissedDay(r, key(-1)); // falha amanhã
    // O totalDone (que alimenta marcos e atributo) é intocado pela falha.
    expect(r.totalDone).toBe(7);
    expect(Object.keys(r)).not.toContain('streak');
  });
});
