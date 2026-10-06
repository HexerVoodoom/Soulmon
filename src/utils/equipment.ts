/**
 * Combate v3 / PR8 — o EQUIPAMENTO do Soulmon (dono único; espelho no servidor: `functions/api/_equipment.js`,
 * travado por `equipment.parity.test.js`).
 *
 * Decisões do dono (§2.14 M3 e §2.26):
 *  · 3 slots, um por atributo: Núcleo → ATK, Carapaça → DEF, Rastro → SPD; 3 tiers por slot (9 itens).
 *  · Aquisição por LOJA DIRETA (Bits) ou FRAGMENTOS: sem sorteio, sem caixa, sem "chance". O tier é lapidação, nunca sorte.
 *  · Só moeda GANHA jogando: o Bit que veio de Crédito não compra equipamento (`bitsOrigin.ts › earnedBits`). Créditos aceleram
 *    só o que não é combate; nunca equipamento nem % de combate.
 *  · O bônus é PERCENTUAL (um ponto plano no L1 vale +11,1% e estoura o teto) e entra no canal único de 5% (`combate/bonus.ts`):
 *    PvP por atributo (`equipAttrBonus` → `combinedAttrBonus`), fenda como soma (`equipScalar` → `combinedBonus`). Quem soma
 *    e corta é o canal, nunca este arquivo.
 *  · O Comércio (talentos) mexe só em PREÇO (`equipPriceDiscount`) e em ganho de FRAGMENTOS (`fragmentGain`), dentro do +25%.
 *  · Persistido SÓ `equipment: { owned, equipped, fragments }`; o bônus e os preços são derivados. Lixo é descartado peça a peça
 *    (`sanitizeEquipment`): um slot forjado (item que não é do slot, ou não possuído) volta vazio.
 *
 * Módulo PURO: sem React, sem relógio, sem localStorage. Os TEXTOS moram em `equipmentCopy.ts` (só a tela os lê).
 */

import { earnedBits, spendBitsPaidFirst, type BitsOrigin } from './bitsOrigin';
import { combinedAttrBonus, type AttrBonus } from './combate/bonus';
import { ranksOf } from './talents';

export type EquipSlot = 'nucleo' | 'carapaca' | 'rastro';
export type EquipAttr = 'atk' | 'def' | 'spd';

export const EQUIP_SLOTS: readonly EquipSlot[] = ['nucleo', 'carapaca', 'rastro'];
export const SLOT_ATTR: Readonly<Record<EquipSlot, EquipAttr>> = { nucleo: 'atk', carapaca: 'def', rastro: 'spd' };

/** Bônus por tier (fração; 0,005 = 0,5%). Três slots no tier 3 somam 4,5%: o teto de 5% é UM, o equipamento sozinho cabe nele. */
export const TIER_PCT: readonly [number, number, number] = [0.005, 0.01, 0.015];
/** Preço em Bits GANHOS e em fragmentos, por tier (DEFAULTS da squad: o dono não fixou preços finais). */
export const TIER_BITS: readonly [number, number, number] = [400, 1200, 3000];
export const TIER_FRAGMENTS: readonly [number, number, number] = [4, 12, 30];
/** Fragmentos de uma run COMPLETA da Masmorra (os 5 andares), antes do Comércio (`fragmentGain`). Default da squad. */
export const FRAGMENTS_PER_RUN = 5;
/** Teto de fragmentos guardados (mais que o necessário para os 9 itens; limita save forjado). */
export const FRAGMENTS_MAX = 999;

export interface EquipItem {
  readonly id: string;
  readonly slot: EquipSlot;
  readonly tier: 1 | 2 | 3;
  /** Bônus no atributo do slot (fração). */
  readonly pct: number;
  readonly bits: number;
  readonly fragments: number;
}

export const EQUIP_CATALOG: readonly EquipItem[] = EQUIP_SLOTS.flatMap((slot) =>
  ([1, 2, 3] as const).map((tier): EquipItem => ({
    id: `eq-${slot}-t${tier}`, slot, tier, pct: TIER_PCT[tier - 1], bits: TIER_BITS[tier - 1], fragments: TIER_FRAGMENTS[tier - 1],
  })));

export const EQUIP_BY_ID: ReadonlyMap<string, EquipItem> = new Map(EQUIP_CATALOG.map((i) => [i.id, i]));

export interface EquipmentState {
  readonly owned: readonly string[];
  readonly equipped: Readonly<Partial<Record<EquipSlot, string>>>;
  readonly fragments: number;
}

export const EMPTY_EQUIPMENT: EquipmentState = { owned: [], equipped: {}, fragments: 0 };

