/**
 * PACOTES DE BITS pagos em Créditos (REGISTRO §373, dono 14/11/2026) — a troca Crédito→Bits é decidida AQUI.
 *
 * Créditos são dinheiro real. Por isso o servidor é a fonte de tudo o que a troca envolve:
 *  · QUAIS pacotes existem e quantos Bits/Créditos cada um vale (`BITS_PACKS`, espelho de `src/utils/currencies.ts`,
 *    travado por `bitsPacks.parity.test.js`). O cliente manda só o `pack` (id); qualquer número que ele mande é ignorado.
 *  · O TETO de `BITS_PACK_DAILY_CAP` (1.000) Bits por DIA UTC. O dia é o do SERVIDOR (o relógio do aparelho não abre o dia).
 *    O pacote só passa se couber INTEIRO no que resta (200 + 500 passam; depois disso o de 1.000 não). Recusa não debita nada.
 *  · O contador do dia mora no PRÓPRIO `ent:<saveId>` (`ent.bitsBuy = { day, bits }`) e é gravado na MESMA escrita que debita os
 *    Créditos: débito e contagem nunca se separam (um sem o outro seria cobrar sem contar, ou contar sem cobrar).
 *  · IDEMPOTÊNCIA por pedido (`opId` OBRIGATÓRIO, padrão do `buy-essence`): os últimos `OPS_MAX` pedidos atendidos ficam em
 *    `ent.bitsBuyOps`, gravados na MESMA escrita do débito (como o `rankPrizes` de `grantRankPrize`). Reenviar o mesmo pedido
 *    devolve o mesmo pacote (`replay: true`) sem debitar de novo; não existe estado "debitou mas não marcou" (nem o contrário).
 *
 * CONCORRÊNCIA — o limite honesto. O KV não é transacional (ver o cabeçalho de `_entitlements.js`, ADR-005): duas trocas
 * simultâneas da MESMA conta leriam o mesmo `ent` e uma escrita apagaria a outra. Com o D1 ligado (`env.DB`, produção), cada troca
 * pega uma TRAVA por conta antes de ler: a linha `bitslock:<saveId>` em `order_claims` (PRIMARY KEY, sem schema novo — o mesmo
 * truque do `grant:` de `applyVerifiedPurchase`). Quem não pega a trava recebe `409 busy` e nada muda; a trava vence sozinha em
 * `LOCK_TTL_MS` se um worker morrer no meio. Sem D1 (dev/teste local) sobra a janela de corrida do KV: duas trocas no mesmo
 * instante podem passar as duas, e a perda é do DONO (a última escrita debita uma vez só), nunca do jogador.
 */
import { readEntitlement, writeEntitlement, ehViolacaoDeChave } from './_entitlements.js';

export const BITS_PACKS = [
  { id: 'bits-200', bits: 200, credits: 200 },
  { id: 'bits-500', bits: 500, credits: 460 },
  { id: 'bits-1000', bits: 1000, credits: 800 },
];

export const BITS_PACK_DAILY_CAP = 1000;

/** Quanto a trava por conta vale antes de vencer sozinha (worker que morreu no meio não prende a conta). */
export const LOCK_TTL_MS = 30_000;
/** Quantos pedidos atendidos ficam guardados para a idempotência (a janela de retry de um cliente é de segundos). */
export const OPS_MAX = 20;
const OP_ID = /^[A-Za-z0-9_-]{8,64}$/;

export const isoDayUtc = (ms = Date.now()) => new Date(ms).toISOString().slice(0, 10);

export function bitsPackById(id) {
  return BITS_PACKS.find(p => p.id === id);
}

