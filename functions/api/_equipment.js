/**
 * Espelho de `src/utils/equipment.ts` (Combate v3 / PR8), so a parte que o SERVIDOR usa: sanear o campo `equipment` do save
 * (item fora do catalogo, slot forjado, posse repetida, fragmentos absurdos sao DESCARTADOS peca a peca) e dar a parcela de
 * EQUIPAMENTO do canal de bonus do duelo. Pages Functions nao importam de `src/`: o catalogo e copiado e travado por
 * `equipment.parity.test.js`. O servidor nunca confia no cliente: o bonus e recalculado do save, e o teto de 5% (`combinedAttrBonus`)
 * limita o que um save forjado rende. Limite honesto: a POSSE e escrita pelo cliente (a economia e local-first), entao o servidor
 * garante a FORMA e o teto, nao a procedencia dos Bits.
 */

import { ownedPieceBonus } from './_forge.js';

export const EQUIP_SLOTS = ['nucleo', 'carapaca', 'rastro'];
export const SLOT_ATTR = { nucleo: 'atk', carapaca: 'def', rastro: 'spd' };
export const TIER_PCT = [0.005, 0.01, 0.015];
export const FRAGMENTS_MAX = 999;

/** id -> { slot, pct }. @type {Readonly<Record<string, { slot: string, pct: number }>>} */
export const EQUIP = Object.fromEntries(
  EQUIP_SLOTS.flatMap((slot) => [1, 2, 3].map((tier) => [`eq-${slot}-t${tier}`, { slot, pct: TIER_PCT[tier - 1] }])),
);

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/**
 * @param {unknown} raw
 * @returns {{ owned: string[], equipped: Record<string, string>, fragments: number }}
 */
export function sanitizeEquipment(raw) {
  if (!raw || typeof raw !== 'object') return { owned: [], equipped: {}, fragments: 0 };
  const r = /** @type {Record<string, unknown>} */ (raw);
  /** @type {string[]} */
  const seen = [];
  if (Array.isArray(r.owned)) {
    for (const id of r.owned) if (typeof id === 'string' && has(EQUIP, id) && !seen.includes(id)) seen.push(id);
  }
  // Espelho do cliente: UMA peca por tipo (fica o tier mais alto) e ela esta sempre equipada.
  /** @type {Record<string, string>} */
  const best = {};
  for (const id of seen) {
    const slot = EQUIP[id].slot;
    if (!best[slot] || Number(best[slot].slice(-1)) < Number(id.slice(-1))) best[slot] = id;
  }
  const owned = seen.filter((id) => best[EQUIP[id].slot] === id);
  /** @type {Record<string, string>} */
  const equipped = {};
  for (const slot of EQUIP_SLOTS) if (best[slot]) equipped[slot] = best[slot];
  const f = typeof r.fragments === 'number' && Number.isFinite(r.fragments) ? Math.floor(r.fragments) : 0;
  return { owned, equipped, fragments: Math.min(FRAGMENTS_MAX, Math.max(0, f)) };
}

/**
 * Parcela do EQUIPAMENTO por atributo (fracoes). Slot forjado vale 0. Quem soma e corta nos 5% e `combinedAttrBonus`.
 * Desde o Ferreiro (07/10/2026) o valor da peca vem do NIVEL e das escolhas (`forge`, `_forge.js`), nao do tier.
 * @param {unknown} raw @param {unknown} [forge] @returns {{ atk: number, def: number, spd: number }}
 */
export function equipAttrBonus(raw, forge) {
  const eq = sanitizeEquipment(raw);
  const out = { atk: 0, def: 0, spd: 0 };
  for (const slot of EQUIP_SLOTS) {
    const id = eq.equipped[slot];
    if (!id) continue;
    const b = ownedPieceBonus(id, forge);
    out.atk += b.atk; out.def += b.def; out.spd += b.spd;
  }
  return out;
}

const fin = (n) => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.min(1e9, Math.floor(n)) : 0);

/**
 * Forma do registro de procedencia dos Bits (`src/utils/bitsOrigin.ts`): so a FORMA e o clamp (a regra e do cliente).
 * Sem `day` valido = descartado (`undefined`).
 * @param {unknown} raw @returns {{ day: string, free: number, fromCredits: number, paidLeft: number } | undefined}
 */
export function sanitizeBitsOrigin(raw) {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = /** @type {Record<string, unknown>} */ (raw);
  if (typeof o.day !== 'string' || o.day.length === 0 || o.day.length > 40) return undefined;
  return { day: o.day, free: fin(o.free), fromCredits: fin(o.fromCredits), paidLeft: fin(o.paidLeft) };
}
