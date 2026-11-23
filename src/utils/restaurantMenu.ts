/**
 * 🍲 O CATÁLOGO dos pratos do Restaurante (folha-raiz, sem import de runtime): tipos + `DISHES` + `dishById`. Saiu de `restaurant.ts`
 * (16/11/2026) para o catálogo de itens da pastinha (`dishItems.ts`, que `shop.ts` importa) não puxar a cadeia de `restaurant.ts`.
 * `restaurant.ts` reexporta tudo daqui: quem já importava de lá não muda.
 */
import type { MaterialId } from './buildingQuests';
import type { MealBuffKind } from './restaurantState';

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

/** 16/11/2026 (REGISTRO §451): o Rift é o sumidouro de energia, então o que ENCHE energia custa mais — pratos de energia ×1,5 (arredondado; a escada +2 < +3 se mantém). Espelho: `functions/api/_feiraLoja.js`. */
export const ENERGY_DISH_PRICE_MULT = 1.5;
const energyDishPrice = (base: number): number => Math.round(base * ENERGY_DISH_PRICE_MULT);

/**
 * O CARDÁPIO. Balanço: os de COMBATE (+2%) custam 3 comidas + 1 material + 30–35 Bits; os de ENERGIA NA HORA (+2/+3,
 * ou seja 2–3 h de regeneração) e de REGENERAÇÃO (+25%/+40% por 24 h) custam 2–3 comidas + 2–3 essências + 15–40 Bits.
 * Cada chef tem 2 de energia/regeneração por essência e 3 de combate (ATK, DEF, SPD) por material. Tabela: `docs/RESTAURANTE.md`.
 */
export const DISHES: readonly Dish[] = [
  // 🌿 Snapjaw — seg/qua/sex
  { id: 'salada-viva', chef: 'snapjaw', icon: '🥗', nameEn: 'Living Salad', namePt: 'Salada Viva', foods: { '🥗': 2, '🧃': 1 }, extra: { type: 'essence', id: 'planta', qty: 2 }, bits: 20, effect: { kind: 'regen', value: 25 } },
  { id: 'cha-de-orvalho', chef: 'snapjaw', icon: '🍵', nameEn: 'Dew Tea', namePt: 'Chá de Orvalho', foods: { '☕': 1, '🧃': 1 }, extra: { type: 'essence', id: 'agua', qty: 2 }, bits: energyDishPrice(15), effect: { kind: 'energy', value: 2 } },
  { id: 'tigela-do-bosque', chef: 'snapjaw', icon: '🥣', nameEn: 'Grove Bowl', namePt: 'Tigela do Bosque', foods: { '🍚': 2, '🍎': 1 }, extra: { type: 'essence', id: 'vida', qty: 3 }, bits: 30, effect: { kind: 'regen', value: 40 } },
  { id: 'espetinho-de-vinha', chef: 'snapjaw', icon: '🍢', nameEn: 'Vine Skewer', namePt: 'Espetinho de Vinha', foods: { '🥩': 2, '🥗': 1 }, extra: { type: 'material', id: 'fang', qty: 1 }, bits: 30, effect: { kind: 'atk', value: 2 } },
  { id: 'sopa-de-raiz', chef: 'snapjaw', icon: '🍲', nameEn: 'Root Stew', namePt: 'Sopa de Raiz', foods: { '🥗': 1, '🍚': 1, '🥩': 1 }, extra: { type: 'material', id: 'moss', qty: 1 }, bits: 30, effect: { kind: 'def', value: 2 } },
  { id: 'mordida-da-flor', chef: 'snapjaw', icon: '🌸', nameEn: 'Bloom Bite', namePt: 'Mordida da Flor', foods: { '🍭': 1, '🍎': 1, '🥗': 1 }, extra: { type: 'material', id: 'laurel', qty: 1 }, bits: 35, effect: { kind: 'spd', value: 2 } },
  // 🍲 Caldo — ter/qui/sáb
  { id: 'pao-de-faisca', chef: 'caldo', icon: '🍞', nameEn: 'Spark Bread', namePt: 'Pão de Faísca', foods: { '🍚': 1, '☕': 1 }, extra: { type: 'essence', id: 'eletricidade', qty: 2 }, bits: energyDishPrice(15), effect: { kind: 'energy', value: 2 } },
  { id: 'ensopado-do-caldeirao', chef: 'caldo', icon: '🥘', nameEn: 'Cauldron Stew', namePt: 'Ensopado do Caldeirão', foods: { '🥩': 1, '🥗': 1, '🍚': 1 }, extra: { type: 'essence', id: 'arcano', qty: 3 }, bits: energyDishPrice(40), effect: { kind: 'energy', value: 3 } },
  { id: 'torta-de-mel-lunar', chef: 'caldo', icon: '🥧', nameEn: 'Moon Honey Pie', namePt: 'Torta de Mel Lunar', foods: { '🍭': 2, '🍎': 1 }, extra: { type: 'essence', id: 'luz', qty: 2 }, bits: 20, effect: { kind: 'regen', value: 25 } },
  { id: 'caldo-de-brasa', chef: 'caldo', icon: '🍜', nameEn: 'Ember Broth', namePt: 'Caldo de Brasa', foods: { '🥩': 2, '🍚': 1 }, extra: { type: 'material', id: 'spark', qty: 1 }, bits: 30, effect: { kind: 'atk', value: 2 } },
  { id: 'pizza-de-ferro', chef: 'caldo', icon: '🍕', nameEn: 'Ironcrust Pizza', namePt: 'Pizza Casca de Ferro', foods: { '🍕': 2, '🥩': 1 }, extra: { type: 'material', id: 'ore', qty: 1 }, bits: 30, effect: { kind: 'def', value: 2 } },
  { id: 'pudim-de-nevoa', chef: 'caldo', icon: '🍮', nameEn: 'Mist Pudding', namePt: 'Pudim de Névoa', foods: { '🍭': 1, '🧃': 1, '🍎': 1 }, extra: { type: 'material', id: 'down', qty: 1 }, bits: 35, effect: { kind: 'spd', value: 2 } },
];

const BY_ID = new Map(DISHES.map(d => [d.id, d] as const));
export const dishById = (id: string): Dish | undefined => BY_ID.get(id);
export const isCombatEffect = (e: DishEffect): boolean => e.kind === 'atk' || e.kind === 'def' || e.kind === 'spd';
