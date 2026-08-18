import { useMemo } from 'react';
import { SoulNode, type SoulNodeVisual } from './evolution/SoulNode';
import { getSpriteForStage } from '../utils/sprites';
import { creatureFormId, type CreatureStage } from '../utils/oracle';
import { ALIGN_TO_ATTR, ATTR_COLOR } from '../types/attributes';

type Attr = 'virus' | 'data' | 'vaccine';

/**
 * EvoTrail — a trilha de evolução NA HOME (referência: o caminho de nós
 * serpenteante ao lado do painel "Daily Rituals").
 *
 * É um RESUMO, não a árvore: mostra a linha rookie → champion → ultimate →
 * mega → ultra do galho ATUAL/previsto, com o pet pousado no nó atual.
 * Tocar em qualquer ponto abre a página de Evolução de verdade — nenhuma
 * regra do grafo mora aqui (footgun 9): o galho vem RESOLVIDO de quem chama
 * (o mesmo `resolveBranch` que a página usa), os nós vêm de `stages` e o
 * desenho do cristal é o `SoulNode` que a página já usa.
 *
 * Serpenteia de propósito (x alternado por nó, linhas em SVG por trás):
 * é a leitura visual da referência, e diferencia a trilha de uma lista.
 */
interface EvoTrailProps {
  stages: CreatureStage[];
  currentStageId: string;
  unlockedEvolutions?: string[];
  /** Galho resolvido por quem chama (resolveBranch/currentBranch do App). */
  branch: Attr;
  demoCharacterId?: string;
  onOpen: () => void;
  language?: 'pt-BR' | 'en-US';
}

/* Medidas apertadas de propósito (390px de viewport): com 92px de trilho o
   painel de rituais truncava "Meditation" em "Medita…" — o trilho é RESUMO,
   os rituais são a AÇÃO do dia; quem cede largura é o resumo. Altura idem:
   STEP_Y de 78 estourava o dock do chat e os nós de baixo nasciam cobertos. */
const NODE = 34;          // lado do cristal
const COL_W = 64;         // largura do trilho
const STEP_Y = 56;        // distância vertical entre nós
const X_A = 2;            // coluna esquerda do zigue
const X_B = COL_W - NODE - 2; // coluna direita do zague

export function EvoTrail({
  stages, currentStageId, unlockedEvolutions = [], branch,
  demoCharacterId, onOpen, language = 'en-US',
}: EvoTrailProps) {
  const isPt = language === 'pt-BR';
  const unlockedSet = useMemo(() => new Set(unlockedEvolutions), [unlockedEvolutions]);

  // rookie → galho → ultra, na ordem em que as stages já vêm geradas.
  const trail = useMemo(() => {
    const rookie = stages.find(s => s.stage === 'rookie');
    const branchStages = stages.filter(s => s.branch && ALIGN_TO_ATTR[s.branch] === branch);
    const ultra = stages.find(s => s.stage === 'ultra');
    return [rookie, ...branchStages, ultra].filter((s): s is CreatureStage => !!s);
  }, [stages, branch]);

  if (trail.length < 2) return null;

  const tone = ATTR_COLOR[branch];
  const nodePos = (i: number) => ({ x: i % 2 === 0 ? X_A : X_B, y: 8 + i * STEP_Y });
  const height = 8 + (trail.length - 1) * STEP_Y + NODE + 8;

  const visualFor = (id: string): SoulNodeVisual => {
    if (id === currentStageId) return 'current';
    if (unlockedSet.has(id)) return 'reached';
    return 'locked';
  };

  // A linha liga os CENTROS; o segmento até um nó já alcançado acende.
  const centers = trail.map((_, i) => {
    const p = nodePos(i);
    return { cx: p.x + NODE / 2, cy: p.y + NODE / 2 };
  });

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={isPt ? 'Abrir a página de Evolução' : 'Open the Evolution page'}
      title={isPt ? 'Evolução' : 'Evolution'}
      style={{
        position: 'relative',
        width: COL_W,
        minWidth: COL_W,
        height,
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'block',
      }}
    >
      <svg
        width={COL_W}
        height={height}
        viewBox={`0 0 ${COL_W} ${height}`}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0 }}
      >
        {centers.slice(1).map((c, i) => {
          const prev = centers[i];
          const toId = creatureFormId(trail[i + 1]);
          const lit = visualFor(toId) !== 'locked';
          return (
            <line
              key={i}
              x1={prev.cx} y1={prev.cy} x2={c.cx} y2={c.cy}
              stroke={lit ? 'var(--sm-px-cyan)' : 'var(--sm-line)'}
              strokeWidth={lit ? 3 : 2}
              strokeLinecap="round"
              opacity={lit ? 0.9 : 0.6}
            />
          );
        })}
      </svg>
      {trail.map((s, i) => {
        const id = creatureFormId(s);
        const p = nodePos(i);
        const visual = visualFor(id);
        const isCurrent = visual === 'current';
        return (
          <span key={id} style={{ position: 'absolute', left: p.x, top: p.y }}>
            <SoulNode
              visual={visual}
              size={NODE}
              tone={tone}
              sprite={isCurrent ? getSpriteForStage(currentStageId, demoCharacterId) : undefined}
              ring={isCurrent}
              /* Sem spoiler do nome de forma futura: trancada é só "?" — a
                 página de Evolução é quem revela, com confirmação. */
              label={
                visual === 'locked'
                  ? (isPt ? 'Forma futura bloqueada' : 'Locked future form')
                  : `${s.name}${isCurrent ? (isPt ? ' (atual)' : ' (current)') : ''}`
              }
            />
          </span>
        );
      })}
    </button>
  );
}
