import { Icon } from '../ui/Icon';
import { CORNER_BOX, CORNER_BOX_TOP, CORNER_GLOW, CORNER_RING_STYLE, CORNER_SIDE } from './cornerAnchor';

/**
 * O BOTÃO DE AVISOS na Home (beta-2, F3 do crítico, 13/10/2026): na pilha do canto direito, logo abaixo das missões. Os avisos do dia
 * (HP, incubação, semanal, triagem, convites, check-ins...) NÃO ocupam mais a faixa acima da lista: moram numa folha (`ModalSheet`) que
 * este botão abre, e o botão carrega só um SELO (ponto) quando há algo — sem número, parado, sem som (nada que cobre). Some quando não
 * há aviso nenhum: não há porta para uma folha vazia. A altura acima de "HOJE" fica FIXA (zero), com ou sem aviso.
 */
export function AvisosLink({ count, label, countLabel, onClick, row }: {
  /** Quantos avisos há. `0` = o botão SOME. */
  count: number;
  label: string;
  /** O estado falado ao leitor de tela, ex.: "2 avisos". */
  countLabel: string;
  onClick: () => void;
  /** A linha da pilha do canto (1 = logo abaixo do Mapa). */
  row: 1 | 2 | 3;
}) {
  if (count <= 0) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}, ${countLabel}`}
      aria-haspopup="dialog"
      data-avisos-link
      data-avisos-count={count}
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
      <span aria-hidden="true" style={{ ...CORNER_RING_STYLE, opacity: 1, position: 'relative' }}>
        <Icon name="event_note" size={24} tone="viewport" />
        {/* o selo: um ponto dourado, sem número */}
        <span
          data-avisos-seal
          style={{
            position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: '50%', boxSizing: 'border-box',
            background: 'var(--sm2-viewport-warn, #EBBE84)', border: '2px solid var(--sm2-viewport-bg, #0E2422)',
          }}
        />
      </span>
    </button>
  );
}
