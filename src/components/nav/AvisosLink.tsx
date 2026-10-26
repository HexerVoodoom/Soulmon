import { Icon } from '../ui/Icon';
import { CORNER_BOX, CORNER_BOX_TOP, CORNER_SIDE } from './cornerAnchor';

/**
 * O BOTÃO DE AVISOS na Home (beta-2, F3 do crítico, 13/10/2026): na pilha do canto direito, logo abaixo das missões. O glifo é `info` (14/10/2026): o `event_note` antigo (calendário com nota) lia como o ícone do login diário/check-ins, ocultado pelo dono. Os avisos do dia
 * (HP, incubação, semanal, triagem, convites, check-ins...) NÃO ocupam mais a faixa acima da lista: moram numa folha (`ModalSheet`) que
 * este botão abre, e o botão carrega só um SELO (ponto) quando há algo — sem número, parado, sem som (nada que cobre). Some quando não
 * há aviso nenhum: não há porta para uma folha vazia. A altura acima de "HOJE" fica FIXA (zero), com ou sem aviso.
 */
export const AVISOS_LINK_ENABLED = false;

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
  /* OCULTO por completo (dono, 14/10/2026, REGISTRO §54): o botão não aparece na pilha de cantos. O código fica; religar = `true`. */
  if (!AVISOS_LINK_ENABLED || count <= 0) return null;
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
      }}
    >
      <span aria-hidden="true" style={{ display: 'flex', position: 'relative' }}>
        <Icon name="info" size={32} tone="viewport" />
        {/* o selo: um ponto dourado, sem número */}
        <span
          data-avisos-seal
          style={{
            position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: '50%', boxSizing: 'border-box',
            background: 'var(--sm2-viewport-warn, #EBBE84)', border: '2px solid var(--sm2-viewport-bg, #0E2422)',
          }}
        />
      </span>
    </button>
  );
}
