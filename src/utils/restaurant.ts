/**
 * 🍲 RESTAURANTE DO MERCADO (05/11/2026, pedido do dono) — DONO ÚNICO da regra dos pratos. Funções PURAS (`now` por parâmetro).
 *
 * O jogador COZINHA um prato com o que já tem: 2–3 comidas da pastinha (`foodInventory`) + UM ingrediente extra (essência de
 * elemento OU material de prédio — os mesmos do Soulsmith) + poucos Bits. Todo prato:
 *  · enche a FOME até o máximo (as 3 barras: "satisfação cheia") — passa por `hunger.ts › eat`, nunca por aritmética própria;
 *  · e dá UM benefício: energia NA HORA, regeneração de energia mais rápida por 24 h, ou +% de ATK/DEF/SPD por 24 h no PvE.
 *
 * Cardápio por DIA DO JOGADOR (`playerDayIso`): seg/qua/sex a Snapjaw (planta carnívora), ter/qui/sáb o Caldo (o cozinheirinho),
 * domingo os dois com o cardápio inteiro.
 *
 * Fronteiras (as regras de sempre, nenhuma nova):
 *  · O buff de COMBATE entra pelo canal único `combinedAttrBonus` (teto de 5% somando TODAS as fontes) e só vale no PvE local
 *    (Masmorra, Arena, Pesadelo): o Duelo/Torneio/Guerra são re-simulados no servidor sobre o save e não o enxergam.
 *  · Nada pago com dinheiro real alcança combate: o prato de combate pede material (não se compra) e só aceita Bits GANHOS
 *    (`earnedBits`); os de energia/regeneração gastam o Bit pago primeiro (`spendBitsPaidFirst`), como a loja.
 *  · UM buff de 24 h por vez (cozinhar outro substitui) e no máximo `DISHES_PER_DAY` pratos por dia do jogador.
 *  · Recusa SEMPRE antes de debitar; `applyCook` reconfere tudo sobre o `prev` (footgun do updater inline) e é tudo-ou-nada.
 */
import { eat, HUNGER_MAX, setEnergy, type HungerState } from './hunger';
import { earnedBits, spendBitsPaidFirst, type BitsOrigin } from './bitsOrigin';
import { spendEssences } from './essences';
import { MATERIAL_CAP, type MaterialId, type BuildingQuestState } from './buildingQuests';
import { playerDayIso, type PlayerDayAnchor } from './playerDay';
import { MEAL_BUFF_MS, type MealBuffKind, type RestaurantState } from './restaurantState';

export { MEAL_BUFF_HOURS, MEAL_BUFF_VALUE_CAP, activeMealBuff, mealAttrBonus, sanitizeRestaurant, type MealBuff, type MealBuffKind, type RestaurantState } from './restaurantState';

// ── constantes (defaults propostos; o dono decide) ──────────────────────────────────────────────────────────────────────

/** Pratos por dia do jogador (segura o prato de energia na hora). */
export const DISHES_PER_DAY = 2;

export type ChefId = 'snapjaw' | 'caldo';
/** `energy` = unidades de energia NA HORA; os outros duram `MEAL_BUFF_HOURS` (atk/def/spd em %, regen em % a mais de velocidade). */
export type DishEffect = { kind: 'energy'; value: number } | { kind: MealBuffKind; value: number };
export type DishExtra = { type: 'essence'; id: string; qty: number } | { type: 'material'; id: MaterialId; qty: number };

export interface Dish {
  id: string;
  chef: ChefId;
  icon: string;
  nameEn: string;
  namePt: string;
  /** Comidas da pastinha (emoji → quantidade). Sempre 2+ no total. */
  foods: Readonly<Record<string, number>>;
  extra: DishExtra;
  bits: number;
  effect: DishEffect;
}

/**
 * O CARDÁPIO. Balanço: os de COMBATE (+2%) custam 3 comidas + 1 material + 30–35 Bits GANHOS; os de ENERGIA NA HORA (+2/+3,
 * ou seja 2–3 h de regeneração) e de REGENERAÇÃO (+25%/+40% por 24 h) custam 2–3 comidas + 2–3 essências + 15–40 Bits.
 * Cada chef tem 2 de energia/regeneração por essência e 3 de combate (ATK, DEF, SPD) por material. Tabela: `docs/RESTAURANTE.md`.
 */
