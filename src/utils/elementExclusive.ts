import type { ClassElementId } from './soulProfile/types';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { curatedComponents } from './elementosCurados';

/**
 * COSMÉTICO EXCLUSIVO DE ELEMENTO (04/11/2026, pedido do dono): cenário, moldura ou decoração
 * com `element` só APARECE À VENDA para quem tem um Soulmon daquele elemento.
 *
 * Regras (e por quê):
 *  · Sem `element` = item comum, todo mundo vê (o catálogo de hoje inteiro).
 *  · O elemento do Soulmon é o de `petElementOf` (poção > inicial > oráculo) — a mesma fonte do combate.
 *  · Elemento DERIVADO (par, ex. `vapor` = fogo+água) conta como cada um dos seus dois componentes:
 *    um Soulmon de Vapor vê os exclusivos de Fogo e de Água. Também casa o id exato (exclusivo de `lava`).
 *  · POSSE É PERMANENTE: quem já tem o item continua vendo-o (para equipar) e usando-o mesmo que o
 *    Soulmon troque de elemento (poção, renascimento). O filtro é só de VITRINE, nunca de save/inventário.
 *  · Sem elemento conhecido (`undefined`, `neutro` do Corvo) = nenhum exclusivo à venda.
 */
export type CosmeticElement = ClassElementId | string;

const COMPONENTES = new Map<string, readonly string[]>(DERIVED_ELEMENT_PAIRS.map(d => [d.id, d.componentes as readonly string[]]));

/** O Soulmon com `petElement` "é" do elemento `itemElement`? */
export function petHasElement(itemElement: CosmeticElement, petElement: string | null | undefined): boolean {
  if (!petElement) return false;
  if (petElement === itemElement) return true;
  return (COMPONENTES.get(petElement) ?? curatedComponents(petElement) ?? []).includes(itemElement);
}

/** O item aparece na vitrine? Comum: sempre. Exclusivo: só do elemento certo — ou se já é seu. */
export function elementShopVisible(
  item: { id: string; element?: CosmeticElement },
  petElement: string | null | undefined,
  owned: readonly string[] = [],
): boolean {
  if (!item.element) return true;
  if (owned.includes(item.id)) return true;
  return petHasElement(item.element, petElement);
}
