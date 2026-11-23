// 🌋 A MASMORRA TEMÁTICA POR ELEMENTO (pedido do dono, 08/11/2026 — REGISTRO).
//
// Cada ELEMENTO ocupa 2 camadas seguidas. A ordem é: primeiro todos os elementos BASE (um a um), depois todos os de 2 componentes,
// depois os de 3, depois os de 4; ao terminar tudo, volta ao começo (loop). Em cada camada só aparecem Soulmons DAQUELE elemento
// e o cenário é o do elemento (`combatSceneBg`: o próprio, e o do elemento base dominante enquanto a arte própria não existe).
//
// Dono único e PURO (sem arte, sem relógio, sem `Math.random`): a tela, a conta de quem ficou fora (`dungeonAway.ts`) e os testes
// leem o MESMO `elementoDaCamada` — regra copiada é regra que diverge em silêncio.
import { BASE_ELEMENT_IDS, DERIVED_ELEMENT_IDS } from './elementDex';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { ELEMENTOS_CURADOS } from './elementosCurados';

/** Quantas camadas seguidas cada elemento ocupa. */
export const CAMADAS_POR_ELEMENTO = 2;

/** Quantos componentes (elementos base) tem o elemento: 1 (base), 2 (par), 3 (trio) ou 4. `undefined` = não é da masmorra (ex.: neutro). */
const COMPONENTES = new Map<string, number>([
  ...BASE_ELEMENT_IDS.map(id => [id, 1] as const),
  ...DERIVED_ELEMENT_PAIRS.map(d => [d.id, d.componentes.length] as const),
  ...ELEMENTOS_CURADOS.map(e => [e.id, e.componentes.length] as const),
]);

export const componentesDoElemento = (id: string): number | undefined => COMPONENTES.get(id);

/** A fila inteira da masmorra: base → 2 → 3 → 4 componentes, cada grupo na ordem do catálogo. Sem repetição. */
export const ELEMENTOS_DA_MASMORRA: readonly string[] = (() => {
  const vistos = new Set<string>();
  const todos = [...BASE_ELEMENT_IDS, ...DERIVED_ELEMENT_IDS, ...ELEMENTOS_CURADOS.map(e => e.id)].filter(id => {
    if (vistos.has(id)) return false;
    vistos.add(id);
    return COMPONENTES.has(id);
  });
  const ordem = [1, 2, 3, 4];
  return ordem.flatMap(n => todos.filter(id => COMPONENTES.get(id) === n));
})();

/** Quantas camadas tem um ciclo inteiro (depois dele, volta à camada 1). */
export const CAMADAS_DO_CICLO = ELEMENTOS_DA_MASMORRA.length * CAMADAS_POR_ELEMENTO;

/** O elemento de uma camada (1-based). Entrada ruim cai na camada 1. Dá a volta no fim do ciclo. */
export function elementoDaCamada(layer: number): string {
  const l = Number.isFinite(layer) ? Math.max(1, Math.floor(layer)) : 1;
  return ELEMENTOS_DA_MASMORRA[Math.floor((l - 1) / CAMADAS_POR_ELEMENTO) % ELEMENTOS_DA_MASMORRA.length];
}
