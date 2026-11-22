import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { GameState, Task } from '../contexts/GameStateContext';
import {
  applyTaskCompletion, countHauntedMission, grantReliefFood, markTaskChecked, settleTaskCompletion,
} from './taskCompletionPay';
import { completeTask } from './careRules';
import { awardBondXP } from './bond';
import { effortOf, isHaunted } from './taskTriage';
import { playerDayKey } from './playerDay';
import { isPremiumKey } from './premiumFood';
import { FOOD_BY_CATEGORY } from '../constants/labels';
import { isoWeekKey } from './offerMoment';
import { bumpWeekly, forWeek } from './weeklyMissions';
import type { TaskCompletionReceipt } from './taskUncomplete';

const AGORA = new Date(2026, 10, 18, 10, 0, 0);
const ISO = AGORA.toISOString();
const VELHA = new Date(2026, 10, 1, 10, 0, 0).toISOString(); // parada há 17 dias = assombrada

function tarefa(over: Partial<Task> = {}): Task {
  return {
    id: 't1', name: 'Ler', emoji: '📚', category: 'aprendizado', completed: false, status: 'open',
    createdAt: ISO, lastTouchedAt: ISO, ...over,
  } as Task;
}

function estado(tasks: Task[], over: Partial<GameState> = {}): GameState {
  return {
    tasks, completedTasks: [], activityStats: {}, foodInventory: {}, totalXP: 40,
    activities: [], ...over,
  } as unknown as GameState;
}

/**
 * REFERÊNCIA: o `handleToggleTask` de App.tsx ANTES da extração (main d94fd46e5),
 * copiado ao pé da letra — os 3 updaters do clique e o updater do acerto, na
 * ordem em que o React os aplica. A paridade é contra ISTO, não contra o módulo.
 */
function toqueAntigo(gs: GameState, taskId: string, now: Date): GameState {
  const task = gs.tasks.find(t => t.id === taskId);
  if (!task || task.completed) return gs;
  const relief = isHaunted(task, now);
  let s = gs;
  if (relief) { // contarMissao('haunted-done')
    const semana = isoWeekKey(playerDayKey(now, s.playerDayTz));
    if (semana) s = { ...s, weeklyMissions: bumpWeekly(forWeek(s.weeklyMissions, semana), 'haunted-done') };
  }
  s = { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t) };
  if (relief) {
    const food = FOOD_BY_CATEGORY[task.category];
    if (food) s = { ...s, foodInventory: { ...s.foodInventory, [food.emoji]: (s.foodInventory[food.emoji] ?? 0) + 1 } };
  }
  const prev = s;
  const feito = completeTask(prev, taskId, now) ?? prev;
  const next = feito === prev ? prev : awardBondXP(feito, { kind: 'completion', weight: effortOf(task) }, playerDayKey(now, prev.playerDayTz));
  if (next === prev) return next;
  const naHora = prev.tasks.find(t => t.id === taskId);
  const comida = FOOD_BY_CATEGORY[task.category]?.emoji;
  const premio = Object.keys(feito.foodInventory).find(k => isPremiumKey(k) && (feito.foodInventory[k] ?? 0) > (prev.foodInventory[k] ?? 0));
  const proxima = feito.tasks.find(t => !prev.tasks.some(p => p.id === t.id));
  const receipt: TaskCompletionReceipt = {
    food: comida ? { [comida]: relief ? 2 : 1 } : {},
    ...(premio ? { premium: premio, premiumDay: feito.premiumFood?.day, premiumWeek: feito.premiumFood?.week } : {}),
    xp: Math.max(0, (next.totalXP ?? 0) - (feito.totalXP ?? 0)),
    day: playerDayKey(now, prev.playerDayTz),
    ...(relief ? { mission: 'haunted-done' as const, week: prev.weeklyMissions?.week } : {}),
    ...(proxima ? { nextId: proxima.id } : {}),
    task: (naHora ?? task) as unknown as TaskCompletionReceipt['task'],
  };
  const ct = next.completedTasks;
  const ult = ct[ct.length - 1];
  return ult && ult.id === taskId ? { ...next, completedTasks: [...ct.slice(0, -1), { ...ult, receipt }] } : next;
}

