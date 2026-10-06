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
  return { gain: Math.round(base * factor), factor };
}

/** O maximo de pontos que UM par (mesmos dois levels, sem queda por level) rende por dia de vitorias: a soma da lista. */
export const HONRA_TETO_DIA_POR_PAR = (base) => Math.round(HONRA_FATOR_POR_REPETICAO.reduce((s, f) => s + base * f, 0));
