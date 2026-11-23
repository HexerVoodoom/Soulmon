/**
 * ↩️ DESMARCAR UMA TAREFA JÁ CONCLUÍDA (pedido do dono, 04/11/2026).
 *
 * Segurar uma tarefa marcada na Home abre "Desmarcar / Editar". Desmarcar
 * desfaz a conclusão E ESTORNA tudo o que ela rendeu. Diferente do "Desfazer"
 * de 5 s (`completionUndo.ts`, snapshot), aqui o tempo passou e outras coisas
 * mudaram no save — então a reversão é pelo RECIBO que a conclusão grava na
 * própria entrada do histórico (`CompletedTask.receipt`): só sai o que entrou.
 *
 * O que uma conclusão de tarefa concede (fonte: `completeTask` em
 * `careRules.ts` + `handleToggleTask` no `App.tsx`), e como cada um volta:
 *  · comida comum da categoria (+1)            → −1 no `foodInventory`
 *  · comida extra do alívio (tarefa assombrada) → −1 no `foodInventory`
 *  · comida premium (todos os ≥3 subitens)      → −1 da chave `★` e −1 nos tetos `premiumFood`
 *  · XP de Vínculo (`awardBondXP`, completion)  → −xp em `totalXP` e no ledger `bondDaily`
 *  · missão semanal `haunted-done` (+1)         → −1 na contagem
 *  · `activityStats` (+1), `completedTasks` (entrada), e a tarefa sai de `tasks`
 *    (com a próxima ocorrência criada, se repete) → tudo volta como era.
 *
 * SEM FARM: marcar → desmarcar → marcar devolve EXATAMENTE o que a primeira
 * conclusão daria — o ledger do teto diário e os tetos da premium são
 * devolvidos junto, e nada fica a mais. Quando algum ganho não pode voltar
 * inteiro, a função RECUSA (nunca estorna pela metade):
 *  · `used`    — a comida (comum, extra ou premium) já foi comida/gasta;
 *  · `claimed` — a missão semanal que esta conclusão completou já foi resgatada;
 *  · `old`     — a conclusão é de outro dia (o teto diário daquele dia já virou);
 *  · `legacy`  — entrada sem recibo (concluída antes desta versão): não se sabe
 *    o que ela rendeu, então não há o que estornar com segurança.
 *
 * Fica de fora, de propósito: o XP de subitem (`stepXpPaid` é da vaga, não da
 * conclusão; a tarefa volta com o contador intacto, então remarcar não repaga),
 * o XP da janela de refeição (só paga uma vez por janela, remarcar não repaga)
 * e telemetria. Nenhum deles vira ganho num ciclo marcar/desmarcar.
 *
 * Funções PURAS, feitas para rodar dentro de um updater (footgun 6).
 */
import { bondCapSource } from './bond';
import { playerDayKey, type PlayerDayAnchor } from './playerDay';
import type { WeeklyMissionProgress } from './weeklyMissions';
import type { PremiumRecord } from './premiumFood';

/** O que uma conclusão rendeu — gravado na entrada do histórico. */
export interface TaskCompletionReceipt {
  /** Comidas entregues: emoji → quantidade (comum + alívio). */
  food: Record<string, number>;
  /** Chave da comida premium entregue (`🍎★`), se houve. */
  premium?: string;
  /** `premiumFood.day` / `.week` do drop, para devolver o teto certo. */
  premiumDay?: string;
  premiumWeek?: string;
  /** XP de Vínculo que a conclusão rendeu (0 na demo ou no teto). */
  xp: number;
  /** Dia do jogador (`playerDayKey`) em que rendeu — o dia do ledger. */
  day: string;
  /** Missão semanal contada e a semana dela. */
  mission?: 'haunted-done';
  week?: string;
  /** Id da próxima ocorrência criada (tarefa que se repete). */
  nextId?: string;
  /** A tarefa como estava ao ser concluída — volta para a lista. */
  task: { id: string; completed?: boolean; steps?: Array<{ id: string; label: string; completed: boolean }> };
}

interface Entry { id: string; name: string; category: string; completedAt: string; receipt?: TaskCompletionReceipt }

export interface UncompleteState {
  tasks: Array<{ id: string }>;
  completedTasks: Entry[];
  foodInventory: Record<string, number>;
  activityStats: Record<string, { completionCount: number }>;
  totalXP?: number;
  bondDaily?: { day: string; spent: Record<string, number> };
  premiumFood?: PremiumRecord;
  weeklyMissions?: WeeklyMissionProgress;
  playerDayTz?: PlayerDayAnchor;
}

export type UncompleteBlock = 'not-found' | 'legacy' | 'old' | 'used' | 'claimed';

const CAP_SOURCE = bondCapSource({ kind: 'completion', weight: 1 });

function findEntry(state: UncompleteState, id: string, completedAt: string): number {
  return state.completedTasks.findIndex(c => c.id === id && c.completedAt === completedAt);
}

