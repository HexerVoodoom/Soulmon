/**
 * FRONTEIRA DE ARTE DO NÓ (24/11/2026, dono): SÓ o anel — contorno fino de 2px desenhado em CSS (`.sm2-evo-no-arte`, tokens), sem PNG e sem
 * preenchimento: o nó não tem mais a bola preta com brilho atrás do sprite, o fundo da tela aparece. O estado vem do contorno:
 *   ATUAL = anel aceso na cor do ramo (o glow do contorno é do `SoulNode`) · ALCANÇADO = sólido · PREVISTO = tracejado · BLOQUEADO = apagado.
 * A cor do RAMO entra pela variável `--sm2-no-cor`. Contrato: `(visual) → um quadrado NODE_SIZE²`, decorativo (`aria-hidden`), centrado no vidro.
 */

/** Estados VISUAIS do nó. O significado de jogo é resolvido por quem chama. */
export type SoulNodeVisual =
  /** Forma atual do pet. */
  | 'current'
  /** Forma já alcançada/desbloqueada. */
  | 'reached'
  /** Próximo passo previsto (galho que os atributos apontam). */
  | 'forecast'
  /** Forma futura ainda trancada. */
  | 'locked';

/** Lado do SVG (88), do vidro circular (80) e do sprite dentro dele (64 = 0,25× de 256²). */
export const NODE_SIZE = 88;
export const NODE_GLASS = 80;
export const NODE_SPRITE = 64;

export interface NodeArtProps {
  visual: SoulNodeVisual;
  /** O Oráculo está desenhando esta forma: a moldura pulsa/tracejada some — só marca `data-busy` (a animação é do CSS global). */
  busy?: boolean;
  /** Rodada 7 (I3): a COR do ramo (Poder verde, Harmonia azul, Ultra amarelo). */
  ringColor?: string;
}

/** O anel do nó: um círculo vazio de borda 2px (CSS em `index.css`); `ringColor` troca a cor via `--sm2-no-cor`. */
export function NodeArt({ visual, busy = false, ringColor }: NodeArtProps) {
  return (
    <span
      aria-hidden="true"
      data-node-art={visual}
      data-busy={busy ? 'true' : undefined}
      className="sm2-evo-no-arte"
      style={{ position: 'absolute', inset: 0, display: 'block', ...(ringColor ? { ['--sm2-no-cor' as string]: ringColor } : null) }}
    />
  );
}
