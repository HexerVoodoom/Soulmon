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

/**
 * Custos (espelho de `HEX_COSTS` em `src/utils/hexsmith.ts`; `hexsmith.parity.test.js` compara). `potions` = poções do PRÓPRIO
 * elemento do item (chave `potion:<elemento>` em `foodInventory`); `fragments` = `equipment.fragments`; `bits` = `gamePoints`.
 */
export const HEX_COSTS = {
  element: { potions: 3, bits: 1500, fragments: 0 },
  coroa: { potions: 0, bits: 2000, fragments: 20 },
  luvas: { potions: 0, bits: 500, fragments: 5 },
};

/** @param {string} id @returns {{ potions: number, potionElement?: string, bits: number, fragments: number } | undefined} */
export function hexCost(id) {
  const it = parseHexItem(id);
  if (!it) return undefined;
  if (HEX_ELEMENT_SLOTS.includes(it.slot)) return { ...HEX_COSTS.element, potionElement: it.value };
  return { ...(it.slot === 'coroa' ? HEX_COSTS.coroa : HEX_COSTS.luvas) };
}

/** @param {unknown} v */
const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

/**
 * A FORJA no servidor (REGISTRO §216, ação `POST /api/save?id=&action=hexForge`): lê o save GRAVADO, confere o saldo com `HEX_COSTS`
 * (poções do elemento, `equipment.fragments`, Bits GANHOS = `gamePoints` menos o `bitsOrigin.paidLeft`), debita e entrega o item.
 * Espelho de `forgeHexItem` (`src/utils/hexsmith.ts`; `hexsmith.parity.test.js` compara). Item já possuído = `already`, sem cobrança.
 * @param {Record<string, any>} stored  o state gravado
 * @param {unknown} itemId
 * @returns {{ ok: true, already: boolean, state: Record<string, any> } | { ok: false, reason: 'invalid' | 'potions' | 'fragments' | 'bits' }}
 */
export function forgeOnServer(stored, itemId) {
  const c = typeof itemId === 'string' ? hexCost(itemId) : undefined;
  if (!c) return { ok: false, reason: 'invalid' };
  const id = /** @type {string} */ (itemId);
  const hx = sanitizeHexsmith(stored.hexsmith);
  if (hx.owned.includes(id)) return { ok: true, already: true, state: stored };
  if (hx.owned.length >= HEX_MAX_OWNED) return { ok: false, reason: 'invalid' };
  const food = stored.foodInventory && typeof stored.foodInventory === 'object' && !Array.isArray(stored.foodInventory) ? stored.foodInventory : {};
  const k = c.potionElement ? `potion:${c.potionElement}` : '';
  if (c.potions > 0 && num(food[k]) < c.potions) return { ok: false, reason: 'potions' };
  const frag = num(stored.equipment?.fragments);
  if (c.fragments > 0 && frag < c.fragments) return { ok: false, reason: 'fragments' };
  const gp = num(stored.gamePoints);
  const paidLeft = num(stored.bitsOrigin?.paidLeft);
  if (c.bits > 0 && Math.max(0, gp - Math.min(gp, paidLeft)) < c.bits) return { ok: false, reason: 'bits' };
  const next = { ...stored };
  if (c.potions > 0) {
    const foodInventory = { ...food, [k]: num(food[k]) - c.potions };
    if (foodInventory[k] <= 0) delete foodInventory[k];
    next.foodInventory = foodInventory;
  }
  if (c.fragments > 0) next.equipment = { ...stored.equipment, fragments: frag - c.fragments };
  if (c.bits > 0) {
    next.gamePoints = gp - c.bits;
    // = `spendBits` -> `spendBitsPaidFirst` do cliente: o Bit pago sai primeiro e nunca fica acima do saldo.
    if (stored.bitsOrigin && typeof stored.bitsOrigin === 'object') {
      const left = Math.min(Math.max(0, paidLeft - c.bits), next.gamePoints);
      if (left !== paidLeft) next.bitsOrigin = { ...stored.bitsOrigin, paidLeft: left };
    }
  }
  const slot = /** @type {{ slot: string }} */ (parseHexItem(id)).slot;
  const equipped = hx.equipped[slot] ? hx.equipped : { ...hx.equipped, [slot]: id };
  next.hexsmith = { owned: [...hx.owned, id], equipped };
  return { ok: true, already: false, state: next };
}

/**
 * POSSE DE HEX vem só do servidor (REGISTRO §216): no POST do save, `owned` = o do save GRAVADO (o cliente não acrescenta nem tira);
 * o `equipped` do cliente vale, desde que seja de item possuído no slot certo. Campo ausente no recebido = o gravado inteiro.
 * Sem save gravado, a posse é vazia.
 * @param {unknown} incomingHex  `state.hexsmith` recebido (ou undefined, se o campo não veio)
 * @param {Record<string, any> | undefined} stored
 * @returns {{ owned: string[], equipped: Record<string, string> }}
 */
export function enforceStoredHexOwned(incomingHex, stored) {
  const sto = sanitizeHexsmith(stored?.hexsmith);
  const inc = incomingHex && typeof incomingHex === 'object' ? /** @type {Record<string, unknown>} */ (incomingHex) : undefined;
  return sanitizeHexsmith({ owned: sto.owned, equipped: inc ? inc.equipped : sto.equipped });
}