/** Por que NÃO dá para desmarcar (ou `null` se dá). */
export function uncompleteBlock(state: UncompleteState, id: string, completedAt: string, now = new Date()): UncompleteBlock | null {
  const i = findEntry(state, id, completedAt);
  if (i < 0) return 'not-found';
  const r = state.completedTasks[i].receipt;
  if (!r || !r.task) return 'legacy';
  if (r.day !== playerDayKey(now, state.playerDayTz)) return 'old';
  const need: Record<string, number> = { ...r.food };
  if (r.premium) need[r.premium] = (need[r.premium] ?? 0) + 1;
  for (const [k, n] of Object.entries(need)) {
    if ((state.foodInventory[k] ?? 0) < n) return 'used';
  }
  if (r.mission && state.weeklyMissions && state.weeklyMissions.week === r.week && state.weeklyMissions.claimed.includes(r.mission)) return 'claimed';
  return null;
}

/** Desmarca e estorna. Devolve o MESMO objeto quando bloqueado (nada a gravar). */
export function uncompleteTask<T extends UncompleteState>(state: T, id: string, completedAt: string, now = new Date()): T {
  if (uncompleteBlock(state, id, completedAt, now)) return state;
  const i = findEntry(state, id, completedAt);
  const entry = state.completedTasks[i];
  const r = entry.receipt!;

  const food = { ...state.foodInventory };
  for (const [k, n] of Object.entries(r.food)) food[k] = (food[k] ?? 0) - n;
  if (r.premium) food[r.premium] = (food[r.premium] ?? 0) - 1;

  let premiumFood = state.premiumFood;
  if (r.premium && premiumFood) {
    premiumFood = {
      ...premiumFood,
      dropped: premiumFood.day === r.premiumDay ? Math.max(0, premiumFood.dropped - 1) : premiumFood.dropped,
      weekDropped: premiumFood.week === r.premiumWeek ? Math.max(0, premiumFood.weekDropped - 1) : premiumFood.weekDropped,
    };
  }

  let bondDaily = state.bondDaily;
  if (r.xp > 0 && CAP_SOURCE && bondDaily && bondDaily.day === r.day) {
    bondDaily = { ...bondDaily, spent: { ...bondDaily.spent, [CAP_SOURCE]: Math.max(0, (bondDaily.spent[CAP_SOURCE] ?? 0) - r.xp) } };
  }

  let weeklyMissions = state.weeklyMissions;
  if (r.mission && weeklyMissions && weeklyMissions.week === r.week) {
    weeklyMissions = { ...weeklyMissions, counts: { ...weeklyMissions.counts, [r.mission]: Math.max(0, (weeklyMissions.counts[r.mission] ?? 0) - 1) } };
  }

  const statKey = `task-${entry.name}-${entry.category}`;
  const stat = state.activityStats[statKey];
  const activityStats = stat
    ? { ...state.activityStats, [statKey]: { ...stat, completionCount: Math.max(0, stat.completionCount - 1) } }
    : state.activityStats;

  // A tarefa volta pendente. Com subitens, o ÚLTIMO volta a ficar pendente — sem
  // isso, todos marcados e a tarefa aberta não teria como ser concluída de novo.
  // `stepXpPaid` fica como estava: remarcar o subitem não repaga.
  const steps = r.task.steps;
  const volta = {
    ...r.task,
    completed: false,
    ...(steps && steps.length > 0 && steps.every(s => s.completed)
      ? { steps: steps.map((s, j) => (j === steps.length - 1 ? { ...s, completed: false } : s)) }
      : {}),
  };
  const tasks = [volta, ...state.tasks.filter(t => t.id !== r.nextId && t.id !== volta.id)];

  return {
    ...state,
    tasks: tasks as unknown as T['tasks'],
    completedTasks: state.completedTasks.filter((_, j) => j !== i),
    foodInventory: food,
    activityStats,
    totalXP: Math.max(0, (state.totalXP ?? 0) - r.xp),
    ...(bondDaily ? { bondDaily } : {}),
    ...(premiumFood ? { premiumFood } : {}),
    ...(weeklyMissions ? { weeklyMissions } : {}),
  };
}

/** Texto curto do bloqueio, para a opção desabilitada. */
export function uncompleteBlockText(b: UncompleteBlock, isPt: boolean): string {
  switch (b) {
    case 'used': return isPt ? 'A comida que ela rendeu já foi usada.' : 'The food it earned was already used.';
    case 'claimed': return isPt ? 'A missão que ela completou já foi resgatada.' : 'The mission it completed was already claimed.';
    case 'old': return isPt ? 'Só dá para desmarcar no mesmo dia.' : 'You can only undo it on the same day.';
    case 'legacy': return isPt ? 'Concluída antes desta versão: não dá para desfazer.' : 'Completed before this version: it can’t be undone.';
    default: return isPt ? 'Ainda salvando a conclusão. Tente em instantes.' : 'Still saving the completion. Try again in a moment.';
  }
}