/** Bits já comprados no dia UTC de `nowMs` (registro de outro dia = 0). */
export function bitsBoughtToday(ent, nowMs = Date.now()) {
  const r = ent?.bitsBuy;
  if (!r || typeof r !== 'object' || r.day !== isoDayUtc(nowMs)) return 0;
  const n = Number(r.bits);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function bitsPackLeftToday(ent, nowMs = Date.now()) {
  return Math.max(0, BITS_PACK_DAILY_CAP - bitsBoughtToday(ent, nowMs));
}

async function takeLock(env, saveId, nowMs) {
  if (!env.DB) return { ok: true, release: async () => {} };
  const row = `bitslock:${saveId}`;
  // Trava vencida (worker morto) sai ANTES da disputa, como em `claimOrderAtomic`.
  await env.DB.prepare('DELETE FROM order_claims WHERE order_id = ? AND expires_at IS NOT NULL AND expires_at <= ?').bind(row, nowMs).run();
  try {
    await env.DB.prepare('INSERT INTO order_claims (order_id, save_id, claimed_at, expires_at) VALUES (?, ?, ?, ?)')
      .bind(row, saveId, nowMs, nowMs + LOCK_TTL_MS).run();
  } catch (err) {
    if (!ehViolacaoDeChave(err)) throw err;
    return { ok: false, release: async () => {} };
  }
  return {
    ok: true,
    release: async () => {
      try { await env.DB.prepare('DELETE FROM order_claims WHERE order_id = ?').bind(row).run(); } catch { /* vence em LOCK_TTL_MS */ }
    },
  };
}

/**
 * Compra um pacote de Bits com Créditos.
 * @param {{ admin?: boolean, nowMs?: number }} [opts] admin não debita nem conta (padrão de `spend`/`buy-essence`).
 * @returns {Promise<
 *   | { ok: true, status: 200, pack: string, bits: number, price: number, leftToday: number, ent: any, replay?: boolean }
 *   | { ok: false, status: number, reason: 'bad-op'|'unknown-pack'|'daily-cap'|'insufficient'|'busy', leftToday?: number }>}
 */
export async function buyBitsPack(env, saveId, packId, opId, opts = {}) {
  const admin = opts.admin === true;
  const nowMs = typeof opts.nowMs === 'number' ? opts.nowMs : Date.now();
  if (typeof opId !== 'string' || !OP_ID.test(opId)) return { ok: false, status: 400, reason: 'bad-op' };
  const pack = bitsPackById(packId);
  if (!pack) return { ok: false, status: 400, reason: 'unknown-pack' };
  const lock = await takeLock(env, saveId, nowMs);
  if (!lock.ok) return { ok: false, status: 409, reason: 'busy' };
  try {
    const ent = await readEntitlement(env, saveId);
    const ops = Array.isArray(ent.bitsBuyOps) ? ent.bitsBuyOps.filter(o => o && typeof o === 'object') : [];
    const feito = ops.find(o => o.op === opId);
    if (feito) {
      // Repetição do MESMO pedido: o pacote que ele comprou, sem cobrar e sem reconferir (saldo e teto já mudaram por causa dele).
      const p = bitsPackById(feito.pack) ?? pack;
      return { ok: true, status: 200, pack: p.id, bits: p.bits, price: p.credits, leftToday: bitsPackLeftToday(ent, nowMs), ent, replay: true };
    }
    const left = bitsPackLeftToday(ent, nowMs);
    if (!admin && pack.bits > left) return { ok: false, status: 409, reason: 'daily-cap', leftToday: left };
    if (!admin) {
      if (!(Number(ent.credits) >= pack.credits)) return { ok: false, status: 402, reason: 'insufficient', leftToday: left };
      ent.credits -= pack.credits;
      ent.bitsBuy = { day: isoDayUtc(nowMs), bits: bitsBoughtToday(ent, nowMs) + pack.bits };
      ent.bitsBuyOps = [...ops, { op: opId, pack: pack.id }].slice(-OPS_MAX);
      await writeEntitlement(env, saveId, ent);
    }
    return { ok: true, status: 200, pack: pack.id, bits: pack.bits, price: admin ? 0 : pack.credits, leftToday: admin ? left : left - pack.bits, ent };
  } finally {
    await lock.release();
  }
}
