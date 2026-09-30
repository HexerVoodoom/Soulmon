/**
 * RESPIRAÇÃO COM O PET — o relógio das fases (`docs/BENCHMARK-MINIJOGOS.md` §6.8).
 *
 * PURO: recebe o tempo decorrido e devolve em que fase se está. Não mede nada
 * da pessoa, não pontua, não paga — é gesto de cuidado, não jogo de Bits.
 */

export type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'holdOut';

export interface BreathPattern {
  id: string;
  /** Segundos de cada fase; 0 = a fase não existe no padrão. */
  inhale: number;
  hold: number;
  exhale: number;
  holdOut?: number;
}

/** Os padrões oferecidos. `calma` (4 entra / 6 sai) é o padrão. */
export const BREATH_PATTERNS: readonly BreathPattern[] = Object.freeze([
  { id: 'calma', inhale: 4, hold: 0, exhale: 6 },
  { id: 'quadrada', inhale: 4, hold: 4, exhale: 4, holdOut: 4 },
]);

/** Durações oferecidas, em minutos. */
export const BREATH_DURATIONS_MIN: readonly number[] = Object.freeze([1, 2, 3]);

const ORDER: readonly BreathPhase[] = ['inhale', 'hold', 'exhale', 'holdOut'];

function phaseSeconds(p: BreathPattern, phase: BreathPhase): number {
  const v = phase === 'holdOut' ? (p.holdOut ?? 0) : p[phase];
  return Number.isFinite(v) && v > 0 ? v : 0;
}

/** Duração de um ciclo completo, em ms (nunca 0 — piso de 1 s). */
export function cycleMs(p: BreathPattern): number {
  const s = ORDER.reduce((acc, ph) => acc + phaseSeconds(p, ph), 0);
  return Math.max(1, s) * 1000;
}

/** Em que fase se está depois de `elapsedMs`. `progress` vai de 0 a 1 dentro da fase. */
export function phaseAt(pattern: BreathPattern, elapsedMs: number): { phase: BreathPhase; progress: number; cycle: number } {
  const total = cycleMs(pattern);
  const e = Number.isFinite(elapsedMs) && elapsedMs > 0 ? elapsedMs : 0;
  const cycle = Math.floor(e / total);
  let t = e - cycle * total;
  for (const phase of ORDER) {
    const len = phaseSeconds(pattern, phase) * 1000;
    if (len <= 0) continue;
    if (t < len) return { phase, progress: t / len, cycle };
    t -= len;
  }
  // Padrão degenerado (tudo 0): fica em "inspire", parado.
  return { phase: 'inhale', progress: 0, cycle };
}

/** Quanto a bolha está cheia (0..1) — o mesmo número serve de escala ou de barra. */
export function fillLevel(phase: BreathPhase, progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  if (phase === 'inhale') return p;
  if (phase === 'hold') return 1;
  if (phase === 'exhale') return 1 - p;
  return 0;
}

/**
 * Duração real da sessão: arredonda para CIMA até um ciclo inteiro, para
 * nunca parar no meio de uma inspiração.
 */
export function sessionMs(pattern: BreathPattern, minutes: number): number {
  const c = cycleMs(pattern);
  const want = Math.max(1, minutes) * 60_000;
  return Math.ceil(want / c) * c;
}
