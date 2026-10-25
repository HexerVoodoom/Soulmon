/**
 * A CHAVE DO FOCO (beta3 F1): concluir o "Prepare to Focus" (o prédio de preparação da sessão) dá uma chave que libera a Focus Workshop.
 * A chave mora no SAVE (`focusKeyDay`, o dia do jogador em que foi ganha) e vale naquele dia do jogador — sem acumular nem gastar.
 * Puro: sem React, sem storage, `now` por parâmetro. Campo novo = leitura tolerante (`sanitizeFocusKeyDay`).
 */
import { playerDayIso, type PlayerDayAnchor } from './playerDay';

export interface FocusKeyState { focusKeyDay?: string; playerDayTz?: PlayerDayAnchor }

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Lixo → `undefined` (sem chave). */
export function sanitizeFocusKeyDay(raw: unknown): string | undefined {
  return typeof raw === 'string' && ISO_DAY.test(raw) ? raw : undefined;
}

/** A chave vale AGORA? (foi ganha no dia do jogador de agora; relógio que volta não a revalida). */
export function hasFocusKey(state: FocusKeyState, nowMs: number): boolean {
  const k = sanitizeFocusKeyDay(state.focusKeyDay);
  return !!k && k === playerDayIso(new Date(nowMs), state.playerDayTz);
}

/** Dá a chave do dia. Idempotente: já tendo a de hoje, devolve a MESMA referência. */
export function grantFocusKey<T extends FocusKeyState>(prev: T, nowMs: number): T {
  if (hasFocusKey(prev, nowMs)) return prev;
  return { ...prev, focusKeyDay: playerDayIso(new Date(nowMs), prev.playerDayTz) };
}
