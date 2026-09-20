import type { CSSProperties, ReactNode } from 'react';

/**
 * `MiniGlass` — um vidro SEM anel (o slot SIS-07 do canvas Sistema, na
 * versão "palco" do canvas Pet, D-P7/D-P8/D-P9).
 *
 * É a fronteira pixel/vetor do `Viewport` reduzida ao mínimo: o retângulo
 * `--sm2-viewport-bg` (escuro nos dois temas) + o reflexo `.sm2-viewport-glass`,
 * sem o anel de cobre e sem respiração. Serve para a arte pixel que vive
 * dentro de uma CÉLULA vetor — a cena do Dex (64², cena a 48), a arte do
 * diário (48²) e a forma anterior da ficha (80², sprite a 64) — onde um anel
 * por célula leria como oito visores em vez de uma coleção (Home D-H6).
 *
 * Contrato igual ao do `Viewport`: **escala inteira** (quem chama passa a
 * arte em múltiplo de 0,5× do nativo), `aria-hidden` — o nome fica FORA, no
 * texto da célula. Reusa as classes do `Viewport` (`index.css`), nenhum CSS
 * novo; o raio é `--sm2-radius-sm` porque é célula, não visor.
 */
export interface MiniGlassProps {
  /** Lado do vidro, em CSS px (48 · 64 · 80). */
  size: number;
  children?: ReactNode;
  style?: CSSProperties;
}

export function MiniGlass({ size, children, style }: MiniGlassProps) {
  return (
    <span
      className="sm2-viewport-screen sm2-visor"
      aria-hidden="true"
      data-mini-glass
      style={{
        width: size,
        height: size,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--sm2-radius-sm)',
        ...style,
      }}
    >
      {children}
      <span className="sm2-viewport-glass" style={{ borderRadius: 'var(--sm2-radius-sm)' }} />
    </span>
  );
}

export default MiniGlass;
