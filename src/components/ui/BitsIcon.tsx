import type { CSSProperties } from 'react';

/**
 * `BitsIcon` — a moeda dos BITS (I4, 02/10/2026, pedido do dono: "ilustração
 * própria para os Bits"). Ponto ÚNICO de troca de arte: todo lugar que mostra
 * Bits com ícone usa este componente.
 *
 * Troca de arte SEM tocar em código: largar `src/assets/icons/bits.png`
 * (pixel art, alfa real, quadrada) — o `import.meta.glob` abaixo detecta e a
 * imagem passa a valer no lugar do SVG provisório. Sem o arquivo, desenha uma
 * moeda pixel 8×8 na identidade: aro ciano cíclico (`primary-ink`) e miolo
 * dourado (`gold-ink`) com uma "barra" gravada (o bit). As cores são tokens,
 * então respondem ao tema claro/escuro.
 *
 * Decorativo por padrão (`aria-hidden`): o número e a palavra "Bits" ao lado
 * carregam o nome. Passe `label` quando o ícone aparecer sozinho.
 */
const ART = Object.values(
  import.meta.glob('../../assets/icons/bits.png', { eager: true, import: 'default' }) as Record<string, string>,
)[0] as string | undefined;

/** R = aro, G = miolo, H = barra gravada, . = vazio. */
const COIN = [
  '..RRRR..',
  '.RGGGGR.',
  'RGGHHGGR',
  'RGGHHGGR',
  'RGGHHGGR',
  'RGGHHGGR',
  '.RGGGGR.',
  '..RRRR..',
];
const FILL: Record<string, string> = {
  R: 'var(--sm2-primary-ink)',
  G: 'var(--sm2-gold-ink)',
  H: 'var(--sm2-surface)',
};

export function BitsIcon({ size = 20, label, style }: {
  /** Lado em CSS px. 20 (inline, ao lado de texto) é o padrão; 32 para destaque. */
  size?: number;
  /** Nome acessível, só quando o ícone aparece SEM o texto "Bits" ao lado. */
  label?: string;
  style?: CSSProperties;
}) {
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const };
  const box: CSSProperties = { width: size, height: size, flex: 'none', display: 'inline-block', verticalAlign: 'middle', imageRendering: 'pixelated', ...style };
  if (ART) {
    return <img data-bits-kind="art" src={ART} alt={label ?? ''} width={size} height={size} {...(label ? {} : { 'aria-hidden': true as const })} style={box} />;
  }
  return (
    <svg data-bits-kind="svg" viewBox="0 0 8 8" width={size} height={size} shapeRendering="crispEdges" {...a11y} style={box}>
      {COIN.flatMap((row, y) => Array.from(row).map((c, x) => (
        c === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={FILL[c]} />
      )))}
    </svg>
  );
}
