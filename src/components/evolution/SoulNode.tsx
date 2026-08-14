import { NodeArt, type SoulNodeVisual } from './nodeArt';

export type { SoulNodeVisual };

interface SoulNodeProps {
  visual: SoulNodeVisual;
  /** Lado da caixa do cristal em px. */
  size?: number;
  /** Cor do galho (só pinta nó já alcançado). */
  tone?: string;
  /**
   * Sprite pousado NO nó (Ref C: o pet em cima do nó atual). Decorativo —
   * o nome da forma já está no texto ao lado e no `label`.
   */
  sprite?: string;
  /** Rótulo acessível COMPLETO: nome + situação ("atual", "bloqueada"…). */
  label: string;
  title?: string;
  onClick?: () => void;
  /** Anel ciano pulsante do nó atual. */
  ring?: boolean;
}

/**
 * Um nó do grafo de evolução (Ref C: coluna vertical de losangos de cristal
 * ligados por linhas).
 *
 * Divisão de responsabilidade, de propósito:
 *  · `nodeArt.tsx` = o desenho (hoje SVG, amanhã PNG — fronteira única);
 *  · aqui         = interação, foco, alvo de toque e o que o leitor de tela ouve;
 *  · `EvolutionPath` = o grafo e os dados.
 *
 * A cor/posição NÃO é o único portador de informação: o `label` diz a
 * situação em palavras (WCAG 1.4.1), e o alvo é ≥44px mesmo quando o
 * cristal desenhado é menor.
 */
export function SoulNode({
  visual, size = 44, tone, sprite, label, title, onClick, ring = false,
}: SoulNodeProps) {
  const body = (
    <span className="sm-px-node-art" style={{ width: size, height: size }}>
      {ring && <span className="sm-px-node-ring" aria-hidden="true" />}
      <NodeArt visual={visual} size={size} tone={tone} />
      {sprite && (
        <img
          className="sm-px-node-sprite"
          src={sprite}
          alt=""
          aria-hidden="true"
          style={{ width: Math.round(size * 0.95), height: Math.round(size * 0.95) }}
        />
      )}
    </span>
  );

  if (!onClick) {
    return (
      <span className="sm-px-node" role="img" aria-label={label} title={title}>
        {body}
      </span>
    );
  }

  return (
    <button type="button" className="sm-px-node" onClick={onClick} aria-label={label} title={title}>
      {body}
    </button>
  );
}
