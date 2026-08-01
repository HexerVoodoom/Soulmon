import type { ActivityCategory } from '../types/attributes';
import { CATEGORY_ATTRIBUTES } from '../types/attributes';
import { FOOD_BY_CATEGORY } from '../constants/labels';
import { getMaxEnergyForStage } from '../types/progression';

// Regras de cuidado como funções PURAS.
//
// Por que existe: o app de desktop (desktop/) precisa aplicar exatamente as
// mesmas regras que o app do celular. Enquanto elas viviam dentro do App.tsx,
// misturadas com som, animação e toast, a única saída do desktop era
// reimplementá-las — e duas implementações da mesma regra divergem em silêncio.
// Aqui elas recebem estado e devolvem estado, sem tocar em React nem em
// localStorage; quem chama cuida dos efeitos colaterais e da persistência.
//
// As regras em si continuam sendo as do CLAUDE.md (5 comidas/hora, carinho cura
// meio coração até 1/dia). Este arquivo NÃO decide nada novo — só é o lugar
// onde a decisão passou a morar uma vez só.

/** Fatia do GameState que estas regras leem e escrevem. */
export interface CareState {
  healthPoints: number;
  maxHealthPoints: number;
  energyPoints: number;
  evolutionStage: string;
  foodInventory: Record<string, number>;
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  totalXP: number;
  attributesSinceLastEvolution: { virus: number; data: number; vaccine: number };
}

/** Máximo de comidas por hora (janela deslizante). */
export const FOOD_LIMIT_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

/** Cura do carinho por gesto, e o teto diário. */
export const RUB_HEAL_STEP = 0.5;
export const RUB_HEAL_DAILY_CAP = 1;

export type FeedRefusal = 'no-stock' | 'hourly-limit';
export type RubRefusal = 'already-full' | 'daily-cap';

/** Timestamps (ms) das comidas dentro da janela de 1h. */
export function recentFeeds(feedTimes: number[], now: number): number[] {
  return feedTimes.filter(t => now - t < HOUR_MS);
}

export function feedsLeft(feedTimes: number[], now: number): number {
  return Math.max(0, FOOD_LIMIT_PER_HOUR - recentFeeds(feedTimes, now).length);
}

/**
 * Alimenta com uma comida COMUM (as do `FOOD_BY_CATEGORY`).
 *
 * Itens especiais da loja (chip, coraçãozinho, glitchtama) NÃO passam por aqui:
 * eles têm efeitos próprios e não contam no limite de 5/hora — quem trata é o
 * `handleFeed` do App.
 */
export function feedFood<T extends CareState>(
  state: T,
  foodEmoji: string,
  feedTimes: number[],
  now: number,
): { state: T; feedTimes: number[]; refused?: FeedRefusal } {
  const count = state.foodInventory[foodEmoji] ?? 0;
  if (count <= 0) return { state, feedTimes, refused: 'no-stock' };

  const recent = recentFeeds(feedTimes, now);
  if (recent.length >= FOOD_LIMIT_PER_HOUR) {
    // Importante: devolve `recent` (já podado) mesmo recusando, senão os
    // timestamps velhos ficariam acumulando para sempre.
    return { state, feedTimes: recent, refused: 'hourly-limit' };
  }

  const foodInventory = { ...state.foodInventory, [foodEmoji]: count - 1 };
  if (foodInventory[foodEmoji] === 0) delete foodInventory[foodEmoji];

  const foodDef = Object.values(FOOD_BY_CATEGORY).find(f => f.emoji === foodEmoji);
  const attrs = foodDef
    ? CATEGORY_ATTRIBUTES[foodDef.category]
    : { virus: 0, data: 0, vaccine: 0 };

  return {
    feedTimes: [...recent, now],
    state: {
      ...state,
      // A energia só enche comendo, limitada pelas barras do estágio.
      energyPoints: Math.min(getMaxEnergyForStage(state.evolutionStage), (state.energyPoints ?? 0) + 1),
      foodInventory,
      virusPoints: state.virusPoints + attrs.virus,
      dataPoints: state.dataPoints + attrs.data,
      vaccinePoints: state.vaccinePoints + attrs.vaccine,
      totalXP: state.totalXP + (attrs.virus + attrs.data + attrs.vaccine) * 10,
      attributesSinceLastEvolution: {
        virus: (state.attributesSinceLastEvolution?.virus ?? 0) + attrs.virus,
        data: (state.attributesSinceLastEvolution?.data ?? 0) + attrs.data,
        vaccine: (state.attributesSinceLastEvolution?.vaccine ?? 0) + attrs.vaccine,
      },
    },
  };
}

/** Registro do carinho do dia — `date` no formato de `new Date().toDateString()`. */
export interface RubHealRecord {
  date: string;
  healed: number;
}

export function rubHealRecordFor(record: RubHealRecord | null, todayKey: string): RubHealRecord {
  return record && record.date === todayKey ? record : { date: todayKey, healed: 0 };
}

/**
 * O carinho seria recusado? Separado de `rubHeal` porque quem chama precisa
 * decidir a recusa ANTES de entrar num updater de estado (recusa dispara fala
 * e animação, e efeito colateral dentro de updater roda 2× no StrictMode).
 */
export function rubRefusal(
  healthPoints: number,
  maxHealthPoints: number,
  record: RubHealRecord | null,
  todayKey: string,
): RubRefusal | undefined {
  if (healthPoints >= maxHealthPoints) return 'already-full';
  if (rubHealRecordFor(record, todayKey).healed >= RUB_HEAL_DAILY_CAP) return 'daily-cap';
  return undefined;
}

/**
 * Carinho: cura meio coração, no máximo 1 coração por dia.
 *
 * A animação toca sempre (é o App que decide isso) — aqui só entra a cura.
 */
export function rubHeal<T extends CareState>(
  state: T,
  record: RubHealRecord | null,
  todayKey: string,
): { state: T; record: RubHealRecord; refused?: RubRefusal } {
  const today = rubHealRecordFor(record, todayKey);
  const refused = rubRefusal(state.healthPoints, state.maxHealthPoints, today, todayKey);
  if (refused) return { state, record: today, refused };
  return {
    record: { date: todayKey, healed: today.healed + RUB_HEAL_STEP },
    state: {
      ...state,
      healthPoints: Math.min(state.maxHealthPoints, state.healthPoints + RUB_HEAL_STEP),
    },
  };
}

/**
 * Recompensa por concluir uma tarefa: +1 comida da categoria dela.
 *
 * Os atributos NÃO vêm daqui — vêm de alimentar. Concluir tarefa só entrega a
 * comida; o jogador escolhe quando usar.
 */
export function foodForCompletedTask(
  inventory: Record<string, number>,
  category: ActivityCategory,
): Record<string, number> {
  const food = FOOD_BY_CATEGORY[category];
  if (!food) return inventory;
  return { ...inventory, [food.emoji]: (inventory[food.emoji] ?? 0) + 1 };
}
