import { describe, it, expect } from 'vitest';
import {
  effortWithSteps, suggestedEffortForSteps, taskEffort, STEPS_EFFORT_CAP, MIN_STEPS_FOR_PREMIUM,
} from '../types/taskModel';
import { CATEGORY_ATTRIBUTES } from '../types/attributes';
import { completeTaskStep, nextOccurrence, wakeDueTasks, effortOf, allStepsDone } from './taskTriage';
import { completeTask, type TaskState } from './careRules';
import { registeredForDay } from './dailyReset';
import { weekChip, emptyRhythm } from './habitRhythm';
import { premiumKey, PREMIUM_DROPS_PER_DAY, PREMIUM_DROPS_PER_WEEK, premiumDropFor, PREMIUM_ENERGY } from './premiumFood';
import { applySpecialItem, specialRefusal, type SpecialItemState } from './specialItemUse';
import { SPECIAL_ITEMS } from './shop';
import { getMaxEnergyForStage } from '../types/progression';

const steps = (n: number, done = false) =>
  Array.from({ length: n }, (_, i) => ({ id: `s${i}`, label: `p${i}`, completed: done }));

function estado(over: Partial<TaskState> = {}): TaskState {
  return {
    healthPoints: 3, maxHealthPoints: 3, energyPoints: 0, evolutionStage: 'rookie',
    foodInventory: {}, powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0, totalXP: 0,
    attributesSinceLastEvolution: { power: 0, harmony: 0, benevolence: 0 },
    tasks: [], completedTasks: [], activityStats: {},
    ...over,
  };
}
const AGORA = new Date('2026-10-12T12:00:00'); // segunda

describe('peso de uma tarefa com subitens (C)', () => {
  it('invariante: lista com N subitens nunca pesa mais que N tarefas rápidas soltas, nem mais que 3', () => {
    for (let n = 2; n <= 12; n++) {
      for (const declared of [1, 2, 3] as const) {
        const w = effortWithSteps(declared, n);
        expect(w).toBeLessThanOrEqual(Math.min(n, STEPS_EFFORT_CAP));
        expect(w).toBeLessThanOrEqual(declared);
      }
    }
  });

  it('piso sugerido: a lista de 2 nasce pesando 2 = "pagar água" + "pagar luz" soltas', () => {
    expect(suggestedEffortForSteps(2)).toBe(2);
    const lista = { id: 'l', category: 'Work', emoji: '🧾', name: 'Contas', completed: false, effort: suggestedEffortForSteps(2), steps: steps(2) };
    const soltas = [1, 2].map(i => ({ id: `t${i}`, category: 'Work', emoji: '💧', name: `c${i}`, completed: false, effort: 1 as const }));
    const a = registeredForDay({ tasks: [lista], activities: [], completedTasks: [], evolutionStage: 'rookie' } as never, 1);
    const b = registeredForDay({ tasks: soltas, activities: [], completedTasks: [], evolutionStage: 'rookie' } as never, 1);
    expect(a).toBe(b);
    expect(a).toBe(2);
  });

  it('subitem concluído NÃO multiplica a meta: 10 subitens pesam no máximo 3', () => {
    const t = { id: 'l', effort: 3 as const, steps: steps(10) };
    expect(taskEffort(t)).toBe(3);
    expect(effortOf(t)).toBe(3);
    // e marcar subitens não muda o peso
    expect(taskEffort({ ...t, steps: steps(10, true) })).toBe(3);
  });

  it('1 subitem ou nenhum: nada muda; teto só vale com ≥2', () => {
    expect(effortWithSteps(3, 0)).toBe(3);
    expect(effortWithSteps(3, 1)).toBe(3);
    expect(effortWithSteps(3, 2)).toBe(2);
    expect(effortWithSteps(undefined, 5)).toBe(1);
  });

  it('o peso guardado na conclusão é o mesmo do cadastro (meta e feito na mesma unidade)', () => {
    const task = { id: 'l', name: 'Contas', category: 'Work' as const, emoji: '🧾', effort: 3 as const, steps: steps(2, true) };
    const feito = completeTask(estado({ tasks: [task] }), 'l', AGORA)!;
    expect(feito.completedTasks[0].effort).toBe(effortOf(task));
  });
});

