/**
 * ⚠️ FRONTEIRA DE ARTE DO NÓ (hoje: SVG por token — H1 opção (a)).
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

const R = 41;
const C = NODE_SIZE / 2;

const RING_TONE: Record<SoulNodeVisual, string> = {
  current: 'var(--sm2-primary-ink)',
  reached: 'var(--sm2-primary-deep)',
  forecast: 'var(--sm2-primary-deep)',
  locked: 'var(--sm2-muted)',
};

export interface NodeArtProps {
  visual: SoulNodeVisual;
  /** O Oráculo está desenhando esta forma: anel tracejado, mesmo tom. */
  busy?: boolean;
  /** Rodada 7 (I3): a COR do ramo no anel (Poder verde, Harmonia azul, Ultra amarelo). */
  ringColor?: string;
}

/** O disco e o anel do nó — vetor, por token. */
export function NodeArt({ visual, busy = false, ringColor }: NodeArtProps) {
  const dashed = visual === 'forecast' || busy;
  return (
    <svg
      viewBox={`0 0 ${NODE_SIZE} ${NODE_SIZE}`}
      width={NODE_SIZE}
      height={NODE_SIZE}
      aria-hidden="true"
      data-node-art={visual}
      style={{ position: 'absolute', inset: 0, display: 'block' }}
    >
      <circle cx={C} cy={C} r={R} fill="var(--sm2-surface-2)" />
      {visual === 'current' && (
        <circle data-node-halo cx={C} cy={C} r={R + 2.5} fill="none" stroke={RING_TONE.current} strokeWidth={1} />
      )}
      <circle
        data-node-ring
        cx={C}
        cy={C}
        r={R}
        fill="none"
        stroke={ringColor ?? RING_TONE[visual]}
        strokeWidth={3}
        strokeDasharray={dashed ? '6 5' : undefined}
      />
    </svg>
  );
}
