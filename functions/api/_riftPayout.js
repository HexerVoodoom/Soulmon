// ---------------------------------------------------------------------------
// FECHAMENTO MENSAL DO ENDLESS RIFT (M6) — Créditos 50/25/10 para o top 3, pagos SÓ pelo servidor.
//
// Exceção "Crédito como prêmio" (REGISTRO-DE-DECISOES, decisão do dono 25/10/2026). O cliente nunca credita.
//
// MECANISMO: fechamento PREGUIÇOSO. Pages Functions não têm cron confiável; no primeiro acesso a qualquer
// endpoint de ranking no mês seguinte, `closePreviousMonth` tenta fechar o mês anterior.
//
// IDEMPOTÊNCIA (nunca pagar duas vezes):
//   1. trava `rift-payout:<YYYY-MM>` gravada ANTES de pagar, com um token único; relê e só segue quem
//      reconhece o próprio token (fecha a corrida de dois primeiros acessos simultâneos, na medida em que o
//      KV permite — ele é eventualmente consistente, então isto é best-effort);
//   2. por usuário, `rift-paid:<YYYY-MM>:<saveId>` gravada ANTES do crédito. Prefere-se perder um pagamento
//      a pagar duas vezes: Crédito é dinheiro real;
//   3. trava `done` é definitiva; trava `running` velha (> RUNNING_STALE_MS) pode ser retomada — a chave por
//      usuário impede repagar quem já foi.
// ---------------------------------------------------------------------------
import { kvOrThrow } from './_kv.js';
import { grantRankPrize } from './_entitlements.js';
import { payablePlacements, monthKey } from './_rankings.js';

export const RIFT_GAME = 'endless-rift';
/** Créditos por colocação paga (1º, 2º, 3º). */
export const RIFT_PAYOUT = Object.freeze([50, 25, 10]);
const RUNNING_STALE_MS = 10 * 60 * 1000;
const LOCK_TTL = { expirationTtl: 86400 * 400 };

export const lockKey = (pk) => `rift-payout:${pk}`;
export const paidKey = (pk, saveId) => `rift-paid:${pk}:${saveId}`;

/** `YYYY-MM` do mês ANTERIOR ao de `now` (UTC). */
export function prevMonthKey(now = new Date()) {
  return monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));
}

/** Placar completo do mês, em ordem de pagamento: score desc; empate → quem chegou ao score primeiro (`t`), depois saveId. */
async function readEntries(store, pk) {
  const prefix = `rk:${RIFT_GAME}:${pk}:`;
  const out = [];
  let cursor;
  for (let p = 0; p < 5; p++) {
    const page = await store.list({ prefix, limit: 1000, ...(cursor ? { cursor } : {}) });
    for (const k of page.keys) {
      const t = Number(k.metadata?.t);
      out.push({
        saveId: k.name.slice(k.name.lastIndexOf(':') + 1),
        score: Number(k.metadata?.s) || 0,
        t: Number.isFinite(t) && k.metadata?.t != null ? t : Number.MAX_SAFE_INTEGER,
        sim: k.metadata?.sim === true || /^sim_[0-9]{4}$/.test(k.name.slice(k.name.lastIndexOf(':') + 1)), // M11: simulado nunca recebe Crédito
      });
    }
    if (page.list_complete || !page.cursor) break;
    cursor = page.cursor;
  }
  return out.sort((a, b) => b.score - a.score || a.t - b.t || (a.saveId < b.saveId ? -1 : 1));
}

const closedInMemory = new Set();

/**
 * Fecha o mês anterior se ainda não foi fechado. Seguro de chamar em TODA requisição: custa 1 `get` no
 * máximo (e nenhum depois de fechado, pelo cache em memória). Nunca lança.
 * @returns {Promise<{ status: 'closed'|'already'|'busy'|'skipped', month: string, paid?: {saveId:string,credits:number}[] }>}
 */
export async function closePreviousMonth(env, now = new Date()) {
  const pk = prevMonthKey(now);
  try {
    if (closedInMemory.has(pk)) return { status: 'already', month: pk };
    const store = kvOrThrow(env);
    const raw = await store.get(lockKey(pk));
    if (raw) {
      let lock = null;
      try { lock = JSON.parse(raw); } catch { /* trava ilegível = tratada como running */ }
      if (lock?.state === 'done') { closedInMemory.add(pk); return { status: 'already', month: pk }; }
      if (lock && Number(lock.at) > now.getTime() - RUNNING_STALE_MS) return { status: 'busy', month: pk };
    }
    const token = `${now.getTime()}-${Math.random().toString(36).slice(2)}`;
    await store.put(lockKey(pk), JSON.stringify({ state: 'running', at: now.getTime(), token }), LOCK_TTL);
    const back = JSON.parse((await store.get(lockKey(pk))) || 'null');
    if (back?.token !== token) return { status: 'busy', month: pk };

    const entries = await readEntries(store, pk);
    const winners = payablePlacements(entries, RIFT_PAYOUT.length);
    const paid = [];
    for (let i = 0; i < winners.length; i++) {
      const w = winners[i];
      const credits = RIFT_PAYOUT[i];
      const mine = paidKey(pk, w.saveId);
      if (await store.get(mine)) continue; // já pago (retomada)
      await store.put(mine, JSON.stringify({ credits, place: i + 1, score: w.score, at: now.getTime() }), LOCK_TTL);
      await grantRankPrize(env, w.saveId, credits);
      paid.push({ saveId: w.saveId, credits });
    }
    await store.put(lockKey(pk), JSON.stringify({ state: 'done', at: now.getTime(), token }), LOCK_TTL);
    closedInMemory.add(pk);
    return { status: 'closed', month: pk, paid };
  } catch {
    return { status: 'skipped', month: pk };
  }
}

/** O que ESTE jogador recebeu no fechamento do mês anterior (só leitura, para o cliente mostrar). */
export async function readMyPrize(env, saveId, now = new Date()) {
  try {
    const pk = prevMonthKey(now);
    const raw = await kvOrThrow(env).get(paidKey(pk, saveId));
    if (!raw) return null;
    const v = JSON.parse(raw);
    return { month: pk, credits: Number(v.credits) || 0, place: Number(v.place) || 0 };
  } catch { return null; }
}

/** Só para testes. */
export function _resetClosedCache() { closedInMemory.clear(); }
