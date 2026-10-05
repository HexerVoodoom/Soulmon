import { Icon } from '../ui/Icon';
import { PixelIcon } from '../ui/PixelIcon';
import { QUEST_ART } from '../../assets/soulmon/icones-ui';
import type { MissionMark } from '../../utils/travessiasSave';
import { CORNER_BOX, CORNER_BOX_TOP, CORNER_GLOW, CORNER_RING_STYLE, CORNER_SIDE } from './cornerAnchor';

/**
 * O ÍCONE DE MISSÕES na Home (rodada 7, M8, 04/10/2026): logo abaixo do link do
 * Mapa, no canto superior direito, no mesmo anel. Abre a lista de missões da
 * pessoa. O glifo é o marcador de quest — "!" amarelo com missões para escolher,
 * "?" amarelo com uma escolhida ou já feita (M9) —, parado, sem número e sem
 * som: nada que cobre.
 *
 * Ícone pelado dentro do anel (a mesma exceção D1 do `CornerLink`); o alvo de
 * 44 é do botão, e o rótulo mora no `aria-label`/`title`.
 */
export function MissionsLink({ mark, label, onClick }: {
  mark: MissionMark;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-missions-link
      data-mission-mark-home={mark ?? 'done'}
      className="sm2-corner-link"
      style={{
        position: 'fixed',
        top: `calc(${CORNER_BOX_TOP} + ${CORNER_BOX}px)`,
        right: CORNER_SIDE,
        zIndex: 45,
        width: CORNER_BOX, height: CORNER_BOX,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
        filter: CORNER_GLOW,
      }}
    >
      <span aria-hidden="true" style={CORNER_RING_STYLE}>
        {/* 04/10/2026: o "?" é a arte de quest do dono; o "!" segue o glifo autoral. */}
        {mark === 'available'
          ? <Icon name="exclamation" size={24} weight={600} tone="gold" />
          : <PixelIcon src={QUEST_ART} size={24} />}
      </span>
    </button>
  );
}
