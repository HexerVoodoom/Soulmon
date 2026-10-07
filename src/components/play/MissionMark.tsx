import type { CSSProperties } from 'react';
import { PixelIcon } from '../ui/PixelIcon';
import { QUEST_ART, QUEST_EXCLAMACAO_ART } from '../../assets/soulmon/icones-ui';
import { questMarkLabel } from '../../utils/questMarks';

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
export function MissionMark({ kind, size = 24, isPt, style }: {
  kind: Kind; size?: number; isPt: boolean; style?: CSSProperties;
}) {
  const label = kind === 'progress'
    ? (isPt ? 'Missão em andamento' : 'Mission in progress')
    : questMarkLabel(kind, isPt) ?? '';
  return (
    <span
      data-mission-mark={kind}
      style={{ display: 'inline-flex', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.7))', ...style }}
    >
      <span role="img" aria-label={label} style={{ display: 'inline-flex' }}>
        <PixelIcon src={kind === 'available' ? QUEST_EXCLAMACAO_ART : QUEST_ART} size={size} />
      </span>
    </span>
  );
}
