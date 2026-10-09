import { FOOD_BY_CATEGORY } from '../constants/labels';
import { MATERIAL_CAP, MATERIAL_IDS, type BuildingQuestState, type MaterialId } from './buildingQuests';

export const FOCUS_ENVIRONMENTS = [
  { id: 'forest', pt: 'Floresta', en: 'Forest', icon: 'forest', materials: ['moss', 'laurel', 'down', 'fang'] },
  { id: 'shore', pt: 'Costa', en: 'Shore', icon: 'waves', materials: ['pebble', 'prism', 'essence', 'keepsake'] },
  { id: 'cavern', pt: 'Caverna', en: 'Cavern', icon: 'landscape', materials: ['ore', 'spark', 'cipher', 'crest'] },
  { id: 'garden', pt: 'Jardim', en: 'Garden', icon: 'yard', materials: ['moss', 'essence', 'page', 'prism'] },
  { id: 'workshop', pt: 'Oficina', en: 'Workshop', icon: 'build', materials: ['gear', 'ink', 'spark', 'ribbon'] },
  { id: 'observatory', pt: 'Observatório', en: 'Observatory', icon: 'visibility', materials: ['cipher', 'down', 'page', 'laurel'] },
] as const satisfies ReadonlyArray<{ id: string; pt: string; en: string; icon: string; materials: readonly MaterialId[] }>;

export type FocusEnvironmentId = typeof FOCUS_ENVIRONMENTS[number]['id'];
export type FocusLootLedger = { day: string; items: number; claims: string[] };
export type FocusLootState = {
  foodInventory: Record<string, number>;
  buildingQuests?: BuildingQuestState;
  focusLoot?: FocusLootLedger;
};
export type FocusLootItem = { kind: 'material' | 'food'; id: string; icon: string; namePt: string; nameEn: string };
export type FocusLootRoll = { primary: FocusLootItem; extra?: FocusLootItem; chancePercent: number };
export type FocusLootRequest = { day: string; environment: FocusEnvironmentId; sessionId: string; eventId: string };

export const FOCUS_LOOT_DAILY_CAP = 8;
export const FOCUS_EXTRA_BASE_CHANCE = 0.05;
export const FOCUS_EXTRA_CHANCE_PER_CYCLE = 0.05;
export const FOCUS_EXTRA_MAX_CHANCE = 0.25;

const MATERIAL_COPY: Record<MaterialId, { pt: string; en: string; icon: string }> = {
  spark: { pt: 'Faísca', en: 'Spark', icon: '✨' }, moss: { pt: 'Musgo', en: 'Moss', icon: '🌿' },
  prism: { pt: 'Prisma', en: 'Prism', icon: '🔷' }, pebble: { pt: 'Seixo', en: 'Pebble', icon: '🗿' },
  ore: { pt: 'Minério', en: 'Ore', icon: '⛏️' }, ink: { pt: 'Tinta', en: 'Ink', icon: '🖋️' },
  gear: { pt: 'Engrenagem', en: 'Gear', icon: '⚙️' }, fang: { pt: 'Presa', en: 'Fang', icon: '🦷' },
  laurel: { pt: 'Louro', en: 'Laurel', icon: '🍃' }, ribbon: { pt: 'Fita', en: 'Ribbon', icon: '🎀' },
  essence: { pt: 'Essência', en: 'Essence', icon: '🧬' }, down: { pt: 'Penugem', en: 'Down', icon: '☁️' },
  cipher: { pt: 'Cifra', en: 'Cipher', icon: '🔣' }, page: { pt: 'Página', en: 'Page', icon: '📜' },
  keepsake: { pt: 'Lembrança', en: 'Keepsake', icon: '🎁' }, crest: { pt: 'Brasão', en: 'Crest', icon: '🛡️' },
};
const FOOD_ITEMS: FocusLootItem[] = Object.values(FOOD_BY_CATEGORY).map(food => ({
  kind: 'food', id: food.emoji, icon: food.emoji,
  namePt: ({ '🥩': 'Proteína', '🥗': 'Salada', '🍎': 'Maçã', '☕': 'Café', '🧃': 'Suco', '🍚': 'Arroz', '🍕': 'Pizza', '🍭': 'Doce' } as Record<string, string>)[food.emoji] ?? food.name,
  nameEn: food.name,
}));

export function isFocusEnvironmentId(value: unknown): value is FocusEnvironmentId {
  return FOCUS_ENVIRONMENTS.some(environment => environment.id === value);
}

