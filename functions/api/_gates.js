/**
 * Espelho de `src/utils/gates.ts` (Combate v3 / PR7). Pages Functions nao importam de `src/`:
 * a tabela e copiada e travada por `gates.parity.test.js`. E o UNICO lugar do servidor que compara
 * Vinculo com um numero de portao.
 */

/** @type {Readonly<Record<'pvp' | 'torneio' | 'masmorraAlto' | 'renascimento', { minBond: number }>>} */
export const GATES = {
  pvp: { minBond: 5 },
  torneio: { minBond: 5 },
  masmorraAlto: { minBond: 8 },
  renascimento: { minBond: 12 },
};

export const MASMORRA_ALTO_A_PARTIR_DO_ANDAR = 4;

/**
 * @param {keyof typeof GATES} feature @param {unknown} bondLevel
 * @returns {{ open: boolean, minBond: number, bondLevel: number }}
 */
export function gateFor(feature, bondLevel) {
  const lvl = typeof bondLevel === 'number' && Number.isFinite(bondLevel) ? Math.max(1, Math.floor(bondLevel)) : 1;
  const minBond = GATES[feature].minBond;
  return { open: lvl >= minBond, minBond, bondLevel: lvl };
}
