// ---------------------------------------------------------------------------
// FLIPERAMA DE CANTO COMO PRÊMIO DO 1º LUGAR (REGISTRO §482, decisão do dono 18/11/2026).
//
// No FECHAMENTO DO MÊS, quem liderou o ranking MENSAL de cada minigame dos prédios de jogos (Salão e Ateliê da Mente) ganha o item
// `furn-arcade-cab`. Só os rankings MENSAIS entram agora (match3 = Aventura do Elemental Fusion; match3-pvp); os semanais (dino, ppt, eco,
// soul-barrage, zip, patches…) NÃO têm agregado mensal e ficam de fora até o dono decidir. O Endless Rift é da Masmorra (não é dos dois
// prédios de minigame) e tem o prêmio próprio em Créditos (`_riftPayout.js`): fora daqui.
//
// MECANISMO (mesmo fechamento PREGUIÇOSO do Rift: no 1º acesso a um endpoint de ranking no mês seguinte):
//   · trava `arcade-prize:lock:<YYYY-MM>` (running/done) evita trabalho repetido; é best-effort (KV eventual);
//   · o que NUNCA paga duas vezes é a marca DENTRO do `ent` (`ent.rankPrizes`, `arcade:<mês>:<jogo>`), gravada no mesmo ler-modificar-gravar
//     que entrega o item (`grantItemPrize`, sob a trava do ent);
//   · item ÚNICO: quem já tem o Fliperama (no save gravado) recebe o PRÊMIO ALTERNATIVO (`ARCADE_ALT_PRIZE`, configurável e DESLIGADO até o
//     dono decidir: sem ele, só fica o registro `owned`); quem ganhou o item de outro jogo no mesmo mês também cai aqui (ver `jaTem`);
//   · simulados nunca recebem (`payablePlacements`); conta apagada depois do fechamento recusa;
//   · cada decisão grava uma linha de auditoria `arcade-prize:<mês>:<jogo>` (saveId, score, status, quando).
// O cliente lê `itemPrizes` do GET de entitlements e põe o item no save (`grantGuildTrophy`, só ids permitidos).
// ---------------------------------------------------------------------------
import { kvOrThrow } from './_kv.js';
import { grantItemPrize, grantRankPrize, readEntitlement } from './_entitlements.js';
import { payablePlacements, monthKey } from './_rankings.js';
import { lerSave, possuidosDoSave } from './_feiraLoja.js';

export const ARCADE_ITEM_ID = 'furn-arcade-cab';
/** Rankings MENSAIS dos prédios de minigame que premiam o 1º lugar. */
export const ARCADE_MONTHLY_GAMES = Object.freeze(['match3', 'match3-pvp']);
/**
 * Prêmio alternativo para quem JÁ tem o Fliperama e vence de novo. DESLIGADO até o dono escolher (modal): `enabled: false` = só registra.
 * Só `credits` está implementado; as outras opções propostas (essência, outra decoração) dependem da escolha do dono (REGISTRO §482).
 */
export const ARCADE_ALT_PRIZE = Object.freeze({ enabled: false, credits: 0 });

const RUNNING_STALE_MS = 10 * 60 * 1000;
const TTL = { expirationTtl: 86400 * 400 };
const lockKey = (pk) => `arcade-prize:lock:${pk}`;
const auditKey = (pk, game) => `arcade-prize:${pk}:${game}`;
export const arcadeMark = (pk, game) => `arcade:${pk}:${game}`;
const closed = new Set();
export const _resetArcadeCache = () => closed.clear();

export const prevMonth = (now = new Date()) => monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));

async function entries(store, game, pk) {
  const prefix = `rk:${game}:${pk}:`;
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
        sim: k.metadata?.sim === true,
      });
    }
    if (page.list_complete || !page.cursor) break;
    cursor = page.cursor;
  }
  return out.sort((a, b) => b.score - a.score || a.t - b.t || (a.saveId < b.saveId ? -1 : 1));
}

async function premiar(env, store, pk, game, w, now) {
  const key = auditKey(pk, game);
  if (await store.get(key)) return null; // já decidido (retomada): nunca sobrescreve
  const save = await lerSave(env, w.saveId);
  const ent = await readEntitlement(env, w.saveId).catch(() => null);
  const jaTem = possuidosDoSave(save).has(ARCADE_ITEM_ID) || (Array.isArray(ent?.itemPrizes) && ent.itemPrizes.includes(ARCADE_ITEM_ID));
  const base = { month: pk, game, saveId: w.saveId, score: w.score, at: now.getTime() };
  let status;
  if (jaTem) {
    status = 'owned';
    if (ARCADE_ALT_PRIZE.enabled && ARCADE_ALT_PRIZE.credits > 0) {
      const r = await grantRankPrize(env, w.saveId, ARCADE_ALT_PRIZE.credits, arcadeMark(pk, game), now.getTime());
      status = r.refused ? `refused:${r.refused}` : 'alt-credits';
    }
  } else {
    const r = await grantItemPrize(env, w.saveId, ARCADE_ITEM_ID, arcadeMark(pk, game), now.getTime());
    status = r.refused ? `refused:${r.refused}` : r.duplicate ? 'already' : 'item';
  }
  await store.put(key, JSON.stringify({ ...base, status }), TTL);
  return { game, saveId: w.saveId, status };
}

/**
 * Fecha o mês anterior se ainda não foi fechado. Seguro de chamar em TODA requisição (1 `get` no máximo; nenhum depois de fechado). Nunca lança.
 * @returns {Promise<{ status: 'closed'|'already'|'busy'|'skipped', month: string, results?: {game:string,saveId:string,status:string}[] }>}
 */
export async function closeArcadeMonth(env, now = new Date()) {
  const pk = prevMonth(now);
  try {
    if (closed.has(pk)) return { status: 'already', month: pk };
    const store = kvOrThrow(env);
    const raw = await store.get(lockKey(pk));
    if (raw) {
      let lock = null;
      try { lock = JSON.parse(raw); } catch { /* ilegível = running */ }
      if (lock?.state === 'done') { closed.add(pk); return { status: 'already', month: pk }; }
      if (lock && Number(lock.at) > now.getTime() - RUNNING_STALE_MS) return { status: 'busy', month: pk };
    }
    const token = `${now.getTime()}-${Math.random().toString(36).slice(2)}`;
    await store.put(lockKey(pk), JSON.stringify({ state: 'running', at: now.getTime(), token }), TTL);
    const back = JSON.parse((await store.get(lockKey(pk))) || 'null');
    if (back?.token !== token) return { status: 'busy', month: pk };
    const results = [];
    for (const game of ARCADE_MONTHLY_GAMES) {
      const [w] = payablePlacements(await entries(store, game, pk), 1);
      if (!w) continue;
      const r = await premiar(env, store, pk, game, w, now);
      if (r) results.push(r);
    }
    await store.put(lockKey(pk), JSON.stringify({ state: 'done', at: now.getTime(), token }), TTL);
    closed.add(pk);
    return { status: 'closed', month: pk, results };
  } catch {
    return { status: 'skipped', month: pk };
  }
}
