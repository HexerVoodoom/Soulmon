/**
 * POÇÃO DE ELEMENTO (30/10/2026) — dono único. No Laboratório (Centro de Evolução) o jogador transforma ESSÊNCIAS em uma poção de um
 * elemento (base ou par). Dar a poção ao Soulmon (usar da pastinha) grava `evolutionPotion`; na PRÓXIMA evolução o elemento da poção
 * vira o elemento do Soulmon (`potionElement`) e o campo é limpo. Uma segunda poção SOBRESCREVE a primeira (a primeira some do mesmo jeito).
 *
 * Custos: SÓ aqui (nunca literal em outro arquivo). REGRA DO DONO (08/11/2026, mais barata): base = 100 da própria essência.
 * Composto (2, 3 ou 4 componentes; o catálogo da poção só tem pares hoje) = 1 POÇÃO de cada elemento base componente + 50 essências do
 * composto. Antes (30/10): base 300; par 300+300+200; trio 200+200+150. Nada some do save de ninguém: só muda o preço de agora em diante.
 *
 * Funções PURAS. O gasto passa por `spendEssences` (`essences.ts`), que também soma `essenceSpent`: o servidor só deixa o saldo baixar
 * pelo aumento desse acumulado (`functions/api/_essences.js`). Futuro (NÃO construído): essências compráveis com moeda real no Cambista.
 *
 * Chave no inventário (`foodInventory`): `potion:<elementId>` (ids `[a-z_]{2,24}`) — uma entrada de `SPECIAL_ITEMS` por elemento.
 */
import { ALL_ELEMENT_IDS, ESSENCE_ELEMENT_IDS, BASE_ELEMENT_IDS, essenceComposition, isEssenceElement } from './elementDex';
import { essenceName, spendEssences, type EssenceDrop } from './essences';
import type { SpecialItem } from './shop';
import { readLocal, writeLocal } from './safeStorage';
import { ELEMENTO_NEUTRO_ID } from './elementoNeutro';
import { NEUTRO_POTION_COST } from './neutroPotion';

export const POTION_COSTS = {
  /** Elemento base: quantidade da PRÓPRIA essência. Ao atingir isto a Vesca oferece a poção (`essenceThresholdCrossings`). */
  baseOwn: 100,
  /** Composto: essências do próprio composto (além de 1 poção de cada base componente). */
  compositeFinal: 50,
} as const;

/** Quantos slots de elemento base o jogador preenche. */
export const POTION_MAX_BASES = 3;
/** Máximo de bases na composição de um elemento (curados têm até 4). */
export const POTION_MAX_COMPONENTS = 4;

export const POTION_PREFIX = 'potion:';
/** Elementos que têm poção: os 269 do catálogo de essências E o Neutro (16/11/2026, receita própria em `neutroPotion.ts`). O Pesadelo NÃO tem (só coleta). */
export const isPotionElement = (id: unknown): id is string => isEssenceElement(id) || id === ELEMENTO_NEUTRO_ID;
export const potionKey = (elementId: string): string => POTION_PREFIX + elementId;
export const isPotionKey = (key: unknown): key is string =>
  typeof key === 'string' && key.startsWith(POTION_PREFIX) && isPotionElement(key.slice(POTION_PREFIX.length));
export const potionElementOfKey = (key: string): string | undefined => (isPotionKey(key) ? key.slice(POTION_PREFIX.length) : undefined);

/** Composição (ids dos elementos base) de um elemento do catálogo: base = ele mesmo; par = os 2 componentes. `undefined` se desconhecido. */
export function elementComposition(id: string): readonly string[] | undefined {
  return essenceComposition(id);
}

/** O custo em essências, agrupado por id. Base: 100 da própria. Composto (2+ bases distintas): 50 do composto. `[]` se o elemento não existe. */
export function potionCostFor(finalId: string, bases: readonly string[]): EssenceDrop[] {
  if (!isEssenceElement(finalId) || bases.length < 1 || bases.length > POTION_MAX_COMPONENTS) return [];
  return [{ id: finalId, qty: bases.length === 1 ? POTION_COSTS.baseOwn : POTION_COSTS.compositeFinal }];
}

export function potionCost(elementId: string): EssenceDrop[] {
  if (elementId === ELEMENTO_NEUTRO_ID) return NEUTRO_POTION_COST.map(c => ({ ...c }));
  const comp = elementComposition(elementId);
  return comp ? potionCostFor(elementId, comp) : [];
}

/** As poções que o composto consome: 1 de cada elemento base componente (ids únicos). Base = nada. */
export function potionIngredients(elementId: string): EssenceDrop[] {
  const comp = elementComposition(elementId);
  if (!comp || comp.length < 2) return [];
  return [...new Set(comp)].map(id => ({ id, qty: 1 }));
}

type Inventory = Record<string, number> | undefined;

