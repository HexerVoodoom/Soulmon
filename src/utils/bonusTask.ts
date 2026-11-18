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

/**
 * O save guarda a LISTA de tarefas bônus do dia (REGISTRO §474: antes era um slot único e a segunda oferta aceita
 * sobrescrevia a primeira). Saves antigos trazem um objeto só: vira lista de 1.
 */
export type BonusTaskSave = BonusTaskState | readonly BonusTaskState[] | undefined;

function one(v: unknown): BonusTaskState | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const { day, activityId } = v as Record<string, unknown>;
  if (typeof day !== 'string' || !day || typeof activityId !== 'string' || !activityId) return undefined;
  return { day, activityId };
}

/** Normaliza objeto único (legado) ou lista para lista sem duplicata (mesmo dia + mesma atividade). */
export function bonusTaskList(v: unknown): BonusTaskState[] {
  const raw = Array.isArray(v) ? v : v ? [v] : [];
  const out: BonusTaskState[] = [];
  for (const r of raw) {
    const t = one(r);
    if (t && !out.some(x => x.day === t.day && x.activityId === t.activityId)) out.push(t);
  }
  return out;
}

/** Valida o que vem do save (cliente ou nuvem). Nada válido → `undefined`. */
export function sanitizeBonusTask(v: unknown): BonusTaskState[] | undefined {
  const l = bonusTaskList(v);
  return l.length > 0 ? l : undefined;
}

/** Acrescenta a tarefa bônus de `day` SEM tirar as outras do mesmo dia (as de dias antigos saem). */
export function addBonusTask(s: BonusTaskSave, activityId: string, day: string): BonusTaskState[] {
  const keep = bonusTaskList(s).filter(t => t.day === day && t.activityId !== activityId);
  return [...keep, { day, activityId }];
}

/** Ids das tarefas bônus de `day`. */
export function bonusActivityIdsOf(s: BonusTaskSave, day: string): string[] {
  return bonusTaskList(s).filter(t => t.day === day).map(t => t.activityId);
}

/** A atividade é uma tarefa bônus de `day`? */
export function isBonusActivity(s: BonusTaskSave, activityId: string, day: string): boolean {
  return bonusTaskList(s).some(t => t.day === day && t.activityId === activityId);
}

/**
 * Bônus de gauge da virada: `BONUS_TASK_GAUGE_WEIGHT` POR tarefa bônus do dia julgado concluída nesse dia; senão 0.
 * A virada limpa o estado depois, então paga uma vez só.
 */
export function bonusTaskGaugeBonus(
  s: BonusTaskSave,
  activities: readonly { id: string; completedToday?: boolean; lastCompletedDate?: string }[] | undefined,
  judgedDay: string,
): number {
  let n = 0;
  for (const id of bonusActivityIdsOf(s, judgedDay)) {
    const a = (activities ?? []).find(x => x.id === id);
    if (a && a.completedToday && a.lastCompletedDate === judgedDay) n += BONUS_TASK_GAUGE_WEIGHT;
  }
  return n;
}
