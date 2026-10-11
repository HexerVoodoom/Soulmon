import type { SpecialItem } from './shop';
import { FOOD_BY_CATEGORY } from '../constants/labels';
import { MIN_STEPS_FOR_PREMIUM } from '../types/taskModel';
import { playerDayIso, type PlayerDayAnchor } from './playerDay';

/**
 * COMIDA PREMIUM — o item de quem fecha uma tarefa de várias etapas.
 *
 * DONO ÚNICO do que é premium: chave de inventário, números, tetos e o drop
 * (determinístico, sem sorteio). O USO mora em `specialItemUse.ts`; o drop
 * acontece em `careRules.completeTask`.
 *
 * Chave de inventário = emoji da comida + `PREMIUM_SUFFIX` ("🍎★"): o save e o
 * widget indexam por string, então a premium é uma chave NOVA e a comida comum
 * não muda de identidade. A estrela é só a marca; a arte é a da comida de base.
 *
 * Por que há tetos (energia é limitada pela META DO DIA, não por vontade):
 *  · rende `PREMIUM_ENERGY` (5) em vez de 1, sempre limitada pelas barras do
 *    estágio — nunca passa do máximo, e RECUSA com a energia cheia (o item
 *    volta, como o coraçãozinho com vida cheia);
 *  · cai no máx. `PREMIUM_DROPS_PER_DAY` por dia do jogador e
 *    `PREMIUM_DROPS_PER_WEEK` por semana (segunda a domingo) — criar uma
 *    tarefa de 3 passos por dia NÃO vira fonte infinita de energia;
 *  · usa-se no máx. `PREMIUM_USES_PER_DAY` por dia.
 * Não toca em HP nem na regra do "dia completo": só a perna de energia.
 */
export const PREMIUM_SUFFIX = '★';
export const PREMIUM_ENERGY = 5;
export const PREMIUM_DROPS_PER_DAY = 1;
export const PREMIUM_DROPS_PER_WEEK = 3;
export const PREMIUM_USES_PER_DAY = 1;

export const premiumKey = (baseEmoji: string): string => baseEmoji + PREMIUM_SUFFIX;
export const isPremiumKey = (key: string): boolean => key.endsWith(PREMIUM_SUFFIX) && key.length > PREMIUM_SUFFIX.length;
/** A chave da comida comum por trás (ou a própria chave, se não for premium). */
export const premiumBase = (key: string): string => (isPremiumKey(key) ? key.slice(0, -PREMIUM_SUFFIX.length) : key);

/** Registro no SAVE (`premiumFood`) — mesmo motivo do `glitchtamaUse`. */
export interface PremiumRecord {
  day: string;
  dropped: number;
  used: number;
  /** Segunda-feira da semana do último drop (`YYYY-MM-DD`). */
  week: string;
  weekDropped: number;
}

/** Segunda-feira (YYYY-MM-DD) da semana de um dayKey `YYYY-MM-DD`. */
export function weekMondayOf(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7));
  return dt.toISOString().slice(0, 10);
}

export interface PremiumClock { premiumFood?: PremiumRecord; playerDayTz?: PlayerDayAnchor }

export function premiumDroppedToday(state: PremiumClock, now: Date): number {
  const r = state.premiumFood;
  return r && r.day === playerDayIso(now, state.playerDayTz) ? r.dropped : 0;
}
export function premiumUsedToday(state: PremiumClock, now: Date): number {
  const r = state.premiumFood;
  return r && r.day === playerDayIso(now, state.playerDayTz) ? r.used : 0;
}
export function premiumDroppedThisWeek(state: PremiumClock, now: Date): number {
  const r = state.premiumFood;
  return r && r.week === weekMondayOf(playerDayIso(now, state.playerDayTz)) ? r.weekDropped : 0;
}

/** Esta tarefa, concluída agora, rende premium? (≥3 subitens, todos feitos, tetos.) */
export function premiumDropFor(
  state: PremiumClock,
  task: { steps?: ReadonlyArray<{ completed?: boolean }> },
  now: Date,
): boolean {
  const steps = task.steps ?? [];
  if (steps.length < MIN_STEPS_FOR_PREMIUM || !steps.every(s => s.completed === true)) return false;
  return premiumDroppedToday(state, now) < PREMIUM_DROPS_PER_DAY
    && premiumDroppedThisWeek(state, now) < PREMIUM_DROPS_PER_WEEK;
}

/** Aplica o drop (PURA): soma 1 no inventário e atualiza o registro. */
export function withPremiumDrop<T extends PremiumClock & { foodInventory: Record<string, number> }>(
  state: T, categoryFoodEmoji: string, now: Date,
): T {
  const key = premiumKey(categoryFoodEmoji);
  const day = playerDayIso(now, state.playerDayTz);
  return {
    ...state,
    foodInventory: { ...state.foodInventory, [key]: (state.foodInventory[key] ?? 0) + 1 },
    premiumFood: {
      day,
      dropped: premiumDroppedToday(state, now) + 1,
      used: premiumUsedToday(state, now),
      week: weekMondayOf(day),
      weekDropped: premiumDroppedThisWeek(state, now) + 1,
    },
  };
}

const PT_NAMES: Record<string, string> = {
  Protein: 'Proteína', Salad: 'Salada', Apple: 'Maçã', Coffee: 'Café',
  Juice: 'Suco', Rice: 'Arroz', Pizza: 'Pizza', Candy: 'Doce',
};

/** Entradas de `SPECIAL_ITEMS`, uma por comida de categoria. */
export const PREMIUM_SPECIAL_ITEMS: Record<string, SpecialItem> = Object.fromEntries(
  Object.values(FOOD_BY_CATEGORY).map(f => {
    const key = premiumKey(f.emoji);
    const item: SpecialItem = {
      emoji: key, kind: 'premium',
      namePt: `${PT_NAMES[f.name] ?? f.name} premium`, nameEn: `Premium ${f.name}`,
      descPt: `Rende ${PREMIUM_ENERGY} de energia em vez de 1 — vem de fechar uma tarefa de várias etapas. Não passa do máximo do dia.`,
      descEn: `Gives ${PREMIUM_ENERGY} energy instead of 1 — earned by finishing a multi-step task. Never above the day's max.`,
    };
    return [key, item];
  }),
);
