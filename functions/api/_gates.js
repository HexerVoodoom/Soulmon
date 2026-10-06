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

/**
 * Espelho de `BUILDING_GATES` (Tarefa A, predios por Vinculo). O servidor NAO decide abrir predio: as acoes
 * (duelo/torneio/renascimento) ja tem o portao acima. Fica aqui so para a paridade travar a tabela.
 */
export const BUILDING_GATES = {
  'mercado.itens': { minBond: 1 },
  'mercado.conquistas': { minBond: 1 },
  'mercado.decoracao': { minBond: 2 },
  'mercado.background': { minBond: 3 },
  'jogos.salao': { minBond: 1 },
  'jogos.refugio': { minBond: 1 },
  'jogos.mente': { minBond: 3 },
  'exploracao.passeio': { minBond: 1 },
  'exploracao.masmorra': { minBond: 2 },
  'exploracao.caderno': { minBond: 2 },
  'exploracao.oficina': { minBond: 3 },
  'arena.duelo': { minBond: GATES.pvp.minBond },
  'arena.torneio': { minBond: GATES.torneio.minBond },
  'arena.feira': { minBond: GATES.pvp.minBond },
  'laboratorio.evolucao': { minBond: 1 },
  'laboratorio.pet': { minBond: 2 },
  'laboratorio.stats': { minBond: 3 },
  'hall.biblioteca': { minBond: 2 },
  'hall.amigos': { minBond: 2 },
  'hall.guilda': { minBond: 4 },
};

/** @param {keyof typeof BUILDING_GATES} id @param {unknown} bondLevel */
export function buildingGateFor(id, bondLevel) {
  const lvl = typeof bondLevel === 'number' && Number.isFinite(bondLevel) ? Math.max(1, Math.floor(bondLevel)) : 1;
  const minBond = BUILDING_GATES[id].minBond;
  return { open: lvl >= minBond, minBond, bondLevel: lvl };
}