const CASOS: Array<[string, Task]> = [
  ['tarefa comum', tarefa()],
  ['tarefa assombrada (alívio + missão)', tarefa({ lastTouchedAt: VELHA, createdAt: VELHA })],
  ['tarefa com 3 etapas feitas (premium)', tarefa({ steps: [1, 2, 3].map(i => ({ id: `s${i}`, label: `s${i}`, completed: true })) })],
  ['tarefa que se repete (próxima ocorrência)', tarefa({ repeatEveryDays: 1 } as Partial<Task>)],
  ['tarefa de esforço alto', tarefa({ effort: 3 } as Partial<Task>)],
];

describe('paridade: widget (applyTaskCompletion) = toque na Home (handleToggleTask)', () => {
  for (const [nome, t] of CASOS) {
    it(nome, () => {
      const gs = estado([t, tarefa({ id: 'outra', name: 'Outra' })]);
      const widget = applyTaskCompletion(gs, 't1', AGORA);
      expect(widget.paid).toBe(true);
      expect(widget.state).toEqual(toqueAntigo(gs, 't1', AGORA));
    });
  }

  it('o caminho em dois tempos da Home (clique, depois acerto) dá o mesmo estado', () => {
    const t = tarefa({ lastTouchedAt: VELHA, createdAt: VELHA });
    const gs = estado([t]);
    let s = countHauntedMission(gs, AGORA);
    s = markTaskChecked(s, 't1');
    s = grantReliefFood(s, t.category).state;
    const r = settleTaskCompletion(s, t, true, AGORA);
    expect(r.paid).toBe(true);
    expect(r.state).toEqual(applyTaskCompletion(gs, 't1', AGORA).state);
  });
});

describe('idempotência', () => {
  it('reaplicar = no-op (mesma referência, nada pago)', () => {
    const gs = estado([tarefa()]);
    const um = applyTaskCompletion(gs, 't1', AGORA).state;
    const dois = applyTaskCompletion(um, 't1', AGORA);
    expect(dois.paid).toBe(false);
    expect(dois.state).toBe(um);
  });

  it('tarefa já marcada no app (esperando o acerto de 3 s) = ignora', () => {
    const gs = estado([tarefa({ completed: true })]);
    const r = applyTaskCompletion(gs, 't1', AGORA);
    expect(r.paid).toBe(false);
    expect(r.state).toBe(gs);
  });

  it('tarefa que não existe mais (concluída noutro aparelho) = ignora', () => {
    const gs = estado([tarefa({ id: 'x' })]);
    expect(applyTaskCompletion(gs, 't1', AGORA).state).toBe(gs);
  });

  it('paga comida e Vínculo uma vez só', () => {
    const gs = estado([tarefa()]);
    const r = applyTaskCompletion(gs, 't1', AGORA);
    expect(r.state.foodInventory['🍎']).toBe(1);
    expect(r.state.totalXP).toBeGreaterThan(40);
    expect(r.state.completedTasks).toHaveLength(1);
    expect(r.state.tasks).toHaveLength(0);
  });
});

describe('App.tsx usa a regra compartilhada (contrato)', () => {
  const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
  const corpo = app.slice(app.indexOf('const handleToggleTask = (taskId: string) =>'), app.indexOf('const handleToggleTaskStep'));
  it('o toque marca, dá o alívio, conta a missão e acerta pelas funções puras', () => {
    expect(corpo).toMatch(/markTaskChecked\(prev, taskId\)/);
    expect(corpo).toMatch(/grantReliefFood\(prev, task\.category\)/);
    expect(corpo).toMatch(/countHauntedMission\(prev,/);
    expect(corpo).toMatch(/settleTaskCompletion\(prev, task, relief,/);
  });
  it('e não reimplementa a transição dentro do updater', () => {
    expect(corpo).not.toMatch(/completeTask\(prev/);
    expect(corpo).not.toMatch(/awardBondXP\(/);
  });
});
