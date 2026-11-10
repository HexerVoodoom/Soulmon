// ---------------------------------------------------------------------------
// OS BUFFS DO CLÃ (pedido do dono, 10/11/2026; REGISTRO-DE-DECISOES §"Buffs do clã"). Substituem a Loja do clã
// (`_lojaCla.js`, aposentada em 10/11/2026: lápide em `guild.js`, ação `guildShopBuy`).
//
// O clã compra, com o TESOURO (os Bits doados), um buff que vale para O CLÃ INTEIRO por 7 DIAS (semana corrida desde a
// compra). Quem compra: o ANFITRIÃO do clã (`isHost`, o único papel de decisão que existe na guilda; não há "líder"
// separado). Sem vantagem paga: Bits vêm só de doação de Bits GANHOS (o cliente nunca doa Crédito).
//
// TESOURO = `bitsDaCasa` (tudo o que o clã recebeu) − gasto em Buffs. A Loja antiga NÃO é mais descontada (`coopLoja:<gid>` não é lido):
// o que os clãs gastaram nela VOLTA ao tesouro (os cosméticos só apareciam num card e a Loja foi abolida; além disso poupa 1 leitura por vista).
// A doação alimenta o tesouro E a seiva da Casa a partir do MESMO registro (ver `_casa.js › doarBits`): a seiva é a
// lembrança do que foi doado e nunca encolhe quando o tesouro é gasto.
//
// PREÇO (uma conta só, de constantes; nunca à mão): um clã CHEIO compra UM buff por semana e sobra pouco.
//   doação semanal máxima de um clã cheio = COOP_MAX_MEMBERS × CASA_BITS_POR_DIA × 7 = 12 × 100 × 7 = 8400
//   BUFF_PRECO = round(0,9 × 8400) = 7560 (90%)
//
// Chave do clã (campo novo e ADITIVO; ausente = vazio):
//   coopBuffs:<gid> = { v:1, gasto, buffs:{ [id]:{ desde, ate } }, ops:{ [opId]: id } }   (instantes em ms)
// Comprar de novo ENQUANTO ativo estende (`ate += 7 dias`, `desde` fica); depois de vencido, recomeça. Um buff de cada
// tipo por vez. Idempotente por `opId`. KV é eventualmente consistente (best-effort, como os outros módulos).
// ---------------------------------------------------------------------------
import { kvOrThrow } from './_kv.js';
import { CASA_TTL, CASA_BITS_POR_DIA, bitsDaCasa } from './_casa.js';
import { COOP_MAX_MEMBERS } from './_coop.js';

export const BUFF_DIAS = 7;
export const BUFF_MS = BUFF_DIAS * 86400000;
/** Fração da doação semanal máxima de um clã cheio que custa UM buff. */
export const BUFF_PRECO_FRACAO = 0.9;
export const BUFF_PRECO = Math.round(BUFF_PRECO_FRACAO * COOP_MAX_MEMBERS * CASA_BITS_POR_DIA * BUFF_DIAS);

/** Catálogo (ids ESTÁVEIS; nunca renomear). Os efeitos moram onde a regra mora (ver o espelho `src/utils/guildBuffs.ts`). */
export const BUFFS = Object.freeze(['gauge', 'feira', 'drop', 'energia']);
/** Bônus de cada buff (o cliente espelha; `guildBuffs.test.ts` prova a paridade). */
// Feira: `FEIRA_LOJA_PCT_BUFF` (+4 pontos: 8% → 12%) mora em `_feiraLoja.js`, onde mora a chance.
export const BUFF_GAUGE_MULT = 1.05;

export const BUFF_DROP_MULT = 1.1;
export const BUFF_ENERGIA_PCT = 10;

export const BUFF_OP_RE = /^[A-Za-z0-9_-]{8,64}$/;
export const BUFF_OPS_MAX = 40;

export const buffsKey = gid => `coopBuffs:${gid}`;
const int0 = n => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

