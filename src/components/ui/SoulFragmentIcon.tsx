import type { CSSProperties } from 'react';
import lanterna from '../../assets/soulmon/evo/lanterna-2.png';

/**
 * `SoulFragmentIcon` — o ícone da EVOLUÇÃO. Desde 30/10/2026 (dono) é a LANTERNA do corvo (a chama dentro cresce até o
 * Soulmon evoluir; `evo/lanterna-*.png`), em todo lugar do progresso de evolução: Centro de Evolução (`EvolutionPath`),
 * medidor mini e cerimônia. Antes (REGISTRO §153) era o cristal losango em SVG.
 *
 * Decorativo por padrão (`aria-hidden`): o número e o nome ao lado o dizem.
 * Passe `label` quando o ícone aparecer sozinho.
 */
export function SoulFragmentIcon({ size = 20, label, style }: {
  /** Lado em CSS px. 20 (inline, ao lado de texto) é o padrão. */
  size?: number;
  /** Nome acessível, só quando o ícone aparece SEM o texto ao lado. */
  label?: string;
  style?: CSSProperties;
}) {
  const a11y = label ? { role: 'img' as const, 'aria-label': label, alt: label } : { 'aria-hidden': true as const, alt: '' };
  return (
    <img
      data-soul-fragment-icon
      src={lanterna}
      width={size} height={size} {...a11y}
      style={{ width: size, height: size, flex: 'none', display: 'inline-block', verticalAlign: 'middle', imageRendering: 'pixelated', ...style }}
    />
  );
}