export const DISHES: readonly Dish[] = [
  // 🌿 Snapjaw — seg/qua/sex
  { id: 'salada-viva', chef: 'snapjaw', icon: '🥗', nameEn: 'Living Salad', namePt: 'Salada Viva', foods: { '🥗': 2, '🧃': 1 }, extra: { type: 'essence', id: 'planta', qty: 2 }, bits: 20, effect: { kind: 'regen', value: 25 } },
  { id: 'cha-de-orvalho', chef: 'snapjaw', icon: '🍵', nameEn: 'Dew Tea', namePt: 'Chá de Orvalho', foods: { '☕': 1, '🧃': 1 }, extra: { type: 'essence', id: 'agua', qty: 2 }, bits: 15, effect: { kind: 'energy', value: 2 } },
  { id: 'tigela-do-bosque', chef: 'snapjaw', icon: '🥣', nameEn: 'Grove Bowl', namePt: 'Tigela do Bosque', foods: { '🍚': 2, '🍎': 1 }, extra: { type: 'essence', id: 'vida', qty: 3 }, bits: 30, effect: { kind: 'regen', value: 40 } },
  { id: 'espetinho-de-vinha', chef: 'snapjaw', icon: '🍢', nameEn: 'Vine Skewer', namePt: 'Espetinho de Vinha', foods: { '🥩': 2, '🥗': 1 }, extra: { type: 'material', id: 'fang', qty: 1 }, bits: 30, effect: { kind: 'atk', value: 2 } },
  { id: 'sopa-de-raiz', chef: 'snapjaw', icon: '🍲', nameEn: 'Root Stew', namePt: 'Sopa de Raiz', foods: { '🥗': 1, '🍚': 1, '🥩': 1 }, extra: { type: 'material', id: 'moss', qty: 1 }, bits: 30, effect: { kind: 'def', value: 2 } },
  { id: 'mordida-da-flor', chef: 'snapjaw', icon: '🌸', nameEn: 'Bloom Bite', namePt: 'Mordida da Flor', foods: { '🍭': 1, '🍎': 1, '🥗': 1 }, extra: { type: 'material', id: 'laurel', qty: 1 }, bits: 35, effect: { kind: 'spd', value: 2 } },
  // 🍲 Caldo — ter/qui/sáb
  { id: 'pao-de-faisca', chef: 'caldo', icon: '🍞', nameEn: 'Spark Bread', namePt: 'Pão de Faísca', foods: { '🍚': 1, '☕': 1 }, extra: { type: 'essence', id: 'eletricidade', qty: 2 }, bits: 15, effect: { kind: 'energy', value: 2 } },
  { id: 'ensopado-do-caldeirao', chef: 'caldo', icon: '🫕', nameEn: 'Cauldron Stew', namePt: 'Ensopado do Caldeirão', foods: { '🥩': 1, '🥗': 1, '🍚': 1 }, extra: { type: 'essence', id: 'arcano', qty: 3 }, bits: 40, effect: { kind: 'energy', value: 3 } },
  { id: 'torta-de-mel-lunar', chef: 'caldo', icon: '🥧', nameEn: 'Moon Honey Pie', namePt: 'Torta de Mel Lunar', foods: { '🍭': 2, '🍎': 1 }, extra: { type: 'essence', id: 'luz', qty: 2 }, bits: 20, effect: { kind: 'regen', value: 25 } },
  { id: 'caldo-de-brasa', chef: 'caldo', icon: '🍜', nameEn: 'Ember Broth', namePt: 'Caldo de Brasa', foods: { '🥩': 2, '🍚': 1 }, extra: { type: 'material', id: 'spark', qty: 1 }, bits: 30, effect: { kind: 'atk', value: 2 } },
  { id: 'pizza-de-ferro', chef: 'caldo', icon: '🍕', nameEn: 'Ironcrust Pizza', namePt: 'Pizza Casca de Ferro', foods: { '🍕': 2, '🥩': 1 }, extra: { type: 'material', id: 'ore', qty: 1 }, bits: 30, effect: { kind: 'def', value: 2 } },
  { id: 'pudim-de-nevoa', chef: 'caldo', icon: '🍮', nameEn: 'Mist Pudding', namePt: 'Pudim de Névoa', foods: { '🍭': 1, '🧃': 1, '🍎': 1 }, extra: { type: 'material', id: 'down', qty: 1 }, bits: 35, effect: { kind: 'spd', value: 2 } },
];

const BY_ID = new Map(DISHES.map(d => [d.id, d] as const));
export const dishById = (id: string): Dish | undefined => BY_ID.get(id);
export const isCombatEffect = (e: DishEffect): boolean => e.kind === 'atk' || e.kind === 'def' || e.kind === 'spd';

// ── o cardápio do dia ────────────────────────────────────────────────────────────────────────────────────────────────

/** Dia da semana (0 = domingo) do DIA DO JOGADOR. */
export function playerWeekday(now: Date, anchor: PlayerDayAnchor | undefined): number {
  return new Date(`${playerDayIso(now, anchor)}T12:00:00Z`).getUTCDay();
}

/** seg/qua/sex → Snapjaw · ter/qui/sáb → Caldo · domingo → os dois. */
export function chefsOn(weekday: number): ChefId[] {
  if (weekday === 0) return ['snapjaw', 'caldo'];
  return weekday % 2 === 1 ? ['snapjaw'] : ['caldo'];
}

