/**
 * Ordem das listas de missão (revisão do dono, 20/10/2026 — REVOGA a ordem A5 "concluídas antes das abertas"):
 * as PRONTAS para resgatar ("?") sobem ao topo, as em aberto ficam no meio e as já resgatadas/entregues vão para o FIM
 * da fila. Estável: dentro de cada grupo vale a ordem original. PURA — quem chama só informa o estado de cada item.
 */
export type MissionRankState = 'ready' | 'claimed' | 'open';

const RANK: Record<MissionRankState, number> = { ready: 0, open: 1, claimed: 2 };

export function missionsInQueueOrder<T>(items: readonly T[], stateOf: (item: T) => MissionRankState): T[] {
  return items
    .map((item, i) => ({ item, i, r: RANK[stateOf(item)] }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map(x => x.item);
}

export interface MissionBoardLayout<T> {
  /** Missões especiais ainda NÃO concluídas, sempre acima de tudo (em ordem de fila). */
  top: T[];
  /** Normais prontas, normais abertas e, por fim, TODAS as concluídas (especiais e normais), ordem original estável. */
  rest: T[];
  /** A linha fina entre o topo e o resto só existe quando os dois lados têm itens. */
  divider: boolean;
}

/** Monta o quadro da aba Diárias: especiais abertas no topo; o que foi concluído desce para o fim da categoria. PURA. */
export function layoutMissionBoard<T>(
  items: readonly T[],
  stateOf: (item: T) => MissionRankState,
  isSpecial: (item: T) => boolean,
): MissionBoardLayout<T> {
  const top = missionsInQueueOrder(items.filter(x => isSpecial(x) && stateOf(x) !== 'claimed'), stateOf);
  const rest = missionsInQueueOrder(items.filter(x => !(isSpecial(x) && stateOf(x) !== 'claimed')), stateOf);
  return { top, rest, divider: top.length > 0 && rest.length > 0 };
}

export function boardHasDivider(layout: { top: readonly unknown[]; rest: readonly unknown[] }): boolean {
  return layout.top.length > 0 && layout.rest.length > 0;
}
