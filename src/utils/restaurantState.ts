/**
 * 🍲 O ESTADO do Restaurante no save (`GameState.restaurant`) — folha LEVE (sem import), lida pelo `GameStateContext` no chunk de
 * entrada e pelo bônus de combate. A regra dos pratos mora em `restaurant.ts`.
 */
import type { AttrBonus } from './combate/bonus';

/** Duração de todo buff de prato. */
export const MEAL_BUFF_HOURS = 24;
export const MEAL_BUFF_MS = MEAL_BUFF_HOURS * 3_600_000;

export type MealBuffKind = 'atk' | 'def' | 'spd' | 'regen';
/** O maior valor do cardápio por tipo (teste trava contra `DISHES`): save editado não compra +50%. */
export const MEAL_BUFF_VALUE_CAP: Readonly<Record<MealBuffKind, number>> = { atk: 2, def: 2, spd: 2, regen: 40 };

export interface MealBuff { dish: string; kind: MealBuffKind; value: number; from: number; until: number }
/** `GameState.restaurant`: o buff ativo (um por vez) e quantos pratos no dia do jogador. */
export interface RestaurantState { buff?: MealBuff; day?: string; count?: number }

const KINDS: readonly MealBuffKind[] = ['atk', 'def', 'spd', 'regen'];
const fin = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** Lixo → `undefined`. Valor do buff limitado ao maior do cardápio (save editado não compra +50%). */
export function sanitizeRestaurant(raw: unknown): RestaurantState | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as { buff?: unknown; day?: unknown; count?: unknown };
  const out: RestaurantState = {};
  const b = r.buff as Partial<MealBuff> | undefined;
  if (b && typeof b === 'object' && typeof b.dish === 'string' && KINDS.includes(b.kind as MealBuffKind) && fin(b.value) && fin(b.from) && fin(b.until) && b.until > b.from) {
    const kind = b.kind as MealBuffKind;
    const cap = MEAL_BUFF_VALUE_CAP[kind];
    out.buff = { dish: b.dish.slice(0, 40), kind, value: Math.min(cap, Math.max(0, b.value)), from: Math.floor(b.from), until: Math.min(Math.floor(b.until), Math.floor(b.from) + MEAL_BUFF_MS) };
  }
  if (typeof r.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.day) && fin(r.count)) {
    out.day = r.day;
    out.count = Math.min(99, Math.max(0, Math.floor(r.count)));
  }
  return out.buff || out.day ? out : undefined;
}

/** O buff ATIVO em `now` (ou `undefined`). */
export function activeMealBuff(s: { restaurant?: RestaurantState } | undefined, now: number): MealBuff | undefined {
  const b = s?.restaurant?.buff;
  return b && now >= b.from && now < b.until ? b : undefined;
}

/** O canal de combate do prato (frações: 2% = 0,02). Entra SEMPRE pelo `combinedAttrBonus`, nunca somado à parte. */
export function mealAttrBonus(s: { restaurant?: RestaurantState } | undefined, now: number): Partial<AttrBonus> | undefined {
  const b = activeMealBuff(s, now);
  if (!b || b.kind === 'regen') return undefined;
  return { [b.kind]: b.value / 100 } as Partial<AttrBonus>;
}