export const menuOn = (weekday: number): Dish[] => {
  const chefs = chefsOn(weekday);
  return DISHES.filter(d => chefs.includes(d.chef));
};

// ── o estado no save ──────────────────────────────────────────────────────────────────────────────────────────────────

export function dishesToday(s: { restaurant?: RestaurantState; playerDayTz?: PlayerDayAnchor }, now: number): number {
  const r = s.restaurant;
  return r?.day === playerDayIso(new Date(now), s.playerDayTz) ? (r.count ?? 0) : 0;
}

// ── cozinhar ─────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface CookState extends HungerState {
  foodInventory: Record<string, number>;
  gamePoints: number;
  bitsOrigin?: BitsOrigin;
  essences?: Record<string, number>;
  essenceSpent?: Record<string, number>;
  buildingQuests?: BuildingQuestState;
  restaurant?: RestaurantState;
  playerDayTz?: PlayerDayAnchor;
}

export type CookRefusal = 'unknown' | 'not-today' | 'daily-cap' | 'no-food' | 'no-extra' | 'no-bits' | 'not-earned';

export function extraOwned(s: CookState, extra: DishExtra): number {
  return extra.type === 'essence' ? (s.essences?.[extra.id] ?? 0) : (s.buildingQuests?.materials?.[extra.id] ?? 0);
}

export function cookRefusal(s: CookState, dishId: string, now: number): CookRefusal | undefined {
  const d = dishById(dishId);
  if (!d) return 'unknown';
  if (!chefsOn(playerWeekday(new Date(now), s.playerDayTz)).includes(d.chef)) return 'not-today';
  if (dishesToday(s, now) >= DISHES_PER_DAY) return 'daily-cap';
  for (const [emoji, n] of Object.entries(d.foods)) if ((s.foodInventory?.[emoji] ?? 0) < n) return 'no-food';
  if (extraOwned(s, d.extra) < d.extra.qty) return 'no-extra';
  if ((s.gamePoints ?? 0) < d.bits) return 'no-bits';
  if (isCombatEffect(d.effect) && earnedBits(s) < d.bits) return 'not-earned';
  return undefined;
}

/**
 * Cozinha e serve. Reconfere a recusa sobre `prev`; recusado → devolve a MESMA referência. Debita comidas, extra e Bits, enche a
 * fome (`eat`) e aplica o efeito (energia por `setEnergy`, buff substitui o anterior).
 */
export function applyCook<T extends CookState>(prev: T, dishId: string, now: number): { state: T; refused?: CookRefusal } {
  const refused = cookRefusal(prev, dishId, now);
  if (refused) return { state: prev, refused };
  const d = dishById(dishId)!;
  // comidas
  const foodInventory = { ...prev.foodInventory };
  for (const [emoji, n] of Object.entries(d.foods)) {
    const left = (foodInventory[emoji] ?? 0) - n;
    if (left > 0) foodInventory[emoji] = left; else delete foodInventory[emoji];
  }
  let s: T = { ...prev, foodInventory };
  // extra
  if (d.extra.type === 'essence') {
    const next = spendEssences(s, [{ id: d.extra.id, qty: d.extra.qty }]);
    if (!next) return { state: prev, refused: 'no-extra' };
    s = next;
  } else {
    const bq = s.buildingQuests!;
    const materials = { ...bq.materials };
    const left = Math.min(MATERIAL_CAP, (materials[d.extra.id] ?? 0) - d.extra.qty);
    if (left > 0) materials[d.extra.id] = left; else delete materials[d.extra.id];
    s = { ...s, buildingQuests: { ...bq, materials } };
  }
  // Bits: combate só com Bit GANHO (o pago fica intacto); o resto gasta o pago primeiro, como a loja.
  const gamePoints = s.gamePoints - d.bits;
  if (isCombatEffect(d.effect)) {
    s = { ...s, gamePoints, ...(s.bitsOrigin ? { bitsOrigin: { ...s.bitsOrigin, paidLeft: Math.min(s.bitsOrigin.paidLeft, gamePoints) } } : {}) };
  } else {
    s = spendBitsPaidFirst({ ...s, gamePoints }, d.bits);
  }
  // fome cheia
  s = eat(s, now, HUNGER_MAX);
  // efeito
  const day = playerDayIso(new Date(now), prev.playerDayTz);
  const count = dishesToday(prev, now) + 1;
  const restaurant: RestaurantState = { ...(s.restaurant ?? {}), day, count };
  if (d.effect.kind === 'energy') {
    const value = d.effect.value;
    s = setEnergy(s, now, cur => cur + value);
  } else {
    // regeneração: acerta o relógio ANTES de o buff começar (a velocidade nova vale só daqui para frente)
    restaurant.buff = { dish: d.id, kind: d.effect.kind, value: d.effect.value, from: now, until: now + MEAL_BUFF_MS };
  }
  return { state: { ...s, restaurant } };
}
