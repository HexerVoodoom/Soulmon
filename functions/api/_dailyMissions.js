/**
 * Espelho de `src/utils/dailyMissions.ts` (missoes diarias dos outros recursos e primeiras vezes, 14/10/2026, REGISTRO secao 53), so a
 * parte que o SERVIDOR usa: sanear `dailyMissions` e `firstTimes` do save. Listas FECHADAS de eventos e de ids, contagem inteira
 * 0..99, sem repeticao. Pages Functions nao importam de `src/`: as constantes sao copiadas e travadas por
 * `dailyMissions.parity.test.js`. Limite honesto: as contagens sao escritas pelo cliente (economia local-first, sem dinheiro real);
 * o servidor garante a FORMA e o teto, nao a procedencia.
 */

export const DAILY_COUNT_CAP = 99;
export const DAILY_EVENTS = [
  'dino', 'ppt', 'match3', 'foco', 'masmorra', 'banho', 'carinho', 'brincar',
  'comida', 'humor', 'sono', 'mercado', 'amigo', 'arena', 'torneio',
];
export const DAILY_MISSION_IDS = [
  'd-dino', 'd-ppt', 'd-match3', 'd-foco', 'd-masmorra', 'd-banho', 'd-carinho', 'd-brincar',
  'd-comida', 'd-humor', 'd-sono', 'd-mercado', 'd-amigo', 'd-arena', 'd-torneio',
];
export const FIRST_TIME_IDS = [
  'first-minigame', 'first-focus', 'first-stroll', 'first-dungeon',
  'visit:mercado.itens', 'visit:mercado.conquistas', 'visit:mercado.decoracao', 'visit:mercado.background', 'visit:mercado.ferreiro',
  'visit:jogos.salao', 'visit:jogos.refugio', 'visit:jogos.mente',
  'visit:exploracao.passeio', 'visit:exploracao.masmorra', 'visit:exploracao.caderno', 'visit:exploracao.oficina',
  'visit:arena.duelo', 'visit:arena.torneio',
  'visit:laboratorio.evolucao', 'visit:laboratorio.pet', 'visit:laboratorio.stats',
  'visit:hall.biblioteca', 'visit:hall.amigos', 'visit:hall.guilda', 'visit:hall.feira',
];
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/** @param {unknown} raw */
export function sanitizeDailyMissions(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = /** @type {Record<string, unknown>} */ (raw);
  if (typeof r.day !== 'string' || r.day.length === 0 || r.day.length > 40) return undefined;
  const c = r.counts && typeof r.counts === 'object' && !Array.isArray(r.counts) ? /** @type {Record<string, unknown>} */ (r.counts) : {};
  /** @type {Record<string, number>} */
  const counts = {};
  for (const e of DAILY_EVENTS) {
    const v = has(c, e) ? c[e] : undefined;
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) counts[e] = Math.min(DAILY_COUNT_CAP, Math.floor(v));
  }
  const claimed = Array.isArray(r.claimed) ? [...new Set(r.claimed.filter((x) => typeof x === 'string' && DAILY_MISSION_IDS.includes(x)))] : [];
  return { day: r.day, counts, claimed };
}

/** @param {unknown} raw */
export function sanitizeFirstTimes(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = /** @type {Record<string, unknown>} */ (raw);
  /** @param {unknown} v @returns {string[]} */
  const pick = (v) => (Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string' && FIRST_TIME_IDS.includes(x)))] : []);
  const done = pick(r.done);
  const claimed = pick(r.claimed);
  for (const c of claimed) if (!done.includes(c)) done.push(c);
  return { done, claimed };
}