export function canAffordPotion(essences: Record<string, number> | undefined, elementId: string, inventory?: Inventory): boolean {
  const cost = potionCost(elementId);
  return cost.length > 0
    && cost.every(c => (essences?.[c.id] ?? 0) >= c.qty)
    && potionIngredients(elementId).every(i => (inventory?.[potionKey(i.id)] ?? 0) >= i.qty);
}

/** Elementos BASE cuja essência CRUZOU o limiar (`POTION_COSTS.baseOwn`) de `prev` para `next` (estava abaixo, agora tem). Dispara 1x por cruzamento. */
export function essenceThresholdCrossings(prev: Record<string, number> | undefined, next: Record<string, number> | undefined): string[] {
  return BASE_ELEMENT_IDS.filter(id => (prev?.[id] ?? 0) < POTION_COSTS.baseOwn && (next?.[id] ?? 0) >= POTION_COSTS.baseOwn);
}

const VESCA_OFFERED_KEY = 'soulmon:vescaOffered';
/** Elementos que a Vesca já ofereceu (por aparelho; evita repetir o modal para veterano a cada abertura). Sem storage = vazio. */
export function readVescaOffered(): Set<string> {
  try {
    const raw = JSON.parse(readLocal(VESCA_OFFERED_KEY) ?? '[]');
    return new Set(Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : []);
  } catch { return new Set(); }
}
export function writeVescaOffered(ids: ReadonlySet<string>): void {
  writeLocal(VESCA_OFFERED_KEY, JSON.stringify([...ids]));
}

/** Filtro E: elementos cuja composição contém TODAS as bases escolhidas (sem escolha = todos). Ordem do catálogo (padrão: os 210 do dex/Forja Hex; Cambista e Poção passam `ESSENCE_ELEMENT_IDS`, com os curados). */
export function elementsMatchingBases(selected: readonly (string | null | undefined)[], catalog: readonly string[] = ALL_ELEMENT_IDS): string[] {
  return catalog.filter(id => compositionHasBases(elementComposition(id), selected));
}

/** Bases válidas escolhidas no filtro (sem repetição, sem vazio). */
export function selectedBases(selected: readonly (string | null | undefined)[]): string[] {
  return [...new Set(selected.filter((s): s is string => typeof s === 'string' && BASE_ELEMENT_IDS.includes(s)))];
}

/** Regra única do filtro por bases (E): a composição contém TODAS as bases escolhidas. Sem escolha = passa tudo; composição desconhecida só passa sem escolha. */
export function compositionHasBases(comp: readonly string[] | undefined, selected: readonly (string | null | undefined)[]): boolean {
  const sel = selectedBases(selected);
  if (sel.length === 0) return true;
  return !!comp && sel.every(s => comp.includes(s));
}

/** O mesmo filtro aplicado a um id de elemento qualquer (Drive, Essências). `pesadelo`/curados sem composição saem quando há filtro. */
export function elementMatchesBases(id: string | null | undefined, selected: readonly (string | null | undefined)[]): boolean {
  if (selectedBases(selected).length === 0) return true;
  return !!id && compositionHasBases(elementComposition(id), selected);
}

/** Os que cabem no filtro E o jogador consegue pagar. */
export function affordablePotionElements(essences: Record<string, number> | undefined, selected: readonly (string | null | undefined)[], inventory?: Inventory): string[] {
  return elementsMatchingBases(selected, ESSENCE_ELEMENT_IDS).filter(id => canAffordPotion(essences, id, inventory));
}

export type PotionFilter = 'all' | 'can' | 'enough' | 'base' | 'composite';
export const POTION_FILTERS: readonly PotionFilter[] = ['all', 'can', 'enough', 'base', 'composite'];

export interface PotionRecipeRow { id: string; have: number; need: number }
export interface PotionRecipe {
  id: string;
  /** Essências do custo: quanto o jogador TEM de quanto PRECISA. */
  essences: PotionRecipeRow[];
  /** Poções-base que o composto consome (vazio em base). */
  potions: PotionRecipeRow[];
  enoughEssences: boolean;
  canCraft: boolean;
}

/** Receita de UMA poção com o progresso do jogador por ingrediente (dados reais de custo: `potionCost`/`potionIngredients`). */
export function potionRecipe(id: string, essences: Record<string, number> | undefined, inventory?: Inventory): PotionRecipe {
  const ess = potionCost(id).map(c => ({ id: c.id, have: essences?.[c.id] ?? 0, need: c.qty }));
  const pots = potionIngredients(id).map(c => ({ id: c.id, have: inventory?.[potionKey(c.id)] ?? 0, need: c.qty }));
  const enoughEssences = ess.length > 0 && ess.every(r => r.have >= r.need);
  return { id, essences: ess, potions: pots, enoughEssences, canCraft: enoughEssences && pots.every(r => r.have >= r.need) };
}

/**
 * A LISTA COMPLETA (todas as poções do catálogo), filtrada pelas bases escolhidas (E) e por `filter`; as que o jogador já consegue
 * criar vêm primeiro (ordem do catálogo dentro de cada grupo).
 */
