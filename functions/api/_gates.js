/**
 * Espelho de `src/utils/gates.ts` (Combate v3 / PR7). Pages Functions nao importam de `src/`:
 * a tabela e copiada e travada por `gates.parity.test.js`. E o UNICO lugar do servidor que compara
 * Vinculo com um numero de portao.
 */

/**
 * Dono 12/11/2026: "tirar todos os limites por level, exceto a ranqueada" — so a Ranqueada do Torneio (`ranqueada`) segue
 * com Vinculo 5; todo o resto abre no Vinculo 1.
 * @type {Readonly<Record<'pvp' | 'torneio' | 'ranqueada' | 'masmorraAlto' | 'renascimento', { minBond: number }>>}
 */
export const GATES = {
  pvp: { minBond: 1 },
  torneio: { minBond: 1 },
  ranqueada: { minBond: 5 },
  masmorraAlto: { minBond: 1 },
  renascimento: { minBond: 1 },
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
 * O predio de Exploracao sempre livre (Vinculo 1) NAO e espelhado: o servidor nao cita esse nome (R-38,
 * o contrato R-38 varre `functions/`); a paridade o descarta do lado do app.
 */
export const BUILDING_GATES = {
  'mercado.itens': { minBond: 1 },
  'mercado.conquistas': { minBond: 1 },
  'mercado.decoracao': { minBond: 1 },
  'mercado.background': { minBond: 1 },
  'forja.ferreiro': { minBond: 1 },
  'forja.hexsmith': { minBond: 1 },
  'jogos.salao': { minBond: 1 },
  'exploracao.dungeon': { minBond: 1 },
  'jogos.mente': { minBond: 1 },
  'exploracao.fenda': { minBond: 1 },
  'forja.caderno': { minBond: 1 },
  'forja.oficina': { minBond: 1 },
  'forja.refugio': { minBond: 1 },
  'arena.duelo': { minBond: GATES.pvp.minBond },
  'arena.torneio': { minBond: GATES.torneio.minBond },
  'arena.guerra': { minBond: 1 }, // dono 12/11/2026: sem limite por level (era 3)
  'laboratorio.evolucao': { minBond: 1 },
  'laboratorio.pet': { minBond: 1 },
  'laboratorio.stats': { minBond: 1 },
  'laboratorio.perfil': { minBond: 1 },
  'laboratorio.biblioteca': { minBond: 1 },
  'laboratorio.amigos': { minBond: 1 },
  'hall.guilda': { minBond: 1 },
  'hall.grove': { minBond: 1 },
  'hall.feira': { minBond: 1 },
};

/** Predios que mudaram de id (espelho de `MOVED_BUILDINGS` em `src/utils/gates.ts`; D-50). */
export const MOVED_BUILDINGS = {
  'arena.feira': 'hall.feira',
  'hall.biblioteca': 'laboratorio.biblioteca',
  'hall.amigos': 'laboratorio.amigos',
  'jogos.refugio': 'forja.refugio', // beta3 M3 (25/10/2026): o Refúgio foi de Jogos para a Exploração; 28/10/2026 (#187): daí para a Forja
  'exploracao.masmorra': 'exploracao.fenda', // beta3 N10 (26/10/2026): a Fenda Sem Fim foi para a Arena; 28/10/2026 (#187): voltou à Exploração
  'exploracao.preparar': 'forja.oficina', // beta3 N8 (26/10/2026): o prédio "Prepare to Focus" virou a 1ª etapa da Oficina do Foco (hoje na Forja)
  // 28/10/2026 (#187, a Forja e as masmorras na Exploração): o id acompanha o lote — a leitura do save, do servidor e dos atalhos antigos redireciona.
  'exploracao.oficina': 'forja.oficina',
  'exploracao.caderno': 'forja.caderno',
  'exploracao.refugio': 'forja.refugio',
  'mercado.ferreiro': 'forja.ferreiro',
  'arena.fenda': 'exploracao.fenda',
  'jogos.dungeon': 'exploracao.dungeon',
};

/** O id atual de um predio (id antigo -> novo; qualquer outro valor passa igual). @param {unknown} x */
export function currentBuildingId(x) {
  return typeof x === 'string' && Object.prototype.hasOwnProperty.call(MOVED_BUILDINGS, x) ? /** @type {Record<string, string>} */ (MOVED_BUILDINGS)[x] : x;
}

/** @param {keyof typeof BUILDING_GATES} id @param {unknown} bondLevel */
export function buildingGateFor(id, bondLevel) {
  const lvl = typeof bondLevel === 'number' && Number.isFinite(bondLevel) ? Math.max(1, Math.floor(bondLevel)) : 1;
  const minBond = BUILDING_GATES[id].minBond;
  return { open: lvl >= minBond, minBond, bondLevel: lvl };
}
