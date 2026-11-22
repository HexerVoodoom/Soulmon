// ---------------------------------------------------------------------------
// FLIPERAMA DE CANTO COMO PRÊMIO DO 1º LUGAR (REGISTRO §482, decisão do dono 18/11/2026).
//
// No FECHAMENTO DO MÊS, quem liderou o ranking MENSAL de cada minigame dos prédios de jogos (Salão e Ateliê da Mente) recebe uma CARTA do
// Papus (o correio do jogo, `_mensageiro.js`) com o item `furn-arcade-cab` de ANEXO: o jogador abre a carta e resgata, e o item vai para a
// decoração (cliente: `applyMail` → `grantGuildTrophy`). Só os rankings MENSAIS entram agora (match3 = Aventura do Elemental Fusion;
// match3-pvp); os semanais (dino, ppt, eco, soul-barrage, zip, patches…) NÃO têm agregado mensal e ficam de fora até o dono decidir.
// O Endless Rift é da Masmorra (não é dos dois prédios de minigame) e tem o prêmio próprio em Créditos (`_riftPayout.js`): fora daqui.
//
// MECANISMO (mesmo fechamento PREGUIÇOSO do Rift: no 1º acesso a um endpoint de ranking no mês seguinte):
//   · trava `arcade-prize:lock:<YYYY-MM>` (running/done) evita trabalho repetido; é best-effort (KV eventual);
//   · o que NUNCA duplica é o `mid` da carta (`arcade:<mês>:<jogo>`): o correio não aceita o mesmo `mid` duas vezes, nem depois de apagada;
//   · a carta com anexo pendente NÃO expira nem some sem `force` (regra do correio: prêmio pendente nunca vence calado);
//   · item ÚNICO: quem já tem o Fliperama (save gravado ou outra carta com o anexo) recebe a carta SEM anexo (só o aplauso), ou com o
//     PRÊMIO ALTERNATIVO (`ARCADE_ALT_PRIZE`: 30 de Honra na própria carta, decisão do dono 18/11/2026; configurável);
//   · simulados nunca recebem (`payablePlacements`); cada decisão grava a auditoria `arcade-prize:<mês>:<jogo>`.
// ---------------------------------------------------------------------------
import { kvOrThrow } from './_kv.js';
import { enqueueMail, temItemNaCaixa } from './_mensageiro.js';
import { payablePlacements, monthKey, MENSAL_COM_LEGADO_SEMANAL, semanasDoMes } from './_rankings.js';
import { adminSaveIdsSeguro } from './_rankAdmin.js';
import { lerSave, possuidosDoSave } from './_feiraLoja.js';

export const ARCADE_ITEM_ID = 'furn-arcade-cab';
/** Rankings MENSAIS dos prédios de minigame que premiam o 1º lugar. */
export const ARCADE_MONTHLY_GAMES = Object.freeze(['match3', 'match3-pvp']);
/**
 * Prêmio alternativo para quem JÁ tem o Fliperama e vence de novo, entregue na própria carta (Bits e/ou Honra, os prêmios que o correio
 * carrega). LIGADO pelo dono (18/11/2026): 30 de Honra, o mesmo valor que `seasonPrize` (`_mensageiro.js`) paga do 4º ao 20º lugar da
 * temporada, abaixo dos 120 do 1º: é consolação, não substitui o item. `enabled: false` volta à carta só com os parabéns.
 */
export const ARCADE_ALT_PRIZE = Object.freeze({ enabled: true, bits: 0, emblems: 30 });

const RUNNING_STALE_MS = 10 * 60 * 1000;
const TTL = { expirationTtl: 86400 * 400 };
const lockKey = (pk) => `arcade-prize:lock:${pk}`;
const auditKey = (pk, game) => `arcade-prize:${pk}:${game}`;
export const arcadeMark = (pk, game) => `arcade:${pk}:${game}`;
const closed = new Set();
export const _resetArcadeCache = () => closed.clear();

export const prevMonth = (now = new Date()) => monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));

const MESES_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const JOGO_NOME = { match3: ['Elemental Fusion (Aventura)', 'Elemental Fusion (Adventure)'], 'match3-pvp': ['Elemental Fusion (PvP)', 'Elemental Fusion (PvP)'] };

