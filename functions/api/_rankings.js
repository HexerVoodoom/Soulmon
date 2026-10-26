// ---------------------------------------------------------------------------
// RANKING GENÉRICO (BACKLOG-BETA3 M8) — um módulo, todos os jogos.
//
// Reaproveitável pelos minigames e pelas masmorras das próximas lanes: basta
// acrescentar o id em `RANKED_GAMES` (allowlist FECHADA — o servidor decide
// quais jogos têm ranking; o cliente não inventa).
//
// PERÍODO — chave em UTC FIXO (igual para todos, sem depender do fuso do
// aparelho, que o jogador pode mexer; um ranking comparativo precisa de um
// relógio só):
//   • `weekly`  → `YYYY-Www`, semana ISO 8601 (segunda 00:00 UTC a domingo);
//   • `monthly` → `YYYY-MM`.
//
// ARMAZENAMENTO (KV, sem ler-modificar-gravar um documento único, que perderia
// placar sob concorrência):
//   • `rk:<jogo>:<período>:<INV>:<saveId>` — uma chave por jogador; `INV` é o
//     score INVERTIDO e zero-preenchido, então a ordem lexicográfica do `list`
//     já é a ordem do ranking (maior score primeiro). Os dados do placar ficam
//     em `metadata` (≤1 KB): `{ s, n, sim }` — o top N sai de UM `list`.
//   • `rkme:<jogo>:<período>:<saveId>` — o melhor score do jogador (para achar
//     e apagar a chave antiga ao melhorar). Só o MELHOR score vale no período.
//
// FAIXA (regra do CLAUDE.md, linha "Rodada do Torneio": a faixa vem ANTES do
// ranking global — posição absoluta é leitura de comparação tóxica). A faixa
// mede o jogador contra ele mesmo: é função só do MELHOR score DELE no período
// e dos cortes do jogo (`TIER_CUTS`), então só sobe. Mesmos ids de
// `src/utils/tournamentTiers.ts` (madeira…diamante). Cortes = PROPOSTOS, o dono
// calibra (ainda não há dado real).
//
// SIMULADO: o perfil tem a flag interna `simulated` (M11, `_simulados.js`). Esses
// jogadores APARECEM no ranking (a sala não fica vazia), mas
// `payablePlacements` os PULA ao decidir quem recebe prêmio.
// ---------------------------------------------------------------------------

import { kvOrThrow } from './_kv.js';
import { getProfile } from './_profile.js';

/** Allowlist de jogos com ranking. Id estável: vira parte da chave KV. */
// `dino` (sem nível) fica só para LER/aceitar recorde antigo e cliente antigo; o cliente novo envia `dino-1`/`dino-2` (QA beta3 R4, decisão 6).
// `zip`/`patches`: ranking SEMANAL por TEMPO de resolução (decisão 5; MENOR é melhor — ver `LOWER_IS_BETTER`).
export const RANKED_GAMES = Object.freeze(['dino', 'dino-1', 'dino-2', 'ppt', 'match3', 'eco', 'endless-rift', 'rogue-dungeon', 'soul-barrage', 'zip', 'patches']);

/** Jogos em que o MENOR score vence (tempo em ms). A chave KV usa o score direto (ordem crescente) em vez do invertido. */
export const LOWER_IS_BETTER = Object.freeze(['zip', 'patches']);
export const isLowerBetter = (game) => LOWER_IS_BETTER.includes(game);

export const PERIODS = Object.freeze(['weekly', 'monthly']);
/** Período padrão — minigames: semanal. O Endless Rift (M6) usa `monthly` (score = camada mais funda do mês). */
export const DEFAULT_PERIOD = 'weekly';

/** Teto de sanidade do score: acima disso é lixo/forja, nunca placar. */
export const MAX_SCORE = 1_000_000_000;
const INV_WIDTH = 10;

export const TOP_DEFAULT = 10;
export const TOP_MAX = 50;
/** Páginas do `list` varridas para achar a posição do jogador (1000 chaves cada). */
const RANK_SCAN_PAGES = 5;

/** Faixas e cortes por jogo (proposta; ver cabeçalho). Índice = faixa; [0] é sempre 0. */
export const TIER_IDS = Object.freeze(['madeira', 'bronze', 'prata', 'ouro', 'platina', 'diamante']);
export const TIER_CUTS = Object.freeze({
  dino: [0, 300, 800, 1500, 2500, 4000],
  'dino-1': [0, 300, 800, 1500, 2500, 4000],
  'dino-2': [0, 300, 800, 1500, 2500, 4000],
  ppt: [0, 10, 20, 30, 40, 50],
  match3: [0, 300, 800, 1500, 2500, 4000],
  eco: [0, 4, 6, 8, 10, 13],
  // Endless Rift: camada mais funda do mês. Espelha os limiares de recompensa de `utils/endlessRift.ts`
  // (25 / 100 / 250) mais 500 e 999 (o teto da descida).
  'endless-rift': [0, 25, 100, 250, 500, 999],
  'rogue-dungeon': [0, 6, 12, 18, 24, 30],
  'soul-barrage': [0, 150, 400, 800, 1400, 2200],
});

