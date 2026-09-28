/**
 * PROGRESSÃO DE NÍVEL DO CATÁLOGO (docs/PLANO-CATALOGO-ATIVIDADES.md §4).
 *
 * Função PURA: recebe a constância (já calculada por `utils/habitRhythm.ts`
 * → `constancy()`) e devolve uma SUGESTÃO, nunca uma mudança automática. Quem
 * decide subir ou descer de nível é sempre o jogador — o motor só oferece o
 * convite, e `EvolveTaskModal` é quem mostra.
 *
 * Regras do plano, aplicadas aqui e só aqui (nenhum outro arquivo reinventa
 * o limiar):
 *  - Subir: sugere nível+1 quando `ratio >= LEVEL_UP_CONSTANCY_RATIO` (0.8,
 *    "constância ≥ 80% nas últimas 3 semanas") E o item já está no nível
 *    atual há pelo menos `LEVEL_MIN_DAYS` (21) dias — Lally 2010: mediana de
 *    66 dias até a automaticidade, então não acelerar demais.
 *  - Descer: oferta gentil (nunca punição) depois de `LEVEL_DOWN_WINDOW_DAYS`
 *    (14) dias com `ratio < LEVEL_DOWN_CONSTANCY_RATIO` (0.4).
 *  - Nunca as duas ao mesmo tempo, e nunca fora do intervalo [1,3].
 */
import type { CatalogLevel } from '../types/activityCatalog';

/** Constância mínima (janela de 3 semanas) para sugerir subir de nível. */
export const LEVEL_UP_CONSTANCY_RATIO = 0.8;

/** Dias mínimos no nível atual antes de poder subir — Lally 2010: não
 *  acelerar a automaticidade além do que a pesquisa sustenta. */
export const LEVEL_MIN_DAYS = 21;

/** Constância abaixo da qual, sustentada por `LEVEL_DOWN_WINDOW_DAYS`,
 *  oferece-se (gentilmente) descer de nível. */
export const LEVEL_DOWN_CONSTANCY_RATIO = 0.4;

/** Dias de baixa constância antes da oferta de descer. */
export const LEVEL_DOWN_WINDOW_DAYS = 14;

export type LevelSuggestion = 'up' | 'down' | null;

export interface LevelProgressInput {
  currentLevel: CatalogLevel;
  /** Ratio de constância (0..1) na janela de referência — já calculado por
   *  `habitRhythm.constancy()` sobre uma janela de ~21 dias para subir. */
  ratio: number;
  /** Dias desde que o item está no `currentLevel`. */
  daysAtLevel: number;
  /** Dias consecutivos (ou dentro da janela) com constância baixa — quem
   *  chama decide a janela; aqui só se compara com `LEVEL_DOWN_WINDOW_DAYS`. */
  lowConstancyDays: number;
}

/**
 * Sugestão de nível — NUNCA aplica nada; só diz o que oferecer. `null` =
 * nenhuma oferta agora.
 */
export function suggestLevelChange(input: LevelProgressInput): LevelSuggestion {
  const { currentLevel, ratio, daysAtLevel, lowConstancyDays } = input;

  if (currentLevel < 3 && ratio >= LEVEL_UP_CONSTANCY_RATIO && daysAtLevel >= LEVEL_MIN_DAYS) {
    return 'up';
  }
  if (
    currentLevel > 1 &&
    ratio < LEVEL_DOWN_CONSTANCY_RATIO &&
    lowConstancyDays >= LEVEL_DOWN_WINDOW_DAYS
  ) {
    return 'down';
  }
  return null;
}

/** Aplica a sugestão (chamado só depois que o JOGADOR aceitou o convite). */
export function applyLevelChange(
  currentLevel: CatalogLevel,
  direction: 'up' | 'down',
): CatalogLevel {
  const next = direction === 'up' ? currentLevel + 1 : currentLevel - 1;
  return Math.max(1, Math.min(3, next)) as CatalogLevel;
}
