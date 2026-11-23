// ---------------------------------------------------------------------------
// PAGAMENTO DA CONCLUSÃO DE TAREFA — uma regra só para a Home e para o widget.
//
// O toque no check da Home (`handleToggleTask`, App.tsx) e o check do widget
// grande da Home (fila nativa drenada ao abrir o app) TÊM que pagar igual. Duas
// implementações divergiriam (footgun 9), então o que o toque fazia dentro dos
// updaters mora aqui, puro:
//
//   1. `markTaskChecked`    — o check aparece (a tarefa fica `completed: true`);
//   2. `grantReliefFood`    — tarefa ASSOMBRADA rende uma comida extra na hora;
//   3. `countHauntedMission`— a assombrada conta na missão semanal `haunted-done`;
//   4. `settleTaskCompletion` — `completeTask` (sai da lista, histórico, comida,
//      premium) + XP de Vínculo pelo peso de esforço + recibo do "Desmarcar".
//
// A Home roda 1–3 no clique e 4 depois de 3 s (animação de saída). O widget
// roda tudo de uma vez (`applyTaskCompletion`), no momento em que o app drena.
//
// Idempotência: `completeTask` devolve `null` quando a tarefa já saiu da lista,
// e `applyTaskCompletion` recusa a que já está marcada (o toque na Home recusa
// igual: `if (!task || task.completed) return`). Reaplicar = no-op.
// ---------------------------------------------------------------------------

import type { GameState, Task } from '../contexts/GameStateContext';
import { completeTask } from './careRules';
import { awardBondXP } from './bond';
import { effortOf, isHaunted } from './taskTriage';
import { playerDayKey } from './playerDay';
import { registrarDiaComTarefa } from './fundador';
import { isPremiumKey } from './premiumFood';
import { FOOD_BY_CATEGORY } from '../constants/labels';
import { isoWeekKey } from './offerMoment';
import { bumpWeekly, forWeek } from './weeklyMissions';
import type { TaskCompletionReceipt } from './taskUncomplete';

/** O check: a tarefa fica marcada e continua na lista até o acerto. */
export function markTaskChecked<S extends GameState>(state: S, taskId: string): S {
  return { ...state, tasks: state.tasks.map(t => (t.id === taskId ? { ...t, completed: true } : t)) };
}

/** Bônus de alívio: +1 comida da categoria. `emoji` = o que entrou (para a animação), ou `null`. */
export function grantReliefFood<S extends GameState>(state: S, category: Task['category']): { state: S; emoji: string | null } {
  const food = FOOD_BY_CATEGORY[category];
  if (!food) return { state, emoji: null };
  return {
    state: { ...state, foodInventory: { ...state.foodInventory, [food.emoji]: (state.foodInventory[food.emoji] ?? 0) + 1 } },
    emoji: food.emoji,
  };
}

/** Missão semanal `haunted-done` (o mesmo que `contarMissao('haunted-done')`: não tem evento diário). */
export function countHauntedMission<S extends GameState>(state: S, now: Date): S {
  const semana = isoWeekKey(playerDayKey(now, state.playerDayTz));
  if (!semana) return state;
  return { ...state, weeklyMissions: bumpWeekly(forWeek(state.weeklyMissions, semana), 'haunted-done') };
}

export interface SettleResult<S> {
  state: S;
  /** A conclusão aconteceu agora (pagou). `false` = já tinha sido paga / a tarefa sumiu. */
  paid: boolean;
  /** Entrou comida premium (todas as etapas feitas). */
  premium: boolean;
}

/**
 * O acerto da conclusão: `completeTask` + XP de Vínculo + recibo. `task` é a
 * tarefa COMO ESTAVA no toque (peso, categoria); `relief` foi medido no toque.
 */
export function settleTaskCompletion<S extends GameState>(prev: S, task: Task, relief: boolean, now: Date): SettleResult<S> {
  const taskId = task.id;
  const feito = completeTask(prev, taskId, now) ?? prev;
  const premium = Object.keys(feito.foodInventory).some(k => isPremiumKey(k) && (feito.foodInventory[k] ?? 0) > (prev.foodInventory[k] ?? 0));
  // 🔗 Vínculo pelo PESO DE ESFORÇO (`effortOf`), nunca por contagem de itens.
  // Só rende se a conclusão ACONTECEU: tocar duas vezes não paga duas.
  const next = feito === prev ? prev : awardBondXP(
    feito,
    { kind: 'completion', weight: effortOf(task) },
    playerDayKey(now, prev.playerDayTz),
  );
  const paid = next !== prev;
  if (!paid) return { state: next, paid, premium };
  // ↩️ RECIBO (`utils/taskUncomplete.ts`): o que entrou, para o "Desmarcar" estornar exatamente isso.
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
  const state = ult && ult.id === taskId
    ? { ...next, completedTasks: [...ct.slice(0, -1), { ...ult, receipt }] }
    : next;
  // Conjunto Fundador: um dia a mais com tarefa concluída (no-op no mesmo dia; `utils/fundador.ts`).
  return { state: registrarDiaComTarefa(state, now), paid, premium };
}

export interface ApplyResult<S> extends SettleResult<S> {
  /** Era assombrada (pagou o alívio). */
  relief: boolean;
  /** A tarefa como estava antes (nome/categoria para o feedback), ou `null` se não havia o que pagar. */
  task: Task | null;
}

/**
 * Toque completo, de uma vez: a mesma sequência do `handleToggleTask` sem a
 * espera de 3 s. Tarefa ausente ou já marcada = nada muda (mesma referência).
 */
export function applyTaskCompletion<S extends GameState>(state: S, taskId: string, now: Date): ApplyResult<S> {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task || task.completed) return { state, paid: false, premium: false, relief: false, task: null };
  const relief = isHaunted(task, now);
  let s = relief ? countHauntedMission(state, now) : state;
  s = markTaskChecked(s, taskId);
  if (relief) s = grantReliefFood(s, task.category).state;
  const r = settleTaskCompletion(s, task, relief, now);
  // Se o acerto não pagou (não deveria: a tarefa estava na lista), nada do toque fica.
  if (!r.paid) return { state, paid: false, premium: false, relief: false, task: null };
  return { ...r, relief, task };
}
