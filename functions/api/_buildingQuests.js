/**
 * Espelho de `src/utils/buildingQuests.ts` (missao por predio + materiais, 07/10/2026), so a parte que o SERVIDOR usa:
 * sanear o campo `buildingQuests` do save. Lista FECHADA de materiais, estoque inteiro em 0..MATERIAL_CAP, ids de predio
 * so com o formato `<area>.<lote>` de areas fora do Mercado, sem repeticao. Pages Functions nao importam de `src/`: as
 * constantes sao copiadas e travadas por `buildingQuests.parity.test.js`. Limite honesto: o ESTOQUE e escrito pelo cliente
 * (economia local-first, sem dinheiro real, sem sorteio); o servidor garante a FORMA e o teto, nao a procedencia.
 */

export const MATERIAL_CAP = 99;
export const MATERIAL_IDS = [
  'spark', 'moss', 'prism', 'pebble', 'ore', 'ink', 'gear', 'fang',
  'laurel', 'ribbon', 'essence', 'down', 'cipher', 'page', 'keepsake', 'crest',
];
const BUILDING_RE = /^(jogos|exploracao|arena|laboratorio|hall)\.[a-z]{1,24}$/;
const MAX_LIST = 20;
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/** @param {unknown} v @returns {string[]} */
function ids(v) {
  /** @type {string[]} */
  const out = [];
  if (Array.isArray(v)) {
    for (const x of v) {
      if (out.length >= MAX_LIST) break;
      if (typeof x === 'string' && BUILDING_RE.test(x) && !out.includes(x)) out.push(x);
    }
  }
  return out;
}

/** @param {unknown} raw @returns {{ day: string, visited: string[], claimed: string[], materials: Record<string, number> } | undefined} */
export function sanitizeBuildingQuests(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = /** @type {Record<string, unknown>} */ (raw);
  if (typeof r.day !== 'string' || r.day.length === 0 || r.day.length > 40) return undefined;
  const m = r.materials && typeof r.materials === 'object' && !Array.isArray(r.materials) ? /** @type {Record<string, unknown>} */ (r.materials) : {};
  /** @type {Record<string, number>} */
  const materials = {};
  for (const id of MATERIAL_IDS) {
    const v = has(m, id) ? m[id] : undefined;
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) materials[id] = Math.min(MATERIAL_CAP, Math.floor(v));
  }
  const visited = ids(r.visited);
  const claimed = ids(r.claimed);
  for (const c of claimed) if (!visited.includes(c)) visited.push(c);
  return { day: r.day, visited, claimed, materials };
}