describe('subitens de tarefa', () => {
  it('completeTaskStep é idempotente e não desmarca', () => {
    const tasks = [{ id: 'a', steps: steps(3) }];
    const um = completeTaskStep(tasks, 'a', 's0');
    expect(um[0].steps![0].completed).toBe(true);
    expect(completeTaskStep(um, 'a', 's0')).toBe(um);
    expect(completeTaskStep(um, 'a', 'zzz')).toBe(um);
    expect(allStepsDone(um[0])).toBe(false);
  });
});

describe('repetição: a cada N dias da conclusão', () => {
  it('a próxima nasce guardada, fora da meta, com subitens zerados', () => {
    const task = { id: 'c', name: 'Contas', category: 'Work' as const, emoji: '🧾', effort: 2 as const, repeatEveryDays: 30, steps: steps(3, true) };
    const feito = completeTask(estado({ tasks: [task] }), 'c', AGORA)!;
    expect(feito.tasks).toHaveLength(1);
    const prox = feito.tasks[0];
    expect(prox.status).toBe('someday');
    expect(prox.wakeOn).toBe('2026-11-11');
    expect(prox.steps!.every(s => !s.completed)).toBe(true);
    expect(prox.id).not.toBe('c');
    // guardada = não pesa hoje
    expect(registeredForDay({ tasks: feito.tasks, activities: [], completedTasks: [], evolutionStage: 'rookie' } as never, 1)).toBe(0);
    // concluir de novo não encadeia id infinito
    expect(nextOccurrence({ ...prox, status: 'open', repeatEveryDays: 30 }, AGORA)!.id.match(/~r/g)).toHaveLength(1);
  });

  it('acorda no dia (e é idempotente); antes disso segue guardada', () => {
    const t = [{ id: 'x', status: 'someday' as const, wakeOn: '2026-11-11' }];
    expect(wakeDueTasks(t, new Date('2026-11-10T09:00:00'))).toBe(t);
    const acordou = wakeDueTasks(t, new Date('2026-11-11T09:00:00'));
    expect(acordou[0].status).toBe('open');
    expect(acordou[0].wakeOn).toBeUndefined();
    expect(wakeDueTasks(acordou, new Date('2026-11-11T09:30:00'))).toBe(acordou);
  });

  it('sem repeatEveryDays não nasce nada', () => {
    const task = { id: 'c', name: 'n', category: 'Work' as const, emoji: '🧾' };
    expect(completeTask(estado({ tasks: [task] }), 'c', AGORA)!.tasks).toHaveLength(0);
  });
});

describe('comida premium: o drop (D)', () => {
  const cheia = (n: number) => ({ id: 'p', name: 'Plano', category: 'Study' as const, emoji: '📚', steps: steps(n, true) });

  it('só com ≥3 subitens, todos feitos; guarda a chave da comida da categoria', () => {
    expect(MIN_STEPS_FOR_PREMIUM).toBe(3);
    const k = premiumKey('🍎');
    expect(completeTask(estado({ tasks: [cheia(3)] }), 'p', AGORA)!.foodInventory[k]).toBe(1);
    expect(completeTask(estado({ tasks: [cheia(2)] }), 'p', AGORA)!.foodInventory[k]).toBeUndefined();
    const incompleta = { ...cheia(4), steps: steps(4).map((s, i) => ({ ...s, completed: i < 3 })) };
    expect(completeTask(estado({ tasks: [incompleta] }), 'p', AGORA)!.foodInventory[k]).toBeUndefined();
    // a comida comum continua vindo
    expect(completeTask(estado({ tasks: [cheia(3)] }), 'p', AGORA)!.foodInventory['🍎']).toBe(1);
  });

  it('teto por dia e por semana', () => {
    let s = estado({ tasks: [cheia(3)] });
    s = completeTask(s, 'p', AGORA)!;
    expect(s.premiumFood?.dropped).toBe(1);
    // mesmo dia: segundo não cai
    expect(premiumDropFor(s, cheia(3), AGORA)).toBe(false);
    expect(PREMIUM_DROPS_PER_DAY).toBe(1);
    // dia seguinte: cai de novo, até o teto semanal
    let quando = new Date(AGORA);
    for (let d = 1; d < PREMIUM_DROPS_PER_WEEK; d++) {
      quando = new Date(quando.getTime() + 86_400_000);
      s = completeTask({ ...s, tasks: [cheia(3)] }, 'p', quando)!;
    }
    expect(s.premiumFood?.weekDropped).toBe(PREMIUM_DROPS_PER_WEEK);
    quando = new Date(quando.getTime() + 86_400_000);
    expect(premiumDropFor(s, cheia(3), quando)).toBe(false); // semana cheia
    // semana seguinte (segunda): libera
    expect(premiumDropFor(s, cheia(3), new Date('2026-10-19T12:00:00'))).toBe(true);
  });
});

