/**
 * Espelho de `src/utils/talents.ts` (Combate v3 / PR7), so a parte que o SERVIDOR usa: validar o
 * vetor `talentPicks` do save e dar a parcela de talento do canal de bonus do duelo.
 * Pages Functions nao importam de `src/`: o catalogo e copiado e travado por `talents.parity.test.js`.
 * Vetor invalido e DESCARTADO (`[]`), nunca corrigido; o servidor nunca confia no cliente.
 */

export const TALENT_POINTS_MAX = 20;

/**
 * id -> grau maximo e efeito, so dos nos PEGAVEIS (os `pendente` nao se compram).
 * @type {Readonly<Record<string, { maxRank: number, kind: 'combatBonus' | 'respecDiscount', scope?: 'pvp' | 'pve', perRank: number }>>}
 */
export const PICKABLE = {
  'tal-pvp-01': { maxRank: 4, kind: 'combatBonus', scope: 'pvp', perRank: 0.004 },
  'tal-pvp-02': { maxRank: 4, kind: 'combatBonus', scope: 'pvp', perRank: 0.004 },
  'tal-pvp-03': { maxRank: 4, kind: 'combatBonus', scope: 'pvp', perRank: 0.004 },
  'tal-pve-01': { maxRank: 4, kind: 'combatBonus', scope: 'pve', perRank: 0.006 },
  'tal-pve-02': { maxRank: 4, kind: 'combatBonus', scope: 'pve', perRank: 0.006 },
  'tal-com-03': { maxRank: 4, kind: 'respecDiscount', perRank: 0.1 },
};

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/** @param {unknown} bondLevel */
export function talentPointsFor(bondLevel) {
  const lvl = typeof bondLevel === 'number' && Number.isFinite(bondLevel) ? Math.max(1, Math.floor(bondLevel)) : 1;
  return Math.min(TALENT_POINTS_MAX, lvl);
}

/** @param {unknown} raw @param {unknown} bondLevel @returns {raw is string[]} */
export function isValidPicks(raw, bondLevel) {
  if (!Array.isArray(raw)) return false;
  if (raw.length > talentPointsFor(bondLevel)) return false;
  /** @type {Record<string, number>} */
  const counts = Object.create(null);
  for (const id of raw) {
    if (typeof id !== 'string' || !has(PICKABLE, id)) return false;
    counts[id] = (counts[id] ?? 0) + 1;
    if (counts[id] > PICKABLE[id].maxRank) return false;
  }
  return true;
}

/**
 * Descarta (nao corrige) o vetor invalido.
 * @param {unknown} raw @param {unknown} bondLevel @returns {string[]}
 */
export function sanitizeTalentPicks(raw, bondLevel) {
  return isValidPicks(raw, bondLevel) ? [...raw] : [];
}

/**
 * Parcela do TALENTO no canal de bonus (fracao), para o escopo. Invalido para o Vinculo = 0.
 * Quem soma com as outras fontes e corta nos 5% e `combinedBonus` (`_combate.js`).
 * @param {unknown} picks @param {unknown} bondLevel @param {'pvp' | 'pve'} scope
 */
export function talentBonus(picks, bondLevel, scope) {
  if (!isValidPicks(picks, bondLevel)) return 0;
  let sum = 0;
  for (const id of picks) {
    const n = PICKABLE[id];
    if (n.kind === 'combatBonus' && n.scope === scope) sum += n.perRank;
  }
  return sum;
}