export function focusExtraChance(completedCycles: number): number {
  return Math.min(FOCUS_EXTRA_MAX_CHANCE, FOCUS_EXTRA_BASE_CHANCE + Math.max(0, Math.floor(completedCycles)) * FOCUS_EXTRA_CHANCE_PER_CYCLE);
}

/** Each environment contributes four materials and one equally weighted food slot (food type is random). */
export function rollFocusLoot(environmentId: FocusEnvironmentId, completedCycles: number, random: () => number = Math.random): FocusLootRoll {
  const environment = FOCUS_ENVIRONMENTS.find(item => item.id === environmentId)!;
  const availableMaterials = environment.materials.map(id => {
    const copy = MATERIAL_COPY[id];
    return { kind: 'material' as const, id, icon: copy.icon, namePt: copy.pt, nameEn: copy.en };
  });
  const pool = [...availableMaterials, null];
  const pick = () => {
    const index = Math.min(pool.length - 1, Math.floor(Math.max(0, Math.min(0.999999999, random())) * pool.length));
    if (pool[index]) return pool[index]!;
    const foodIndex = Math.min(FOOD_ITEMS.length - 1, Math.floor(Math.max(0, Math.min(0.999999999, random())) * FOOD_ITEMS.length));
    return FOOD_ITEMS[foodIndex];
  };
  const chance = focusExtraChance(completedCycles);
  return { primary: pick(), ...(random() < chance ? { extra: pick() } : {}), chancePercent: Math.round(chance * 100) };
}

export function sanitizeFocusLoot(raw: unknown): FocusLootLedger | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.day)) return undefined;
  const items = typeof r.items === 'number' && Number.isFinite(r.items) ? Math.floor(r.items) : -1;
  if (items < 0 || items > FOCUS_LOOT_DAILY_CAP || !Array.isArray(r.claims)) return undefined;
  const claims = [...new Set(r.claims.filter((id): id is string => typeof id === 'string' && /^[\w:-]{1,120}$/.test(id)))].slice(0, FOCUS_LOOT_DAILY_CAP);
  return { day: r.day, items, claims };
}

export function applyFocusLoot(state: FocusLootState, request: FocusLootRequest, roll: FocusLootRoll): { state: FocusLootState; accepted: boolean; items: FocusLootItem[] } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(request.day) || !isFocusEnvironmentId(request.environment) || !request.sessionId || !request.eventId) {
    return { state, accepted: false, items: [] };
  }
  const current = state.focusLoot?.day === request.day ? sanitizeFocusLoot(state.focusLoot) : undefined;
  const ledger = current ?? { day: request.day, items: 0, claims: [] };
  if (ledger.claims.includes(request.eventId) || ledger.items >= FOCUS_LOOT_DAILY_CAP) return { state, accepted: false, items: [] };
  const remaining = FOCUS_LOOT_DAILY_CAP - ledger.items;
  const allowedMaterials = FOCUS_ENVIRONMENTS.find(environment => environment.id === request.environment)?.materials as readonly MaterialId[];
  const items = [roll.primary, ...(roll.extra ? [roll.extra] : [])].slice(0, remaining).map(item => {
    if (item.kind !== 'material') return item;
    if (!MATERIAL_IDS.includes(item.id as MaterialId) || !allowedMaterials.includes(item.id as MaterialId) || (state.buildingQuests?.materials?.[item.id as MaterialId] ?? 0) >= MATERIAL_CAP) return FOOD_ITEMS[0];
    return item;
  });
  if (!items.length) return { state, accepted: false, items: [] };
  const materials = { ...(state.buildingQuests?.materials ?? {}) };
  const foodInventory = { ...state.foodInventory };
  for (const item of items) {
    if (item.kind === 'material' && MATERIAL_IDS.includes(item.id as MaterialId)) {
      const id = item.id as MaterialId;
      materials[id] = Math.min(MATERIAL_CAP, (materials[id] ?? 0) + 1);
    } else if (item.kind === 'food' && FOOD_ITEMS.some(food => food.id === item.id)) {
      foodInventory[item.id] = (foodInventory[item.id] ?? 0) + 1;
    }
  }
  const newState: FocusLootState = {
    ...state,
    foodInventory,
    buildingQuests: { ...(state.buildingQuests ?? { day: request.day, visited: [], claimed: [], materials: {} }), materials },
    focusLoot: { day: request.day, items: ledger.items + items.length, claims: [...ledger.claims, request.eventId].slice(-FOCUS_LOOT_DAILY_CAP) },
  };
  return { state: newState, accepted: true, items };
}
