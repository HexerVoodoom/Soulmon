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
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/**
 * PAGAMENTO dos HEXes no save (01/11/2026, REGISTRO §216). Todo item que entra em `owned` e NAO estava no save gravado precisa ser
 * coberto pela QUEDA, do gravado para o recebido, de poções do elemento, fragmentos e Bits (`gamePoints`). A queda é um orçamento
 * consumido item a item, na ordem da lista; item sem cobertura é REVERTIDO (sai da posse e do slot). Recursos não são tocados.
 * Item já possuído no gravado não cobra de novo. Sem save gravado, o orçamento é zero (nenhum HEX nasce de graça).
 * @param {unknown} incomingHex  `state.hexsmith` recebido
 * @param {Record<string, any>} incoming  o state recebido (já saneado: `equipment.fragments` clampado)
 * @param {Record<string, any> | undefined} stored  o state gravado (ou undefined)
 * @returns {{ hexsmith: { owned: string[], equipped: Record<string, string> }, revoked: string[] }}
 */
export function enforceHexPayment(incomingHex, incoming, stored) {
  const hx = sanitizeHexsmith(incomingHex);
  const before = new Set(sanitizeHexsmith(stored?.hexsmith).owned);
  const added = hx.owned.filter((id) => !before.has(id));
  if (!added.length) return { hexsmith: hx, revoked: [] };
  const fIn = incoming?.foodInventory && typeof incoming.foodInventory === 'object' ? incoming.foodInventory : {};
  const fSt = stored?.foodInventory && typeof stored.foodInventory === 'object' ? stored.foodInventory : {};
  /** @type {Record<string, number>} */
  const potionBudget = {};
  let fragBudget = Math.max(0, num(stored?.equipment?.fragments) - num(incoming?.equipment?.fragments));
  let bitsBudget = Math.max(0, num(stored?.gamePoints) - num(incoming?.gamePoints));
  /** @type {string[]} */
  const revoked = [];
  for (const id of added) {
    const c = /** @type {NonNullable<ReturnType<typeof hexCost>>} */ (hexCost(id));
    const k = c.potionElement ? `potion:${c.potionElement}` : '';
    if (k && !(k in potionBudget)) potionBudget[k] = Math.max(0, num(fSt[k]) - num(fIn[k]));
    const ok = (!c.potions || potionBudget[k] >= c.potions) && fragBudget >= c.fragments && bitsBudget >= c.bits;
    if (!ok) { revoked.push(id); continue; }
    if (c.potions) potionBudget[k] -= c.potions;
    fragBudget -= c.fragments;
    bitsBudget -= c.bits;
  }
  if (!revoked.length) return { hexsmith: hx, revoked };
  const owned = hx.owned.filter((id) => !revoked.includes(id));
  return { hexsmith: sanitizeHexsmith({ owned, equipped: hx.equipped }), revoked };
}
