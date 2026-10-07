import { PixelIcon } from '../ui/PixelIcon';
import { QUEST_ART, QUEST_EXCLAMACAO_ART } from '../../assets/soulmon/icones-ui';
import type { QuestMark } from '../../utils/questMarks';
import { CORNER_BOX, CORNER_BOX_TOP, CORNER_GLOW, CORNER_RING_STYLE, CORNER_SIDE } from './cornerAnchor';

/**
 * O ÍCONE DE MISSÕES na Home (rodada 7, M8, 04/10/2026): logo abaixo do link do
 * Mapa, no canto superior direito, no mesmo anel. Abre a lista de missões da
 * pessoa. O glifo é o marcador de quest (07/10/2026, `utils/questMarks.ts`): "!"
 * com missão disponível, "?" com missão PRONTA (vence o "!"), e o "?" esmaecido
 * quando não há nada pendente — a porta da lista continua lá. Parado, sem
 * número e sem som: nada que cobre.
 *
 * Ícone pelado dentro do anel (a mesma exceção D1 do `CornerLink`); o alvo de
 * 44 é do botão, e o rótulo mora no `aria-label`/`title`.
 */
export function MissionsLink({ mark, label, markLabel, onClick }: {
  mark: QuestMark;
  label: string;
  /** `questMarkLabel(mark, isPt)` — o estado falado ao leitor de tela. */
  markLabel: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={markLabel ? `${label}, ${markLabel}` : label}
      title={markLabel ? `${label}, ${markLabel}` : label}
      data-missions-link
      data-mission-mark-home={mark ?? 'none'}
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
      <span aria-hidden="true" style={{ ...CORNER_RING_STYLE, opacity: mark ? 1 : 0.6 }}>
        {/* 04/10/2026 ("?") e 05/10/2026 ("!"): a arte de quest do dono. */}
        <PixelIcon src={mark === 'ready' ? QUEST_ART : QUEST_EXCLAMACAO_ART} size={24} />
      </span>
    </button>
  );
}
