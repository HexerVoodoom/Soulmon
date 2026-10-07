/**
 * Combate v3 / PR7 — a tabela ÚNICA dos portões do Vínculo (o level do usuário).
 *
 * Dono único: aqui mora o número de Vínculo de cada porta (Arena/PvP, Torneio, andares altos da
 * Masmorra, Renascimento). Nenhum outro arquivo compara `bondLevel >= N` (há teste de grep). O
 * servidor espelha em `functions/api/_gates.js`, travado por `gates.parity.test.js`.
 *
 * O Vínculo nunca desce e NUNCA é pago: um portão é um LIMIAR, não uma manutenção. O Renascimento
 * pede conta paga E Vínculo; o dinheiro real não compra o Vínculo (`rebirthGate.ts`).
 *
 * Copy (`copy.semFomo`): o texto de um portão fechado diz onde a pessoa está e onde a porta abre.
 * Nunca "faltam só N", nunca contagem, nunca urgência.
 */

export type GateFeature = 'pvp' | 'torneio' | 'masmorraAlto' | 'renascimento';

export interface GateRule {
  /** Vínculo mínimo para abrir. */
  readonly minBond: number;
}

/**
 * Os números são DEFAULTS DA SQUAD (o dono decidiu os portões, não os valores): `pvp` e `torneio`
 * mantêm o 5 que já valia (funil D1–D7 termina no 4); Masmorra alta e Renascimento são propostas.
 */
export const GATES: Readonly<Record<GateFeature, GateRule>> = {
  pvp: { minBond: 5 },
  torneio: { minBond: 5 },
  masmorraAlto: { minBond: 8 },
  renascimento: { minBond: 12 },
};

/** Andares da Masmorra a partir daqui são "altos" (o andar 1 e os baixos seguem livres, sem portão de entrada). */
export const MASMORRA_ALTO_A_PARTIR_DO_ANDAR = 4;

export interface GateResult {
  readonly open: boolean;
  readonly minBond: number;
  readonly bondLevel: number;
}

function levelOf(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1;
}

/** O portão `feature` está aberto para este Vínculo? Lixo cai em Vínculo 1 (ausência de prova não é prova). */
export function gateFor(feature: GateFeature, bondLevel: unknown): GateResult {
  const lvl = levelOf(bondLevel);
  const minBond = GATES[feature].minBond;
  return { open: lvl >= minBond, minBond, bondLevel: lvl };
}

/** A Masmorra deixa entrar neste andar? Os andares baixos nunca têm portão. */
export function masmorraFloorOpen(floor: number, bondLevel: unknown): boolean {
  return floor < MASMORRA_ALTO_A_PARTIR_DO_ANDAR || gateFor('masmorraAlto', bondLevel).open;
}

const NOME: Record<GateFeature, { pt: string; en: string }> = {
  pvp: { pt: 'O Duelo', en: 'The Duel' },
  torneio: { pt: 'O Torneio', en: 'The Tournament' },
  masmorraAlto: { pt: 'Os andares mais fundos da Masmorra', en: 'The deepest Dungeon floors' },
  renascimento: { pt: 'O Renascimento', en: 'Rebirth' },
};

