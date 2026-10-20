import type { CSSProperties } from 'react';

/**
 * `SoulFragmentIcon` — o glifo do FRAGMENTO DE ALMA (20/10/2026, REGISTRO §151).
 * Cristal losango em pixel 8×8, na mesma família do `BitsIcon` (SVG de `rect`s
 * `crispEdges`, cores por token — responde ao tema claro/escuro), mas com forma
 * própria: Bits é MOEDA redonda, o fragmento é uma lasca pontuda. Nunca usa o
 * dourado (Honra) nem o roxo (Créditos). Arte autoral, sem imagem gerada.
 *
 * Decorativo por padrão (`aria-hidden`): o número e o nome ao lado o dizem.
 * Passe `label` quando o ícone aparecer sozinho.
 */

/** R = contorno, G = corpo, H = brilho, . = vazio. */
const SHARD = [
  '...RR...',
  '..RGGR..',
  '.RGHGGR.',
  'RGHGGGGR',
  'RGGGGGGR',
  '.RGGGGR.',
  '..RGGR..',
  '...RR...',
];
const FILL: Record<string, string> = {
  R: 'var(--sm2-primary-ink)',
  G: 'var(--sm2-primary-fill)',
  H: 'var(--sm2-surface)',
};

export function SoulFragmentIcon({ size = 20, label, style }: {
  /** Lado em CSS px. 20 (inline, ao lado de texto) é o padrão. */
  size?: number;
  /** Nome acessível, só quando o ícone aparece SEM o texto ao lado. */
  label?: string;
  style?: CSSProperties;
}) {
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const };
  return (
    <svg
      data-soul-fragment-icon
      viewBox="0 0 8 8" width={size} height={size} shapeRendering="crispEdges" {...a11y}
      style={{ width: size, height: size, flex: 'none', display: 'inline-block', verticalAlign: 'middle', imageRendering: 'pixelated', ...style }}
    >
      {SHARD.flatMap((row, y) => Array.from(row).map((c, x) => (
        c === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={FILL[c]} />
      )))}
    </svg>
  );
}
