// ---------------------------------------------------------------------------
// FECHAMENTO MENSAL DO ENDLESS RIFT (M6) — Créditos 50/25/10 para o top 3, pagos SÓ pelo servidor E SÓ APÓS REVISÃO DO DONO.
//
// Exceção "Crédito como prêmio" (REGISTRO-DE-DECISOES, decisão do dono 25/10/2026). O cliente nunca credita.
// DECISÃO DO DONO 1 (QA beta3, 25/10/2026): o fechamento do mês NÃO paga. Ele grava o top 3 REAL (sem simulados) como PENDENTE
// (`rift-pending:<YYYY-MM>:<saveId>`); o dono vê a progressão do jogador na página GM (`/gm/rift`) e aprova ou rejeita
// (`/api/gm-rift-payout`, admin autenticado); só a aprovação chama `grantRankPrize`.
//
// MECANISMO: fechamento PREGUIÇOSO. Pages Functions não têm cron confiável; no primeiro acesso a qualquer
// endpoint de ranking no mês seguinte, `closePreviousMonth` tenta fechar o mês anterior (isto é, gravar os pendentes).
//
// IDEMPOTÊNCIA (nunca pagar duas vezes, nunca perder em silêncio):
//   1. A trava `rift-payout:<YYYY-MM>` só evita trabalho repetido (KV eventual: best-effort). Gravar pendente é idempotente
//      por construção: não sobrescreve um pendente que já exista (nem um pago/rejeitado);
//   2. quem NÃO é best-effort é a marca de pago DENTRO do `ent` (`ent.rankPrizes`, `rift:<mês>`), gravada no mesmo
//      ler-modificar-gravar que soma os Créditos (`grantRankPrize`). Aprovar duas vezes (ou duas abas do GM) credita uma;
//   3. falha em qualquer ponto NÃO perde prêmio: o pendente só vira `paid` DEPOIS do crédito; se o crédito falhar (ou a conta
//      foi apagada) ele continua pendente/recusado e visível ao dono; se a marca em `rift-pending` falhar depois do crédito,
//      reaprovar acha a marca no `ent` (duplicate) e só regrava o registro;
//   4. a trava `done` só vem depois de TODOS os pendentes gravados; trava `running` velha pode ser retomada.
// ---------------------------------------------------------------------------
import { kvOrThrow } from './_kv.js';
import { grantRankPrize } from './_entitlements.js';
import { payablePlacements, monthKey } from './_rankings.js';
import { readRiftLastro } from './_dayCounters.js';

export const RIFT_GAME = 'endless-rift';
/** Créditos por colocação paga (1º, 2º, 3º). */
export const RIFT_PAYOUT = Object.freeze([50, 25, 10]);
const RUNNING_STALE_MS = 10 * 60 * 1000;
const LOCK_TTL = { expirationTtl: 86400 * 400 };

export const lockKey = (pk) => `rift-payout:${pk}`;
export const pendingKey = (pk, saveId) => `rift-pending:${pk}:${saveId}`;
export const PENDING_PREFIX = 'rift-pending:';
/** Marca de prêmio pago dentro do `ent` (`ent.rankPrizes`). */
export const prizeMark = (pk) => `rift:${pk}`;

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
 * Fecha o mês anterior se ainda não foi fechado: GRAVA o top 3 real como PENDENTE (não paga). Seguro de chamar em TODA
 * requisição: custa 1 `get` no máximo (e nenhum depois de fechado, pelo cache em memória). Nunca lança.
 * @returns {Promise<{ status: 'closed'|'already'|'busy'|'skipped', month: string, pending?: {saveId:string,credits:number,place:number}[] }>}
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
    const pending = [];
    for (let i = 0; i < winners.length; i++) {
      const w = winners[i];
      const credits = RIFT_PAYOUT[i];
      const key = pendingKey(pk, w.saveId);
      if (await store.get(key)) continue; // já existe (retomada): nunca sobrescreve pendente/pago/rejeitado
      await store.put(key, JSON.stringify({ status: 'pending', month: pk, credits, place: i + 1, score: w.score, at: now.getTime() }), LOCK_TTL);
      pending.push({ saveId: w.saveId, credits, place: i + 1 });
    }
    await store.put(lockKey(pk), JSON.stringify({ state: 'done', at: now.getTime(), token }), LOCK_TTL);
    closedInMemory.add(pk);
    return { status: 'closed', month: pk, pending };
  } catch {
    return { status: 'skipped', month: pk };
  }
}

const VALID_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const VALID_SAVE = /^[a-zA-Z0-9_-]{8,64}$/;

async function readPending(store, pk, saveId) {
  const raw = await store.get(pendingKey(pk, saveId));
  if (!raw) return null;
  try { const v = JSON.parse(raw); return v && typeof v === 'object' ? v : null; } catch { return null; }
}

