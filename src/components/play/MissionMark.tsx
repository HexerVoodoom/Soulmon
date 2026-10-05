import type { CSSProperties } from 'react';
import { Icon } from '../ui/Icon';
import { PixelIcon } from '../ui/PixelIcon';
import { QUEST_ART } from '../../assets/soulmon/icones-ui';
import type { MissionMark as Kind } from '../../utils/travessiasSave';

/**
 * O MARCADOR DE MISSÃO (04/10/2026, pedido do dono — como o World of Warcraft):
 * "!" = há missões do dia para escolher; "?" = uma escolhida, esperando o
 * "Fiz". Rodada 7 (M9): os dois agora são AMARELOS (tom `gold`) — o "?" azul
 * saiu da quest. O "!" é glifo AUTORAL (`ui/NavGlyphs.tsx`: `exclamation`); o "?" é
 * a arte de quest do dono desde 04/10/2026 (`QUEST_ART`, pixel), pelados — ícone nunca dentro de box. Parado: sem animação, sem
 * som, sem número (as regras do Passeio: nada que cobre). Some quando a missão
 * de hoje foi feita ou quando a camada de Travessias está escondida.
 */
export function MissionMark({ kind, size = 24, isPt, style }: {
  kind: Exclude<Kind, null>; size?: number; isPt: boolean; style?: CSSProperties;
}) {
  const label = kind === 'available'
    ? (isPt ? 'Missões do dia' : 'Missions of the day')
    : (isPt ? 'Missão em andamento' : 'Mission in progress');
  return (
    <span
      data-mission-mark={kind}
      style={{ display: 'inline-flex', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.7))', ...style }}
    >
      {/* 04/10/2026: o "?" virou a arte do dono (`QUEST_ART`); o "!" continua o glifo. */}
      {kind === 'progress' ? (
        <span role="img" aria-label={label} style={{ display: 'inline-flex' }}>
          <PixelIcon src={QUEST_ART} size={size} />
        </span>
      ) : (
        <Icon name="exclamation" size={size} weight={600} tone="gold" label={label} />
      )}
    </span>
  );
}