/**
 * Teto de sanidade POR JOGO (abaixo do `MAX_SCORE` global; QA beta3 R1: 1e9 genérico deixava qualquer um forjar o topo).
 * Fenda: camada 999. `rogue-dungeon`: 24 desafios/dia + 3 andares x 3 de bônus = 33 (espelho de `ROGUE_MAX_SCORE` em
 * `src/utils/rogueDungeon.ts`; há teste de paridade). Os demais são folgados (dezenas de vezes o topo da faixa mais alta
 * de `TIER_CUTS`), só para barrar lixo/forja grosseira — o dono calibra quando houver dado real.
 */
export const MAX_SCORE_BY_GAME = Object.freeze({
  'endless-rift': 999, 'rogue-dungeon': 33,
  dino: 100_000, 'dino-1': 100_000, 'dino-2': 100_000,
  ppt: 200, match3: 100_000, eco: 100, 'soul-barrage': 50_000,
});
/** Jogos de TEMPO (ms): faixa plausível [min, max]. Resolver em < 2 s é impossível; > 30 min não é recorde de ninguém. */
export const TIME_BOUNDS_MS = Object.freeze({ zip: [2000, 1_800_000], patches: [2000, 1_800_000] });
export function scoreIsPlausible(game, score) {
  const tb = TIME_BOUNDS_MS[game];
  if (tb) return score >= tb[0] && score <= tb[1];
  const cap = MAX_SCORE_BY_GAME[game];
  return cap === undefined || score <= cap;
}

export function isRankedGame(game) {
  return typeof game === 'string' && RANKED_GAMES.includes(game);
}
export function isPeriod(p) {
  return typeof p === 'string' && PERIODS.includes(p);
}

/** Score válido: inteiro finito em [0, MAX_SCORE]; senão `null`. */
export function cleanScore(raw, game) {
  const max = (game && (TIME_BOUNDS_MS[game]?.[1] ?? MAX_SCORE_BY_GAME[game])) || MAX_SCORE;
  const n = typeof raw === 'number' ? raw : Number.NaN;
  if (!Number.isFinite(n)) return null;
  const s = Math.floor(n);
  return s >= 0 && s <= max ? s : null;
}

const pad = (n, w = 2) => String(n).padStart(w, '0');

/** Semana ISO 8601 em UTC: `YYYY-Www`. */
export function isoWeekKey(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = d.getUTCDay() || 7; // seg=1 … dom=7
  d.setUTCDate(d.getUTCDate() + 4 - dow); // a quinta da semana decide o ano ISO
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${pad(week)}`;
}

/** `YYYY-MM` em UTC. */
export function monthKey(now = new Date()) {
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}`;
}

export function periodKey(period, now = new Date()) {
  return period === 'monthly' ? monthKey(now) : isoWeekKey(now);
}

/** Faixa (id) do melhor score do jogador. */
export function tierFor(game, score) {
  const cuts = TIER_CUTS[game];
  if (!cuts) return TIER_IDS[0];
  let idx = 0;
  for (let i = 0; i < cuts.length; i++) if (score >= cuts[i]) idx = i;
  return TIER_IDS[idx];
}

const scoreKey = (game, pk, score, saveId) =>
  `rk:${game}:${pk}:${String(isLowerBetter(game) ? score : MAX_SCORE - score).padStart(INV_WIDTH, '0')}:${saveId}`;
/** Chave do placar de um score (para a exclusão de conta apagar a linha do jogador sem varrer o ranking). */
export const rkKeyFor = (game, pk, score, saveId) => scoreKey(game, pk, score, saveId);
const meKey = (game, pk, saveId) => `rkme:${game}:${pk}:${saveId}`;
const boardPrefix = (game, pk) => `rk:${game}:${pk}:`;

/** Quantas colocações pagam prêmio neste jogo (hoje só o Endless Rift: top 3). 0 = nenhuma. */
const pagoPor = (game) => (game === 'endless-rift' ? 3 : 0);

function cleanName(name) {
  const s = String(name ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 40);
  return s || 'Anônimo';
}

/**
 * Registra o score do jogador. Só o MELHOR vale: score ≤ ao guardado não muda nada.
 * @returns {Promise<{ improved: boolean, best: number }>}
 */