const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/**
 * O que o save pode guardar, peça a peça: posse só de itens do catálogo (sem repetir), equipado só se o item é do slot E está
 * possuído, fragmentos inteiros em [0, FRAGMENTS_MAX]. Lixo vira vazio; nunca lança.
 */
export function sanitizeEquipment(raw: unknown): EquipmentState {
  if (!raw || typeof raw !== 'object') return EMPTY_EQUIPMENT;
  const r = raw as Record<string, unknown>;
  const owned: string[] = [];
  if (Array.isArray(r.owned)) {
    for (const id of r.owned) if (typeof id === 'string' && EQUIP_BY_ID.has(id) && !owned.includes(id)) owned.push(id);
  }
  const equipped: Partial<Record<EquipSlot, string>> = {};
  const eq = r.equipped && typeof r.equipped === 'object' ? (r.equipped as Record<string, unknown>) : {};
  for (const slot of EQUIP_SLOTS) {
    const id = own(eq, slot) ? eq[slot] : undefined;
    if (typeof id === 'string' && owned.includes(id) && EQUIP_BY_ID.get(id)!.slot === slot) equipped[slot] = id;
  }
  const f = typeof r.fragments === 'number' && Number.isFinite(r.fragments) ? Math.floor(r.fragments) : 0;
  return { owned, equipped, fragments: Math.min(FRAGMENTS_MAX, Math.max(0, f)) };
}

/**
 * O bônus POR ATRIBUTO do que está equipado (frações). Já saneado: um slot forjado vale 0. É o que entra em
 * `combinedAttrBonus({ equipment })` (PvP).
 */
export function equipAttrBonus(raw: unknown): AttrBonus {
  const eq = sanitizeEquipment(raw);
  const out = { atk: 0, def: 0, spd: 0 };
  for (const slot of EQUIP_SLOTS) {
    const id = eq.equipped[slot];
    if (id) out[SLOT_ATTR[slot]] += EQUIP_BY_ID.get(id)!.pct;
  }
  return out;
}

/**
 * PR12a (§2.28 B) — o bônus da MASMORRA por atributo: o talento de PvE (um número, vai no ATK = dano dado) + o equipamento em
 * ATK/DEF/SPD, pelo MESMO canal de 5% do PvP (`combinedAttrBonus`: a SOMA dos três canais nunca passa do teto). O núcleo
 * (`combatantAt`) já aplica DEF (o inimigo precisa de mais golpes) e SPD (o golpe sai mais cedo), sem mudar o motor.
 * Arena e Pesadelo seguem no canal escalar (`equipScalar`): não mudam.
 */
export function dungeonAttrBonus(talentPve: number, raw: unknown): AttrBonus {
  return combinedAttrBonus({ talent: { atk: talentPve }, equipment: equipAttrBonus(raw) });
}

/** O mesmo bônus como UM número (a soma dos três): é a parcela de equipamento do canal da fenda (`combinedBonus`). */
export function equipScalar(raw: unknown): number {
  const b = equipAttrBonus(raw);
  return b.atk + b.def + b.spd;
}

// ── Comércio: só preço e ganho de moeda ─────────────────────────────────────────

/** Desconto de preço por grau de `tal-com-01` (Etiqueta). */
export const PRICE_STEP = 0.04;
/** Mais fragmentos por grau de `tal-com-02`. */
export const FRAGMENT_GAIN_STEP = 0.05;
/** O teto do ganho que o Comércio pode somar (o +25% do dono, §2.26). */
export const COMMERCE_GAIN_CAP = 0.25;

// ── Comércio (PR12b, §2.28 C): mochila, Bits do dia completo e desconto da semana ──────────────

/** A MOCHILA: quantas peças possuídas podem ficar FORA dos slots. Começa em 3 e `tal-com-04` soma 1 por grau (máx. 6 = as 9 peças menos 3 slots). */
export const BACKPACK_BASE = 3;
export const BACKPACK_STEP = 1;
/** Mais Bits do dia completo por grau de `tal-com-06` (3 graus = +15%, dentro do +25% do dono). */
export const MISSION_BITS_STEP = 0.05;
/** O desconto da peça da semana (`tal-com-07`), em Bits. Soma com o `tal-com-01` e o total nunca passa de 60% (`discounted`). */
export const WEEKLY_DISCOUNT = 0.2;

/** Capacidade da mochila (inteiro). `picks` = `talentPicks` (já validado para o Vínculo por quem chama). */
export function backpackCapacity(picks: readonly string[] | undefined): number {
  return BACKPACK_BASE + BACKPACK_STEP * Math.min(3, ranksOf(picks ?? []).get('tal-com-04') ?? 0);
}

