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
