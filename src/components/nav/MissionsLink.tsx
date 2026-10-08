import { QuestGlyph } from '../play/MissionMark';
import type { QuestMark, QuestTone } from '../../utils/questMarks';
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
export function MissionsLink({ mark, tone = 'gold', label, markLabel, onClick, kind = 'daily', row = 1 }: {
  /** `null` = nada a fazer nem a entregar: o ícone SOME (não há porta para uma lista vazia). */
  mark: QuestMark;
  /** `blue` quando a marca vencedora é de missão semanal. */
  tone?: QuestTone;
  label: string;
  /** `questMarkLabel(mark, isPt)` — o estado falado ao leitor de tela. */
  markLabel: string | null;
  onClick: () => void;
  /** Qual acesso é (07/10/2026): `daily` (Diárias) ou `weekly` (Semanais). Cada um tem a sua porta. */
  kind?: 'daily' | 'weekly';
  /** A linha da pilha de ícones do canto (1 = logo abaixo do Mapa). Quem só tem um acesso visível usa 1. */
  row?: 1 | 2;
}) {
  if (mark === null) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={markLabel ? `${label}, ${markLabel}` : label}
      title={markLabel ? `${label}, ${markLabel}` : label}
      data-missions-link={kind}
      data-missions-kind={kind}
      data-mission-mark-home={mark ?? 'none'}
      data-mission-tone={mark ? tone : 'gold'}
      className="sm2-corner-link"
      style={{
        position: 'fixed',
        top: `calc(${CORNER_BOX_TOP} + ${CORNER_BOX * row}px)`,
        right: CORNER_SIDE,
        zIndex: 45,
        width: CORNER_BOX, height: CORNER_BOX,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
        filter: CORNER_GLOW,
      }}
    >
      <span aria-hidden="true" style={{ ...CORNER_RING_STYLE, opacity: 1 }}>
        {/* 04/10/2026 ("?") e 05/10/2026 ("!"): a arte de quest do dono. */}
        <QuestGlyph kind={mark === 'ready' ? 'ready' : 'available'} tone={mark ? tone : 'gold'} size={24} />
      </span>
    </button>
  );
}