export function potionListFor(essences: Record<string, number> | undefined, inventory: Inventory, selected: readonly (string | null | undefined)[], filter: PotionFilter = 'all', unlocked?: readonly string[]): PotionRecipe[] {
  const rows = elementsMatchingBases(selected, ESSENCE_ELEMENT_IDS).map(id => potionRecipe(id, essences, inventory))
    .filter(r => {
      const open = isPotionUnlocked(r.id, unlocked);
      const comp = elementComposition(r.id)?.length ?? 0;
      switch (filter) {
        case 'can': return open && r.canCraft;
        case 'enough': return r.enoughEssences;
        case 'base': return comp === 1;
        case 'composite': return comp > 1;
        default: return true;
      }
    });
  const ok = (r: PotionRecipe) => (r.canCraft && isPotionUnlocked(r.id, unlocked) ? 0 : 1);
  return rows.map((r, i) => ({ r, i })).sort((a, b) => ok(a.r) - ok(b.r) || a.i - b.i).map(x => x.r);
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
  if (!isPotionUnlocked(elementId, prev.defeatedElements) || !canAffordPotion(prev.essences, elementId, prev.foodInventory)) return prev;
  const gasto = spendEssences(prev, potionCost(elementId));
  if (!gasto) return prev;
  const inv = { ...prev.foodInventory };
  for (const i of potionIngredients(elementId)) {
    const pk = potionKey(i.id);
    inv[pk] = (inv[pk] ?? 0) - i.qty;
    if (inv[pk] <= 0) delete inv[pk];
  }
  const k = potionKey(elementId);
  return { ...gasto, foodInventory: { ...inv, [k]: (inv[k] ?? 0) + 1 } };
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
export const sanitizeElementId = (raw: unknown): string | undefined => (isPotionElement(raw) ? raw : undefined);

/**
 * Na evolução: o elemento pendente vira o elemento do Soulmon (`potionElement`) e `evolutionPotion` é limpo. REGRA DO DONO (30/10/2026):
 * a poção vale SÓ para a próxima evolução. Na evolução SEGUINTE (sem poção pendente) `potionElement` é LIMPO e o elemento volta ao da
 * pontuação (`petElementOf` cai para `soulmonMeta.dominantElement`). Sem nada pendente nem ativo = o MESMO objeto.
 * Limite honesto: `potionElement` vale para o combate/aura (`petElementOf`); o SPRITE da forma segue sendo o da linha. A arte da forma
 * com poção pode influenciar a seguinte esteticamente; a LÓGICA de elemento não.
 */
export function applyPotionOnEvolve<T extends { evolutionPotion?: string; potionElement?: string }>(prev: T): T {
  const id = sanitizeElementId(prev.evolutionPotion);
  if (!id) {
    if (prev.evolutionPotion === undefined && prev.potionElement === undefined) return prev;
    return { ...prev, evolutionPotion: undefined, potionElement: undefined };
  }
  return { ...prev, evolutionPotion: undefined, potionElement: id };
}

/**
 * Migração tolerante (10/11/2026): `potionElement` persistido que NÃO é da forma atual é lixo de versão antiga (a poção sobrevivia a
 * queda e a troca de forma). Ela só é legítima se o elemento equipado da forma atual é ela; sem equipado (save muito antigo) é mantida.
 */
export function curarPocaoOrfa(potion: string | undefined, evolutionStage: string | undefined, equip: Record<string, string> | undefined): string | undefined {
  if (!potion) return undefined;
  const equipado = evolutionStage ? equip?.[evolutionStage] : undefined;
  // `original` equipada: a poção viva é o elemento BASE posto por `forcarOriginal` (`formaSnapshot.ts`) — legítima, não órfã.
  return equipado && equipado !== 'original' && equipado !== potion ? undefined : potion;
}

/** Entradas de `SPECIAL_ITEMS`, uma por elemento do catálogo. */
export const POTION_SPECIAL_ITEMS: Record<string, SpecialItem> = Object.fromEntries(
  [...ESSENCE_ELEMENT_IDS, ELEMENTO_NEUTRO_ID].map(id => {
    const key = potionKey(id);
    const item: SpecialItem = {
      emoji: key, kind: 'potion',
      namePt: `Poção de ${essenceName(id, true).replace(/^Essência de /, '')}`, nameEn: `${essenceName(id, false).replace(/ Essence$/, '')} Potion`,
      descPt: 'Dê ao Soulmon: na próxima evolução ele passa a carregar este elemento. Vale só para a próxima evolução; depois o Soulmon volta ao elemento da pontuação dele. Outra poção substitui esta.',
      descEn: 'Give it to your Soulmon: at the next evolution it carries this element. Only affects the next evolution; after that your Soulmon returns to its score-based element. Another potion replaces this one.',
    };
    return [key, item];
  }),
);