/**
 * APROVAÇÃO do dono (só `gm-rift-payout.js`, já autenticada como admin): credita e marca pago.
 * Idempotente: o `ent` carrega a marca (ver `grantRankPrize`); aprovar de novo devolve `already`.
 * @returns {Promise<{ status: 'paid'|'already'|'not-found'|'refused'|'invalid'|'rejected', credits?: number, recorded?: boolean }>}
 */
export async function approveRiftPrize(env, pk, saveId, now = Date.now()) {
  if (!VALID_MONTH.test(String(pk)) || !VALID_SAVE.test(String(saveId))) return { status: 'invalid' };
  const store = kvOrThrow(env);
  const p = await readPending(store, pk, saveId);
  if (!p) return { status: 'not-found' };
  if (p.status === 'paid') return { status: 'already', credits: p.credits };
  if (p.status === 'rejected') return { status: 'rejected' };
  const credits = Number(p.credits);
  const r = await grantRankPrize(env, saveId, credits, prizeMark(pk), Number(p.at) || 0);
  if (r.refused) {
    // Conta apagada ou dado inválido: NÃO paga, e o pendente fica pendente (com o motivo) — nunca some em silêncio.
    await store.put(pendingKey(pk, saveId), JSON.stringify({ ...p, refused: r.refused, refusedAt: now }), LOCK_TTL).catch(() => {});
    return { status: 'refused', credits };
  }
  let recorded = true;
  try {
    const { refused: _r, refusedAt: _ra, ...limpo } = p;
    await store.put(pendingKey(pk, saveId), JSON.stringify({ ...limpo, status: 'paid', paidAt: now }), LOCK_TTL);
  } catch { recorded = false; } // o crédito já está no `ent` com a marca: reaprovar só regrava o registro
  return { status: r.duplicate ? 'already' : 'paid', credits, recorded };
}

/** O dono recusa o prêmio (ex.: score forjado). Não credita. Prêmio já pago não volta atrás por aqui. */
export async function rejectRiftPrize(env, pk, saveId, now = Date.now()) {
  if (!VALID_MONTH.test(String(pk)) || !VALID_SAVE.test(String(saveId))) return { status: 'invalid' };
  const store = kvOrThrow(env);
  const p = await readPending(store, pk, saveId);
  if (!p) return { status: 'not-found' };
  if (p.status === 'paid') return { status: 'already' };
  await store.put(pendingKey(pk, saveId), JSON.stringify({ ...p, status: 'rejected', rejectedAt: now }), LOCK_TTL);
  return { status: 'rejected' };
}

/**
 * Lista os prêmios do Rift (pendentes primeiro) com a PROGRESSÃO do jogador, para o dono decidir: lastro do mês
 * (base/camadas começadas/recorde do servidor), os melhores dos 3 meses anteriores e o apelido.
 */
export async function listRiftPrizes(env) {
  const store = kvOrThrow(env);
  const page = await store.list({ prefix: PENDING_PREFIX, limit: 100 });
  const items = [];
  for (const k of page.keys ?? []) {
    const m = /^rift-pending:(\d{4}-\d{2}):(.+)$/.exec(k.name);
    if (!m) continue;
    const [, month, saveId] = m;
    const p = await readPending(store, month, saveId);
    if (!p) continue;
    let nome = null;
    try { const raw = await store.get(`profile:${saveId}`); nome = raw ? (JSON.parse(raw)?.name ?? null) : null; } catch { nome = null; }
    const [y, mo] = month.split('-').map(Number);
    const lastro = await readRiftLastro(store, saveId, Date.UTC(y, mo - 1, 15), month).catch(() => null);
    const historico = [];
    for (let i = 1; i <= 3; i++) {
      const pm = monthKey(new Date(Date.UTC(y, mo - 1 - i, 1)));
      const v = Number(await store.get(`rkme:${RIFT_GAME}:${pm}:${saveId}`));
      if (Number.isFinite(v) && v > 0) historico.push({ month: pm, best: v });
    }
    items.push({
      month, saveId, name: typeof nome === 'string' ? nome.slice(0, 80) : null, place: p.place, credits: p.credits, score: p.score,
      status: p.status, refused: p.refused ?? null,
      progresso: lastro ? { base: lastro.base, camadasComecadas: lastro.n, recordeDoServidor: lastro.rec } : null,
      historico,
    });
  }
  items.sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || (a.month < b.month ? 1 : a.month > b.month ? -1 : a.place - b.place));
  return items;
}

/** O que ESTE jogador recebeu no fechamento do mês anterior (só leitura, para o cliente mostrar). Só prêmio JÁ PAGO. */
export async function readMyPrize(env, saveId, now = new Date()) {
  try {
    const pk = prevMonthKey(now);
    const v = await readPending(kvOrThrow(env), pk, saveId);
    if (!v || v.status !== 'paid') return null;
    return { month: pk, credits: Number(v.credits) || 0, place: Number(v.place) || 0 };
  } catch { return null; }
}

/** Só para testes. */
export function _resetClosedCache() { closedInMemory.clear(); }
