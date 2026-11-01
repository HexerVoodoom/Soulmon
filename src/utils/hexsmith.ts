/**
 * A HEXSMITH (01/11/2026, pedido do dono) — dono único das regras dos itens que REESCREVEM o "código hex" do Soulmon.
 * Ela fica na Forja (lote `forja:hexsmith`). A tela é `components/hex/HexsmithSheet.tsx`; os textos, `hexsmithCopy.ts`.
 *
 * Decisões do dono (01/11/2026):
 *  · CINCO slots ao redor do Soulmon, um por efeito ("mapa de slots" de RPG):
 *      coroa   → FAMÍLIA do especial (as 7 de `combate/specials.ts`);
 *      amuleto → ELEMENTO do especial;
 *      garra   → ELEMENTO do ataque básico;
 *      couraca → ELEMENTO do Soulmon na DEFESA (só muda o dano que ele RECEBE);
 *      luvas   → ALCANCE do ataque básico (distância ou corpo a corpo) — SÓ VISUAL, não muda regra.
 *  · Os slots de ELEMENTO aceitam QUALQUER um dos 210 elementos do dex e são pagos com POÇÕES DE ELEMENTO daquele elemento
 *    (`elementPotion.ts` — o "chip" que o Lab de Evolução fabrica com essências). Coroa e luvas pagam com recursos do Soulsmith
 *    (fragmentos da Masmorra) + Bits GANHOS.
 *  · Itens são CAROS, NUNCA se perdem e NÃO podem ser vendidos: posse só cresce. A pessoa pode ter vários; equipa UM por slot.
 *  · Valem em PvE e PvP. Não dão % de atributo (o teto de 5% de `combate/bonus.ts` não é tocado) — só trocam elemento/efeito/forma.
 *  · Sem sorteio, sem Créditos, sem dinheiro real: o Bit que veio de Crédito não paga (`bitsOrigin.ts › earnedBits`), igual ao Soulsmith.
 *
 * Números (PADRÃO da squad, ajustáveis — o dono decide o preço final; ver `docs/PERGUNTAS-DO-DONO.md`): `HEX_COSTS`.
 *
 * Estado persistido: UM objeto, `GameState.hexsmith = { owned, equipped }`. Lixo é descartado item a item (`sanitizeHexsmith`).
 * Módulo PURO: sem React, sem relógio, sem localStorage.
 */
import { ALL_ELEMENT_IDS, isDexElement } from './elementDex';
import { SPECIAL_FAMILIES, type SpecialFamily } from './combate/specials';
import { earnedBits, type BitsOrigin } from './bitsOrigin';
import { spendBits } from './equipment';
import { potionKey } from './elementPotion';
import { baseDominanteDoElemento } from './soulProfile/ficha/elementoNome';
import type { FighterIdentity } from './fighterIdentity';

export type HexSlot = 'coroa' | 'amuleto' | 'garra' | 'couraca' | 'luvas';
export const HEX_SLOTS: readonly HexSlot[] = ['coroa', 'amuleto', 'garra', 'couraca', 'luvas'];
/** Os slots cujo valor é um elemento do dex. */
export const HEX_ELEMENT_SLOTS: readonly HexSlot[] = ['amuleto', 'garra', 'couraca'];
export type HexStrike = 'ranged' | 'melee';
export const HEX_STRIKES: readonly HexStrike[] = ['ranged', 'melee'];

/** Custos padrão (ajustáveis). `potions` = poções do PRÓPRIO elemento do item. */
export const HEX_COSTS = {
  element: { potions: 3, bits: 1500, fragments: 0 },
  coroa: { potions: 0, bits: 2000, fragments: 20 },
  luvas: { potions: 0, bits: 500, fragments: 5 },
} as const;

export interface HexCost { readonly potions: number; readonly potionElement?: string; readonly bits: number; readonly fragments: number }

/** Id do item: `slot:valor` (`garra:fogo`, `coroa:heal`, `luvas:ranged`). */
export const hexItemId = (slot: HexSlot, value: string): string => `${slot}:${value}`;

export function parseHexItem(id: unknown): { slot: HexSlot; value: string } | undefined {
  if (typeof id !== 'string') return undefined;
  const i = id.indexOf(':');
  if (i < 1) return undefined;
  const slot = id.slice(0, i) as HexSlot;
  const value = id.slice(i + 1);
  if (!HEX_SLOTS.includes(slot)) return undefined;
  if (HEX_ELEMENT_SLOTS.includes(slot)) return isDexElement(value) ? { slot, value } : undefined;
  if (slot === 'coroa') return (SPECIAL_FAMILIES as readonly string[]).includes(value) ? { slot, value } : undefined;
  return (HEX_STRIKES as readonly string[]).includes(value) ? { slot, value } : undefined;
}

export const isHexItem = (id: unknown): id is string => parseHexItem(id) !== undefined;

