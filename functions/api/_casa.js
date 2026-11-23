// ---------------------------------------------------------------------------
// A CASA DA GUILDA (guilda-lancamento PR2, 11/10/2026; pedido do dono).
//
// Um cenário que evolui com o que a roda faz junto: uma árvore mecânica com um
// cristal no centro que cresce, ganha flores e cristais. Três fontes somam
// "seiva" (pontos): DOAÇÃO de Bits, MISSÃO misteriosa e GUERRA de guilda. Cada
// membro também pode pôr UM item do próprio inventário num slot dele.
//
// REGRAS QUE FICAM (PLANO-GUILDA §3, "o que NUNCA acontece"):
//  · a vista NUNCA devolve pontos, limiares nem "faltam N", e nada por pessoa
//    em número — só o estágio e um binário `perto`. Doar não vira placar;
//  · só sobe: sair NÃO diminui (os pontos do membro viram `casaLegado`);
//  · o slot mostra o ITEM (decoração que a pessoa quis pôr), nunca quanto doou;
//  · dinheiro real não compra poder aqui: a doação é em Bits (ganhos ou vindos de Crédito, §373; sem gate por origem), e só cosmético muda.
//
// Chave pessoal (escrita só pelo dono, sem corrida entre membros — I3):
//   coopCasa:<gid>:<save> = { v:1, day, bitsToday, pts:{doacao,missao,guerra}, slot }
// Este módulo NÃO importa `_coop.js` (o cartão e o `coopLeave` importam daqui).
// ---------------------------------------------------------------------------
import { kvOrThrow } from './_kv.js';

export const CASA_TTL = 86400 * 120;
/** 1 ponto de seiva a cada 10 Bits doados. */
export const CASA_BITS_POR_PONTO = 10;
/**
 * DOAÇÃO DE BITS AO CLÃ (pedido do dono, 10/11/2026): UMA doação por pessoa por DIA DO JOGADOR, de um valor FECHADO
 * (`CASA_DOACOES`: 50 ou 100, nenhum outro). Antes eram várias doações até o teto de 200/dia.
 */
export const CASA_DOACOES = Object.freeze([50, 100]);
/** Teto de Bits doados por pessoa por DIA DO JOGADOR = a maior doação (só cabe UMA). */
export const CASA_BITS_POR_DIA = 100;
/** Menor doação aceita (múltiplo de `CASA_BITS_POR_PONTO`). */
export const CASA_BITS_MIN = 50;
/**
 * Seiva de UMA missão: cresce com o LEVEL do Soulmon (`stagePower` 1..5) e com o tamanho da roda ativa
 * (pedido do dono: "mais membros e mais level = mais pontos"). 4 → 17; sempre inteiro, ≥ 1.
 * @param {number} power `stagePower` do estágio (1..5)
 * @param {number} ativos membros ativos da roda (1..12)
 */
export function pontosDeMissao(power, ativos) {
  const p = Math.min(5, Math.max(1, Math.floor(Number(power) || 1)));
  const n = Math.min(12, Math.max(1, Math.floor(Number(ativos) || 1)));
  return Math.max(1, Math.round(4 * (1 + 0.25 * (p - 1)) * (1 + 0.1 * (n - 1))));
}

/** Teto de pontos por fonte e dia, para missão/guerra (o chamador já limita por dia; defesa em profundidade). */
export const CASA_PTS_FONTE_DIA_MAX = 60;

export const CASA_STAGES = Object.freeze(['fagulha', 'haste', 'latao', 'flores', 'cristais', 'aurora']);
/** Seiva mínima de cada estágio (índice 0 = semente, sempre). */
export const CASA_THRESHOLDS = Object.freeze([0, 40, 120, 280, 520, 900]);
export const CASA_PERTO_FRACAO = 0.2;
export const CASA_FONTES = Object.freeze(['doacao', 'missao', 'guerra']);
/** Id de item aceito no slot: o id de decoração da loja (`furn-…`, `trophy-…`). */
export const CASA_ITEM_RE = /^[a-z0-9][a-z0-9_-]{1,39}$/;

