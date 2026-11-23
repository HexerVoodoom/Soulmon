// ---------------------------------------------------------------------------
// PAGAMENTO DA CONCLUSÃO DE HÁBITO — uma regra só para o toque na Home e para o
// check do widget grande da Home (decisão do dono, 18/11/2026, adendo ao §478).
//
// O toque no check de um hábito na Home (`handleToggleActivityCompletion`,
// App.tsx) e o `habit_done` da fila do widget TÊM que pagar igual (footgun 9).
// O updater do toque mora aqui, puro:
//   `applyHabitCompletion` = virada pendente (`settlePendingRollover`) + hábito
//   marcado hoje + estatística + comida da categoria + registro de atividade +
//   `withHabitCompletion` (constância, bônus de maturidade, Vínculo, marco).
//
// Idempotência: hábito já feito hoje ou inexistente = a MESMA referência, nada
// pago. (Hábito com etapas fecha pelas etapas na Home; quem filtra é o chamador.)
// ---------------------------------------------------------------------------

import type { GameState } from '../contexts/GameStateContext';
import { CATEGORY_ATTRIBUTES, type ActivityCategory } from '../types/attributes';
import { HABIT_WEIGHT } from '../types/taskModel';
import { completeHabit, emptyRhythm, attributeMultiplier, milestoneReached, habitTier } from './habitRhythm';
import { awardBondXP } from './bond';
import { playerDayKey } from './playerDay';
import { registrarDiaComTarefa } from './fundador';
import { settlePendingRollover } from './dailyReset';
import { FOOD_BY_CATEGORY } from '../constants/labels';

/** Teto do registro de conclusões de atividade (`activityLog`). */
export const ACTIVITY_LOG_CAP = 90;

const EMPTY_RHYTHM = emptyRhythm();

/**
 * Registra a conclusão de um hábito NO MESMO DIA em que ela acontece.
 *
 * A virada do dia (`utils/dailyReset.ts`) já escreve faltas, escudos e a
 * conclusão de ONTEM — isto aqui não duplica aquilo: `completeHabit` é
 * idempotente por dayKey. O rendimento de atributo é o BÔNUS de maturidade
 * (`attributeMultiplier`): um hábito maduro rende MAIS, nunca menos; hábito novo
 * (semente) tem multiplicador 1, logo bônus zero.
 *
 * Vínculo: a conclusão é um dos eventos da trilha (mesmo tier de maturidade do
 * atributo), e o MARCO 7/21/66 (`milestoneReached`) paga o `habitMilestone`.
 *
 * Função PURA sobre `prev` (roda dentro de updater, footgun 6). `bondDayKey` é o
 * dia do JOGADOR, vindo por parâmetro para não haver `new Date()` aqui dentro.
 */
export function withHabitCompletion(
  prev: GameState,
  activityId: string,
  category: ActivityCategory,
  todayKey: string,
  bondDayKey: string,
): GameState {
  const before = prev.habitRhythms?.[activityId] ?? EMPTY_RHYTHM;
  const after = completeHabit(before, todayKey);
  if (after === before) return prev; // já marcado hoje — nada a fazer

  const extra = attributeMultiplier(after.totalDone) - 1;
  const base = CATEGORY_ATTRIBUTES[category] ?? { power: 0, harmony: 0, benevolence: 0 };
  const bonus = {
    power: Math.round(base.power * extra),
    harmony: Math.round(base.harmony * extra),
    benevolence: Math.round(base.benevolence * extra),
  };

  const comXP = awardBondXP(prev, {
    kind: 'completion', weight: HABIT_WEIGHT, habitTier: habitTier(after.totalDone),
  }, bondDayKey);

  const marco = milestoneReached(before.totalDone, after.totalDone);
  const comMarco = marco
    ? awardBondXP(comXP, { kind: 'habitMilestone', days: after.totalDone }, bondDayKey)
    : comXP;

  return {
    ...comMarco,
    habitRhythms: { ...(prev.habitRhythms ?? {}), [activityId]: after },
    powerPoints: prev.powerPoints + bonus.power,
    harmonyPoints: prev.harmonyPoints + bonus.harmony,
    benevolencePoints: prev.benevolencePoints + bonus.benevolence,
    attributesSinceLastEvolution: {
      power: (prev.attributesSinceLastEvolution?.power ?? 0) + bonus.power,
      harmony: (prev.attributesSinceLastEvolution?.harmony ?? 0) + bonus.harmony,
      benevolence: (prev.attributesSinceLastEvolution?.benevolence ?? 0) + bonus.benevolence,
    },
  };
}

/**
 * O toque no check do hábito, de uma vez. `today` é o
 * `toDateString()` do instante do toque (a Home calcula fora do updater).
 * Nada a pagar = a MESMA referência `prevRaw`.
 */
export function applyHabitCompletion<S extends GameState>(prevRaw: S, activityId: string, now: Date, today: string = now.toDateString()): S {
  const found = prevRaw.activities.find(a => a.id === activityId);
  if (!found) return prevRaw;
  if (found.completedToday && found.lastCompletedDate === today) return prevRaw;
  // Virada pendente (até 30 s depois da meia-noite): fecha ontem ANTES de escrever hoje (QA L02-02).
  const prev = settlePendingRollover(prevRaw, now) as S;
  const activity = prev.activities.find(a => a.id === activityId);
  if (!activity) return prevRaw;
  if (activity.completedToday && activity.lastCompletedDate === today) return prevRaw;

  const activityKey = `activity-${activity.id}`;
  const currentStats = prev.activityStats[activityKey] || {
    name: activity.name, emoji: activity.emoji, category: activity.category, completionCount: 0,
  };
  const food = FOOD_BY_CATEGORY[activity.category as keyof typeof FOOD_BY_CATEGORY];
  const next: S = {
    ...prev,
    activities: prev.activities.map(act => (act.id === activityId ? { ...act, completedToday: true, lastCompletedDate: today } : act)),
    activityStats: { ...prev.activityStats, [activityKey]: { ...currentStats, completionCount: currentStats.completionCount + 1 } },
    foodInventory: food ? { ...prev.foodInventory, [food.emoji]: (prev.foodInventory[food.emoji] ?? 0) + 1 } : prev.foodInventory,
    // Para o ritmo de cuidado enxergar atividades (`completedTasks` só recebe tarefa avulsa).
    activityLog: [...(prev.activityLog ?? []), now.toISOString()].slice(-ACTIVITY_LOG_CAP),
  };
  // Conjunto Fundador: um dia a mais com atividade concluída (no-op no mesmo dia; `utils/fundador.ts`).
  return registrarDiaComTarefa(withHabitCompletion(next, activityId, activity.category, today, playerDayKey(now, prev.playerDayTz)) as S, now);
}
