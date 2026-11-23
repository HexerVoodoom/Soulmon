/**
 * CÂMERA DA JORNADA (12/11/2026, pedido do dono): o card do relógio ficava por cima do Soulmon quando ele chegava ao fim do mapa.
 * A câmera agora ANTECIPA: além de seguir o bicho, garante que o topo do sprite (com um olhar adiante) fique sempre abaixo do card,
 * rolando para dentro do "teto" extra do cenário. Puro: sem React; o desenho usa o mesmo mapeamento (unidades do SVG → pixels).
 * O SVG usa `preserveAspectRatio="xMidYMid slice"`: a escala é a MAIOR entre largura e altura e o que sobra é cortado, centralizado.
 */
export const JOURNEY_BLOCK_H = 200;
export const JOURNEY_VIEW_BLOCKS = 1.2;
/** Altura do sprite do Soulmon em unidades do SVG (a mesma do `<image>`). */
export const JOURNEY_SPRITE = 22;
/** Teto extra desenhado acima do fim do mapa (unidades), por onde a câmera pode seguir rolando. */
export const JOURNEY_TOP_PAD = 400;
/** Folga mínima entre a base do card do relógio e o topo do sprite (px). */
export const JOURNEY_CLOCK_MARGIN = 24;
/** Quanto a câmera olha adiante do bicho (em blocos) ao proteger o card. */
export const JOURNEY_LOOKAHEAD = 0.3;

export interface JourneyCameraInput {
  /** Posição do Soulmon (0..blocks, de baixo para cima). */
  petY: number;
  blocks: number;
  screenW: number; screenH: number;
  /** Px do topo da tela até a base do card do relógio. */
  clockBottom: number;
  margin?: number; lookahead?: number;
}
export interface JourneyCamera {
  /** Topo do `viewBox` (unidades do SVG). */
  vbTop: number;
  /** Px por unidade e corte vertical (px) do `slice`. */
  scale: number; cropTop: number;
  /** Altura visível (unidades) = `JOURNEY_VIEW_BLOCKS * JOURNEY_BLOCK_H`. */
  vbHeight: number;
}

export const journeyScale = (screenW: number, screenH: number): { scale: number; cropTop: number } => {
  const w = Math.max(1, screenW); const h = Math.max(1, screenH);
  const scale = Math.max(w / 100, h / (JOURNEY_VIEW_BLOCKS * JOURNEY_BLOCK_H));
  return { scale, cropTop: Math.max(0, (JOURNEY_VIEW_BLOCKS * JOURNEY_BLOCK_H * scale - h) / 2) };
};

export function journeyCamera(i: JourneyCameraInput): JourneyCamera {
  const { blocks } = i;
  const margin = i.margin ?? JOURNEY_CLOCK_MARGIN;
  const look = i.lookahead ?? JOURNEY_LOOKAHEAD;
  const { scale, cropTop } = journeyScale(i.screenW, i.screenH);
  const Y = (y: number) => (blocks - y) * JOURNEY_BLOCK_H;
  const camY = Math.min(blocks - JOURNEY_VIEW_BLOCKS, Math.max(0, i.petY - JOURNEY_VIEW_BLOCKS * 0.45));
  const follow = Y(camY + JOURNEY_VIEW_BLOCKS);
  const spriteTop = Y(Math.min(blocks, i.petY + look)) - JOURNEY_SPRITE;
  const safe = spriteTop - (i.clockBottom + margin + cropTop) / scale;
  return { vbTop: Math.max(-JOURNEY_TOP_PAD, Math.min(follow, safe)), scale, cropTop, vbHeight: JOURNEY_VIEW_BLOCKS * JOURNEY_BLOCK_H };
}

/** Px (a partir do topo da tela) do topo do sprite do Soulmon na câmera dada. */
export function petTopPx(cam: JourneyCamera, petY: number, blocks: number): number {
  return ((blocks - petY) * JOURNEY_BLOCK_H - JOURNEY_SPRITE - cam.vbTop) * cam.scale - cam.cropTop;
}
