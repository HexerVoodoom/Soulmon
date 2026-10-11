/**
 * Espelho de `src/utils/forge.ts` (O Soulsmith, 07/10/2026), so a parte que o SERVIDOR usa: sanear o campo `forge` do save (peca fora
 * da lista, nivel fora de 1..5, escolha que nao seja 'a'|'b' sao DESCARTADOS) e dar o bonus de UMA peca por atributo. Pages Functions
 * nao importam de `src/`: as tabelas sao copiadas e travadas por `forge.parity.test.js`. O servidor nunca confia no cliente: o bonus e
 * recalculado do save, cada peca vale no maximo `PIECE_MAX_PCT` (1,5%) e o teto UNICO de 5% (`combinedAttrBonus`) limita o conjunto.
 * Limite honesto: o nivel e escrito pelo cliente (economia local-first) — o servidor garante a FORMA e o teto, nao a procedencia dos
 * materiais.
 */

export const FORGE_MAX_LEVEL = 15;
/** Versao do esquema persistido (`forge.v`): sem ela o registro e o esquema antigo de 5 niveis, convertido na leitura (11/10/2026). */
export const FORGE_SCHEMA = 2;
export const LEVEL_PCT = Array.from({ length: FORGE_MAX_LEVEL }, () => 0.001);
export const PIECE_MAX_PCT = 0.015;
export const PRIMARY_ATTR = { nucleo: 'atk', carapaca: 'def', rastro: 'spd' };
export const ALT_ATTR = { nucleo: 'def', carapaca: 'spd', rastro: 'atk' };
export const LEGACY_LEVEL = [5, 11, 15];
export const LEVEL_MIN_BOND = [0, 0, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 9, 10];
export const UPGRADE_COST = {
  2: [2, 0], 3: [3, 1], 4: [3, 1], 5: [4, 2], 6: [5, 2], 7: [5, 3], 8: [6, 3], 9: [7, 4],
  10: [8, 5], 11: [9, 5], 12: [10, 6], 13: [11, 7], 14: [12, 8], 15: [13, 9],
};
/** Nivel novo que carrega o MESMO bonus de cada nivel do esquema antigo (indice = nivel antigo - 1) e quantos niveis novos cada um cobre. */
export const OLD_LEVEL_TO_NEW = [3, 5, 8, 11, 15];
const OLD_LEVEL_SPAN = [3, 2, 3, 3, 4];
export const REDO_BITS = 150;
export const REDO_FRAGMENTS = 3;

/** id -> { slot, tier }. O predio de origem e os materiais sao so do cliente (o servidor nao concede nem debita: valida a FORMA e o teto). */
export const FORGE_PIECES = {
  'eq-nucleo-t1': { slot: 'nucleo', tier: 1 },
  'eq-nucleo-t2': { slot: 'nucleo', tier: 2 },
  'eq-nucleo-t3': { slot: 'nucleo', tier: 3 },
  'eq-carapaca-t1': { slot: 'carapaca', tier: 1 },
  'eq-carapaca-t2': { slot: 'carapaca', tier: 2 },
  'eq-carapaca-t3': { slot: 'carapaca', tier: 3 },
  'eq-rastro-t1': { slot: 'rastro', tier: 1 },
  'eq-rastro-t2': { slot: 'rastro', tier: 2 },
  'eq-rastro-t3': { slot: 'rastro', tier: 3 },
};

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/**
 * Higieniza o campo `forge`. Registro SEM `v: 2` = esquema antigo de 5 niveis: nivel e escolhas sao convertidos para o nivel novo de
 * MESMO bonus (espelho exato de `sanitizeForge` em `src/utils/forge.ts`). Idempotente.
 * @param {unknown} raw
 * @returns {{ v?: number, levels: Record<string, number>, picks: Record<string, string[]> }}
 */
export function sanitizeForge(raw) {
  const empty = { levels: {}, picks: {} };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return empty;
  const r = /** @type {Record<string, unknown>} */ (raw);
  const legacy = r.v !== FORGE_SCHEMA;
  const lv = r.levels && typeof r.levels === 'object' && !Array.isArray(r.levels) ? /** @type {Record<string, unknown>} */ (r.levels) : {};
  const pk = r.picks && typeof r.picks === 'object' && !Array.isArray(r.picks) ? /** @type {Record<string, unknown>} */ (r.picks) : {};
  /** @type {Record<string, number>} */ const levels = {};
  /** @type {Record<string, string[]>} */ const picks = {};
  for (const id of Object.keys(FORGE_PIECES)) {
    const v = has(lv, id) ? lv[id] : undefined;
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    const arr = has(pk, id) && Array.isArray(pk[id]) ? /** @type {unknown[]} */ (pk[id]) : [];
    if (legacy) {
      const old = Math.min(OLD_LEVEL_TO_NEW.length, Math.max(1, Math.floor(v)));
      /** @type {string[]} */ const list = [];
      for (let k = 1; k <= old; k++) {
        const c = k >= 2 && arr[k - 2] === 'b' ? 'b' : 'a';
        const span = OLD_LEVEL_SPAN[k - 1] - (k === 1 ? 1 : 0);
        for (let i = 0; i < span; i++) list.push(c);
      }
      levels[id] = OLD_LEVEL_TO_NEW[old - 1];
      if (list.includes('b')) picks[id] = list;
      continue;
    }
    const level = Math.min(FORGE_MAX_LEVEL, Math.max(1, Math.floor(v)));
    levels[id] = level;
    const list = [];
    for (let i = 0; i < level - 1; i++) list.push(arr[i] === 'b' ? 'b' : 'a');
    if (list.includes('b')) picks[id] = list;
  }
  return Object.keys(levels).length === 0 ? empty : { v: FORGE_SCHEMA, levels, picks };
}

/**
 * Bonus (fracoes) de uma peca POSSUIDA: o nivel registrado (ja convertido), ou o equivalente do tier (peca comprada antes do Soulsmith).
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
  // Espelho: 15 somas de 0,001 dao 0,015000000000000006 em ponto flutuante — arredonda a 1e-9.
  out.atk = Math.round(out.atk * 1e9) / 1e9; out.def = Math.round(out.def * 1e9) / 1e9; out.spd = Math.round(out.spd * 1e9) / 1e9;
  return out;
}