/** Texto de um portão FECHADO: neutro, com o Vínculo pedido e o atual. Aberto = string vazia. */
export function gateLine(feature: GateFeature, bondLevel: unknown, language: string): string {
  const g = gateFor(feature, bondLevel);
  if (g.open) return '';
  return language === 'pt-BR'
    ? `${NOME[feature].pt} abre no Vínculo ${g.minBond}. Você está no Vínculo ${g.bondLevel}, e ele cresce com o que você já faz por aqui.`
    : `${NOME[feature].en} opens at Bond ${g.minBond}. You are at Bond ${g.bondLevel}, and it grows with what you already do here.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRÉDIOS POR VÍNCULO (Tarefa A, 07/10/2026) — qual prédio do Mapa abre em qual Vínculo.
// ─────────────────────────────────────────────────────────────────────────────

/** Os prédios (lotes) das seis áreas do Mapa: `<área>.<lote>`. Os ids são estáveis (o save e os testes os citam). */
export type BuildingId =
  | 'mercado.itens' | 'mercado.conquistas' | 'mercado.decoracao' | 'mercado.background' | 'mercado.ferreiro'
  | 'jogos.salao' | 'jogos.refugio' | 'jogos.mente'
  | 'arena.duelo' | 'arena.torneio' | 'arena.feira'
  | 'exploracao.passeio' | 'exploracao.masmorra' | 'exploracao.caderno' | 'exploracao.oficina'
  | 'laboratorio.evolucao' | 'laboratorio.pet' | 'laboratorio.stats'
  | 'hall.biblioteca' | 'hall.amigos' | 'hall.guilda';

/**
 * A tabela ÚNICA de qual Vínculo abre cada prédio (DECISÃO DO DONO, confirmada em 07/10/2026 — ajuste só aqui; o servidor
 * espelha em `functions/api/_gates.js`, travado por `gates.parity.test.js`). Nenhum outro arquivo guarda um
 * número de prédio.
 *
 * Regras de desenho: o Vínculo nunca desce nem é comprado, então um prédio aberto nunca fecha de novo; o
 * Refúgio (momentos difíceis) e o primeiro caminho de cada área são sempre livres; Arena/Torneio/Feira
 * LEEM a tabela de portões acima (um número só: se o Duelo mudar de 5, o prédio muda junto).
 * O gate vale NA ENTRADA do prédio (toque no Mapa ou na área): nada que já está aberto é fechado no meio.
 */
export const BUILDING_GATES: Readonly<Record<BuildingId, GateRule>> = {
  'mercado.itens': { minBond: 1 },
  'mercado.conquistas': { minBond: 1 },
  'mercado.decoracao': { minBond: 2 },
  'mercado.background': { minBond: 3 },
  // O Ferreiro (07/10/2026): equipamentos. Vínculo 2 — o mesmo da Decoração: o primeiro Vínculo é a Loja de Itens e o resto
  // da vitrine abre com o uso (equipamento só se compra com Bits GANHOS, e o teto de 5% é o mesmo para quem entra mais tarde).
  'mercado.ferreiro': { minBond: 2 },
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

/** Prédios de ENTRADA (onboarding/tutorial e o Refúgio): nunca bloqueiam — o teste exige `minBond` 1. */
export const BUILDINGS_ALWAYS_OPEN: readonly BuildingId[] = ['mercado.itens', 'laboratorio.evolucao', 'jogos.refugio', 'exploracao.passeio'];

/** O prédio abre neste Vínculo? `bondLevel` ausente/lixo = Vínculo 1. */
export function buildingGateFor(id: BuildingId, bondLevel: unknown): GateResult {
  const lvl = levelOf(bondLevel);
  const minBond = BUILDING_GATES[id].minBond;
  return { open: lvl >= minBond, minBond, bondLevel: lvl };
}

/** O Vínculo da ÁREA no Mapa = o do seu prédio mais cedo (a área só trava se TODOS os prédios travam). */
export function areaMinBond(area: string): number {
  let min = Infinity;
  for (const id of Object.keys(BUILDING_GATES) as BuildingId[]) if (id.startsWith(`${area}.`)) min = Math.min(min, BUILDING_GATES[id].minBond);
  return Number.isFinite(min) ? min : 1;
}

/** O Vínculo que falta para abrir a ÁREA no Mapa, ou `null` se ela abre (ou se não há `bondLevel`). */
export function areaLockedAt(area: string, bondLevel: unknown): number | null {
  if (bondLevel === undefined) return null;
  const need = areaMinBond(area);
  return levelOf(bondLevel) >= need ? null : need;
}

/** Aviso NEUTRO ao tocar um prédio trancado (sem cobrança, sem contagem, sem urgência). */
export function buildingLockLine(minBond: number, language: string): string {
  return language === 'pt-BR'
    ? `Libera no Vínculo ${minBond}. Ele cresce com o que você já faz por aqui.`
    : `Opens at Bond ${minBond}. It grows with what you already do here.`;
}