/** Peças possuídas que NÃO estão em slot (o que ocupa a mochila). Save antigo pode passar da capacidade: nada é tirado dele. */
export function backpackUsed(raw: unknown): number {
  const eq = sanitizeEquipment(raw);
  return eq.owned.filter((id) => eq.equipped[EQUIP_BY_ID.get(id)!.slot] !== id).length;
}

/** Cabe mais uma peça fora dos slots? (O que já passa da capacidade fica; só não entra mais.) */
export function backpackHasRoom(raw: unknown, picks: readonly string[] | undefined): boolean {
  return backpackUsed(raw) < backpackCapacity(picks);
}

/**
 * Os Bits do dia completo com o Comércio: `base × (1 + 5% por grau)`, até +25%, arredondado para baixo. NÃO cria fonte: só soma
 * sobre o que o dia completo JÁ pagava (`BITS_PER_COMPLETE_DAY`). Sem o nó, devolve `base`.
 */
export function missionBitsGain(base: number, picks: readonly string[] | undefined): number {
  const n = Math.max(0, Math.floor(Number.isFinite(base) ? base : 0));
  const bonus = Math.min(COMMERCE_GAIN_CAP, MISSION_BITS_STEP * (ranksOf(picks ?? []).get('tal-com-06') ?? 0));
  return Math.floor(n * (1 + bonus) + 1e-9);
}

/**
 * A peça da semana (`tal-com-07`): DETERMINÍSTICA, sem sorteio nem relógio do aparelho. `weekKey` é a semana ISO do dia do jogador
 * (`2026-W41`). A ordem anda de 4 em 4 pelo catálogo (4 e 9 são primos entre si: as 9 peças passam, sem repetir, em 9 semanas).
 * Chave inválida = nenhuma peça.
 */
export function weeklyDiscountItem(weekKey: string | null | undefined): string | null {
  const m = typeof weekKey === 'string' ? /^(\d{4})-W(\d{2})$/.exec(weekKey) : null;
  if (!m) return null;
  const n = Number(m[1]) * 53 + Number(m[2]);
  return EQUIP_CATALOG[(n * 4) % EQUIP_CATALOG.length].id;
}

/** O desconto de Bits que vale para `itemId` nesta semana (fração): `WEEKLY_DISCOUNT` se tem o nó e é a peça da semana, senão 0. */
export function weeklyDiscountFor(itemId: string, picks: readonly string[] | undefined, weekKey: string | null | undefined): number {
  if (!(picks ?? []).includes('tal-com-07')) return 0;
  return weeklyDiscountItem(weekKey) === itemId ? WEEKLY_DISCOUNT : 0;
}

/** Desconto de preço do Comércio (fração em [0, 0,6]). `picks` = `talentPicks` (já validado para o Vínculo por quem chama). */
export function equipPriceDiscount(picks: readonly string[] | undefined): number {
  const r = ranksOf(picks ?? []);
  return Math.min(0.6, PRICE_STEP * (r.get('tal-com-01') ?? 0));
}

/** Preço final (inteiro ≥ 1) depois do desconto. */
export function discounted(base: number, discount: number): number {
  return Math.max(1, Math.ceil(base * (1 - Math.min(0.6, Math.max(0, discount)))));
}

/** Fragmentos de um prêmio de `base`, com o Comércio (+5% por grau, até o teto de +25%). Nunca menos que `base`. */
export function fragmentGain(base: number, picks: readonly string[] | undefined): number {
  const n = Math.max(0, Math.floor(Number.isFinite(base) ? base : 0));
  const r = ranksOf(picks ?? []);
  const bonus = Math.min(COMMERCE_GAIN_CAP, FRAGMENT_GAIN_STEP * (r.get('tal-com-02') ?? 0));
  return Math.floor(n * (1 + bonus) + 1e-9);
}

// ── Compra e equipar (puras, rodam DENTRO de um updater) ─────────────────────────

export interface EquipBuyState {
  gamePoints?: number;
  bitsOrigin?: BitsOrigin;
  equipment?: EquipmentState;
  talentPicks?: string[];
  /** PR12b: a semana ISO do dia do jogador (`isoWeekKey`), para a peça da semana. Ausente = sem desconto semanal. */
  weekKey?: string | null;
}

export type EquipRefusal = 'unknown' | 'already-owned' | 'no-funds' | 'not-earned' | 'no-fragments' | 'backpack-full';
export type EquipPay = 'bits' | 'fragments';

/** O preço de `id` na forma de pagamento `pay`, já com o Comércio. */
export function equipPrice(item: EquipItem, pay: EquipPay, picks: readonly string[] | undefined, weekKey?: string | null): number {
  return pay === 'bits' ? discounted(item.bits, equipPriceDiscount(picks) + weeklyDiscountFor(item.id, picks, weekKey)) : item.fragments;
}

