/**
 * A ORIGEM do que a Focus Workshop lista (01/11/2026, pedido do dono: "se puxou de lá, tem que marcar nos dois").
 * Puro: sem React, sem storage, data por parâmetro. Dono de duas coisas só:
 *  · `focusTasksFor` — o que entra na escolha: tarefas abertas, tarefas concluídas HOJE (o ✓ aparece quando a origem
 *    foi marcada fora da Oficina; `completeTask` tira a tarefa de `tasks` e a guarda em `completedTasks`) e os hábitos
 *    do dia (`habit:<id>`, `kind: 'habit'`), concluídos ou não.
 *  · `focusCheckTarget` — o que o ✓ da Oficina conclui na origem: a tarefa, o hábito simples ou TODAS as etapas abertas
 *    do hábito com etapas (num só updater, no App — `handleCompleteSteps`).
 * A lista de hábitos do dia vem de fora (`activitiesForWeekDay`), a mesma do resto do app.
 */
export const HABIT_PREFIX = 'habit:';

interface OriginTask { id: string; name: string; completed: boolean; steps?: Array<{ id: string; label: string; completed: boolean }> }
interface OriginDone { id: string; name: string; completedAt: string }
interface OriginHabit { id: string; name: string; steps: Array<{ id: string; completed: boolean }>; completedToday?: boolean; lastCompletedDate?: string }

export type FocusTask = { id: string; name: string; completed: boolean; kind?: 'habit'; steps?: OriginTask['steps'] };

/** `dayKey` = `Date.toDateString()` do dia (a mesma chave de `completedToday`/`lastCompletedDate`). */
export const habitDone = (a: OriginHabit, dayKey: string): boolean =>
  a.steps.length > 0 ? a.steps.every(s => s.completed) : !!a.completedToday && a.lastCompletedDate === dayKey;

export function focusTasksFor(tasks: readonly OriginTask[], completedTasks: readonly OriginDone[], habitsToday: readonly OriginHabit[], dayKey: string): FocusTask[] {
  const abertas = tasks.map(({ id, name, completed, steps }) => ({ id, name, completed, steps }));
  const ids = new Set(abertas.map(t => t.id));
  const feitasHoje = completedTasks
    .filter(t => !ids.has(t.id) && new Date(t.completedAt).toDateString() === dayKey)
    .map(t => ({ id: t.id, name: t.name, completed: true }));
  const habitos = habitsToday.map(a => ({ id: `${HABIT_PREFIX}${a.id}`, name: String(a.name), kind: 'habit' as const, completed: habitDone(a, dayKey) }));
  return [...abertas, ...feitasHoje, ...habitos];
}

export type FocusCheckTarget =
  | { kind: 'task'; id: string }
  | { kind: 'habit'; id: string }
  | { kind: 'steps'; id: string; stepIds: string[] }
  | null;

export function focusCheckTarget(id: string, habits: readonly OriginHabit[]): FocusCheckTarget {
  if (!id.startsWith(HABIT_PREFIX)) return { kind: 'task', id };
  const a = habits.find(h => String(h.id) === id.slice(HABIT_PREFIX.length));
  if (!a) return null;
  if (a.steps.length === 0) return { kind: 'habit', id: a.id };
  const stepIds = a.steps.filter(s => !s.completed).map(s => s.id);
  return stepIds.length ? { kind: 'steps', id: a.id, stepIds } : null;
}
