/**
 * DEX DE ELEMENTOS (27/10/2026, decisão do dono) — dono único de "quais elementos o jogador já derrotou".
 *
 * `GameState.defeatedElements` é a lista de ids (20 base + 190 derivados) de elementos de inimigos IDENTIFICADOS que o jogador
 * já venceu (Fenda/Masmorra, Elemental Fusion, Arena, Torneio). Começa VAZIA para todos (sem retroativo), só cresce, e é
 * idempotente. Vencer um inimigo COMPOSTO libera só o id do composto, nunca as bases dele.
 * A forma é espelhada no servidor (`functions/api/_elementDex.js`, teste de paridade `elementDex.parity.test.js`).
 */
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { CURATED_ELEMENT_IDS, isCuratedElement } from './elementosCurados';

/** Teto da lista no save (20 base + 190 derivados + 50 curados + neutro = 261; 01/11/2026; + 6 do lote 4 + 3 promovidos = 270, 05/11/2026). */
export const ELEMENT_DEX_MAX = 270;

export const BASE_ELEMENT_IDS: readonly string[] = CLASS_ELEMENT_ORDER;
export const DERIVED_ELEMENT_IDS: readonly string[] = DERIVED_ELEMENT_PAIRS.map(d => d.id);
/** Todos os elementos do dex, na ordem: 20 base e depois os derivados. */
export const ALL_ELEMENT_IDS: readonly string[] = [...BASE_ELEMENT_IDS, ...DERIVED_ELEMENT_IDS];

const KNOWN: ReadonlySet<string> = new Set(ALL_ELEMENT_IDS);
const PAIR_ID = new Map<string, string>(DERIVED_ELEMENT_PAIRS.map(d => [[...d.componentes].sort().join('+'), d.id]));
const COMPONENTS = new Map<string, readonly [string, string]>(DERIVED_ELEMENT_PAIRS.map(d => [d.id, d.componentes]));

export const isDexElement = (id: unknown): id is string => typeof id === 'string' && KNOWN.has(id);

/**
 * O que a aba Elemento da BIBLIOTECA mostra (01/11/2026): o catálogo acima + os 50 curados (212–261) + neutro
 * (`elementosCurados.ts`). `ALL_ELEMENT_IDS`/`isDexElement` continuam sendo o catálogo da Loja/Poção.
 */
export const LIBRARY_ELEMENT_IDS: readonly string[] = [...ALL_ELEMENT_IDS, ...CURATED_ELEMENT_IDS];
export const isLibraryElement = (id: unknown): id is string => isDexElement(id) || isCuratedElement(id);

/**
 * Tudo o que vencer um inimigo destranca na Biblioteca: o id de `elementIdOfFoe(elements)` (como sempre) e, se o elemento do
 * SPRITE for curado/neutro, ele também (Geyzor destranca `vapor` como antes E `geiser`; o corvo destranca `neutro`).
 */
export function dexIdsOfFoe(foe: { elements?: readonly (string | undefined | null)[] | null; element?: string | null } | undefined | null): string[] {
  if (!foe) return [];
  const out: string[] = [];
  const a = elementIdOfFoe(foe.elements);
  if (a) out.push(a);
  if (isCuratedElement(foe.element) && !out.includes(foe.element)) out.push(foe.element);
  return out;
}

/** Os dois componentes de um derivado; `undefined` para base/desconhecido. */
export const elementComponents = (id: string): readonly [string, string] | undefined => COMPONENTS.get(id);

/**
 * O id de elemento de um inimigo a partir dos elementos dele: 1 elemento (ou 2 iguais) → o base; 2 diferentes → o id do derivado
 * (só ele, nunca as bases). Desconhecido → `undefined` (inimigo não identificado não desbloqueia nada).
 */
export function elementIdOfFoe(elements: readonly (string | undefined | null)[] | undefined | null): string | undefined {
  const els = (elements ?? []).filter((e): e is string => typeof e === 'string');
  if (els.length === 0) return undefined;
  const [a, b] = els;
  if (els.length === 1 || a === b) return isDexElement(a) ? a : undefined;
  return PAIR_ID.get([a, b].sort().join('+'));
}

/** Forma segura da lista (sem a regra do catálogo, para o servidor espelhar igual): strings `[a-z_]{2,24}`, sem repetir, teto 270. */
export function sanitizeDefeatedElements(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v === 'string' && /^[a-z_]{2,24}$/.test(v) && !out.includes(v)) out.push(v);
    if (out.length >= ELEMENT_DEX_MAX) break;
  }
  return out;
}

/** Os ids que contam no dex da Biblioteca (catálogo + curados), deduplicados. */
export const dexUnlockedSet = (list: readonly string[] | undefined): Set<string> =>
  new Set((list ?? []).filter(isLibraryElement));

/** Adiciona elementos vencidos. IDEMPOTENTE: nada novo → devolve o MESMO objeto. Ignora o que não é do catálogo. */
export function applyElementsDefeated<T extends { defeatedElements?: string[] }>(prev: T, ids: readonly (string | undefined)[]): T {
  const have = prev.defeatedElements ?? [];
  const novos: string[] = [];
  for (const id of ids) if (isLibraryElement(id) && !have.includes(id) && !novos.includes(id)) novos.push(id);
  if (novos.length === 0) return prev;
  return { ...prev, defeatedElements: [...have, ...novos] };
}
