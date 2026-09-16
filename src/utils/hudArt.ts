// Peças pixel do HUD DENTRO do visor (D3, 15/09/2026 — o dono decidiu pixel,
// não vetor, para barras e moldura do visor). Leva sprites-20260915:
//   bar-frame-96x8 — moldura de barra vazia (A5), trilho petróleo, aro cobre
//   bar-fill-6     — um segmento ciano 6×6, repetido dentro do trilho
//   frame-pipe-vine-96 — moldura 9-slice 96² (A6), cantos de 24 px
// Mapa só; o consumidor (`HomeHud`, `Viewport`) entra com o canvas Sistema.
import barFrame from '../assets/soulmon/hud/bar-frame-96x8.png';
import barFill from '../assets/soulmon/hud/bar-fill-6.png';
import frame from '../assets/soulmon/hud/frame-pipe-vine-96.png';

export const HUD_ART = {
  barFrame, barFill, frame,
  /** `border-image-slice` da moldura: cantos de 24 px em 96. */
  frameSlice: 24,
} as const;
