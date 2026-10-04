import type { CatalogItem } from '../types/activityCatalog';

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
    schedule: item.levels[0].defaultSchedule,
  }));
}
