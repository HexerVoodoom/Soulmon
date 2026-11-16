/**
 * 🍽️ O PRATO COMO ITEM DA PASTINHA (16/11/2026, pedido do dono: "faz um item no Restaurante, ele NÃO é usado na hora: vai para a
 * pastinha junto com os comidos"). Folha com pouca dependência: o catálogo de uso (`shop.ts › SPECIAL_ITEMS`) importa DAQUI.
 *
 * Chave no inventário (`foodInventory`): `dish:<dishId>` — um item por prato. COZINHAR (`restaurant.ts › applyCook`) só põe o prato
 * aqui; USAR da pastinha (`specialItemUse.ts › applySpecialItem`, a porta única de uso) chama `serveDish`: fome cheia + o efeito
 * do prato (energia na hora, ou o buff de 24 h que substitui o anterior). `serveDish` também serve a Feira (`applyFeiraDish`).
 */
import { eat, HUNGER_MAX, setEnergy, type HungerState } from './hunger';
import { MEAL_BUFF_MS, type RestaurantState } from './restaurantState';
import { DISHES, dishById, type Dish } from './restaurantMenu';
import type { SpecialItem } from './shop';

export const DISH_PREFIX = 'dish:';
export const dishKey = (dishId: string): string => DISH_PREFIX + dishId;
export const isDishKey = (key: unknown): key is string => typeof key === 'string' && key.startsWith(DISH_PREFIX) && !!dishById(key.slice(DISH_PREFIX.length));
export const dishIdOfKey = (key: string): string | undefined => (isDishKey(key) ? key.slice(DISH_PREFIX.length) : undefined);

/** Uma entrada de `SPECIAL_ITEMS` por prato (kind `dish`). Nome e descrição no idioma; a arte vem de `itemArt.ts`. */
export const DISH_SPECIAL_ITEMS: Record<string, SpecialItem> = Object.fromEntries(
  DISHES.map(d => {
    const key = dishKey(d.id);
    const item: SpecialItem = {
      emoji: key, kind: 'dish',
      namePt: d.namePt, nameEn: d.nameEn,
      descPt: 'Prato do Restaurante. Dê ao Soulmon: enche a fome e dá o reforço do prato.',
      descEn: 'A Restaurant dish. Give it to your Soulmon: it fills hunger and gives the dish boost.',
    };
    return [key, item];
  }),
);

/** O que o prato FAZ ao ser servido: fome cheia + efeito. Pura; `now` por parâmetro. Buff novo substitui o anterior. */
export function serveDish<T extends HungerState & { restaurant?: RestaurantState }>(prev: T, d: Dish, now: number): T {
  let s: T = eat(prev, now, HUNGER_MAX);
  const restaurant: RestaurantState = { ...(s.restaurant ?? {}) };
  if (d.effect.kind === 'energy') {
    const value = d.effect.value;
    s = setEnergy(s, now, cur => cur + value);
  } else {
    restaurant.buff = { dish: d.id, kind: d.effect.kind, value: d.effect.value, from: now, until: now + MEAL_BUFF_MS };
  }
  return { ...s, restaurant };
}
