/**
 * BOLHAS DO SONHO — a regra pura (`docs/BENCHMARK-MINIJOGOS.md` §6.3).
 *
 * Dois modos, e eles não se misturam:
 *  · `foco` (go/no-go): 60 s; ~22% das bolhas são fiapos de pesadelo que se
 *    DEIXA PASSAR. Estourar um fiapo não tira nada — só não pontua. O ritmo
 *    se ajusta de leve (escada rumo a ~85% de acerto).
 *  · `calma`: sem tempo, sem placar, sem Bits, sem fiapo. Bolha lenta.
 *
 * Tudo PURO: `now` e `rng` sempre por parâmetro. O componente só aplica.
 */
import type { Rng } from './eco';

export type BolhasMode = 'foco' | 'calma';
export type BubbleKind = 'dream' | 'wisp';

/** Duração do modo foco. */
export const BOLHAS_FOCO_DURATION_MS = 60_000;
/** Fração de fiapos no foco (o benchmark pede 20–25%). */
export const BOLHAS_WISP_RATIO = 0.22;
/** Teto de Bits por rodada. */
export const BOLHAS_MAX_BITS = 10;
/** 1 Bit a cada N sonhos. */
export const BOLHAS_POINTS_PER_BIT = 10;

/** Ritmo de nascimento (ms entre bolhas) do foco: início, piso e teto. */
export const BOLHAS_START_INTERVAL_MS = 950;
export const BOLHAS_MIN_INTERVAL_MS = 500;
export const BOLHAS_MAX_INTERVAL_MS = 1400;
/** Modo calma: ritmo fixo e lento. */
export const BOLHAS_CALMA_INTERVAL_MS = 1600;
export const BOLHAS_CALMA_RISE_MS = 7000;

/** Janela da escada e as faixas de acerto. */
export const STAIRCASE_WINDOW = 10;
export const STAIRCASE_MIN_SAMPLES = 6;
export const STAIRCASE_FAST_ABOVE = 0.9;
export const STAIRCASE_SLOW_BELOW = 0.75;
const STAIRCASE_SPEED_UP = 0.94;
const STAIRCASE_SLOW_DOWN = 1.08;

export interface Bubble {
  id: number;
  kind: BubbleKind;
  /** Posição horizontal, 0..1 da largura útil. */
  x: number;
  /** Quando nasceu (ms). */
  born: number;
  /** Quanto leva para atravessar o visor (ms). */
  riseMs: number;
}

export interface Staircase {
  intervalMs: number;
  /** Últimos desfechos (true = certo), no máximo `STAIRCASE_WINDOW`. */
  recent: boolean[];
}

export function initialStaircase(): Staircase {
  return { intervalMs: BOLHAS_START_INTERVAL_MS, recent: [] };
}

/**
 * Registra um desfecho e ajusta o ritmo. Certo = estourar sonho ou deixar o
 * fiapo passar; não-certo = deixar sonho escapar ou estourar fiapo. Acima de
 * 90% acelera um pouco; abaixo de 75% desacelera; entre os dois, fica.
 */
export function recordOutcome(state: Staircase, correct: boolean): Staircase {
  const recent = [...state.recent, correct].slice(-STAIRCASE_WINDOW);
  if (recent.length < STAIRCASE_MIN_SAMPLES) return { intervalMs: state.intervalMs, recent };
  const acc = recent.filter(Boolean).length / recent.length;
  let intervalMs = state.intervalMs;
  if (acc > STAIRCASE_FAST_ABOVE) intervalMs *= STAIRCASE_SPEED_UP;
  else if (acc < STAIRCASE_SLOW_BELOW) intervalMs *= STAIRCASE_SLOW_DOWN;
  intervalMs = Math.round(Math.min(BOLHAS_MAX_INTERVAL_MS, Math.max(BOLHAS_MIN_INTERVAL_MS, intervalMs)));
  return { intervalMs, recent };
}

/** Tempo de subida no foco: acompanha o ritmo (mais bolhas = sobem mais rápido). */
export function riseMsFor(intervalMs: number): number {
  return Math.round(Math.min(5600, Math.max(3000, intervalMs * 4)));
}

/** Nasce uma bolha. Calma nunca tem fiapo. */
export function spawnBubble(id: number, rng: Rng, mode: BolhasMode, now: number, intervalMs: number): Bubble {
  const kind: BubbleKind = mode === 'foco' && rng() < BOLHAS_WISP_RATIO ? 'wisp' : 'dream';
  const x = 0.08 + rng() * 0.84;
  const riseMs = mode === 'calma' ? BOLHAS_CALMA_RISE_MS : riseMsFor(intervalMs);
  return { id, kind, x, born: now, riseMs };
}

/** Progresso da subida, 0 (embaixo) → 1 (saiu por cima). */
export function bubbleProgress(b: Bubble, now: number): number {
  return Math.max(0, (now - b.born) / b.riseMs);
}

export function hasEscaped(b: Bubble, now: number): boolean {
  return bubbleProgress(b, now) >= 1;
}

/** Tempo restante do foco (nunca negativo). */
export function timeLeftMs(startedAt: number, now: number): number {
  return Math.max(0, BOLHAS_FOCO_DURATION_MS - (now - startedAt));
}

/** Bits da rodada: floor(sonhos/10), teto `BOLHAS_MAX_BITS`. */
export function bolhasBits(score: number): number {
  if (!Number.isFinite(score) || score <= 0) return 0;
  return Math.min(BOLHAS_MAX_BITS, Math.floor(score / BOLHAS_POINTS_PER_BIT));
}