/** A recusa da compra (ou `undefined`). Separada para a tela desabilitar o botão com o MESMO motivo. */
export function equipBuyRefusal(state: EquipBuyState, id: string, pay: EquipPay): EquipRefusal | undefined {
  const item = EQUIP_BY_ID.get(id);
  if (!item) return 'unknown';
  const eq = sanitizeEquipment(state.equipment);
  if (eq.owned.includes(id)) return 'already-owned';
  // PR12b: a peça que NÃO entra num slot vazio vai para a mochila; mochila cheia = não entra mais uma (o que já passa fica).
  if (eq.equipped[item.slot] && !backpackHasRoom(eq, state.talentPicks)) return 'backpack-full';
  const price = equipPrice(item, pay, state.talentPicks, state.weekKey);
  if (pay === 'fragments') return eq.fragments < price ? 'no-fragments' : undefined;
  const bal = Math.max(0, Math.floor(Number.isFinite(state.gamePoints) ? (state.gamePoints as number) : 0));
  if (bal < price) return 'no-funds';
  // Tem Bits, mas parte deles veio de Crédito: equipamento só com Bit GANHO.
  return earnedBits(state) < price ? 'not-earned' : undefined;
}

/**
 * Compra `id` sobre o `prev` (reconferida aqui: dois toques no mesmo lote não compram duas vezes nem levam o saldo a negativo).
 * Bits: debita do saldo (o Bit pago não conta, `earnedBits`). Fragmentos: debita fragmentos. Equipa na hora se o slot está vazio.
 */
export function applyEquipBuy<T extends EquipBuyState>(prev: T, id: string, pay: EquipPay): { ok: true; state: T; price: number } | { ok: false; reason: EquipRefusal } {
  const reason = equipBuyRefusal(prev, id, pay);
  if (reason) return { ok: false, reason };
  const item = EQUIP_BY_ID.get(id)!;
  const eq = sanitizeEquipment(prev.equipment);
  const price = equipPrice(item, pay, prev.talentPicks, prev.weekKey);
  const equipped = eq.equipped[item.slot] ? eq.equipped : { ...eq.equipped, [item.slot]: id };
  const next: EquipmentState = {
    owned: [...eq.owned, id],
    equipped,
    fragments: pay === 'fragments' ? eq.fragments - price : eq.fragments,
  };
  const state = pay === 'bits' ? { ...prev, gamePoints: (prev.gamePoints ?? 0) - price, equipment: next } : { ...prev, equipment: next };
  return { ok: true, state: state as T, price };
}

/** Equipa um item POSSUÍDO no slot dele (troca o anterior, que continua possuído). Não possuído = o mesmo estado. */
export function applyEquip<T extends { equipment?: EquipmentState }>(prev: T, id: string): T {
  const eq = sanitizeEquipment(prev.equipment);
  const item = EQUIP_BY_ID.get(id);
  if (!item || !eq.owned.includes(id) || eq.equipped[item.slot] === id) return prev;
  return { ...prev, equipment: { ...eq, equipped: { ...eq.equipped, [item.slot]: id } } };
}

/** Tira o item do slot (continua possuído e vai para a mochila; mochila cheia = o mesmo estado). */
export function applyUnequip<T extends { equipment?: EquipmentState; talentPicks?: string[] }>(prev: T, slot: EquipSlot): T {
  const eq = sanitizeEquipment(prev.equipment);
  if (!eq.equipped[slot]) return prev;
  if (!backpackHasRoom(eq, prev.talentPicks)) return prev;
  const equipped = { ...eq.equipped };
  delete equipped[slot];
  return { ...prev, equipment: { ...eq, equipped } };
}

/** Soma fragmentos GANHOS (já com o Comércio, `fragmentGain`), até `FRAGMENTS_MAX`. */
export function addFragments<T extends { equipment?: EquipmentState }>(prev: T, amount: number): T {
  const n = Math.floor(Number.isFinite(amount) ? amount : 0);
  if (n <= 0) return prev;
  const eq = sanitizeEquipment(prev.equipment);
  const fragments = Math.min(FRAGMENTS_MAX, eq.fragments + n);
  return fragments === eq.fragments ? prev : { ...prev, equipment: { ...eq, fragments } };
}

/** O gasto de Bits que NÃO é equipamento (loja, respec): debita e gasta o Bit pago primeiro. */
export function spendBits<T extends { gamePoints?: number; bitsOrigin?: BitsOrigin }>(prev: T, amount: number): T {
  const bal = prev.gamePoints ?? 0;
  if (!(amount > 0) || bal < amount) return prev;
  return spendBitsPaidFirst({ ...prev, gamePoints: bal - amount }, amount);
}
