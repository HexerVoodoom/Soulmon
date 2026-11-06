/**
 * HISTÓRICO de temporadas do Torneio por jogador (pedido do dono, 06/11/2026: "Última temporada" + modal com todas).
 *
 * Antes não existia: o servidor só guardava `rank:<season>:<saveId>` (TTL de 120 d) e `rankIndex:<season>`; o único
 * registro de colocação era o troféu do top 3 (`pendingTrophies`, apagado ao resgatar). Agora cada jogador tem
 *   `seasonHist:<saveId>` = `{ v: 1, s: { 'YYYY-MM': { place, points } }, c: ['YYYY-MM', …] }`
 * onde `s` é a colocação FINAL de cada temporada já encerrada em que ele jogou e `c` são as temporadas já conferidas
 * (jogou ou não) — uma temporada encerrada não muda, então nunca é relida.
 *
 * Como o histórico nasce:
 *   · `closeSeason` grava o pódio (1º–3º) na hora (é o único momento em que a season inteira está à mão);
 *   · `seasonHistory` (leitura AUTENTICADA do dono) RECONSTRÓI, a partir do índice `rankIndex:<season>`, as
 *     temporadas encerradas que ainda existem no KV e as grava. A posição sai da mesma régua do `myPlace`
 *     (simulados contam, GM/admin não — `_rankAdmin.js`).
 *
 * LIMITE HONESTO: o KV só guarda a season por ~120 dias após a última partida dela. Temporada mais velha que isso,
 * de quem não abriu o Torneio antes de o dado vencer, NÃO dá para reconstruir (só o pódio, se foi premiado).
 * Daqui em diante, quem abrir o Torneio ao menos uma vez a cada ~4 meses não perde nenhuma.
 */
import { kvOrThrow } from './_kv.js';
import { lerIndice, completarIndice, ordenar } from './_rankIndex.js';
import { adminSaveIds } from './_rankAdmin.js';

const TTL = 86400 * 800;
const histKey = (id) => `seasonHist:${id}`;
const SEASON_RE = /^\d{4}-\d{2}$/;
/** Até quantas temporadas passadas olhar por chamada (o KV guarda ~4 meses; sobra folga). */
export const HIST_LOOKBACK = 6;
/** Orçamento de `get` para completar um índice antigo ainda não preenchido. */
const HIST_FILL_BUDGET = 60;

export function mesAnteriorA(season, n = 1) {
  const [y, m] = season.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 - n, 1)).toISOString().slice(0, 7);
}

export async function lerHist(env, id) {
  const raw = await kvOrThrow(env).get(histKey(id));
  const vazio = { v: 1, s: {}, c: [] };
  if (!raw) return vazio;
  try {
    const o = JSON.parse(raw);
    const s = {};
    if (o && typeof o.s === 'object' && o.s && !Array.isArray(o.s)) {
      for (const [k, v] of Object.entries(o.s)) {
        const place = Number(v?.place);
        if (SEASON_RE.test(k) && Number.isInteger(place) && place >= 1) s[k] = { place, points: Number(v?.points) || 0 };
      }
    }
    const c = Array.isArray(o?.c) ? o.c.filter(x => typeof x === 'string' && SEASON_RE.test(x)) : [];
    return { v: 1, s, c };
  } catch { return vazio; }
}

async function gravarHist(env, id, h) {
  const s = Object.fromEntries(Object.entries(h.s).sort(([a], [b]) => (a < b ? -1 : 1)).slice(-60));
  await kvOrThrow(env).put(histKey(id), JSON.stringify({ v: 1, s, c: h.c.slice(-60) }), { expirationTtl: TTL });
}

/** Grava a colocação final de UMA temporada encerrada (usado pelo `closeSeason` para o pódio). Melhor esforço. */
export async function registrarColocacao(env, id, season, place, points) {
  try {
    const h = await lerHist(env, id);
    h.s[season] = { place, points: Number(points) || 0 };
    if (!h.c.includes(season)) h.c.push(season);
    await gravarHist(env, id, h);
  } catch (err) {
    console.warn(JSON.stringify({ event: 'seasonHist.write.failed', season, err: String(err?.message ?? err).slice(0, 80) }));
  }
}

/** Colocação de `id` num índice COMPLETO, sem GM/admin. `null` = não jogou. */
function colocacao(indice, id, admins) {
  const ordem = ordenar(indice.p).filter(r => !admins.has(r.owner));
  const i = ordem.findIndex(r => r.owner === id);
  return i < 0 ? null : { place: i + 1, points: ordem[i].points };
}

/**
 * Histórico do jogador: lê, reconstrói o que falta (temporadas encerradas ainda no KV) e devolve
 * `{ seasons: [{season, place, points}] (mais recente primeiro), best, last, lastSeason }`.
 * GM/admin recebem a lista vazia (não participam do ranking).
 */
export async function historicoDoJogador(env, id, currentSeason) {
  const admins = await adminSaveIds(env);
  const ultima = mesAnteriorA(currentSeason);
  if (admins.has(id)) return { seasons: [], best: null, last: null, lastSeason: ultima, excluded: true };
  const h = await lerHist(env, id);
  let mudou = false;
  for (let n = 1; n <= HIST_LOOKBACK; n++) {
    const season = mesAnteriorA(currentSeason, n);
    if (h.c.includes(season) || season in h.s) continue;
    let indice = await lerIndice(env, season);
    // Índice ausente ou ainda em preenchimento: avança um lote a partir das linhas `rank:` (sem linha nenhuma, fica vazio e `done`).
    if (!indice.done) { const c = await completarIndice(env, season, HIST_FILL_BUDGET); indice = { ...indice, p: c.p, done: c.done }; }
    if (!indice.done) continue; // ainda incompleto: confere na próxima chamada, nunca grava meia-verdade
    const c = colocacao(indice, id, admins);
    if (c) h.s[season] = c;
    h.c.push(season);
    mudou = true;
  }
  if (mudou) await gravarHist(env, id, h);
  const seasons = Object.entries(h.s)
    .map(([season, v]) => ({ season, place: v.place, points: v.points }))
    .sort((a, b) => (a.season < b.season ? 1 : -1));
  let best = null;
  for (const s of seasons) if (!best || s.place < best.place) best = { season: s.season, place: s.place };
  const last = seasons.find(s => s.season === ultima) ?? null;
  return { seasons, best, last, lastSeason: ultima };
}
