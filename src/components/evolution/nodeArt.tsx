import normal from '../../assets/soulmon/evo/evo-no-A-normal.png';
import atual from '../../assets/soulmon/evo/evo-no-A-atual.png';
import alcancado from '../../assets/soulmon/evo/evo-no-A-alcancado.png';
import bloqueado from '../../assets/soulmon/evo/evo-no-A-bloqueado.png';

/**
 * ⚠️ FRONTEIRA DE ARTE DO NÓ (hoje: PNG A do dono, 4 estados — instalado em 24/11/2026; antes, SVG por token, H1 opção (a)).
 * Mapa: current→atual (anel aceso turquesa), reached→alcancado, forecast→normal, locked→bloqueado. A cor do RAMO entra por
 * `mix-blend-mode: color` numa máscara do próprio PNG (o neutro segue sendo a arte; o ramo só troca o matiz).
 *
 * Este arquivo é o ÚNICO lugar que sabe COM O QUE o anel de um nó da árvore é
 * desenhado. `SoulNode.tsx` (vidro, sprite/silhueta, foco, aria) e
 * `EvolutionPath.tsx` (grafo e dados) não importam nada de arte.
 *
 * Histórico curto, porque ele explica a forma: o nó nasceu SVG, virou PNG
 * (18/08/2026 — quatro cristais 128² do Gemini, `soulmon/evolution/node-*`)
 * e voltou a vetor pela decisão do dono no canvas Evolução (H1, `STATUS.md`
 * §3; `docs/design/wireframes/evolucao/identidade/README.md` D-E3,
 * 20/09/2026). Os quatro PNGs foram para `D:\Soulmon\brand-archive\
 * evo-nodes-antigos\` e o kit de cristais de `E:/nodes` ficou sem consumidor.
 * O motivo é a direção "O Visor": o pixel só entra em VIDRO, e o nó agora TEM
 * um vidro (o circular de 80, em `SoulNode`) — o cristal pixel em volta dele
 * era pixel fora do visor.
 *
 * O que este SVG desenha (88², medidas do canvas, todas em token):
 *  · o disco `surface-2` (r 41) — decorativo, atrás do vidro;
 *  · o ANEL por estado, r 41, traço 3 — a fronteira do controle (WCAG
 *    1.4.11: os quatro medem ≥ 3:1 sobre `surface`/`surface-2` nos dois
 *    temas, tabela do README):
 *      ATUAL      `primary-ink` 3px + halo 1px (r 43,5)
 *      PREVISTO   `primary-deep` 3px tracejado 6/5
 *      BLOQUEADO  `muted` 3px (X5 — o nó oculto é botão, "Reveal (spoiler)")
 *      ALCANÇADO  `primary-deep` 3px sólido (X4 — cheio taparia o sprite)
 *  · `busy` = o Oráculo está desenhando esta forma (D-E9): o anel vira
 *    tracejado no tom do estado, sem trocar de estado.
 *
 * Contrato para quem chama: `(visual) → um quadrado NODE_SIZE²`, decorativo
 * (`aria-hidden`), com o centro do anel no centro da caixa — é dele que o
 * vidro circular depende para ficar concêntrico.
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

const ARTE: Record<SoulNodeVisual, string> = { current: atual, reached: alcancado, forecast: normal, locked: bloqueado };

export interface NodeArtProps {
  visual: SoulNodeVisual;
  /** O Oráculo está desenhando esta forma: a moldura pulsa/tracejada some — só marca `data-busy` (a animação é do CSS global). */
  busy?: boolean;
  /** Rodada 7 (I3): a COR do ramo (Poder verde, Harmonia azul, Ultra amarelo). */
  ringColor?: string;
}

/** A moldura do nó — PNG neutro (96²) mostrado a `NODE_SIZE`; com `ringColor`, uma camada de matiz do ramo sobre a mesma silhueta. */
export function NodeArt({ visual, busy = false, ringColor }: NodeArtProps) {
  const src = ARTE[visual];
  return (
    <span
      aria-hidden="true"
      data-node-art={visual}
      data-busy={busy ? 'true' : undefined}
      className="sm2-evo-no-arte"
      style={{ position: 'absolute', inset: 0, display: 'block' }}
    >
      <img data-node-frame src={src} alt="" width={NODE_SIZE} height={NODE_SIZE} style={{ display: 'block', inlineSize: '100%', blockSize: '100%' }} />
      {ringColor && (
        <span
          data-node-tint
          className="sm2-evo-no-matiz"
          style={{ background: ringColor, WebkitMaskImage: `url(${src})`, maskImage: `url(${src})` }}
        />
      )}
    </span>
  );
}
