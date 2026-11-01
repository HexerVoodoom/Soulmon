/**
 * A HEXSMITH no servidor (01/11/2026): espelho de `src/utils/hexsmith.ts` — o saneamento do campo `hexsmith` do save e o que o
 * equipado REESCREVE no Soulmon (lido pelo duelo, `_duel.js`). Os itens nao dao % de atributo: so trocam elemento/familia/forma.
 * As Pages Functions nao importam de `src/`; `hexsmith.parity.test.js` trava as duas copias.
 */
import { COUNTER_RING, BASE_DO_PAR } from './_elementoBase.js';
import { SPECIAL_FAMILIES } from './_combate.js';

export const HEX_SLOTS = ['coroa', 'amuleto', 'garra', 'couraca', 'luvas'];
export const HEX_ELEMENT_SLOTS = ['amuleto', 'garra', 'couraca'];
export const HEX_STRIKES = ['ranged', 'melee'];
export const HEX_MAX_OWNED = 3 * 210 + 7 + 2;

const ELEMENT_IDS = new Set([...COUNTER_RING, ...Object.keys(BASE_DO_PAR)]);

/** @param {unknown} id @returns {{ slot: string, value: string } | undefined} */
export function parseHexItem(id) {
  if (typeof id !== 'string') return undefined;
  const i = id.indexOf(':');
  if (i < 1) return undefined;
  const slot = id.slice(0, i);
  const value = id.slice(i + 1);
  if (!HEX_SLOTS.includes(slot)) return undefined;
  if (HEX_ELEMENT_SLOTS.includes(slot)) return ELEMENT_IDS.has(value) ? { slot, value } : undefined;
  if (slot === 'coroa') return /** @type {readonly string[]} */ (SPECIAL_FAMILIES).includes(value) ? { slot, value } : undefined;
  return HEX_STRIKES.includes(value) ? { slot, value } : undefined;
}

/** @param {unknown} raw @returns {{ owned: string[], equipped: Record<string, string> }} */
export function sanitizeHexsmith(raw) {
  if (!raw || typeof raw !== 'object') return { owned: [], equipped: {} };
  const r = /** @type {Record<string, unknown>} */ (raw);
  /** @type {string[]} */
  const owned = [];
  if (Array.isArray(r.owned)) {
    for (const id of r.owned) {
      if (owned.length >= HEX_MAX_OWNED) break;
      if (parseHexItem(id) && !owned.includes(id)) owned.push(id);
    }
  }
  /** @type {Record<string, string>} */
  const equipped = {};
  const eq = r.equipped && typeof r.equipped === 'object' ? /** @type {Record<string, unknown>} */ (r.equipped) : {};
  for (const slot of HEX_SLOTS) {
    const id = eq[slot];
    if (typeof id === 'string' && owned.includes(id) && parseHexItem(id)?.slot === slot) equipped[slot] = id;
  }
  return { owned, equipped };
}

/**
 * O que o equipado reescreve. Campo ausente = o codigo original vale.
 * @param {unknown} raw
 * @returns {{ specialFamily?: string, specialElement?: string, basicElement?: string, defenseElement?: string, strike?: string }}
 */
export function hexOverrides(raw) {
  const { equipped } = sanitizeHexsmith(raw);
  /** @param {string} slot */
  const v = (slot) => (equipped[slot] ? parseHexItem(equipped[slot])?.value : undefined);
  /** @type {Record<string, string>} */
  const out = {};
  const pairs = [['coroa', 'specialFamily'], ['amuleto', 'specialElement'], ['garra', 'basicElement'], ['couraca', 'defenseElement'], ['luvas', 'strike']];
  for (const [slot, key] of pairs) { const x = v(slot); if (x) out[key] = x; }
  return out;
}
