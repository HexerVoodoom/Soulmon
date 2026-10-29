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
  'forja:ferreiro': [0.131, 0, 0.871, 0.742],
  // O Restaurante em obra (14/10/2026): andaimes e tijolos, alfa > 20.
  'mercado:restaurante': [0.027, 0.277, 0.97, 0.97],
  'arena:torneio': [0.073, 0.107, 0.927, 1.0],
  'arena:duelo': [0.167, 0.347, 0.833, 1.0],
  'arena:guerra': [0.039, 0.059, 0.959, 0.939], // W12 (20/10/2026): prédio do banco isométrico de 23/09 (`hf_20260923_193918_c287e46f…`, coliseu em cabeça de pedra com cristais), alfa > 20
  'hall:feira': [0.158, 0.0, 0.84, 0.742],
  'exploracao:fenda': [0.23, 0.01, 0.767, 0.987], // 28/10/2026: prédio próprio do Endless Rift (`lote-exploracao-endless-rift`, alfa > 20)
  'exploracao:passeio': [0.243, 0.12, 0.76, 0.973],
  // Prédios próprios desde 04/10/2026 (antes reusavam o Observatório e a Biblioteca).
  // 07/10/2026 (escolha do dono): Oficina = santuário Akasha (torre estreita), Caderno = santuário do Pântano, Amigos = abrigo da Terra — bbox do alfa > 20.
  'forja:oficina': [0.207, 0.102, 0.793, 0.742],
  // 11/10/2026: chalé `-campina` (alfa > 20), no lugar do santuário do Pântano ([0.13, 0.027, 0.867, 0.983]).
  'forja:caderno': [0.209, 0, 0.793, 0.742], // 18/10/2026 (§88): prédios Caderno/Oficina repintados (faixa D); caixa remedida pelo alfa
  'jogos:salao': [0.017, 0, 0.98, 1],
  'jogos:mente': [0.227, 0.12, 0.773, 0.973],
  'exploracao:dungeon': [0.087, 0.007, 0.91, 0.993], // 28/10/2026 (dono, 26/10): opção d, Cripta de cristal (`lote-jogos-dungeon-cripta`, alfa > 20)
  'forja:refugio': [0.109, 0, 0.893, 0.742],
  'laboratorio:evolucao': [0.174, 0, 0.826, 0.742],
  'laboratorio:stats': [0.184, 0, 0.818, 0.742],
  'laboratorio:perfil': [0.02, 0.487, 0.98, 0.97], // P2b (14/10/2026): `lote-laboratorio-perfil` (espelho-d'água da alma, alfa > 20)
  // D-50 (19/10/2026): Biblioteca e Círculo de Amigos mudaram do Hall para o Laboratório. W5 (19/10/2026): arte nova do Clã/Feira/Grove/Evolução/Arquivo/Vínculo/Amigos/Guerra/Caderno/Oficina — 512², recorte da bbox + ~4% de margem, caixa medida com alfa > 20.
  'laboratorio:biblioteca': [0.117, 0, 0.883, 0.742],
  'hall:grove': [0.18, 0.0, 0.82, 0.742],
  'hall:guilda': [0.184, 0.0, 0.816, 0.742],
};

/**
 * MIOLO DE TOQUE (26/10/2026, dono: ARENA com os prédios sobrepostos no desenho). Fração da caixa OPACA (`LOT_ART_BOUNDS`) que
 * NÃO recebe toque, por lado (esquerda, topo, direita, base). A arte continua inteira; só o alvo encolhe — usado por `lotHitRects`
 * E pelo botão real do `AreaScene` (`data-area-lot-hit`), então o que o contrato mede é o que o jogador toca.
 */
export const LOT_HIT_INSET: Record<string, LotBounds> = {
  'arena:torneio': [0, 0, 0.22, 0],
  'arena:duelo': [0.2, 0, 0, 0],
  'arena:guerra': [0.2, 0, 0, 0],
};

/** Deslocamento do RÓTULO (px, x e y) por lote — tira o nome de trás do prédio vizinho que o cobre. */
export const LOT_LABEL_OFFSET: Record<string, readonly [number, number]> = {
  'arena:torneio': [-38, 0],
};

/** Caixa de TOQUE do sprite: a opaca menos o miolo (`LOT_HIT_INSET`). */
export function lotHitBounds(areaId: AreaId, lotId: string): LotBounds {
  const b = lotArtBounds(areaId, lotId) ?? [0, 0, 1, 1];
  const i = LOT_HIT_INSET[`${areaId}:${lotId}`];
  if (!i) return b;
  const w = b[2] - b[0], h = b[3] - b[1];
  return [b[0] + i[0] * w, b[1] + i[1] * h, b[2] - i[2] * w, b[3] - i[3] * h];
}

export function lotLabelOffset(areaId: AreaId, lotId: string): readonly [number, number] {
  return LOT_LABEL_OFFSET[`${areaId}:${lotId}`] ?? [0, 0];
}

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
  const b = lotHitBounds(areaId, lot.id);
  const [ox, oy] = lotLabelOffset(areaId, lot.id);
  const art: Rect = { x0: x0 + b[0] * bw, y0: y0 + b[1] * bw, x1: x0 + b[2] * bw, y1: y0 + b[3] * bw };
  const labelW = Math.min(bw, lot.label.length * 7.5 + 20);
  const label: Rect = { x0: x0 + (bw - labelW) / 2 + ox, y0: y0 + bw + oy, x1: x0 + (bw + labelW) / 2 + ox, y1: y0 + total + oy };
  return [art, label];
}
