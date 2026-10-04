import type { CSSProperties } from 'react';
import { NodeArt, NODE_GLASS, NODE_SIZE, NODE_SPRITE, type SoulNodeVisual } from './nodeArt';

export type { SoulNodeVisual };

interface SoulNodeProps {
  visual: SoulNodeVisual;
  /**
   * A arte dentro do vidro: o sprite PRÓPRIO/de reserva da forma (256² a 64,
   * 0,25× — Pet D-P9) ou o placeholder v3 enquanto o Oráculo desenha (D-E9).
   * Ausente = vidro vazio (a forma oculta sem sprite próprio é silêncio).
   */
  sprite?: string;
  /**
   * WP4.21 / Pet D-P7 — desenha o `sprite` como SILHUETA: `mask-image` do
   * PNG preenchida por `color-mix(viewport-bg 58%, viewport-ink)`. Sem alfa,
   * sem `filter`: a forma inteira, nenhuma cor — o contorno é a antecipação,
   * a identidade continua atrás do spoiler.
   */
  silhouette?: boolean;
  /** O Oráculo está desenhando esta forma (anel tracejado, D-E9). */
  busy?: boolean;
  /** Rodada 7 (I3): a cor do ramo no anel do nó. */
  ringColor?: string;
  /** Rodada 7 (I5): brilho (glow) na cor dada — o ramo que lidera. */
  glowColor?: string;
  /** Rótulo acessível COMPLETO: nome + situação + o que o toque faz (V2). */
  label: string;
  title?: string;
  onClick?: () => void;
}

/**
 * Um nó da árvore de evolução (canvas Evolução, D-E3 — H1 opção (a)).
 *
 * Divisão de responsabilidade, de propósito:
 *  · `nodeArt.tsx` = o anel (SVG por token — fronteira única de arte);
 *  · aqui         = o VIDRO circular de 80 (`viewport-bg`, X3: corte 0 % nas
 *                   quatro artes e nos placeholders), o sprite a 64 ou a
 *                   silhueta, interação, foco e o que o leitor de tela ouve;
 *  · `EvolutionPath` = o grafo e os dados.
 *
 * O interior do nó é VIDRO, não `surface-2`: o pixel só entra em vidro (D-E3
 * (i)); o disco `surface-2` fica no SVG, atrás, decorativo. Reusa as classes
 * do `Viewport` (`sm2-viewport-screen` + `sm2-viewport-glass`, escopo
 * `.sm2-visor`) — nenhum CSS novo; o raio 50% vem inline porque é célula
 * circular, não visor.
 *
 * A cor/posição NÃO é o único portador de informação: o `label` diz a
 * situação em palavras (WCAG 1.4.1), e o alvo do nó oculto é o SVG inteiro
 * (88 ≥ 44).
 */
export function SoulNode({
  visual, sprite, silhouette = false, busy = false, ringColor, glowColor, label, title, onClick,
}: SoulNodeProps) {
  const box: CSSProperties = {
    position: 'relative',
    display: 'block',
    width: NODE_SIZE,
    height: NODE_SIZE,
    flex: 'none',
    padding: 0,
    border: 'none',
    background: 'transparent',
    cursor: onClick ? 'pointer' : undefined,
    borderRadius: '50%',
    ...(glowColor ? { boxShadow: `0 0 12px 2px ${glowColor}` } : null),
  };
  const inset = (NODE_SIZE - NODE_GLASS) / 2;

  const body = (
    <>
      <NodeArt visual={visual} busy={busy} ringColor={ringColor} />
      <span
        className="sm2-viewport-screen sm2-visor"
        data-node-glass
        style={{
          position: 'absolute',
          left: inset,
          top: inset,
          width: NODE_GLASS,
          height: NODE_GLASS,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {sprite && (silhouette
          ? (
            <span
              data-node-silhouette
              aria-hidden="true"
              style={{
                width: NODE_SPRITE,
                height: NODE_SPRITE,
                display: 'block',
                background: 'color-mix(in srgb, var(--sm2-viewport-bg) 58%, var(--sm2-viewport-ink))',
                WebkitMaskImage: `url(${sprite})`,
                maskImage: `url(${sprite})`,
                WebkitMaskSize: `${NODE_SPRITE}px ${NODE_SPRITE}px`,
                maskSize: `${NODE_SPRITE}px ${NODE_SPRITE}px`,
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
              }}
            />
          )
          : (
            <img
              data-node-sprite
              src={sprite}
              alt=""
              aria-hidden="true"
              width={NODE_SPRITE}
              height={NODE_SPRITE}
              style={{ width: NODE_SPRITE, height: NODE_SPRITE, display: 'block', objectFit: 'contain', imageRendering: 'pixelated' }}
            />
          ))}
        <span className="sm2-viewport-glass" style={{ borderRadius: '50%' }} />
      </span>
    </>
  );

  if (!onClick) {
    return (
      <span role="img" aria-label={label} title={title} data-soul-node={visual} style={box}>
        {body}
      </span>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={label} title={title} data-soul-node={visual} style={box}>
      {body}
    </button>
  );
}