/** A carta do Papus com os parabéns. Com `anexo` o Fliperama vai junto; sem ele (já tem) a carta é só o aplauso, ou leva o alternativo. */
export function cartaDoPremio(pk, game, anexo, alt) {
  const [y, m] = pk.split('-').map(Number);
  const [jp, je] = JOGO_NOME[game] ?? [game, game];
  const mesPt = `${MESES_PT[m - 1]} de ${y}`;
  const mesEn = `${MESES_EN[m - 1]} ${y}`;
  const comAlt = !anexo && !!alt && (alt.bits > 0 || alt.emblems > 0);
  const fimPt = anexo ? 'Vai anexado a esta carta o Fliperama de Canto: toque em resgatar e ele entra na sua decoração.'
    : comAlt ? 'Você já tem o Fliperama de Canto, então vai outro presente anexado: toque em resgatar.'
      : 'Você já tem o Fliperama de Canto, então esta carta é só o nosso aplauso.';
  const fimEn = anexo ? 'The Corner Arcade is attached to this letter: tap claim and it goes to your decor.'
    : comAlt ? 'You already own the Corner Arcade, so another gift is attached: tap claim.'
      : 'You already own the Corner Arcade, so this letter is just our applause.';
  return {
    mid: arcadeMark(pk, game),
    titlePt: 'Parabéns pelo 1º lugar!', titleEn: 'Congratulations on 1st place!',
    bodyPt: `Você terminou em 1º lugar no ranking de ${mesPt} em ${jp}. ${fimPt}`,
    bodyEn: `You finished 1st in the ${mesEn} ranking of ${je}. ${fimEn}`,
    ...(anexo ? { item: ARCADE_ITEM_ID } : {}),
    ...(comAlt ? { bits: alt.bits, emblems: alt.emblems } : {}),
  };
}

// Legado semanal (REGISTRO §473, adendo 18/11/2026): no mês da troca (`2026-11`) o `match3` junta as semanas do mês, a MESMA régua do
// quadro (`readBoard`): o melhor placar de cada jogador; empate no placar = o mais antigo. De dezembro em diante, só o mensal.
async function entries(env, store, game, pk) {
  const legado = MENSAL_COM_LEGADO_SEMANAL[game]?.includes(pk) ? semanasDoMes(pk) : [];
  const porId = new Map();
  for (const per of [pk, ...legado]) {
    for (const e of await entriesDe(store, game, per)) {
      const prev = porId.get(e.saveId);
      if (!prev || e.score > prev.score || (e.score === prev.score && e.t < prev.t)) porId.set(e.saveId, e);
    }
  }
  const admins = await adminSaveIdsSeguro(env); // GM/admin nunca leva o Fliperama (dono 18/11/2026)
  return [...porId.values()].filter((e) => !admins.has(e.saveId)).sort((a, b) => b.score - a.score || a.t - b.t || (a.saveId < b.saveId ? -1 : 1));
}

async function entriesDe(store, game, pk) {
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
  return out;
}

async function premiar(env, store, pk, game, w, now) {
  const key = auditKey(pk, game);
  if (await store.get(key)) return null; // já decidido (retomada): nunca sobrescreve
  const save = await lerSave(env, w.saveId);
  const jaTem = possuidosDoSave(save).has(ARCADE_ITEM_ID) || await temItemNaCaixa(store, w.saveId, ARCADE_ITEM_ID);
  const carta = cartaDoPremio(pk, game, !jaTem, ARCADE_ALT_PRIZE.enabled ? ARCADE_ALT_PRIZE : null);
  const enviada = await enqueueMail(env, store, w.saveId, { ...carta, at: now.getTime() });
  const status = !enviada ? 'already' : !jaTem ? 'item' : (carta.bits || carta.emblems) ? 'alt' : 'owned';
  await store.put(key, JSON.stringify({ month: pk, game, saveId: w.saveId, score: w.score, at: now.getTime(), status, mid: carta.mid }), TTL);
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
      const [w] = payablePlacements(await entries(env, store, game, pk), 1);
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
