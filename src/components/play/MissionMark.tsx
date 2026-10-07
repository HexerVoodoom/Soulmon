import type { CSSProperties } from 'react';
import { PixelIcon } from '../ui/PixelIcon';
import { QUEST_ART, QUEST_EXCLAMACAO_ART } from '../../assets/soulmon/icones-ui';
import { questMarkLabel, type QuestTone } from '../../utils/questMarks';

/** `ready` = "?" (pronta), `available` = "!", `progress` = "?" dentro da folha do Passeio. */
type Kind = 'available' | 'progress' | 'ready';

/**
 * O MARCADOR DE MISSÃO (04/10/2026, pedido do dono — como o World of Warcraft):
 * "!" = há missões do dia para escolher; "?" = uma escolhida, esperando o
 * "Fiz". Rodada 7 (M9): os dois agora são AMARELOS (tom `gold`) — o "?" azul
 * saiu da quest. Os dois são a arte de quest do dono (pixel: "?" desde 04/10/2026 = `QUEST_ART`,
 * "!" desde 05/10/2026 = `QUEST_EXCLAMACAO_ART`), pelados — ícone nunca dentro de box. Parado: sem animação, sem
 * som, sem número (as regras do Passeio: nada que cobre). Some quando a missão
 * de hoje foi feita ou quando a camada de Travessias está escondida.
 */
/**
 * O glifo "!"/"?" no tom pedido. `blue` (missões SEMANAIS, decisão do dono 07/10/2026)
 * pinta a arte como silhueta com o token `--sm2-primary-ink` (≥ 4,5:1 nos dois temas) —
 * nenhuma cor escrita à mão. `gold` é a arte original.
 */
export function QuestGlyph({ kind, tone = 'gold', size }: { kind: Kind; tone?: QuestTone; size: number }) {
  const src = kind === 'available' ? QUEST_EXCLAMACAO_ART : QUEST_ART;
  if (tone !== 'blue') return <PixelIcon src={src} size={size} />;
  const m = `url("${src}") center / contain no-repeat`;
  return (
    <span
      aria-hidden="true"
      data-quest-tone="blue"
      style={{
        display: 'block', width: size, height: size, pointerEvents: 'none',
        background: 'var(--sm2-primary-ink)',
        WebkitMask: m, mask: m, imageRendering: 'pixelated',
      }}
    />
  );
}

export function MissionMark({ kind, size = 24, isPt, style, tone = 'gold' }: {
  kind: Kind; size?: number; isPt: boolean; style?: CSSProperties; tone?: QuestTone;
}) {
  const label = kind === 'progress'
    ? (isPt ? 'Missão em andamento' : 'Mission in progress')
    : questMarkLabel(kind, isPt) ?? '';
  return (
    <span
      data-mission-mark={kind}
      data-mission-tone={tone}
      style={{ display: 'inline-flex', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.7))', ...style }}
    >
      <span role="img" aria-label={label} style={{ display: 'inline-flex' }}>
        <QuestGlyph kind={kind} tone={tone} size={size} />
      </span>
    </span>
  );
}
