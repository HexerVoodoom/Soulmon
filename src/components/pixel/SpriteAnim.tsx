import type { CSSProperties } from 'react';
import type { AnimSheet } from '../../utils/animArt';

/**
 * Quadro a quadro DENTRO do visor: uma tira horizontal de N células, avançada
 * por `background-position` em `steps(N)` (`04` §6.3 — dentro do visor o
 * movimento é discreto, nunca desliza). `prefers-reduced-motion` mostra o
 * ÚLTIMO quadro parado (regra no `index.css`, bloco único de movimento
 * reduzido — `.sm-sheet`). `size` é o lado desenhado; a tira é escalada
 * inteira, com `pixelated`.
 */
export function SpriteAnim({ sheet, size = 32, durationMs = 480, loop = false, hold = false, style, className }: {
  sheet: AnimSheet;
  size?: number;
  durationMs?: number;
  loop?: boolean;
  /** Para no ÚLTIMO quadro e fica (adereço assentado, ex.: o cocô). Sem isto a
   *  tira de uma passada termina em `-sheet-w` (fora da imagem) e o efeito some. */
  hold?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`sm-sheet${className ? ` ${className}` : ''}`}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        backgroundImage: `url(${sheet.src})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${size * sheet.frames}px ${size}px`,
        imageRendering: 'pixelated',
        ['--sm-sheet-frames' as string]: String(sheet.frames),
        ['--sm-sheet-w' as string]: `${size * sheet.frames}px`,
        animation: hold && !loop
          ? `sm-sheet-hold ${durationMs}ms steps(${Math.max(1, sheet.frames - 1)}, end) forwards`
          : `sm-sheet ${durationMs}ms steps(${sheet.frames}, end) ${loop ? 'infinite' : 'forwards'}`,
        ...style,
      } as CSSProperties}
    />
  );
}
