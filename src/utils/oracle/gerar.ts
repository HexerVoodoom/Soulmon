/**
 * Entrada de PRODUÇÃO da geração do Oráculo: carrega famílias visuais e motor
 * por `import()` e devolve a leitura. Mesma seed → mesma saída que
 * `generateOracleWithFamilies` (`./motor`).
 *
 * Fica fora de `../oracle.ts` de propósito: o App chama este módulo por
 * `import()`, e um `import()` de um módulo que o chunk de entrada também importa
 * estaticamente faz o Rollup manter o módulo INTEIRO lá (namespace completo —
 * medido em 04/10/2026: ~26 KB). Este arquivo só tem tipos do `../oracle`.
 */
import type { OracleInputSync, OracleInputWithClass, OracleOverrides, OracleResult } from '../oracle';

export async function generateOracleAsync(input: OracleInputSync | OracleInputWithClass, seed?: number, overrides?: OracleOverrides): Promise<OracleResult> {
  const [familias, motor] = await Promise.all([import('./familias'), import('./motor')]);
  return motor.generateOracleWithFamilies(input, familias, seed, overrides);
}
