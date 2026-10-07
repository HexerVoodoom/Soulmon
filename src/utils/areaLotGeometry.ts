/**
 * GEOMETRIA DOS LOTES (02/10/2026, H11/H12) — onde cada construção toca de
 * verdade na cena.
 *
 * Por que existe: os sprites dos lotes são quadrados 300² com MUITO alfa em
 * volta (a torre de Conquistas ocupa só 50% da largura; o Observatório, 51%).
 * A caixa do botão é o quadrado inteiro, então caixas vizinhas se sobrepunham
 * e o toque no pé de um prédio caía no vizinho — ora abria o Observatório
 * (NPC Quill), ora a Árvore da Evolução (Vesca), conforme o ponto tocado (H11).
 * Agora o alvo de toque de um lote é só a caixa do que é OPACO + o rótulo
 * (`AreaScene`), e o contrato (`areaLotGeometry.contract.test.ts`) reprova
 * qualquer par de lotes de uma área cujos alvos se encostem.
 *
 * `LOT_ART_BOUNDS` é a caixa opaca de cada sprite em frações do quadrado
 * (esquerda, topo, direita, base) — medida com alfa > 20 por
 * `areaLotGeometry.contract.test.ts` contra os PNG: se a arte trocar, o teste
 * diz os números novos.
 */
import type { AreaId } from '../navigation';

export type LotBounds = readonly [number, number, number, number];

export const LOT_ART_BOUNDS: Record<string, LotBounds> = {
  'mercado:itens': [0, 0, 0.997, 1],
  'mercado:decoracao': [0, 0.003, 1, 0.997],
  'mercado:background': [0.023, 0, 0.973, 1],
  'mercado:conquistas': [0.253, 0.027, 0.75, 0.973],
  // O Soulsmith (07/10/2026): a oficina de lava do domínio Fogo.
  'mercado:ferreiro': [0.04, 0.08, 0.963, 0.94],
  'arena:torneio': [0.073, 0, 0.927, 1],
  'arena:duelo': [0.167, 0, 0.833, 1],
  'arena:feira': [0.153, 0.12, 0.847, 0.973],
  'exploracao:masmorra': [0.23, 0, 0.767, 1],
  'exploracao:passeio': [0.243, 0.12, 0.76, 0.973],
  // Prédios próprios desde 04/10/2026 (antes reusavam o Observatório e a Biblioteca).
  'exploracao:oficina': [0.027, 0.07, 0.973, 0.973],
  'exploracao:caderno': [0.123, 0.027, 0.88, 0.973],
  'jogos:salao': [0.017, 0, 0.98, 1],
  'jogos:mente': [0.227, 0.12, 0.773, 0.973],
  'jogos:refugio': [0.147, 0.12, 0.857, 0.973],
  'laboratorio:evolucao': [0.1, 0.027, 0.9, 0.973],
  'laboratorio:pet': [0.227, 0.217, 0.773, 0.973],
  'laboratorio:stats': [0.247, 0.12, 0.757, 0.973],
  'hall:biblioteca': [0.027, 0.03, 0.973, 0.973],
  'hall:amigos': [0.123, 0.34, 0.88, 0.973],
  'hall:guilda': [0.057, 0.037, 0.943, 0.97],
};

export function lotArtBounds(areaId: AreaId, lotId: string): LotBounds | undefined {
  return LOT_ART_BOUNDS[`${areaId}:${lotId}`];
}

/** Altura do rótulo sob o prédio, em px (texto xs + respiro + borda). */
export const LOT_LABEL_H = 22;
/** Largura mínima do botão de um lote (o `minWidth` do `AreaScene`). */
export const LOT_MIN_WIDTH_PX = 120;

export interface Rect { x0: number; y0: number; x1: number; y1: number }

/**
 * Os alvos de toque de UM lote numa cena `viewW × viewH` (px): a caixa opaca
 * do sprite e a do rótulo. Espelha o layout do `AreaScene` (botão com
 * `translate(-50%, -80%)`, imagem quadrada de largura `width`, rótulo colado
 * na base da imagem).
 */
export function lotHitRects(
  areaId: AreaId,
  lot: { id: string; left: string; top: string; width?: string; label: string },
  viewW: number,
  viewH: number,
): Rect[] {
  const pct = (s: string) => parseFloat(s) / 100;
  const bw = Math.max(pct(lot.width ?? '38%') * viewW, LOT_MIN_WIDTH_PX);
  const total = bw + LOT_LABEL_H;
  const x0 = pct(lot.left) * viewW - bw / 2;
  const y0 = pct(lot.top) * viewH - 0.8 * total;
  const b = lotArtBounds(areaId, lot.id) ?? [0, 0, 1, 1];
  const art: Rect = { x0: x0 + b[0] * bw, y0: y0 + b[1] * bw, x1: x0 + b[2] * bw, y1: y0 + b[3] * bw };
  const labelW = Math.min(bw, lot.label.length * 7.5 + 20);
  const label: Rect = { x0: x0 + (bw - labelW) / 2, y0: y0 + bw, x1: x0 + (bw + labelW) / 2, y1: y0 + total };
  return [art, label];
}
