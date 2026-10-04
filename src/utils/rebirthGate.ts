/**
 * Porta do Renascimento — SÓ a regra de elegibilidade, sem nada pesado.
 *
 * Separada de `rebirth.ts` em 04/10/2026 (rodada 6, perf): `rebirth.ts` puxa a
 * ficha do class-system (`CLASS_DATA`, elementos derivados, ~28 KB) e o App só
 * precisa saber SE e POR QUE o Renascimento está disponível para renderizar a
 * Evolução. O resto (opções, `applyRebirth`) carrega por `import()` ao renascer.
 */
import type { RebirthRecord } from './rebirth';

/** Estágio que habilita o Rebirth. O ápice da escada, não um número solto. */
export const REBIRTH_REQUIRED_STAGE = 'ultra';

export interface RebirthEligibilityInput {
  evolutionStage?: string;
  accountTier?: 'demo' | 'paid';
  rebirth?: RebirthRecord | null;
}

/**
 * Por que uma RECUSA com motivo em vez de um booleano: cada motivo tem uma
 * saída diferente na tela (comprar, subir a escada, ou nada — já usou). Um
 * `false` mudo mandaria o jogador adivinhar qual dos três é.
 */
export type RebirthRefusal = 'not-ultra' | 'not-paid' | 'already-used' | null;

export function rebirthRefusal(input: RebirthEligibilityInput): RebirthRefusal {
  if (input.rebirth) return 'already-used';
  if (input.accountTier !== 'paid') return 'not-paid';
  if (input.evolutionStage !== REBIRTH_REQUIRED_STAGE) return 'not-ultra';
  return null;
}

export function canRebirth(input: RebirthEligibilityInput): boolean {
  return rebirthRefusal(input) === null;
}