/** Tudo que se pode forjar num slot (os valores, em ordem estável). */
export function hexValuesOf(slot: HexSlot): readonly string[] {
  if (HEX_ELEMENT_SLOTS.includes(slot)) return ALL_ELEMENT_IDS;
  return slot === 'coroa' ? SPECIAL_FAMILIES : HEX_STRIKES;
}

export function hexCost(id: string): HexCost | undefined {
  const it = parseHexItem(id);
  if (!it) return undefined;
  if (HEX_ELEMENT_SLOTS.includes(it.slot)) return { ...HEX_COSTS.element, potionElement: it.value };
  return { ...(it.slot === 'coroa' ? HEX_COSTS.coroa : HEX_COSTS.luvas) };
}

export interface HexsmithState {
  readonly owned: readonly string[];
  readonly equipped: Readonly<Partial<Record<HexSlot, string>>>;
}
export const EMPTY_HEXSMITH: HexsmithState = { owned: [], equipped: {} };
/** Teto de itens no save (sanidade: 3×210 + 7 + 2 = 639 itens possíveis). */
export const HEX_MAX_OWNED = 3 * 210 + 7 + 2;

/** Leitura tolerante: posse só de itens válidos (sem repetir), equipado só se possuído E do slot certo. Nunca lança. */
export function sanitizeHexsmith(raw: unknown): HexsmithState {
  if (!raw || typeof raw !== 'object') return EMPTY_HEXSMITH;
  const r = raw as Record<string, unknown>;
  const owned: string[] = [];
  if (Array.isArray(r.owned)) {
    for (const id of r.owned) {
      if (owned.length >= HEX_MAX_OWNED) break;
      if (isHexItem(id) && !owned.includes(id)) owned.push(id);
    }
  }
  const equipped: Partial<Record<HexSlot, string>> = {};
  const eq = r.equipped && typeof r.equipped === 'object' ? (r.equipped as Record<string, unknown>) : {};
  for (const slot of HEX_SLOTS) {
    const id = eq[slot];
    if (typeof id === 'string' && owned.includes(id) && parseHexItem(id)!.slot === slot) equipped[slot] = id;
  }
  return { owned, equipped };
}

export interface HexForgeState {
  hexsmith?: HexsmithState;
  foodInventory: Record<string, number>;
  gamePoints?: number;
  bitsOrigin?: BitsOrigin;
  equipment?: { owned: readonly string[]; equipped: Readonly<Record<string, string | undefined>>; fragments: number };
}

export type HexRefusal = 'invalid' | 'owned' | 'potions' | 'bits' | 'fragments';

/** Por que não dá para forjar agora (ou `undefined` = dá). A ordem é a da tela: o que falta primeiro. */
export function hexForgeRefusal(state: HexForgeState, id: string): HexRefusal | undefined {
  const cost = hexCost(id);
  if (!cost) return 'invalid';
  if (sanitizeHexsmith(state.hexsmith).owned.includes(id)) return 'owned';
  if (cost.potions > 0 && (state.foodInventory[potionKey(cost.potionElement!)] ?? 0) < cost.potions) return 'potions';
  if (cost.fragments > 0 && (state.equipment?.fragments ?? 0) < cost.fragments) return 'fragments';
  if (cost.bits > 0 && earnedBits(state) < cost.bits) return 'bits';
  return undefined;
}

/** Forja o item: paga tudo de uma vez e o item entra na posse (e vai direto para o slot se o slot estava vazio). Recusa = o MESMO objeto. */
export function forgeHexItem<T extends HexForgeState>(prev: T, id: string): T {
  if (hexForgeRefusal(prev, id)) return prev;
  const cost = hexCost(id)!;
  const hx = sanitizeHexsmith(prev.hexsmith);
  let next: T = prev;
  if (cost.potions > 0) {
    const k = potionKey(cost.potionElement!);
    const foodInventory = { ...prev.foodInventory, [k]: (prev.foodInventory[k] ?? 0) - cost.potions };
    if (foodInventory[k] <= 0) delete foodInventory[k];
    next = { ...next, foodInventory };
  }
  if (cost.fragments > 0) next = { ...next, equipment: { ...next.equipment!, fragments: next.equipment!.fragments - cost.fragments } };
  if (cost.bits > 0) next = spendBits(next, cost.bits);
  const slot = parseHexItem(id)!.slot;
  const equipped = hx.equipped[slot] ? hx.equipped : { ...hx.equipped, [slot]: id };
  return { ...next, hexsmith: { owned: [...hx.owned, id], equipped } };
}

/**
 * Aplica no estado LOCAL a forja que o SERVIDOR já confirmou (REGISTRO §216, `cloudHexForge`): `paid` = o servidor debitou, então
 * o cliente debita o mesmo custo (sem recusar: a verdade é a do servidor; nada fica negativo); `paid: false` = já era seu, só a posse.
 */