describe('Work (B) e hábito semanal (A)', () => {
  it('Work existe, soma 4 pontos como as demais e pende para Harmonia', () => {
    const sum = (c: keyof typeof CATEGORY_ATTRIBUTES) => Object.values(CATEGORY_ATTRIBUTES[c]).reduce((a, b) => a + b, 0);
    for (const c of Object.keys(CATEGORY_ATTRIBUTES) as Array<keyof typeof CATEGORY_ATTRIBUTES>) expect(sum(c)).toBe(sum('Work'));
    expect(CATEGORY_ATTRIBUTES.Work.harmony).toBeGreaterThan(CATEGORY_ATTRIBUTES.Work.power);
  });

  it('weekChip: 3x/semana mostra N de 3; diário mostra N de 7; a cada N dias não tem semana', () => {
    const r = { ...emptyRhythm(), done: ['2026-10-11', '2026-10-12'] };
    expect(weekChip(r, { kind: 'timesPerWeek', target: 3 }, AGORA)).toEqual({ done: 2, target: 3 });
    expect(weekChip(r, { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] }, AGORA)).toEqual({ done: 2, target: 7 });
    expect(weekChip(undefined, { kind: 'timesPerWeek', target: 3 }, AGORA)).toEqual({ done: 0, target: 3 });
    expect(weekChip(r, { kind: 'everyNDays', n: 30, from: 'schedule' }, AGORA)).toBeNull();
  });
});

describe('comida premium: o uso (D)', () => {
  const K = premiumKey('🍎');
  const uso = (over: Partial<SpecialItemState> = {}): SpecialItemState => ({
    healthPoints: 3, maxHealthPoints: 3, foodInventory: { [K]: 2 }, perfectDays: 0, powerPoints: 0,
    harmonyPoints: 0, benevolencePoints: 0, totalXP: 0, energyPoints: 0, evolutionStage: 'mega',
    attributesSinceLastEvolution: { power: 0, harmony: 0, benevolence: 0 }, ...over,
  });

  it('existe um item especial premium por comida de categoria, com nome nos dois idiomas', () => {
    expect(SPECIAL_ITEMS[K].kind).toBe('premium');
    expect(SPECIAL_ITEMS[K].namePt).toBe('Maçã premium');
    expect(SPECIAL_ITEMS[K].nameEn).toBe('Premium Apple');
  });

  it('dá 5 de energia (não 1), sem atributo, XP nem HP, e gasta 1 do inventário', () => {
    const { state, refused } = applySpecialItem(uso(), K, AGORA);
    expect(refused).toBeUndefined();
    expect(state.energyPoints).toBe(PREMIUM_ENERGY);
    expect(state.foodInventory[K]).toBe(1);
    expect(state.powerPoints + state.harmonyPoints + state.benevolencePoints + state.totalXP).toBe(0);
    expect(state.healthPoints).toBe(3);
  });

  it('nunca passa das barras do estágio; com a energia cheia RECUSA e o item volta', () => {
    const max = getMaxEnergyForStage('mega');
    expect(applySpecialItem(uso({ energyPoints: max - 2 }), K, AGORA).state.energyPoints).toBe(max);
    const cheio = uso({ energyPoints: max });
    expect(specialRefusal(cheio, K, AGORA)).toBe('already-full');
    const r = applySpecialItem(cheio, K, AGORA);
    expect(r.state).toBe(cheio);
    expect(r.state.foodInventory[K]).toBe(2);
  });

  it('1 uso por dia: o segundo no mesmo lote é recusado sem queimar o item; amanhã vale', () => {
    const um = applySpecialItem(uso(), K, AGORA).state;
    expect(specialRefusal(um, K, AGORA)).toBe('daily-cap');
    expect(applySpecialItem(um, K, AGORA).state).toBe(um);
    const amanha = new Date(AGORA.getTime() + 86_400_000);
    expect(specialRefusal({ ...um, energyPoints: 0 }, K, amanha)).toBeUndefined();
  });

  it('sem estoque: recusa', () => {
    expect(specialRefusal(uso({ foodInventory: {} }), K, AGORA)).toBe('no-stock');
  });
});
