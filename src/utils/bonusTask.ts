/**
 * ⭐ TAREFA BÔNUS — dona única da regra (pedido do dono, 13/11/2026).
 *
 * Substitui o "aceitar já conta como feito" da oferta reduzida (never miss
 * twice): aceitar NÃO conclui mais nada. O hábito aceito vira a TAREFA BÔNUS do
 * dia — mesma linha e mesma caixa de sempre, só o título em bronze — e a pessoa
 * marca como qualquer outra.
 *
 * Recompensa: concluir a tarefa bônus rende +`BONUS_TASK_GAUGE_WEIGHT`
 * Fragmento de Alma ACIMA do teto diário do estágio (teto 5 + bônus = 6),
 * creditado na virada como o resto do gauge (`computeDailyReset`). O servidor
 * não valida `evolutionPoints`, então não há teto do lado do servidor a mudar.
 *
 * Funções PURAS: sem React, sem localStorage.
 */

/** A tarefa bônus de um dia: qual atividade, em qual dia (`Date.toDateString()`, o mesmo de `lastCompletedDate`). */
export interface BonusTaskState {
  day: string;
  activityId: string;
}

/** Fragmentos extras, acima do teto diário, por concluir a tarefa bônus. */
export const BONUS_TASK_GAUGE_WEIGHT = 1;

/** Valida o que vem do save (cliente ou nuvem). Inválido → `undefined`. */
export function sanitizeBonusTask(v: unknown): BonusTaskState | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const { day, activityId } = v as Record<string, unknown>;
  if (typeof day !== 'string' || !day || typeof activityId !== 'string' || !activityId) return undefined;
  return { day, activityId };
}

/** A atividade é a tarefa bônus de `day`? */
export function isBonusActivity(s: BonusTaskState | undefined, activityId: string, day: string): boolean {
  return !!s && s.day === day && s.activityId === activityId;
}

/**
 * Bônus de gauge da virada: `BONUS_TASK_GAUGE_WEIGHT` se a tarefa bônus do dia
 * julgado foi concluída nesse dia; senão 0. A virada limpa o estado depois,
 * então paga uma vez só.
 */
export function bonusTaskGaugeBonus(
  s: BonusTaskState | undefined,
  activities: readonly { id: string; completedToday?: boolean; lastCompletedDate?: string }[] | undefined,
  judgedDay: string,
): number {
  if (!s || s.day !== judgedDay) return 0;
  const a = (activities ?? []).find(x => x.id === s.activityId);
  return a && a.completedToday && a.lastCompletedDate === judgedDay ? BONUS_TASK_GAUGE_WEIGHT : 0;
}
