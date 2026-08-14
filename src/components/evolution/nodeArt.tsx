/**
 * ⚠️ FRONTEIRA DE TROCA SVG → PNG.
 *
 * Este arquivo é o ÚNICO lugar que sabe COM O QUE um nó da árvore é
 * desenhado. `SoulNode.tsx` (anel, brilho, sprite pousado, foco, aria) e
 * `EvolutionPath.tsx` (grafo, linhas, dados) não importam nada de arte.
 *
 * A arte de cristal do kit (`node-crystal-on` / `node-crystal-off` /
 * `node-ring-active`, 64×64 com alfa) ainda NÃO existe — está bloqueada em
 * geração. Enquanto isso, o nó é SVG puro, no mesmo vocabulário do kit
 * (losango facetado, contorno duro, ciano `--sm-px-cyan`, cobre
 * `--sm-px-copper`).
 *
 * Para trocar por PNG depois, a mudança inteira cabe aqui:
 *
 *   import crystalOn from '../../assets/soulmon/evolution/node-crystal-on.png';
 *   …
 *   const SRC: Record<SoulNodeVisual, string> = { current: crystalOn, … };
 *   export function NodeArt({ visual, size }: NodeArtProps) {
 *     return <img src={SRC[visual]} width={size} height={size} alt=""
 *                 style={{ imageRendering: 'pixelated', display: 'block' }} />;
 *   }
 *
 * Nenhuma outra linha do app muda: o contrato é (visual, size) → um quadrado
 * de `size`×`size` px, sem texto, decorativo (`alt=""` / `aria-hidden`), com
 * o centro geométrico do losango no centro da caixa — é dele que a linha de
 * conexão e o anel dependem.
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

export interface NodeArtProps {
  visual: SoulNodeVisual;
  /** Lado da caixa em px. O losango é inscrito nele. */
  size: number;
  /** Cor do galho, quando o galho tem cor própria. */
  tone?: string;
}

/** Preenchimento/contorno por estado. `tone` só entra em nó já alcançado. */
function paint(visual: SoulNodeVisual, tone?: string) {
  switch (visual) {
    case 'current':
      return { fill: 'var(--sm-px-cyan)', face: '#ffffff', edge: '#04211f', rim: 'var(--sm-px-cyan)' };
    case 'reached':
      return { fill: tone ?? 'var(--sm-px-cyan)', face: 'rgba(255,255,255,0.55)', edge: '#04211f', rim: 'var(--sm-px-copper)' };
    case 'forecast':
      return { fill: 'color-mix(in srgb, var(--sm-px-cyan) 30%, var(--sm-px-track))', face: 'rgba(255,255,255,0.28)', edge: 'var(--sm-px-cyan)', rim: 'var(--sm-px-cyan)' };
    case 'locked':
    default:
      // Escurecido RELATIVO ao tema, não absoluto: `--sm-px-track` (#16283d)
      // é azul-marinho e, no tema claro, virava a mancha mais pesada da tela
      // — além de puxar para fora da paleta teal/cobre.
      return {
        fill: 'color-mix(in srgb, var(--sm-ink) 22%, var(--sm-bg))',
        face: 'rgba(255,255,255,0.10)',
        edge: 'color-mix(in srgb, var(--sm-ink) 45%, var(--sm-bg))',
        rim: 'var(--sm-line)',
      };
  }
}

/**
 * O cristal. Grade de 32×32 "pixels" escalada para `size` — os vértices caem
 * em números inteiros da grade, que é o que mantém a silhueta em degraus retos
 * (pixel-art) em vez de diagonal antisserrilhada.
 */
export function NodeArt({ visual, size, tone }: NodeArtProps) {
  const c = paint(visual, tone);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
      style={{ display: 'block' }}
    >
      {/* Moldura do losango (contorno duro de 2 unidades). */}
      <polygon points="16,1 31,16 16,31 1,16" fill={c.rim} />
      {/* Corpo do cristal. */}
      <polygon points="16,4 28,16 16,28 4,16" fill={c.fill} stroke={c.edge} strokeWidth="1" />
      {/* Faceta de luz (metade superior-esquerda) — o que dá volume sem sombra
          borrada, que não existe no vocabulário pixel-art do kit. */}
      <polygon points="16,6 16,16 6,16" fill={c.face} />
      {/* Faceta de sombra (inferior-direita). */}
      <polygon points="16,16 26,16 16,26" fill="rgba(0,0,0,0.28)" />
    </svg>
  );
}
