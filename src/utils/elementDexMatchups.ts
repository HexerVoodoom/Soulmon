/**
 * Forte contra / fraco contra de um elemento do dex (separado de `elementDex.ts` para o dex leve não puxar o `arena.ts`).
 * Para derivado vale a base de vantagem (`baseDominanteDoElemento`: o anel só conhece as 20 bases). Ordem do anel.
 */
import { baseDominanteDoElemento } from './soulProfile/ficha/elementoNome';
import { COUNTERS, countersElement } from './arena';
import { BASE_ELEMENT_IDS } from './elementDex';

export function elementMatchups(id: string): { strong: string[]; weak: string[] } {
  const base = baseDominanteDoElemento(id);
  const strong = [...(COUNTERS[base] ?? [])];
  const weak = BASE_ELEMENT_IDS.filter(x => countersElement(x, base));
  return { strong, weak };
}
