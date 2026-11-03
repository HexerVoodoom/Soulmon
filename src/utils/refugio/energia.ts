/**
 * ENERGIA DO REFÚGIO (pedido do dono, 02/11/2026): concluir UMA atividade do Refúgio (respiração inteira ou 30 bolhas calmas) devolve
 * metade da energia máxima, no máximo 1× por DIA DO JOGADOR somando as duas atividades. Sem número na tela e sem aviso quando já tomou
 * o do dia: o Refúgio continua sem placar nem cobrança. A energia passa pela porta única (`setEnergy`), que limita ao máximo.
 * Puro: sem React, sem storage, `now` por parâmetro. Campo novo = leitura tolerante (`sanitizeRefugioEnergyDay`).
 */
import { setEnergy, type HungerState } from '../hunger';
import { playerDayIso, type PlayerDayAnchor } from '../playerDay';

export const REFUGIO_ENERGY_FRACTION = 0.5;
/** Bolhas calmas estouradas para a sessão contar como concluída. */
export const REFUGIO_BUBBLES_TO_COMPLETE = 30;

export interface RefugioEnergyState extends HungerState {
  refugioEnergyDay?: string;
  playerDayTz?: PlayerDayAnchor;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Lixo → `undefined` (nunca tomou). */
export function sanitizeRefugioEnergyDay(raw: unknown): string | undefined {
  return typeof raw === 'string' && ISO_DAY.test(raw) ? raw : undefined;
}

/** O do dia já foi tomado? (relógio que volta não o devolve: compara com o dia do jogador de agora). */
export function refugioEnergyTaken(state: RefugioEnergyState, nowMs: number): boolean {
  const d = sanitizeRefugioEnergyDay(state.refugioEnergyDay);
  return !!d && d === playerDayIso(new Date(nowMs), state.playerDayTz);
}

/** Dá a energia do dia. Idempotente: já tomada hoje devolve a MESMA referência. */
export function grantRefugioEnergy<T extends RefugioEnergyState>(prev: T, nowMs: number): T {
  if (refugioEnergyTaken(prev, nowMs)) return prev;
  const next = setEnergy(prev, nowMs, (cur, max) => cur + Math.max(1, Math.round(max * REFUGIO_ENERGY_FRACTION)));
  return { ...next, refugioEnergyDay: playerDayIso(new Date(nowMs), prev.playerDayTz) };
}
