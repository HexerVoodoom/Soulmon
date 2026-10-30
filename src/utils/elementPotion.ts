/**
 * POÇÃO DE ELEMENTO (30/10/2026) — dono único. No Laboratório (Centro de Evolução) o jogador transforma ESSÊNCIAS em uma poção de um
 * elemento (base ou par). Dar a poção ao Soulmon (usar da pastinha) grava `evolutionPotion`; na PRÓXIMA evolução o elemento da poção
 * vira o elemento do Soulmon (`potionElement`) e o campo é limpo. Uma segunda poção SOBRESCREVE a primeira (a primeira some do mesmo jeito).
 *
 * Custos: SÓ aqui (nunca literal em outro arquivo). Base = 300 da própria essência. Par = 300 de cada base + 200 da essência do elemento
 * final. Trio (genérico; o dado só tem elementos de até 2 bases hoje) = 200 de cada base + 150 da final.
 *
 * Funções PURAS. O gasto passa por `spendEssences` (`essences.ts`), que também soma `essenceSpent`: o servidor só deixa o saldo baixar
 * pelo aumento desse acumulado (`functions/api/_essences.js`). Futuro (NÃO construído): essências compráveis com moeda real no Cambista.
 *
 * Chave no inventário (`foodInventory`): `potion:<elementId>` (ids `[a-z_]{2,24}`) — uma entrada de `SPECIAL_ITEMS` por elemento.
 */
import { ALL_ELEMENT_IDS, BASE_ELEMENT_IDS, elementComponents, isDexElement } from './elementDex';
import { essenceName, spendEssences, type EssenceDrop } from './essences';
import type { SpecialItem } from './shop';

export const POTION_COSTS = {
  /** Elemento base: quantidade da PRÓPRIA essência. */
  baseOwn: 300,
  /** Par: de cada uma das 2 essências base. */
  pairEachBase: 300,
  /** Par: da essência do elemento final. */
  pairFinal: 200,
  /** Trio: de cada uma das 3 essências base. */
  tripleEachBase: 200,
  /** Trio: da essência do elemento final. */
  tripleFinal: 150,
} as const;

/** Quantos slots de elemento base o jogador preenche. */
export const POTION_MAX_BASES = 3;

export const POTION_PREFIX = 'potion:';
export const potionKey = (elementId: string): string => POTION_PREFIX + elementId;
export const isPotionKey = (key: unknown): key is string =>
  typeof key === 'string' && key.startsWith(POTION_PREFIX) && isDexElement(key.slice(POTION_PREFIX.length));
export const potionElementOfKey = (key: string): string | undefined => (isPotionKey(key) ? key.slice(POTION_PREFIX.length) : undefined);

/** Composição (ids dos elementos base) de um elemento do catálogo: base = ele mesmo; par = os 2 componentes. `undefined` se desconhecido. */
export function elementComposition(id: string): readonly string[] | undefined {
  if (!isDexElement(id)) return undefined;
  const comp = elementComponents(id);
  if (comp) return comp[0] === comp[1] ? [comp[0]] : comp;
  return [id];
}

/** O custo em essências, agrupado por id (somado quando um id se repete). Genérico em 1, 2 ou 3 bases. `[]` se o elemento não existe. */
export function potionCostFor(finalId: string, bases: readonly string[]): EssenceDrop[] {
  if (!isDexElement(finalId) || bases.length < 1 || bases.length > POTION_MAX_BASES) return [];
  const acc = new Map<string, number>();
  const add = (id: string, qty: number) => acc.set(id, (acc.get(id) ?? 0) + qty);
  if (bases.length === 1) add(finalId, POTION_COSTS.baseOwn);
  else {
    const each = bases.length === 2 ? POTION_COSTS.pairEachBase : POTION_COSTS.tripleEachBase;
    const fin = bases.length === 2 ? POTION_COSTS.pairFinal : POTION_COSTS.tripleFinal;
    for (const b of bases) add(b, each);
    add(finalId, fin);
  }
  return [...acc].map(([id, qty]) => ({ id, qty }));
}

export function potionCost(elementId: string): EssenceDrop[] {
  const comp = elementComposition(elementId);
  return comp ? potionCostFor(elementId, comp) : [];
}

export function canAffordPotion(essences: Record<string, number> | undefined, elementId: string): boolean {
  const cost = potionCost(elementId);
  return cost.length > 0 && cost.every(c => (essences?.[c.id] ?? 0) >= c.qty);
}

