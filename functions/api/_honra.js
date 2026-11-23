/**
 * PONTOS DO TORNEIO: rendimento decrescente (PR13, achado ALTO-2 da auditoria de seguranca; contexto §2.29).
 *
 * O problema: o ganho de pontos (e a Honra, que o app paga pelo resultado) era fixo por vitoria. Com duas contas
 * proprias (uma delas de level 1) bastava duelar a "B" 5x por dia: +100 pontos/dia sem custo, em escala com N contas.
 * Decisao do dono (06/10/2026), as DUAS regras no servidor:
 *  1. quanto mais o oponente esta ABAIXO do seu level, menos rende (muito abaixo = ~0);
 *  2. vencer o MESMO oponente varias vezes no mesmo dia rende cada vez menos (por par, por dia).
 * Nao pune derrota: nada aqui mexe no que se PERDE (-8 / -4 continuam iguais). So reduz o que se GANHA.
 * O servidor e quem decide; o cliente so mostra (`honorFactor` na resposta do `match`).
 *
 * Os levels vem da ficha CONGELADA em `duelStart` (`pending.sides`), nunca do corpo da requisicao.
 */

/** Pontos de uma vitoria de quem desafiou, antes dos fatores. */
export const HONRA_PONTOS_VITORIA = 20;
/** Pontos de quem foi desafiado e venceu (o desafiante perdeu), antes dos fatores. */
export const HONRA_PONTOS_DEFESA = 10;
/** Diferenca de level a partir da qual o rendimento comeca a cair (ate aqui vale 100%). */
export const HONRA_LEVEL_CARENCIA = 3;
/** Quantos levels alem da carencia ate o rendimento chegar a ZERO (queda linear). */
export const HONRA_LEVEL_QUEDA = 6;
/** Fator da N-esima vitoria do dia sobre o MESMO oponente (0-based); alem do fim da lista vale o ultimo (zero). */
export const HONRA_FATOR_POR_REPETICAO = [1, 0.5, 0.25, 0];

/** Fator [0,1] pela diferenca de level (vencedor - perdedor). Level ausente/invalido = 1 (ficha antiga, sem punir). */
export function fatorPorLevel(levelVencedor, levelPerdedor) {
  if (!Number.isFinite(levelVencedor) || !Number.isFinite(levelPerdedor)) return 1;
  const dif = levelVencedor - levelPerdedor;
  if (dif <= HONRA_LEVEL_CARENCIA) return 1;
  return Math.max(0, 1 - (dif - HONRA_LEVEL_CARENCIA) / HONRA_LEVEL_QUEDA);
}

/** Fator [0,1] pela N-esima vitoria do dia (0-based) contra o mesmo oponente. */
export function fatorPorRepeticao(vitoriasAntes) {
  const n = Number.isInteger(vitoriasAntes) && vitoriasAntes > 0 ? vitoriasAntes : 0;
  return HONRA_FATOR_POR_REPETICAO[Math.min(n, HONRA_FATOR_POR_REPETICAO.length - 1)];
}

/**
 * O ganho real de uma vitoria.
 * @param {number} base @param {unknown} levelVencedor @param {unknown} levelPerdedor @param {number} vitoriasAntes vitorias de hoje no mesmo par
 * @returns {{ gain: number, factor: number }}
 */
export function ganhoDePontos(base, levelVencedor, levelPerdedor, vitoriasAntes) {
  const factor = fatorPorLevel(Number(levelVencedor), Number(levelPerdedor)) * fatorPorRepeticao(vitoriasAntes);
  // Piso por nivel: o corte de nivel sozinho nunca leva a 0; o teto do piso e o que a repeticao ja deixaria (rep 0 => 0).
  const porRep = Math.round(base * fatorPorRepeticao(vitoriasAntes));
  const gain = Math.max(Math.round(base * factor), Math.min(PONTOS_PISO_VITORIA, porRep));
  return { gain, factor };
}

/** O maximo de pontos que UM par (mesmos dois levels, sem queda por level) rende por dia de vitorias: a soma da lista. */
export const HONRA_TETO_DIA_POR_PAR = (base) => Math.round(HONRA_FATOR_POR_REPETICAO.reduce((s, f) => s + base * f, 0));

/**
 * PONTOS DE FAIXA/TEMPORADA POR RANK (decisao do dono, 11/11/2026).
 *
 * Os pontos do Torneio ranqueado dependem de ONDE o oponente esta em relacao a voce na temporada, nao do level:
 *  - vencer quem esta ACIMA rende MAIS (ate ~2x a base); vencer quem esta bem ABAIXO rende MENOS (nunca abaixo do piso);
 *  - a reducao por REPETICAO do mesmo oponente no dia continua (`fatorPorRepeticao`: 1 / 0,5 / 0,25 / 0).
 * Medida de distancia = diferenca de PONTOS DA TEMPORADA (mais robusta que a posicao: nao precisa varrer o ranking e
 * vale igual para simulados). Escala suave: mult = 1 + tanh(dif / PONTOS_RANK_ESCALA), em (0, 2), simetrica em 1.
 * O corte por level (`fatorPorLevel`) SAIU dos pontos; continua valendo so para a HONRA (`ganhoDePontos`, `honorFactor`).
 *
 * Anti-abuso (conta nova de level 1 derrotada em massa): essa conta esta no fundo do rank (poucos pontos). Quem a
 * farma sobe; a cada vitoria a diferenca (conta nova - fazendeiro) fica mais negativa e o ganho cai ate o piso
 * (com ~300 pontos de vantagem o ganho ja e o piso). A repeticao diaria soma ao freio. Os dados de rank vem do
 * SERVIDOR (pontos congelados em `duelStart`), nunca do corpo da requisicao.
 */
/** Piso de pontos de uma vitoria contra quem esta bem abaixo (desde que a repeticao do dia nao zere). */
export const PONTOS_PISO_VITORIA = 3;
/** Escala (em pontos de temporada) da curva suave: 200 pts de distancia = mult 1,76 ou 0,24. */
export const PONTOS_RANK_ESCALA = 200;
/** Teto do multiplicador (cerca do dobro da base). */
export const PONTOS_RANK_MULT_MAX = 2;

/** Multiplicador (0, 2) pela distancia de rank: positivo quando o oponente (perdedor) tem MAIS pontos que o vencedor. */
export function multPorRank(pontosVencedor, pontosPerdedor) {
  const a = Number(pontosVencedor), b = Number(pontosPerdedor);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 1;
  return Math.min(PONTOS_RANK_MULT_MAX, 1 + Math.tanh((b - a) / PONTOS_RANK_ESCALA));
}

/**
 * O ganho de pontos de faixa de uma vitoria, por rank.
 * @returns {{ gain: number, mult: number, rep: number, reason: 'repeat' | 'rank-up' | 'rank-down' | null }}
 */
export function ganhoPorRank(base, pontosVencedor, pontosPerdedor, vitoriasAntes) {
  const mult = multPorRank(pontosVencedor, pontosPerdedor);
  const rep = fatorPorRepeticao(vitoriasAntes);
  const gain = rep === 0 ? 0 : Math.max(Math.min(PONTOS_PISO_VITORIA, Math.round(base * rep)), Math.round(base * mult * rep));
  const reason = rep < 1 ? 'repeat' : mult >= 1.1 ? 'rank-up' : mult <= 0.9 ? 'rank-down' : null;
  return { gain, mult, rep, reason };
}
