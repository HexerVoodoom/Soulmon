import type { CatalogItem } from '../types/activityCatalog';
import { catalogIfLoaded } from '../data/catalogoCarga';
import type { Schedule } from '../types/taskModel';

/** Hábito = TODO DIA. */
export const DAILY_SCHEDULE: Schedule = { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] };

function sameSchedule(a: unknown, b: Schedule): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Migração segura (load do save): hábito do catálogo que entrou com a agenda
 * padrão do nível 1 (3x/semana, dias úteis...) caía na linha de TAREFAS
 * (`activityBucket` = 'scheduled'). Converte para todo dia SÓ quando a agenda
 * ainda é exatamente a padrão de algum nível do item (nunca editada pela
 * pessoa). id, histórico, stats, Bits e nível ficam intactos. Idempotente.
 */
export function migrateCatalogHabitDaily<T extends { catalogId?: unknown; schedule?: unknown }>(
  a: T,
  porId: Record<string, CatalogItem> | null = catalogIfLoaded(),
): T {
  if (!porId) return a; // catálogo ainda não carregado (fora do chunk de entrada): o provider migra quando ele chega
  const cid = a.catalogId;
  if (typeof cid !== 'string' || !cid || !a.schedule) return a;
  if (sameSchedule(a.schedule, DAILY_SCHEDULE)) return a;
  const item = porId[cid];
  if (!item) return a;
  const intacta = item.levels.some(l => sameSchedule(l.defaultSchedule, a.schedule as Schedule));
  if (!intacta) return a;
  return { ...a, schedule: DAILY_SCHEDULE, weekDays: [0, 1, 2, 3, 4, 5, 6] };
}
