/**
 * ⚠️ FRONTEIRA DE ARTE DO NÓ (hoje: PNG do kit).
 *
 * Este arquivo é o ÚNICO lugar que sabe COM O QUE um nó da árvore é
 * desenhado. `SoulNode.tsx` (anel, brilho, sprite pousado, foco, aria) e
 * `EvolutionPath.tsx` (grafo, linhas, dados) não importam nada de arte.
 *
 * A troca SVG → PNG que este arquivo prometia foi FEITA (2026-08-18): a arte
 * saiu da rodada de UI gerada no Gemini e recortada por algoritmo
 * (`E:\Soulmon-assets`, ver `docs/BACKLOG-ARTE-GERAR.md` §A4). São quatro
 * PNGs 128×128 com alfa real, um por estado visual, medidos contra o guard de
 * `src/assets/assets.contract.test.ts` antes de entrar: 0,00% de magenta e
 * 0,6–2,2% de cinza (o teto é 5%), com 12–23% de transparência real — ou seja,
 * sem xadrez assado.
 *
 * A hierarquia visual é CRESCENTE em presença, e é isso que carrega o
 * significado sem depender de cor: `locked` é o cristal morto, `forecast` é um
 * shard aceso (possível, mas ainda não seu), `reached` é a gema cheia e
 * `current` é a gema com raios.
 *
 * O contrato para quem chama continua igual: (visual, size) → um quadrado de
 * `size`×`size` px, sem texto, decorativo (`aria-hidden`), com o centro
 * geométrico do cristal no centro da caixa — é dele que a linha de conexão e o
 * anel dependem. Os PNGs foram normalizados para canvas quadrado justamente
 * para preservar isso.
 */
import nodeCurrent from '../../assets/soulmon/evolution/node-current.png';
import nodeReached from '../../assets/soulmon/evolution/node-reached.png';
import nodeForecast from '../../assets/soulmon/evolution/node-forecast.png';
import nodeLocked from '../../assets/soulmon/evolution/node-locked.png';

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
  /** Lado da caixa em px. O cristal é inscrito nele. */
  size: number;
  /** Cor do galho, quando o galho tem cor própria. */
  tone?: string;
}

const SRC: Record<SoulNodeVisual, string> = {
  current: nodeCurrent,
  reached: nodeReached,
  forecast: nodeForecast,
  locked: nodeLocked,
};

/**
 * O cristal.
 *
 * `tone` (cor do galho, passada só para nós já alcançados por
 * `EvolutionPath`) entra como uma camada de tintura por cima do PNG, recortada
 * pela silhueta com `mask-image` e composta em `mix-blend-mode: color`. Esse
 * modo troca a MATIZ preservando a luminância, então o facetado do pixel art
 * continua legível — pintar a silhueta chapada teria jogado fora justamente o
 * volume que a arte tem a mais que o SVG antigo.
 */
export function NodeArt({ visual, size, tone }: NodeArtProps) {
  const src = SRC[visual];
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'relative',
        display: 'block',
        width: size,
        height: size,
        flex: 'none',
      }}
    >
      <img
        src={src}
        width={size}
        height={size}
        alt=""
        style={{ imageRendering: 'pixelated', display: 'block' }}
      />
      {tone && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            background: tone,
            opacity: 0.5,
            mixBlendMode: 'color',
            WebkitMaskImage: `url(${src})`,
            maskImage: `url(${src})`,
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
            pointerEvents: 'none',
          }}
        />
      )}
    </span>
  );
}
