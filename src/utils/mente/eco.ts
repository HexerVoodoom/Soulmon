/**
 * ECO DO PET — a regra pura do jogo de sequência (`docs/BENCHMARK-MINIJOGOS.md`
 * §6.2). O pet acende as pedras numa ordem; o jogador repete. Acertou a
 * sequência inteira → ela cresce 1. Tocou fora da ordem → a rodada termina e o
 * que se guarda é o MAIOR ECO completado — nunca "game over".
 *
 * Tudo aqui é PURO: nada de React, nada de relógio, nada de `Math.random`
 * direto — quem sorteia recebe um `rng` por parâmetro (seedável nos testes).
 * O componente (`components/mente/EcoGame.tsx`) só aplica.
 */

/** Quantas pedras existem. */
export const ECO_STONES = 4;
/** Tamanho da primeira sequência. */
export const ECO_START_LENGTH = 3;
/** Teto de Bits por rodada (o funil do App ainda aplica o teto diário). */
export const ECO_MAX_BITS = 10;
/** Intervalo de exibição no começo e o piso (acelera devagar com o tamanho). */
export const ECO_BASE_INTERVAL_MS = 700;
export const ECO_MIN_INTERVAL_MS = 350;
const ECO_INTERVAL_STEP_MS = 35;

export type Stone = 0 | 1 | 2 | 3;
export type Rng = () => number;

/** Resultado de um toque: segue esperando, fechou a sequência, ou saiu da ordem. */
export type TapResult = 'continue' | 'complete' | 'miss';

/** Gerador seedável (mulberry32) — determinístico para teste. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uma pedra sorteada. `rng` fora de [0,1) é apertado para dentro. */
export function nextStone(rng: Rng): Stone {
  const r = Math.min(Math.max(rng(), 0), 0.999999);
  return Math.floor(r * ECO_STONES) as Stone;
}

/** A sequência inicial (tamanho `ECO_START_LENGTH` por padrão). */
export function startSequence(rng: Rng, length = ECO_START_LENGTH): Stone[] {
  const seq: Stone[] = [];
  for (let i = 0; i < length; i++) seq.push(nextStone(rng));
  return seq;
}

/** A mesma sequência com UMA pedra a mais no fim — nunca reembaralha o que já veio. */
export function growSequence(seq: readonly Stone[], rng: Rng): Stone[] {
  return [...seq, nextStone(rng)];
}

/** A pedra esperada no toque `index` (eco reverso = de trás para frente). */
export function expectedAt(seq: readonly Stone[], index: number, reverse: boolean): Stone {
  return reverse ? seq[seq.length - 1 - index] : seq[index];
}

/**
 * Confere o toque de número `input.length` (0-based) — `input` é o que já foi
 * tocado ANTES deste toque, todo certo.
 */
export function checkTap(seq: readonly Stone[], input: readonly Stone[], tap: Stone, reverse: boolean): TapResult {
  const i = input.length;
  if (i >= seq.length) return 'miss';
  if (expectedAt(seq, i, reverse) !== tap) return 'miss';
  return i + 1 === seq.length ? 'complete' : 'continue';
}

/** Intervalo entre pedras na exibição: acelera um pouco com o tamanho, piso 350ms. */
export function playbackIntervalMs(length: number): number {
  const extra = Math.max(0, length - ECO_START_LENGTH);
  return Math.max(ECO_MIN_INTERVAL_MS, ECO_BASE_INTERVAL_MS - extra * ECO_INTERVAL_STEP_MS);
}

/** Bits da rodada: 1 por pedra além da inicial, teto `ECO_MAX_BITS`. */
export function ecoBits(longest: number): number {
  if (!Number.isFinite(longest)) return 0;
  return Math.min(ECO_MAX_BITS, Math.max(0, Math.floor(longest) - ECO_START_LENGTH));
}