/** Filtro E: elementos cuja composição contém TODAS as bases escolhidas (sem escolha = todos). Ordem do catálogo. */
export function elementsMatchingBases(selected: readonly (string | null | undefined)[]): string[] {
  const sel = [...new Set(selected.filter((s): s is string => typeof s === 'string' && BASE_ELEMENT_IDS.includes(s)))];
  return ALL_ELEMENT_IDS.filter(id => {
    const comp = elementComposition(id) ?? [];
    return sel.every(s => comp.includes(s));
  });
}

/** Os que cabem no filtro E o jogador consegue pagar. */
export function affordablePotionElements(essences: Record<string, number> | undefined, selected: readonly (string | null | undefined)[]): string[] {
  return elementsMatchingBases(selected).filter(id => canAffordPotion(essences, id));
}

type PotionState = {
  defeatedElements?: string[];
  essences?: Record<string, number>;
  essenceSpent?: Record<string, number>;
  foodInventory: Record<string, number>;
  evolutionPotion?: string;
};

/** O elemento já foi desbloqueado na Biblioteca (dex de elementos vencidos)? Sem isso a poção não aparece com nome nem pode ser criada. */
export const isPotionUnlocked = (elementId: string, defeated: readonly string[] | undefined): boolean =>
  (defeated ?? []).includes(elementId);

/** Cria UMA poção: reconfere o saldo sobre o `prev` (toque duplo no mesmo lote) e consome exatamente o custo. Sem saldo = o MESMO objeto. */
export function craftPotion<T extends PotionState>(prev: T, elementId: string): T {
  if (!isPotionUnlocked(elementId, prev.defeatedElements) || !canAffordPotion(prev.essences, elementId)) return prev;
  const gasto = spendEssences(prev, potionCost(elementId));
  if (!gasto) return prev;
  const k = potionKey(elementId);
  return { ...gasto, foodInventory: { ...prev.foodInventory, [k]: (prev.foodInventory[k] ?? 0) + 1 } };
}

/** Dá a poção ao Soulmon: tira UMA do inventário e grava o pendente (sobrescreve o anterior). Sem estoque = o MESMO objeto. */
export function givePotion<T extends PotionState>(prev: T, key: string): T {
  const id = potionElementOfKey(key);
  const n = prev.foodInventory[key] ?? 0;
  if (!id || n <= 0) return prev;
  const foodInventory = { ...prev.foodInventory, [key]: n - 1 };
  if (foodInventory[key] === 0) delete foodInventory[key];
  return { ...prev, foodInventory, evolutionPotion: id };
}

/** Leitura tolerante do save: só ids do catálogo. */
export const sanitizeElementId = (raw: unknown): string | undefined => (isDexElement(raw) ? raw : undefined);

/**
 * Na evolução: o elemento pendente vira o elemento do Soulmon (`potionElement`) e `evolutionPotion` é limpo. Sem poção = o MESMO objeto.
 * Limite honesto: `potionElement` vale para o combate/aura (`petElementOf`); o SPRITE da forma segue sendo o da linha (a arte não muda por elemento).
 */
export function applyPotionOnEvolve<T extends { evolutionPotion?: string; potionElement?: string }>(prev: T): T {
  const id = sanitizeElementId(prev.evolutionPotion);
  if (!id) return prev.evolutionPotion === undefined ? prev : { ...prev, evolutionPotion: undefined };
  return { ...prev, evolutionPotion: undefined, potionElement: id };
}

/** Entradas de `SPECIAL_ITEMS`, uma por elemento do catálogo. */
export const POTION_SPECIAL_ITEMS: Record<string, SpecialItem> = Object.fromEntries(
  ALL_ELEMENT_IDS.map(id => {
    const key = potionKey(id);
    const item: SpecialItem = {
      emoji: key, kind: 'potion',
      namePt: `Poção de ${essenceName(id, true).replace(/^Essência de /, '')}`, nameEn: `${essenceName(id, false).replace(/ Essence$/, '')} Potion`,
      descPt: 'Dê ao Soulmon: na próxima evolução ele passa a carregar este elemento. Outra poção substitui esta.',
      descEn: 'Give it to your Soulmon: at the next evolution it carries this element. Another potion replaces this one.',
    };
    return [key, item];
  }),
);