export async function submitScore(env, { game, period, saveId, score, now = new Date() }) {
  const pk = periodKey(period, now);
  const store = kvOrThrow(env);
  const mk = meKey(game, pk, saveId);
  const prevRaw = await store.get(mk);
  const prev = prevRaw === null || prevRaw === undefined ? null : Number(prevRaw);
  const hasPrev = prev !== null && Number.isFinite(prev);
  if (hasPrev && (isLowerBetter(game) ? score >= prev : score <= prev)) return { improved: false, best: prev };

  const profile = await getProfile(env, saveId).catch(() => null);
  // Quem se escondeu da lista pública (`publicHidden`) nunca tem o NOME gravado no placar (QA beta3 R1): `h` marca, e a leitura mascara.
  const hidden = profile?.publicHidden === true;
  const ttl = { expirationTtl: 86400 * 70 }; // cobre o mês inteiro + folga
  await store.put(scoreKey(game, pk, score, saveId), '', {
    ...ttl,
    metadata: { s: score, n: hidden ? 'Anônimo' : cleanName(profile?.name), ...(hidden ? { h: true } : {}), sim: profile?.simulated === true, t: now.getTime() },
  });
  if (hasPrev) await store.delete(scoreKey(game, pk, prev, saveId));
  await store.put(mk, String(score), ttl);
  return { improved: true, best: score };
}

/**
 * Top N + situação do jogador. `rank` do jogador pode ser `null` (fora da janela varrida).
 * @returns {Promise<{ game: string, period: string, periodKey: string,
 *   top: { rank: number, name: string, score: number, me: boolean, prizePlace?: number }[],
 *   me: null | { score: number, tier: string | null, rank: number | null } }>}
 */
export async function readBoard(env, { game, period, saveId, top = TOP_DEFAULT, now = new Date() }) {
  const pk = periodKey(period, now);
  const store = kvOrThrow(env);
  const n = Math.max(1, Math.min(TOP_MAX, Math.floor(top) || TOP_DEFAULT));
  const prefix = boardPrefix(game, pk);

  const page = await store.list({ prefix, limit: n });
  const simRow = (k) => k.metadata?.sim === true || /^sim_[0-9]{4}$/.test(k.name.slice(k.name.lastIndexOf(':') + 1));
  /** @type {{ rank: number, name: string, score: number, me: boolean, prizePlace?: number }[]} */
  const rows = page.keys.map((k, i) => ({
    rank: i + 1,
    name: k.metadata?.h === true ? 'Anônimo' : cleanName(k.metadata?.n),
    score: Number(k.metadata?.s) || 0,
    me: !!saveId && k.name.endsWith(`:${saveId}`),
  }));
  // Quem recebe prêmio de verdade (1..N entre os NÃO simulados): o rótulo "#4" com o 1º pago deixa de existir (QA beta3 R10).
  if (pagoPor(game)) {
    let p = 0;
    page.keys.forEach((k, i) => { if (!simRow(k) && p < pagoPor(game)) rows[i].prizePlace = ++p; });
  }

  let me = null;
  if (saveId) {
    const raw = await store.get(meKey(game, pk, saveId));
    const best = raw === null || raw === undefined ? null : Number(raw);
    if (best !== null && Number.isFinite(best)) {
      me = { score: best, tier: isLowerBetter(game) ? null : tierFor(game, best), rank: await rankOf(store, prefix, scoreKey(game, pk, best, saveId)) };
    }
  }
  return { game, period, periodKey: pk, top: rows, me };
}

/** Posição (1-based) da chave no placar; `null` se passar da janela varrida. */
async function rankOf(store, prefix, key) {
  let seen = 0;
  let cursor;
  for (let p = 0; p < RANK_SCAN_PAGES; p++) {
    const page = await store.list({ prefix, limit: 1000, ...(cursor ? { cursor } : {}) });
    const idx = page.keys.findIndex(k => k.name === key);
    if (idx >= 0) return seen + idx + 1;
    seen += page.keys.length;
    if (page.list_complete || !page.cursor) return null;
    cursor = page.cursor;
  }
  return null;
}

/**
 * Quem RECEBE prêmio: as `n` primeiras colocações **sem** contar os `simulated`
 * (aparecem no ranking, mas nunca ocupam vaga paga — o prêmio desce para o
 * próximo jogador real). `entries` já em ordem de ranking.
 */
export function payablePlacements(entries, n) {
  const out = [];
  for (const e of entries ?? []) {
    if (out.length >= n) break;
    if (e?.simulated === true || e?.sim === true) continue;
    // Rede de segurança do M11: o id estável dos simulados (`sim_NNNN`, `_simulados.data.js`) nunca recebe prêmio,
    // mesmo se o `metadata.sim` do placar faltar.
    if (typeof e?.saveId === 'string' && /^sim_[0-9]{4}$/.test(e.saveId)) continue;
    out.push(e);
  }
  return out;
}
