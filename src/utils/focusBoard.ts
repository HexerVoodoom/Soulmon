/**
 * O QUADRO DA OFICINA (§247): critério de cada chave, chaves da sessão no aparelho e o crédito idempotente do que a jornada pagou.
 * Puro, exceto `loadBoardKeys`/`saveBoardKeys` (storage do aparelho). A regra da jornada é de `focusJourney.ts`.
 */
import { MATERIAL_CAP, MATERIAL_IDS, type BuildingQuestState, type MaterialId } from './buildingQuests';
import { applyEssences } from './essences';
import { JOURNEY_FOODS, isJourneyKey, type JourneyGrants, type JourneyKeyId } from './focusJourney';
import type { SessionDraft } from './focoSessao';
import { readJson, writeJson } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';

/** A chave sai quando a técnica foi feita de verdade, mas nunca exige contagem (§238, D-3). */
export function keyEarned(key: JourneyKeyId, d: SessionDraft, opts: { noTasks: boolean; dumpDone: boolean; /** Alguma tarefa já tem as 4 notas de Prioridades. */ classified?: boolean }): boolean {
  switch (key) {
    case 'bancada': return Object.values(d.prepChecked).some(Boolean);
    case 'relampago': return opts.noTasks || d.twoMin.length > 0;
    case 'quadrantes': return opts.noTasks || (opts.classified ?? Object.keys(d.matrix).length > 0);
    case 'brejo': return opts.noTasks || d.frog !== '';
    case 'elo': return d.ifThen.cue.trim() !== '' && d.ifThen.action.trim() !== '';
    case 'pena': return opts.dumpDone || d.dump.trim() !== '';
  }
}

/** As chaves da sessão em preparo (só do aparelho; ao começar, a verdade passa a ser o servidor). */
export function loadBoardKeys(): JourneyKeyId[] {
  const raw = readJson<unknown>(STORAGE_KEYS.FOCO_JOURNEY_KEYS, []);
  return Array.isArray(raw) ? [...new Set(raw.filter(isJourneyKey))] : [];
}
export const saveBoardKeys = (keys: readonly JourneyKeyId[]): void => { writeJson(STORAGE_KEYS.FOCO_JOURNEY_KEYS, [...keys], { silent: true }); };

export interface JourneyCredited { day: string; ids: string[] }
export interface JourneyCreditState {
  essences?: Record<string, number>;
  foodInventory: Record<string, number>;
  buildingQuests?: BuildingQuestState;
  journeyCredited?: JourneyCredited;
  dungeonKeyDay?: string;
}

/** Lixo → `undefined`. */
export function sanitizeJourneyCredited(raw: unknown): JourneyCredited | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.day) || !Array.isArray(r.ids)) return undefined;
  return { day: r.day, ids: [...new Set(r.ids.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 60))].slice(-80) };
}

/** Credita os recibos do dia que ainda não estão no save. Nada novo → a MESMA referência. */
export function applyJourneyGrants<T extends JourneyCreditState>(prev: T, day: string, grants: JourneyGrants, dungeonKeyDay?: string): T {
  const cur = prev.journeyCredited?.day === day ? prev.journeyCredited.ids : [];
  const novos = Object.keys(grants).filter(id => !cur.includes(id));
  const comChave = dungeonKeyDay && prev.dungeonKeyDay !== dungeonKeyDay ? { dungeonKeyDay } : {};
  if (!novos.length) return Object.keys(comChave).length ? { ...prev, ...comChave } : prev;
  const materials = { ...(prev.buildingQuests?.materials ?? {}) };
  const foodInventory = { ...prev.foodInventory };
  const essencias: Array<{ id: string; qty: number }> = [];
  for (const id of novos) for (const it of grants[id] ?? []) {
    const qty = Math.max(0, Math.floor(it.qty));
    if (it.kind === 'material' && MATERIAL_IDS.includes(it.id as MaterialId)) materials[it.id as MaterialId] = Math.min(MATERIAL_CAP, (materials[it.id as MaterialId] ?? 0) + qty);
    else if (it.kind === 'food' && JOURNEY_FOODS.includes(it.id)) foodInventory[it.id] = (foodInventory[it.id] ?? 0) + qty;
    else if (it.kind === 'essence') essencias.push({ id: it.id, qty });
  }
  const { essences } = applyEssences({ essences: prev.essences ?? {} }, essencias);
  const base = { ...prev, essences };
  return {
    ...base, ...comChave, foodInventory,
    buildingQuests: { ...(prev.buildingQuests ?? { day, visited: [], claimed: [], materials: {} }), materials },
    journeyCredited: { day, ids: [...cur, ...novos].slice(-80) },
  } as T;
}