export function normalizarBuffs(r) {
  const buffs = {};
  if (r?.buffs && typeof r.buffs === 'object' && !Array.isArray(r.buffs)) {
    for (const id of BUFFS) {
      const b = r.buffs[id];
      const ate = int0(b?.ate);
      if (ate > 0) buffs[id] = { desde: int0(b?.desde), ate };
    }
  }
  const ops = {};
  if (r?.ops && typeof r.ops === 'object' && !Array.isArray(r.ops)) {
    for (const [k, v] of Object.entries(r.ops)) if (BUFF_OP_RE.test(k) && BUFFS.includes(v)) ops[k] = v;
  }
  return { v: 1, gasto: int0(r?.gasto), buffs, ops };
}

export async function lerBuffs(env, gid) {
  const raw = await kvOrThrow(env).get(buffsKey(gid));
  try { return normalizarBuffs(raw ? JSON.parse(raw) : null); } catch { return normalizarBuffs(null); }
}

/** O tesouro do clã (um número do CLÃ; nunca por pessoa). */
export async function tesouroDoCla(env, g, cartoes, buffs) {
  return Math.max(0, bitsDaCasa(g, cartoes) - buffs.gasto);
}

export const buffAtivo = (buffs, id, agora) => (buffs.buffs[id] && buffs.buffs[id].ate > agora ? buffs.buffs[id] : null);

/** O buff `id` está ativo AGORA neste clã? (leitura para o servidor aplicar efeito, ex.: a Feira de verdade.) */
export async function clanTemBuff(env, gid, id, agora = Date.now()) {
  return !!buffAtivo(await lerBuffs(env, gid), id, agora);
}

/** O que a vista leva: saldo, preço e os buffs ativos (só os não vencidos). */
export async function vistaDosBuffs(env, g, cartoes, agora = Date.now()) {
  const b = await lerBuffs(env, g.id);
  const ativos = {};
  for (const id of BUFFS) { const a = buffAtivo(b, id, agora); if (a) ativos[id] = { desde: a.desde, ate: a.ate }; }
  return { saldo: await tesouroDoCla(env, g, cartoes, b), preco: BUFF_PRECO, dias: BUFF_DIAS, ativos };
}

/**
 * Compra. O servidor é a única fonte de preço, saldo e duração; o cliente manda só `buffId` + `opId`.
 * @returns {Promise<{ ok: true, repeated: boolean } | { ok: false, reason: 'invalid-buff'|'invalid-op'|'op-reuse'|'insufficient' }>}
 */
export async function comprarBuff(env, g, cartoes, buffId, opId, agora = Date.now()) {
  if (typeof buffId !== 'string' || !BUFFS.includes(buffId)) return { ok: false, reason: 'invalid-buff' };
  if (typeof opId !== 'string' || !BUFF_OP_RE.test(opId)) return { ok: false, reason: 'invalid-op' };
  const b = await lerBuffs(env, g.id);
  if (b.ops[opId] !== undefined) return b.ops[opId] === buffId ? { ok: true, repeated: true } : { ok: false, reason: 'op-reuse' };
  if ((await tesouroDoCla(env, g, cartoes, b)) < BUFF_PRECO) return { ok: false, reason: 'insufficient' };
  const a = buffAtivo(b, buffId, agora);
  b.buffs[buffId] = a ? { desde: a.desde, ate: a.ate + BUFF_MS } : { desde: agora, ate: agora + BUFF_MS };
  b.gasto += BUFF_PRECO;
  b.ops[opId] = buffId;
  const chaves = Object.keys(b.ops);
  for (const k of chaves.slice(0, Math.max(0, chaves.length - BUFF_OPS_MAX))) delete b.ops[k];
  await kvOrThrow(env).put(buffsKey(g.id), JSON.stringify(b), { expirationTtl: CASA_TTL });
  return { ok: true, repeated: false };
}
