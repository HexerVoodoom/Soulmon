import type { CSSProperties } from 'react';
import folha from '../../assets/soulmon/chama-alma/chama-alma-folha.webp';
import { usePrefersReducedMotion } from './Viewport';

/**
 * A chama da alma ANIMADA (turquesa, nunca laranja). Folha de 8 quadros em grade 4x2
 * (`chama-alma-folha.webp`), tocada só por CSS (`steps`), sem JS por quadro.
 * Com `prefers-reduced-motion` fica parada no quadro 1.
 *
 * `height` é a altura em px; a largura segue a proporção do quadro (`FRAME_ASPECT`).
 */
export const FLAME_SHEET_COLS = 4;
export const FLAME_SHEET_ROWS = 2;
export const FLAME_SHEET_FRAMES = FLAME_SHEET_COLS * FLAME_SHEET_ROWS;
/** Largura/altura de um quadro da folha. */
export const FRAME_ASPECT = 1;

const KEYFRAMES = (() => {
  const steps: string[] = [];
  for (let i = 0; i < FLAME_SHEET_FRAMES; i++) {
    const col = i % FLAME_SHEET_COLS;
    const row = Math.floor(i / FLAME_SHEET_COLS);
    const x = (col / (FLAME_SHEET_COLS - 1)) * 100;
    const y = (row / (FLAME_SHEET_ROWS - 1)) * 100;
    steps.push(`${((i / FLAME_SHEET_FRAMES) * 100).toFixed(3)}%{background-position:${x}% ${y}%}`);
  }
  return `@keyframes sm-chama-alma{${steps.join('')}100%{background-position:0% 0%}}`;
})();

const CSS = `${KEYFRAMES}
.sm-chama-alma{display:block;flex:none;background-repeat:no-repeat;background-size:${FLAME_SHEET_COLS * 100}% ${FLAME_SHEET_ROWS * 100}%;
  image-rendering:pixelated;animation:sm-chama-alma var(--sm-chama-dur,.9s) step-end infinite}
.sm-chama-alma[data-parada="true"]{animation:none;background-position:0% 0%}
@media (prefers-reduced-motion: reduce){.sm-chama-alma{animation:none;background-position:0% 0%}}`;

export interface SoulFlameAnimProps {
  /** Altura em px (a largura sai do quadro). */
  height?: number;
  /** Duração de um ciclo completo, em segundos. */
  cycleSeconds?: number;
  className?: string;
  style?: CSSProperties;
}

export function SoulFlameAnim({ height = 96, cycleSeconds = 0.9, className, style }: SoulFlameAnimProps) {
  const reduced = usePrefersReducedMotion();
  return (
    <>
      <style>{CSS}</style>
      <span
        aria-hidden="true"
        data-soul-flame-anim
        data-parada={reduced ? 'true' : undefined}
        className={`sm-chama-alma${className ? ` ${className}` : ''}`}
        style={{
          width: Math.round(height * FRAME_ASPECT),
          height,
          backgroundImage: `url(${folha})`,
          ['--sm-chama-dur' as string]: `${cycleSeconds}s`,
          ...style,
        }}
      />
    </>
  );
}

export default SoulFlameAnim;
