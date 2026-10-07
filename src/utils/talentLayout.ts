/**
 * Tarefa B (§2.37) — o DESENHO da árvore de talentos: onde cada nó fica e quais linhas ligam quais nós.
 * Módulo PURO e fora do chunk de entrada (só o `TalentTree`, `lazy`, o importa). Não decide regra nenhuma:
 * quem abre um nó é `talents.ts` (`requires`/`requiresAny`); aqui só se lê esse grafo para desenhá-lo.
 *
 * Geometria: o centro é o hub; três braços saem a −90° (PvP, para cima), 30° (PvE) e 150° (Comércio). Cada nó tem
 * uma profundidade (`r`, ao longo do braço: 120/230/340/450) e um desvio lateral (`lat`, perpendicular ao braço).
 */
import { TALENT_TREE, type TalentPath } from './talents';

export const HUB = 'hub' as const;
/** Raio de cada fileira (px, no tamanho 1:1). */
export const RINGS = [120, 230, 340, 450] as const;
export const ARM_ANGLE: Readonly<Record<TalentPath, number>> = { pvp: -90, pve: 30, comercio: 150 };
/** Tamanho do tabuleiro (px, 1:1) e posição do centro nele. */
export const BOARD = { width: 1180, height: 940, cx: 590, cy: 560 } as const;
export const NODE_SIZE = 56;

/** Fileira (0..3 → `RINGS`) e desvio lateral de cada nó, relativos ao braço do caminho. */
const SLOT: Readonly<Record<string, { ring: 0 | 1 | 2 | 3; lat: number }>> = {
  'tal-pvp-01': { ring: 0, lat: 0 },
  'tal-pvp-02': { ring: 1, lat: -90 },
  'tal-pvp-03': { ring: 1, lat: 90 },
  'tal-pvp-06': { ring: 2, lat: -140 },
  'tal-pvp-05': { ring: 2, lat: 0 },
  'tal-pvp-04': { ring: 2, lat: 140 },
  'tal-pvp-07': { ring: 3, lat: 0 },
  'tal-pve-01': { ring: 0, lat: 0 },
  'tal-pve-02': { ring: 1, lat: -90 },
  'tal-pve-03': { ring: 1, lat: 90 },
  'tal-pve-06': { ring: 2, lat: -90 },
  'tal-pve-05': { ring: 2, lat: 40 },
  'tal-pve-04': { ring: 2, lat: 150 },
  'tal-pve-07': { ring: 3, lat: -20 },
  'tal-com-01': { ring: 0, lat: 0 },
  'tal-com-02': { ring: 1, lat: -90 },
  'tal-com-03': { ring: 1, lat: 90 },
  'tal-com-04': { ring: 2, lat: -140 },
  'tal-com-06': { ring: 2, lat: -40 },
  'tal-com-05': { ring: 2, lat: 90 },
  'tal-com-07': { ring: 3, lat: -50 },
};

export interface LayoutNode { readonly id: string; readonly path: TalentPath; readonly x: number; readonly y: number }
export interface LayoutEdge { readonly from: string; readonly to: string; readonly any: boolean }

function place(id: string, path: TalentPath): { x: number; y: number } {
  const s = SLOT[id];
  const a = (ARM_ANGLE[path] * Math.PI) / 180;
  const r = RINGS[s.ring];
  return {
    x: BOARD.cx + Math.cos(a) * r - Math.sin(a) * s.lat,
    y: BOARD.cy + Math.sin(a) * r + Math.cos(a) * s.lat,
  };
}

export const LAYOUT_NODES: readonly LayoutNode[] = TALENT_TREE.map((n) => ({ id: n.id, path: n.path, ...place(n.id, n.path) }));
export const LAYOUT_BY_ID: ReadonlyMap<string, LayoutNode> = new Map(LAYOUT_NODES.map((n) => [n.id, n]));
export const HUB_POINT = { x: BOARD.cx, y: BOARD.cy } as const;

/** As ligações vêm do grafo de pré-requisitos; o ponto de partida de cada caminho liga ao hub. `any` = ramo de "um OU outro". */
export const LAYOUT_EDGES: readonly LayoutEdge[] = TALENT_TREE.flatMap((n): LayoutEdge[] => {
  const e: LayoutEdge[] = [];
  for (const r of n.requires ?? []) e.push({ from: r.id, to: n.id, any: false });
  for (const r of n.requiresAny ?? []) e.push({ from: r.id, to: n.id, any: true });
  if (e.length === 0) e.push({ from: HUB, to: n.id, any: false });
  return e;
});

export function pointOf(id: string): { x: number; y: number } {
  return id === HUB ? HUB_POINT : LAYOUT_BY_ID.get(id)!;
}

/** Navegação por setas: o nó mais próximo na direção pedida (ou `null`). Vizinho por ângulo, não por grade. */
export function neighborIn(from: string, dir: 'left' | 'right' | 'up' | 'down'): string | null {
  const p = pointOf(from);
  const vx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
  const vy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
  let best: string | null = null;
  let bestScore = Infinity;
  for (const n of LAYOUT_NODES) {
    if (n.id === from) continue;
    const dx = n.x - p.x, dy = n.y - p.y;
    const along = dx * vx + dy * vy;
    if (along <= 1) continue;
    const across = Math.abs(dx * vy) + Math.abs(dy * vx);
    const score = along + across * 1.5;
    if (score < bestScore) { bestScore = score; best = n.id; }
  }
  return best;
}
