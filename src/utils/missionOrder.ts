/**
 * Ordem das listas de missão (revisão 2 do dono, A5): as PRONTAS para resgatar sobem ao topo,
 * depois as já concluídas/resgatadas, e as em aberto ficam abaixo. Estável: dentro de cada
 * grupo vale a ordem original. PURA — quem chama só informa o estado de cada item.
 */
export type MissionRankState = 'ready' | 'claimed' | 'open';

const RANK: Record<MissionRankState, number> = { ready: 0, claimed: 1, open: 2 };

export function missionsDoneFirst<T>(items: readonly T[], stateOf: (item: T) => MissionRankState): T[] {
  return items
    .map((item, i) => ({ item, i, r: RANK[stateOf(item)] }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map(x => x.item);
}
