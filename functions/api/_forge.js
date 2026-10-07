/**
 * Espelho de `src/utils/forge.ts` (O Ferreiro, 07/10/2026), so a parte que o SERVIDOR usa: sanear o campo `forge` do save (peca fora
 * da lista, nivel fora de 1..5, escolha que nao seja 'a'|'b' sao DESCARTADOS) e dar o bonus de UMA peca por atributo. Pages Functions
 * nao importam de `src/`: as tabelas sao copiadas e travadas por `forge.parity.test.js`. O servidor nunca confia no cliente: o bonus e
 * recalculado do save, cada peca vale no maximo `PIECE_MAX_PCT` (1,5%) e o teto UNICO de 5% (`combinedAttrBonus`) limita o conjunto.
 * Limite honesto: o nivel e escrito pelo cliente (economia local-first) — o servidor garante a FORMA e o teto, nao a procedencia dos
 * materiais.
 */

export const FORGE_MAX_LEVEL = 5;
export const LEVEL_PCT = [0.003, 0.002, 0.003, 0.003, 0.004];
export const PIECE_MAX_PCT = 0.015;
export const PRIMARY_ATTR = { nucleo: 'atk', carapaca: 'def', rastro: 'spd' };
export const ALT_ATTR = { nucleo: 'def', carapaca: 'spd', rastro: 'atk' };
export const LEGACY_LEVEL = [2, 4, 5];
export const LEVEL_MIN_BOND = [0, 0, 2, 3, 4, 5];
export const UPGRADE_COST = { 2: [1, 0], 3: [2, 1], 4: [3, 2], 5: [4, 3] };
export const REDO_BITS = 150;
export const REDO_FRAGMENTS = 3;

/** id -> { slot, tier, building, mats }. */
export const FORGE_PIECES = {
  'eq-nucleo-t1': { slot: 'nucleo', tier: 1, building: 'exploracao.masmorra', mats: ['ore', 'gear'] },
  'eq-nucleo-t2': { slot: 'nucleo', tier: 2, building: 'arena.duelo', mats: ['fang', 'ore'] },
  'eq-nucleo-t3': { slot: 'nucleo', tier: 3, building: 'arena.torneio', mats: ['laurel', 'fang'] },
  'eq-carapaca-t1': { slot: 'carapaca', tier: 1, building: 'exploracao.passeio', mats: ['pebble', 'moss'] },
  'eq-carapaca-t2': { slot: 'carapaca', tier: 2, building: 'laboratorio.pet', mats: ['down', 'pebble'] },
  'eq-carapaca-t3': { slot: 'carapaca', tier: 3, building: 'hall.guilda', mats: ['crest', 'down'] },
  'eq-rastro-t1': { slot: 'rastro', tier: 1, building: 'jogos.salao', mats: ['spark', 'moss'] },
  'eq-rastro-t2': { slot: 'rastro', tier: 2, building: 'exploracao.oficina', mats: ['gear', 'spark'] },
  'eq-rastro-t3': { slot: 'rastro', tier: 3, building: 'arena.feira', mats: ['ribbon', 'gear'] },
};

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/**
 * @param {unknown} raw
 * @returns {{ levels: Record<string, number>, picks: Record<string, string[]> }}
 */
export function sanitizeForge(raw) {
  const empty = { levels: {}, picks: {} };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return empty;
  const r = /** @type {Record<string, unknown>} */ (raw);
  const lv = r.levels && typeof r.levels === 'object' && !Array.isArray(r.levels) ? /** @type {Record<string, unknown>} */ (r.levels) : {};
  const pk = r.picks && typeof r.picks === 'object' && !Array.isArray(r.picks) ? /** @type {Record<string, unknown>} */ (r.picks) : {};
  /** @type {Record<string, number>} */ const levels = {};
  /** @type {Record<string, string[]>} */ const picks = {};
  for (const id of Object.keys(FORGE_PIECES)) {
    const v = has(lv, id) ? lv[id] : undefined;
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    const level = Math.min(FORGE_MAX_LEVEL, Math.max(1, Math.floor(v)));
    levels[id] = level;
    const arr = has(pk, id) && Array.isArray(pk[id]) ? /** @type {unknown[]} */ (pk[id]) : [];
    const list = [];
    for (let i = 0; i < level - 1; i++) list.push(arr[i] === 'b' ? 'b' : 'a');
    if (list.includes('b')) picks[id] = list;
  }
  return Object.keys(levels).length === 0 ? empty : { levels, picks };
}

/**
 * Bonus (fracoes) de uma peca POSSUIDA: o nivel registrado, ou o equivalente do tier (peca comprada antes do Ferreiro).
 * @param {string} id @param {unknown} forge @returns {{ atk: number, def: number, spd: number }}
 */
export function ownedPieceBonus(id, forge) {
  const out = { atk: 0, def: 0, spd: 0 };
  if (!has(FORGE_PIECES, id)) return out;
  const piece = FORGE_PIECES[id];
  const f = sanitizeForge(forge);
  const level = has(f.levels, id) ? f.levels[id] : LEGACY_LEVEL[piece.tier - 1];
  const saved = has(f.picks, id) ? f.picks[id] : [];
  const main = PRIMARY_ATTR[piece.slot];
  out[main] += LEVEL_PCT[0];
  for (let k = 2; k <= Math.min(FORGE_MAX_LEVEL, level); k++) out[saved[k - 2] === 'b' ? ALT_ATTR[piece.slot] : main] += LEVEL_PCT[k - 1];
  return out;
}
