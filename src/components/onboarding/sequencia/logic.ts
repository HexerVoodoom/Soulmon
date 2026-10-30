import { ehInterativo, type Quadro } from './types';

/** Índice do quadro seguinte ao tocar. `quadros.length` = fim. */
export function proximo(quadros: Quadro[], i: number): number {
  return Math.min(i + 1, quadros.length);
}

/**
 * Pular (D12): pula a FALA, nunca a etapa interativa. Vai ao próximo quadro
 * interativo depois de `i`; se não houver, vai ao fim.
 */
export function aposPular(quadros: Quadro[], i: number): number {
  for (let j = i + 1; j < quadros.length; j++) if (ehInterativo(quadros[j])) return j;
  return quadros.length;
}
