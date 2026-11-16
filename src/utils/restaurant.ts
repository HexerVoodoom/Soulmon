/**
 * 🍲 RESTAURANTE DO MERCADO (05/11/2026, pedido do dono) — DONO ÚNICO da regra dos pratos. Funções PURAS (`now` por parâmetro).
 *
 * 16/11/2026 (dono): COZINHAR NÃO serve na hora — o prato vira ITEM da pastinha (`dish:<id>`, `dishItems.ts`) e o jogador o USA depois.
 * O jogador COZINHA um prato com o que já tem: 2–3 comidas da pastinha (`foodInventory`) + UM ingrediente extra (essência de
 * elemento OU material de prédio — os mesmos do Soulsmith) + poucos Bits. Todo prato, ao ser USADO da pastinha:
 *  · enche a FOME até o máximo (as 3 barras: "satisfação cheia") — passa por `hunger.ts › eat`, nunca por aritmética própria;
 *  · e dá UM benefício: energia NA HORA, regeneração de energia mais rápida por 24 h, ou +% de ATK/DEF/SPD por 24 h no PvE.
 *
 * Cardápio por DIA DO JOGADOR (`playerDayIso`): seg/qua/sex a Snapjaw (planta carnívora), ter/qui/sáb o Caldo (o cozinheirinho),
 * domingo os dois com o cardápio inteiro.
 *
 * Fronteiras (as regras de sempre, nenhuma nova):
 *  · O buff de COMBATE entra pelo canal único `combinedAttrBonus` (teto de 5% somando TODAS as fontes) e só vale no PvE local
 *    (Masmorra, Arena, Pesadelo): o Duelo/Torneio/Guerra são re-simulados no servidor sobre o save e não o enxergam.
 *  · O prato de combate pede material (não se compra); os Bits de todos os pratos saem do saldo, gastando o Bit pago primeiro
 *    (`spendBitsPaidFirst`), como a loja. Desde §373 o Bit vindo de Crédito também paga o prato de combate; o teto de 5% segura.
 *  · UM buff de 24 h por vez (cozinhar outro substitui) e no máximo `DISHES_PER_DAY` pratos por dia do jogador.
 *  · Recusa SEMPRE antes de debitar; `applyCook` reconfere tudo sobre o `prev` (footgun do updater inline) e é tudo-ou-nada.
 */
import type { HungerState } from './hunger';
import { spendBitsPaidFirst, type BitsOrigin } from './bitsOrigin';
import { spendEssences } from './essences';
import { MATERIAL_CAP, type BuildingQuestState } from './buildingQuests';
import { playerDayIso, type PlayerDayAnchor } from './playerDay';
import { bumpDailyIn } from './dailyMissions';
import { countWeeklyMission } from './dungeonRewards';
import type { WeeklyMissionProgress } from './weeklyMissions';
import type { RestaurantState } from './restaurantState';

import { DISHES, dishById, type ChefId, type Dish, type DishExtra } from './restaurantMenu';
import { dishKey, serveDish } from './dishItems';
export { DISHES, dishById, isCombatEffect, ENERGY_DISH_PRICE_MULT, type ChefId, type Dish, type DishEffect, type DishExtra } from './restaurantMenu';
export { MEAL_BUFF_HOURS, MEAL_BUFF_VALUE_CAP, activeMealBuff, mealAttrBonus, sanitizeRestaurant, type MealBuff, type MealBuffKind, type RestaurantState } from './restaurantState';

// ── constantes (defaults propostos; o dono decide) ──────────────────────────────────────────────────────────────────────

/** Pratos por dia do jogador (segura o prato de energia na hora). */
export const DISHES_PER_DAY = 2;

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
  /** Missão semanal "cook-dish" (15/11/2026): conta 1 por prato COZINHADO (não a Feira). */
  weeklyMissions?: WeeklyMissionProgress;
}

export type CookRefusal = 'unknown' | 'not-today' | 'daily-cap' | 'no-food' | 'no-extra' | 'no-bits';

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
  return undefined;
}

/**
 * Cozinha e GUARDA na pastinha. Reconfere a recusa sobre `prev`; recusado → devolve a MESMA referência. Debita comidas, extra e Bits e põe o prato (`dish:<id>`) na
 * pastinha: fome e efeito só vêm ao USAR o item (`serveDish`).
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
  // Bits: gasta o pago primeiro, como a loja (§373: o prato de combate também aceita o Bit vindo de Crédito).
  s = spendBitsPaidFirst({ ...s, gamePoints: s.gamePoints - d.bits }, d.bits);
  // O prato NÃO é servido na hora (16/11/2026, dono): vai para a pastinha, junto com as comidas. Fome e efeito só quando o jogador
  // USA o item (`specialItemUse.ts › applySpecialItem` → `dishItems.ts › serveDish`); aqui só o teto de pratos do dia.
  const day = playerDayIso(new Date(now), prev.playerDayTz);
  const count = dishesToday(prev, now) + 1;
  const restaurant: RestaurantState = { ...(s.restaurant ?? {}), day, count };
  const key = dishKey(d.id);
  s = { ...s, foodInventory: { ...s.foodInventory, [key]: (s.foodInventory[key] ?? 0) + 1 } };
  // Missão da Snapjaw (12/11/2026, REGISTRO §314): pedir 1 prato no Restaurante (a Feira de verdade, `applyFeiraDish`, é outro gesto).
  // Missão SEMANAL "fazer um prato, qualquer prato" (15/11/2026, dono): 1 por prato cozinhado, no mesmo ponto da diária (a Feira de verdade não conta: o prato já vem pronto).
  return { state: countWeeklyMission(bumpDailyIn({ ...s, restaurant }, 'prato', 1, new Date(now)), 'cook-dish', new Date(now)) };
}

/**
 * A FEIRA DE VERDADE (10/11/2026): o prato PRONTO, sem ingrediente, ao preço da oferta (Bits do Restaurante com o desconto da feira).
 * Mesmo efeito do prato cozinhado (`applyCook`: fome cheia + energia na hora ou buff), mas NÃO usa o chef do dia nem o teto de pratos
 * por dia (não é o Restaurante) e não toca comidas, essências ou materiais. Efeito de combate só com Bit GANHO, como no Restaurante.
 */
export function applyFeiraDish<T extends CookState>(prev: T, dishId: string, price: number, now: number): { state: T; refused?: 'unknown' | 'no-bits' } {
  const d = dishById(dishId);
  if (!d || !Number.isInteger(price) || price < 1) return { state: prev, refused: 'unknown' };
  if ((prev.gamePoints ?? 0) < price) return { state: prev, refused: 'no-bits' };
  return { state: serveDish(spendBitsPaidFirst({ ...prev, gamePoints: prev.gamePoints - price }, price), d, now) };
}