export function applyServerHexForge<T extends HexForgeState>(prev: T, id: string, paid: boolean): T {
  const cost = hexCost(id);
  if (!cost) return prev;
  const hx = sanitizeHexsmith(prev.hexsmith);
  if (hx.owned.includes(id)) return prev;
  let next: T = prev;
  if (paid) {
    if (cost.potions > 0) {
      const k = potionKey(cost.potionElement!);
      const foodInventory = { ...prev.foodInventory, [k]: Math.max(0, (prev.foodInventory[k] ?? 0) - cost.potions) };
      if (foodInventory[k] <= 0) delete foodInventory[k];
      next = { ...next, foodInventory };
    }
    if (cost.fragments > 0 && next.equipment) next = { ...next, equipment: { ...next.equipment, fragments: Math.max(0, next.equipment.fragments - cost.fragments) } };
    if (cost.bits > 0) {
      const bal = next.gamePoints ?? 0;
      next = spendBits(next, Math.min(bal, cost.bits));
    }
  }
  const slot = parseHexItem(id)!.slot;
  const equipped = hx.equipped[slot] ? hx.equipped : { ...hx.equipped, [slot]: id };
  return { ...next, hexsmith: { owned: [...hx.owned, id], equipped } };
}

/** Equipa um item possuído no slot dele (troca o que estava). Não possuído = o MESMO objeto. Nada se perde: o anterior fica na posse. */
export function equipHexItem<T extends { hexsmith?: HexsmithState }>(prev: T, id: string): T {
  const hx = sanitizeHexsmith(prev.hexsmith);
  if (!hx.owned.includes(id)) return prev;
  const slot = parseHexItem(id)!.slot;
  if (hx.equipped[slot] === id) return prev;
  return { ...prev, hexsmith: { owned: hx.owned, equipped: { ...hx.equipped, [slot]: id } } };
}

/** Esvazia o slot (o item continua na posse). */
export function unequipHexSlot<T extends { hexsmith?: HexsmithState }>(prev: T, slot: HexSlot): T {
  const hx = sanitizeHexsmith(prev.hexsmith);
  if (!hx.equipped[slot]) return prev;
  const equipped = { ...hx.equipped };
  delete equipped[slot];
  return { ...prev, hexsmith: { owned: hx.owned, equipped } };
}

/** O que o equipado REESCREVE no Soulmon. Campo ausente = o código original vale. É o que o combate lê. */
export interface HexOverrides {
  readonly specialFamily?: SpecialFamily;
  readonly specialElement?: string;
  readonly basicElement?: string;
  readonly defenseElement?: string;
  readonly strike?: HexStrike;
}

export function hexOverrides(raw: unknown): HexOverrides {
  const { equipped } = sanitizeHexsmith(raw);
  const v = (slot: HexSlot) => (equipped[slot] ? parseHexItem(equipped[slot])!.value : undefined);
  const out: { -readonly [K in keyof HexOverrides]: HexOverrides[K] } = {};
  const fam = v('coroa'); if (fam) out.specialFamily = fam as SpecialFamily;
  const sp = v('amuleto'); if (sp) out.specialElement = sp;
  const ba = v('garra'); if (ba) out.basicElement = ba;
  const de = v('couraca'); if (de) out.defenseElement = de;
  const st = v('luvas'); if (st) out.strike = st as HexStrike;
  return out;
}

// ── Aplicar no combate (cliente). O servidor espelha o que vale no duelo em `functions/api/_duel.js`. ─────────────────────────

/** A família do especial com a Coroa equipada (sem Coroa = a da ficha). */
export const hexFamily = (base: SpecialFamily, hx: HexOverrides): SpecialFamily => hx.specialFamily ?? base;

/**
 * Os elementos da MECÂNICA da vantagem (tabela só das bases): o item pode ser um par/derivado, então entra a BASE DOMINANTE dele
 * (`baseDominanteDoElemento`, a mesma conta da ficha). Couraça = os dois atributos de defesa viram o elemento dela.
 */
export function hexArenaElements<T extends { basica: string; especial: string; attrs: { principal: string; secundario: string } }>(els: T, hx: HexOverrides): T {
  if (!hx.basicElement && !hx.specialElement && !hx.defenseElement) return els;
  const def = hx.defenseElement ? baseDominanteDoElemento(hx.defenseElement) : undefined;
  return {
    ...els,
    basica: hx.basicElement ? baseDominanteDoElemento(hx.basicElement) : els.basica,
    especial: hx.specialElement ? baseDominanteDoElemento(hx.specialElement) : els.especial,
    attrs: def ? { principal: def, secundario: def } : els.attrs,
  };
}

/** A identidade VISUAL do lutador: elemento exibido dos golpes, família do especial e a forma do básico (Luvas, só visual). */
export function hexIdentity(id: FighterIdentity, hx: HexOverrides): FighterIdentity {
  if (!hx.basicElement && !hx.specialElement && !hx.specialFamily && !hx.strike) return id;
  return {
    basico: { ...id.basico, elemento: hx.basicElement ?? id.basico.elemento, forma: hx.strike ?? id.basico.forma },
    especial: { ...id.especial, elemento: hx.specialElement ?? id.especial.elemento, familia: hx.specialFamily ?? id.especial.familia },
  };
}
