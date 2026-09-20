import type { CSSProperties } from 'react';
import { FLAME_GROUPS, FLAME_H, FLAME_W } from './flame';

/**
 * A chama do kit desenhada em React — um `<rect>` por pixel, `crispEdges`,
 * sempre em ESCALA INTEIRA (`scale` 2 = 38×60 no slot do portão; a splash do
 * `index.html` usa 4 = 76×120 e é literal, ver `flame.ts`).
 *
 * É pixel art: vive DENTRO de um vidro `viewport-bg` (D-O4 / X3 do canvas
 * Onboarding-funil). Solta sobre a página clara, os pixels claros somem a
 * 1,10:1. `aria-hidden` — o nome fica no slot (`role=img "Soulmon"`).
 */
export function BrandFlame({ scale = 2, style }: { scale?: number; style?: CSSProperties }) {
  const s = Math.max(1, Math.round(scale));
  return (
    <svg
      viewBox={`0 0 ${FLAME_W} ${FLAME_H}`}
      width={FLAME_W * s}
      height={FLAME_H * s}
      aria-hidden="true"
      style={{ shapeRendering: 'crispEdges', display: 'block', flex: 'none', ...style }}
    >
      {FLAME_GROUPS.map(g => (
        <g key={g.fill} fill={g.fill}>
          {g.px.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />)}
        </g>
      ))}
    </svg>
  );
}
