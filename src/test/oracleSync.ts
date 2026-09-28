/**
 * `generateOracle` SÍNCRONO — só para testes.
 *
 * Fase 2 do Oráculo, PR 2: o alias síncrono saiu de `utils/oracle.ts` (ele
 * prendia as famílias visuais no chunk de entrada). Produção usa
 * `generateOracleAsync`; os testes, que não entram no bundle, montam o sync
 * aqui com o import estático de `oracle/familias` — mesma função pura, mesma
 * saída para a mesma seed.
 */
import * as familias from '../utils/oracle/familias';
import { generateOracleWithFamilies, type OracleInput, type OracleOverrides, type OracleResult } from '../utils/oracle';

export function generateOracle(input: OracleInput, seed?: number, overrides?: OracleOverrides): OracleResult {
  return generateOracleWithFamilies(input, familias, seed, overrides);
}