export const coopCasaKey = (gid, save) => `coopCasa:${gid}:${save}`;

const int0 = n => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

/** Normaliza o registro pessoal (dado não confiável, vem do KV). */
export function normalizarCasa(r) {
  const p = r && typeof r.pts === 'object' && r.pts ? r.pts : {};
  return {
    v: 1,
    day: typeof r?.day === 'string' ? r.day : null,
    bitsToday: int0(r?.bitsToday),
    pts: { doacao: int0(p.doacao), missao: int0(p.missao), guerra: int0(p.guerra) },
    // Bits que o DESAFIO DO MERCADOR deu ao tesouro do clã (11/11/2026): `DESAFIO_BITS_CLA` por dia no máximo, 1× por dia (`desafioDay`).
    desafioBits: int0(r?.desafioBits),
    desafioDay: typeof r?.desafioDay === 'string' ? r.desafioDay : null,
    slot: typeof r?.slot === 'string' && CASA_ITEM_RE.test(r.slot) ? r.slot : null,
  };
}

export const pontosDaCasa = c => (c ? c.pts.doacao + c.pts.missao + c.pts.guerra : 0);

export async function lerCasa(env, gid, save) {
  const raw = await kvOrThrow(env).get(coopCasaKey(gid, save));
  try { return normalizarCasa(raw ? JSON.parse(raw) : null); } catch { return normalizarCasa(null); }
}

async function gravarCasa(env, gid, save, c) {
  await kvOrThrow(env).put(coopCasaKey(gid, save), JSON.stringify(c), { expirationTtl: CASA_TTL });
  return c;
}

/** O estágio (derivado na leitura, nunca gravado) e o binário `perto`. */
export function casaStageFor(total) {
  const t = int0(total);
  let i = 0;
  for (let k = 0; k < CASA_THRESHOLDS.length; k++) if (t >= CASA_THRESHOLDS[k]) i = k;
  const prox = CASA_THRESHOLDS[i + 1];
  const perto = prox !== undefined && (t - CASA_THRESHOLDS[i]) / (prox - CASA_THRESHOLDS[i]) >= 1 - CASA_PERTO_FRACAO;
  return { stage: CASA_STAGES[i], stageIndex: i, perto };
}

/**
 * Doação de Bits. O CLIENTE só desconta o que o servidor aceitar (`accepted`).
 * UMA vez por dia do jogador, e só 50 ou 100 (`CASA_DOACOES`). A doação enche o TESOURO do clã (`bitsDaCasa`, de onde saem os
 * Buffs) E rende seiva como sempre (10 Bits = 1 ponto): uma doação, duas leituras do MESMO registro (`pts.doacao`), sem
 * segunda contabilidade. A seiva NÃO diminui quando o clã gasta o tesouro (a árvore só cresce).
 * @returns {Promise<{ accepted: number, capped: boolean, invalid?: boolean }>}
 */
export async function doarBits(env, gid, save, day, bits) {
  if (!CASA_DOACOES.includes(bits)) return { accepted: 0, capped: false, invalid: true };
  const c = await lerCasa(env, gid, save);
  // O registro guarda só o ÚLTIMO dia doado e o `dayKey` vem do cliente (janela ±1 dia UTC): sem exigir dia ESTRITAMENTE mais
  // novo, alternar 10/11 ↔ 11/11 doava sem fim (tesouro e seiva ilimitados = Buffs do clã de graça). Dia igual ou anterior ao
  // último doado = já doou (texto ISO AAAA-MM-DD compara na ordem cronológica). Segurança, rodada 1 (11/11/2026).
  if (c.day && c.bitsToday > 0 && day <= c.day) return { accepted: 0, capped: true };
  c.day = day;
  c.bitsToday = bits;
  c.pts.doacao += bits / CASA_BITS_POR_PONTO;
  await gravarCasa(env, gid, save, c);
  return { accepted: bits, capped: false };
}

