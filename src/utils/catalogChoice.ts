import type { CatalogItem } from '../types/activityCatalog';
import { DAILY_SCHEDULE } from './catalogHabitMigrate';

/** Id novo de atividade criada a partir do catálogo. */
function genId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Constrói as `Activity` a partir dos itens escolhidos — id novo, nível 1,
 *  agenda padrão do nível 1 do item. Não decide nada sobre o resto do save. */
export function activitiesFromCatalogChoice(
  items: CatalogItem[],
  isPt: boolean,
  nowIso: string = new Date().toISOString(),
): Array<{
  id: string; name: string; category: CatalogItem['category']; emoji: string;
  steps: never[]; weekDays: number[]; catalogId: string; level: 1;
  catalogLevelSetAt: string;
  schedule: CatalogItem['levels'][number]['defaultSchedule'];
}> {
  // `catalogLevelSetAt` desde a criação: sem ele `catalogLevelSignal` trata o
  // tempo no nível como 0 e o convite de subir nunca aparece.
  return items.map((item) => ({
    id: genId(),
    name: isPt ? item.name.pt : item.name.en,
    catalogLevelSetAt: nowIso,
    category: item.category,
    emoji: item.emoji,
    steps: [],
    weekDays: [0, 1, 2, 3, 4, 5, 6],
    catalogId: item.id,
    level: 1,
    // Hábito = TODO DIA: a agenda 3x/semana do nível 1 mandava o item para a linha de tarefas.
    schedule: DAILY_SCHEDULE,
  }));
}

/**
 * O AVISO DO TETO no catálogo (§376). Todo item do catálogo nasce hábito de TODO DIA (§295) e, por isso, ocupa uma vaga da
 * cota de hábitos (`consomeCotaDeHabito`). Com a cota cheia o portão (`commitHabitCreate`) devolvia 0 e o catálogo fechava
 * como se tivesse adicionado: o hábito sumia sem explicação ("Adicionei a Walk e não apareceu", dono 14/11/2026).
 * Devolve o texto do aviso quando `count >= cap`, ou `null` quando ainda cabe. NÃO muda o teto (o número é o mesmo de
 * `activityCapFor`); só deixa de esconder a regra.
 */
export function catalogHabitCapNotice(
  count: number,
  cap: number | undefined,
  isPt: boolean,
  isDemoBoundary = false,
): string | null {
  if (typeof cap !== 'number' || !Number.isFinite(cap) || count < cap) return null;
  const base = isPt
    ? `Limite atingido: você já tem ${count} de ${cap} hábitos de todo dia. Para adicionar outro, remova um hábito ou crie uma tarefa em dias específicos (tarefas não têm limite).`
    : `Limit reached: you already have ${count} of ${cap} every-day habits. To add another, remove a habit or create a task on specific days (tasks are unlimited).`;
  if (!isDemoBoundary) return base;
  return base + (isPt ? ' Evoluir com seu próprio Soulmon aumenta esse teto.' : ' Evolving your own Soulmon raises this ceiling.');
}

/**
 * Tira da escolha o que JÁ está na lista (beta-2, 7.3: "sem duplicar"). A chave é o `catalogId` da atividade
 * existente — o mesmo item do catálogo não entra duas vezes, mesmo que a pessoa o tenha renomeado — e,
 * dentro da própria escolha, o mesmo item não se repete. Função pura; a ORDEM da escolha é preservada.
 */
export function withoutExisting<T extends { id: string }>(
  items: readonly T[],
  existing: ReadonlyArray<{ catalogId?: string | null }> | undefined,
): T[] {
  const ja = new Set<string>();
  for (const a of existing ?? []) if (a && typeof a.catalogId === 'string' && a.catalogId) ja.add(a.catalogId);
  const out: T[] = [];
  for (const it of items) {
    if (ja.has(it.id)) continue;
    ja.add(it.id);
    out.push(it);
  }
  return out;
}
