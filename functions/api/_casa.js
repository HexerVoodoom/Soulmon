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
//  · dinheiro real não entra aqui: Bits GANHOS, e só cosmético muda.
//
// Chave pessoal (escrita só pelo dono, sem corrida entre membros — I3):
//   coopCasa:<gid>:<save> = { v:1, day, bitsToday, pts:{doacao,missao,guerra}, slot }
// Este módulo NÃO importa `_coop.js` (o cartão e o `coopLeave` importam daqui).
// ---------------------------------------------------------------------------
import { kvOrThrow } from './_kv.js';

export const CASA_TTL = 86400 * 120;
/** 1 ponto de seiva a cada 10 Bits doados. */
export const CASA_BITS_POR_PONTO = 10;
/** Teto de Bits doados por pessoa por DIA DO JOGADOR (anti-esvaziar-a-carteira e anti-abuso). */
export const CASA_BITS_POR_DIA = 200;
/** Menor doação aceita (múltiplo de `CASA_BITS_POR_PONTO`). */
export const CASA_BITS_MIN = 10;
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
 * Aceita no máximo o que falta do teto do dia; o resto sobra na carteira.
 * @returns {Promise<{ accepted: number, capped: boolean, invalid?: boolean }>}
 */
export async function doarBits(env, gid, save, day, bits) {
  const pedido = int0(bits);
  // Múltiplos de 10 (nenhum Bit "perdido" no arredondamento do ponto).
  const quer = pedido - (pedido % CASA_BITS_POR_PONTO);
  if (quer < CASA_BITS_MIN) return { accepted: 0, capped: false, invalid: true };
  const c = await lerCasa(env, gid, save);
  const hoje = c.day === day ? c.bitsToday : 0;
  const resta = Math.max(0, CASA_BITS_POR_DIA - hoje);
  const aceito = Math.min(quer, resta - (resta % CASA_BITS_POR_PONTO));
  if (aceito < CASA_BITS_MIN) return { accepted: 0, capped: true };
  c.day = day;
  c.bitsToday = hoje + aceito;
  c.pts.doacao += aceito / CASA_BITS_POR_PONTO;
  await gravarCasa(env, gid, save, c);
  return { accepted: aceito, capped: aceito < quer };
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
  const c = await lerCasa(env, gid, save);
  await kvOrThrow(env).delete(coopCasaKey(gid, save));
  return pontosDaCasa(c);
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
