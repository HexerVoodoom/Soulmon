import type { CSSProperties } from 'react';

/**
 * A ÂNCORA DO CANTO SUPERIOR ESQUERDO/DIREITO (H9, 02/10/2026).
 *
 * O dono via o ícone do Mapa/casinha/voltar em posições diferentes conforme a
 * tela. A posição da CASINHA do Mapa (`CornerLink`) é a âncora: tudo que leva a
 * outro lugar a partir do canto — a casinha, o voltar-ao-mapa das áreas, a seta
 * de voltar das páginas do menu — usa ESTAS medidas, de um dono só, e nunca
 * digita `top`/`left` por conta própria.
 *
 *  · caixa de toque: 56×56, a 6px abaixo da área segura e `--sm2-space-3` da lateral;
 *  · anel visível: 44×44 (borda 2px), centrado na caixa → 6px de folga dos dois lados.
 */
export const CORNER_BOX = 56;
export const CORNER_RING = 44;
const CORNER_RING_INSET = (CORNER_BOX - CORNER_RING) / 2;

/** `top` da caixa de toque de 56. */
export const CORNER_BOX_TOP = 'calc(env(safe-area-inset-top, 0px) + 6px)';
/** Lateral da caixa de toque de 56. */
export const CORNER_SIDE = 'var(--sm2-space-3)';
/** `top` do ANEL de 44 (= caixa + folga) — para quem desenha só o anel. */
export const CORNER_RING_TOP = `calc(env(safe-area-inset-top, 0px) + ${6 + CORNER_RING_INSET}px)`;
/** Lateral do ANEL de 44. */
export const CORNER_RING_SIDE = `calc(var(--sm2-space-3) + ${CORNER_RING_INSET}px)`;

/** Tinta clara fixa: o canto fica sobre arte/cena escura nos dois temas. */
export const CORNER_INK = '#E9F5F2';

/** O brilho claro que a casinha tinha antes do anel (F3): halo ciano + um fio
 *  branco, para o ícone ler sobre QUALQUER fundo. */
export const CORNER_GLOW = 'drop-shadow(0 0 6px rgba(95, 243, 224, 0.55)) drop-shadow(0 0 1px rgba(233, 245, 242, 0.7))';

/** O anel: traço claro + miolo escuro translúcido (legível sobre fundo claro ou escuro). */
export const CORNER_RING_STYLE: CSSProperties = {
  width: CORNER_RING, height: CORNER_RING, boxSizing: 'border-box',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '2px solid rgba(233,245,242,.85)',
  background: 'rgba(8,25,26,.55)',
  borderRadius: '50%',
};