/** Bits do clã por Desafio cumprido (pequeno; o teto de economia é 1× por dia por pessoa). */
export const DESAFIO_BITS_CLA = 10;

/**
 * O Desafio do Mercador enche o TESOURO do clã (não a seiva, não o bolso de ninguém). Idempotente por dia do jogador.
 * @returns {Promise<number>} os Bits que entraram agora (0 = já entraram hoje).
 */
export async function somarBitsDesafio(env, gid, save, hoje) {
  const c = await lerCasa(env, gid, save);
  if (c.desafioDay && c.desafioDay >= hoje) return 0;
  c.desafioDay = hoje;
  c.desafioBits += DESAFIO_BITS_CLA;
  await gravarCasa(env, gid, save, c);
  return DESAFIO_BITS_CLA;
}

/** Seiva de outra fonte (missão, guerra). `pts` é clampado; devolve o que entrou. */
export async function somarPontos(env, gid, save, fonte, pts) {
  if (!CASA_FONTES.includes(fonte) || fonte === 'doacao') return 0;
  const n = Math.min(int0(pts), CASA_PTS_FONTE_DIA_MAX);
  if (n <= 0) return 0;
  const c = await lerCasa(env, gid, save);
  c.pts[fonte] += n;
  await gravarCasa(env, gid, save, c);
  return n;
}

/** Põe (ou tira, com `null`) o item do slot da pessoa. Devolve o slot gravado ou `undefined` se o id é inválido. */
export async function definirSlot(env, gid, save, item) {
  if (item !== null && !(typeof item === 'string' && CASA_ITEM_RE.test(item))) return undefined;
  const c = await lerCasa(env, gid, save);
  c.slot = item;
  await gravarCasa(env, gid, save, c);
  return c.slot;
}

/**
 * Na saída: os pontos da pessoa viram `casaLegado` do grupo (a casa nunca
 * encolhe) e a chave pessoal — com o slot — é apagada. Devolve os pontos.
 */
export async function recolherCasaDeQuemSai(env, gid, save) {
  return (await recolherCasaDetalhe(env, gid, save)).pts;
}

/** Igual a `recolherCasaDeQuemSai`, e devolve também os Bits que a pessoa doou (viram `bitsLegado`: o total de Bits do clã nunca encolhe). */
export async function recolherCasaDetalhe(env, gid, save) {
  const c = await lerCasa(env, gid, save);
  await kvOrThrow(env).delete(coopCasaKey(gid, save));
  return { pts: pontosDaCasa(c), bits: c.pts.doacao * CASA_BITS_POR_PONTO + c.desafioBits };
}

/**
 * A casa como a VISTA a conta: total = legado + soma dos cartões. Nada disto sai
 * inteiro — a vista pega só `casaStageFor` e os slots.
 * @param {{ casaLegado?: number, members: string[] }} g
 * @param {Record<string, any>} cartoes `{ [save]: cartão }` (campo `casa`)
 */
export function totalDaCasa(g, cartoes) {
  let t = int0(g.casaLegado);
  for (const m of g.members) t += pontosDaCasa(cartoes[m]?.casa ? normalizarCasa(cartoes[m].casa) : null);
  return t;
}

/**
 * O TOTAL DE BITS que o clã já recebeu em doação (W14b, 20/10/2026): legado de quem saiu + o que cada membro atual doou.
 * É um dado do CLÃ (um número só); a vista nunca o decompõe por pessoa (linha vermelha: sem contribuição individual).
 */
export function bitsDaCasa(g, cartoes) {
  let t = int0(g.bitsLegado);
  for (const m of g.members) {
    const x = cartoes[m]?.casa ? normalizarCasa(cartoes[m].casa) : normalizarCasa(null);
    t += x.pts.doacao * CASA_BITS_POR_PONTO + x.desafioBits;
  }
  return t;
}
