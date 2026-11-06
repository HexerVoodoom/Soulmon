import { PixelIcon } from '../ui/PixelIcon';
import { Icon } from '../ui/Icon';
import { CARTA_ART } from '../../assets/soulmon/icones-ui/carta';
import { CORNER_BOX, CORNER_BOX_TOP, CORNER_SIDE } from './cornerAnchor';

/**
 * O ÍCONE DA CAIXA DE CARTAS na Home (§245): na pilha do canto direito, ENTRE o Mapa (linha 0) e as Missões (linha 2). Pelado, 32 px,
 * como os vizinhos. A bolinha vermelha (`data-mail-dot`) aparece só com carta NOVA (não aberta nem resgatada); é um ponto absoluto sobre o
 * canto do ícone, então ligar e desligar não move nada. Sem número, parado, sem som. Sem arte (`CARTA_ART` ausente) usa o glifo `chat_bubble`.
 */
export function MailLink({ unread, label, unreadLabel, onClick }: {
  unread: boolean;
  label: string;
  /** O estado falado, ex.: "carta nova". */
  unreadLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={unread ? `${label}, ${unreadLabel}` : label}
      aria-haspopup="dialog"
      data-mail-link
      data-mail-unread={unread ? 'true' : 'false'}
      className="sm2-corner-link"
      style={{
        position: 'fixed',
        top: `calc(${CORNER_BOX_TOP} + ${CORNER_BOX}px)`,
        right: CORNER_SIDE,
        zIndex: 45,
        width: CORNER_BOX, height: CORNER_BOX,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
      }}
    >
      <span aria-hidden="true" style={{ display: 'flex', position: 'relative', width: 32, height: 32 }}>
        {CARTA_ART
          ? <PixelIcon src={CARTA_ART} size={32} />
          : <Icon name="chat_bubble" size={32} tone="viewport" />}
        {unread && (
          <span
            data-mail-dot
            style={{
              position: 'absolute', top: -1, right: -1, width: 12, height: 12, borderRadius: '50%', boxSizing: 'border-box',
              background: '#E5484D', border: '2px solid var(--sm2-viewport-bg, #0E2422)',
            }}
          />
        )}
      </span>
    </button>
  );
}
