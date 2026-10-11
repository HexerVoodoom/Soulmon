/**
 * Detector do ganho de XP do Vínculo — PURO. Dono único da pergunta "este salto
 * de `totalXP` foi um ganho para mostrar?".
 *
 * Por que comparar `totalXP` e não um evento emitido por `awardBondXP`: o
 * `awardBondXP` roda DENTRO de updaters do setGameState (puros; StrictMode os
 * invoca 2×, footgun 6). Emitir evento de lá seria side effect em updater e
 * mostraria o display em dobro. Comparar o valor anterior com o atual num efeito
 * de componente é só leitura e é idempotente.
 *
 * O que NÃO é ganho (devolve 0): primeira leitura (`prev` indefinido →
 * hidratação), valor que não subiu, demo (`isDemoMode`: ninguém ganha XP) e salto
 * maior que `XP_GAIN_DISPLAY_CAP` — adoção de save da nuvem/migração trazem
 * centenas de XP de uma vez, e nenhum conjunto de eventos que cabe num único
 * lote do React chega perto disso.
 */
import {
  XP_PER_EFFORT, XP_PERFECT_DAY, XP_HABIT_MILESTONE, XP_TRIAGE_CLEARED, XP_CHECK_IN,
} from './bond';

/** Maior lote plausível: marco de hábito + dia completo + triagem + check-in + tarefa de projeto (3×) com folga de 2×. */
export const XP_GAIN_DISPLAY_CAP =
  Math.max(...Object.values(XP_HABIT_MILESTONE)) + XP_PERFECT_DAY + XP_TRIAGE_CLEARED + XP_CHECK_IN + XP_PER_EFFORT * 3 * 2;

/** Janela em que ganhos em sequência viram UM display. */
export const XP_COALESCE_MS = 400;
/** Entrada + parada no centro + saída (espelha `sm-xp-gain` no index.css). */
export const XP_DISPLAY_ENTER_MS = 350;
export const XP_DISPLAY_HOLD_MS = 1000;
export const XP_DISPLAY_EXIT_MS = 350;
export const XP_DISPLAY_TOTAL_MS = XP_DISPLAY_ENTER_MS + XP_DISPLAY_HOLD_MS + XP_DISPLAY_EXIT_MS;

export function xpGainBetween(prev: number | undefined | null, next: number | undefined | null, demo = false): number {
  if (demo) return 0;
  if (typeof prev !== 'number' || typeof next !== 'number') return 0;
  if (!Number.isFinite(prev) || !Number.isFinite(next)) return 0;
  const delta = next - prev;
  if (delta <= 0 || delta > XP_GAIN_DISPLAY_CAP) return 0;
  return delta;
}
