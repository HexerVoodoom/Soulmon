/**
 * As 4 espécies do Plantio (= as 4 árvores do Bosque) e a migração das aposentadas. Módulo PEQUENO e sem
 * dependência de propósito: o `claCredit` (no chunk de entrada, via `GameStateContext`) precisa de `migrarEspecie`
 * e não pode arrastar o cliente HTTP (`claApi`) junto — `entradaEnxuta.contract.test.ts` vigia.
 */
export const PLANT_SPECIES = ['abobora', 'pinheiro', 'cerejeira', 'cacto'] as const;
export type PlantSpecies = (typeof PLANT_SPECIES)[number];

/**
 * Espécies aposentadas em 18/10/2026 -> a espécie da MESMA estação (as 4 árvores do Bosque):
 * girassol (primavera) -> cerejeira, melancia (verão) -> cacto. Idempotente; o servidor faz o mesmo na leitura
 * (`functions/api/_claPlantio.js`, `ESPECIE_LEGADO`).
 */
export const ESPECIE_LEGADO: Record<string, PlantSpecies> = { girassol: 'cerejeira', melancia: 'cacto' };
export const migrarEspecie = (e: unknown): unknown => (typeof e === 'string' && Object.hasOwn(ESPECIE_LEGADO, e) ? ESPECIE_LEGADO[e] : e);
