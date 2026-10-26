// ---------------------------------------------------------------------------
// A LOJA DO CLÃ (rodada 5, lane A; pedido do dono; REGISTRO-DE-DECISOES §175).
//
// Compra COSMÉTICOS da Casa/árvore com os Bits TOTAIS do clã (`bitsDaCasa`). O
// servidor decide tudo: o catálogo mora AQUI, o cliente manda só `itemId` + `opId`
// (nunca preço), e o saldo do clã só diminui aqui. O espelho do catálogo no cliente
// (`src/utils/guildLoja.ts`) serve para exibir; `guildLoja.test.ts` prova a paridade.
//
// REGRAS QUE FICAM:
//  · só cosmético da Casa (nada com vantagem de jogo, nada que cresça a árvore);
//  · nada por pessoa: quem comprou NÃO é gravado — o registro é do CLÃ;
//  · idempotente por `opId`: repetir a mesma operação não cobra de novo;
//  · item já do clã = 409 sem cobrar; saldo curto = 409 sem gravar nada;
//  · `bitsTotal` (doado, nunca encolhe) NÃO muda: o saldo é `bitsTotal - gasto`.
//
// Chave do clã (campo novo e ADITIVO; ausente = vazio):
//   coopLoja:<gid> = { v:1, gasto, itens:[ids], ops:{ [opId]: itemId } }
// KV é eventualmente consistente: duas compras EXATAMENTE simultâneas de membros
// diferentes podem passar juntas (best-effort, igual às travas dos outros módulos).
// ---------------------------------------------------------------------------
import { kvOrThrow } from './_kv.js';
import { CASA_TTL, bitsDaCasa } from './_casa.js';

/** Catálogo (ids ESTÁVEIS; nunca renomear nem reaproveitar). Preço em Bits do clã. */
export const LOJA_CATALOGO = Object.freeze([
  Object.freeze({ id: 'loja-fogueira-roda', preco: 250 }),
  Object.freeze({ id: 'loja-lanterna-latao', preco: 150 }),
  Object.freeze({ id: 'loja-cogumelos-brilho', preco: 200 }),
  Object.freeze({ id: 'loja-tapete-circuito', preco: 500 }),
  Object.freeze({ id: 'loja-cristal-menor', preco: 400 }),
  Object.freeze({ id: 'loja-poco-desejos', preco: 600 }),
  Object.freeze({ id: 'loja-ampulheta', preco: 800 }),
  Object.freeze({ id: 'loja-deck-clareira', preco: 300 }),
]);

export const LOJA_OP_RE = /^[A-Za-z0-9_-]{8,64}$/;
/** Quantas operações recentes guardamos para a idempotência. */
export const LOJA_OPS_MAX = 40;

export const lojaKey = gid => `coopLoja:${gid}`;
export const itemDaLoja = id => LOJA_CATALOGO.find(i => i.id === id) ?? null;

const int0 = n => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

/** Normaliza o registro do clã (dado não confiável, vem do KV). Ausente = vazio. */
export function normalizarLoja(r) {
  /** @type {Set<string>} */
  const ids = new Set(LOJA_CATALOGO.map(i => i.id));
  const itens = [...new Set((Array.isArray(r?.itens) ? r.itens : []).filter(x => typeof x === 'string' && ids.has(x)))];
  const ops = {};
  if (r?.ops && typeof r.ops === 'object' && !Array.isArray(r.ops)) {
    for (const [k, v] of Object.entries(r.ops)) if (LOJA_OP_RE.test(k) && typeof v === 'string' && ids.has(v)) ops[k] = v;
  }
  return { v: 1, gasto: int0(r?.gasto), itens, ops };
}

export async function lerLoja(env, gid) {
  const raw = await kvOrThrow(env).get(lojaKey(gid));
  try { return normalizarLoja(raw ? JSON.parse(raw) : null); } catch { return normalizarLoja(null); }
}

/** O que a vista leva: os itens do clã e o saldo (um número do CLÃ; nunca por pessoa). */
export function vistaDaLoja(loja, g, cartoes) {
  return { itens: loja.itens.slice(), saldo: Math.max(0, bitsDaCasa(g, cartoes) - loja.gasto) };
}

/**
 * Compra. O servidor é a única fonte de preço e de saldo.
 * @returns {Promise<{ ok: true, repeated: boolean } | { ok: false, reason: 'invalid-item'|'invalid-op'|'op-reuse'|'already-owned'|'insufficient' }>}
 */
export async function comprarNaLoja(env, g, cartoes, itemId, opId) {
  const item = typeof itemId === 'string' ? itemDaLoja(itemId) : null;
  if (!item) return { ok: false, reason: 'invalid-item' };
  if (typeof opId !== 'string' || !LOJA_OP_RE.test(opId)) return { ok: false, reason: 'invalid-op' };
  const loja = await lerLoja(env, g.id);
  if (loja.ops[opId] !== undefined) {
    // Mesma operação repetida (reenvio após queda de rede): devolve o resultado, não cobra.
    return loja.ops[opId] === item.id ? { ok: true, repeated: true } : { ok: false, reason: 'op-reuse' };
  }
  if (loja.itens.includes(item.id)) return { ok: false, reason: 'already-owned' };
  if (bitsDaCasa(g, cartoes) - loja.gasto < item.preco) return { ok: false, reason: 'insufficient' };
  loja.gasto += item.preco;
  loja.itens.push(item.id);
  loja.ops[opId] = item.id;
  const chaves = Object.keys(loja.ops);
  for (const k of chaves.slice(0, Math.max(0, chaves.length - LOJA_OPS_MAX))) delete loja.ops[k];
  await kvOrThrow(env).put(lojaKey(g.id), JSON.stringify(loja), { expirationTtl: CASA_TTL });
  return { ok: true, repeated: false };
}
