import { BASE_ELEMENT_IDS } from './elementDex';
import { curatedComponents } from './elementosCurados';

/**
 * CATEGORIAS DA ABA ELEMENTOS (P5/24.3): Base (20), Comb II (pares), Comb III (curados de 3), Comb IV (curados de 4) e
 * Special (o neutro do corvo). Não existe elemento "Nightmare" no dex (Pesadelo é modo de jogo, não elemento), então Special = Neutral.
 */
export type ElementoCategoria = 'base' | 'ii' | 'iii' | 'iv' | 'special';
export const ELEMENTO_CATEGORIAS: readonly ElementoCategoria[] = ['base', 'ii', 'iii', 'iv', 'special'];
const BASE: ReadonlySet<string> = new Set(BASE_ELEMENT_IDS);

export function elementoCategoria(id: string): ElementoCategoria {
  if (BASE.has(id)) return 'base';
  if (id === 'neutro') return 'special';
  const n = curatedComponents(id)?.length ?? 2;
  return n >= 4 ? 'iv' : n === 3 ? 'iii' : 'ii';
}

export const ELEMENTO_CATEGORIA_ROTULO: Readonly<Record<ElementoCategoria, { pt: string; en: string }>> = {
  base: { pt: 'Base', en: 'Base' },
  ii: { pt: 'Comb II', en: 'Comb II' },
  iii: { pt: 'Comb III', en: 'Comb III' },
  iv: { pt: 'Comb IV', en: 'Comb IV' },
  special: { pt: 'Especial', en: 'Special' },
};
