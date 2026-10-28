import { PixelIcon } from '../ui/PixelIcon';
import { CORNER_BOX, CORNER_BOX_TOP, CORNER_RING_STYLE, CORNER_SIDE } from './cornerAnchor';

/**
 * O LINK DE CANTO — a única navegação entre as duas telas de topo.
 *
 * Home: o Mapa, no canto SUPERIOR direito. Mapa: a Home, no canto SUPERIOR
 * esquerdo (B2, 02/10/2026: antes ficavam embaixo). Não é barra: é um botão só, fixo no
 * canto, abaixo da área segura do aparelho (o anel de 44 cai em y=12, a linha do header da Home).
 *
 * ⚠️ **Anel só na casinha do Mapa (28/10/2026, pedido do dono):** voltou o círculo (`CORNER_RING_STYLE`) em volta da casinha; o ícone do Mapa na Home segue pelado.
 * (Histórico) **Sem anel (14/10/2026, pedido do dono):** o círculo em volta da casinha e do ícone do Mapa (C14/H2) saiu — o ícone
 * lê sobre a cena sem brilho externo (removido na rodada 6, L2) e o alvo de toque (56px, ≥ 44) é o mesmo. O anel segue no voltar das áreas e nos avisos.
 *
 * **Ícone pelado, 32px (papel `nav` da escala, tokens.md §6.1)** — a regra
 * "ícone nunca dentro de box" vale aqui sem exceção (a exceção D1 é só do
 * voltar em círculo e dos cuidados). O alvo de 44px é do BOTÃO, invisível.
 * O rótulo existe no `aria-label` e no `title`; na tela o ícone fala sozinho,
 * como nos mocks aprovados. O ícone é a ARTE do squad de arte (`mapa.png` /
 * `home.png`, `assets/soulmon/icones-ui`) — até a correção pós-F3 era um glifo
 * vetorial de linha fina no lugar dela, por engano.
 */
export function CornerLink({ icon, label, side, onClick }: {
  icon: 'mapa' | 'home';
  label: string;
  side: 'left' | 'right';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-corner-link={side}
      className="sm2-corner-link"
      style={{
        position: 'fixed',
        top: CORNER_BOX_TOP,
        [side]: CORNER_SIDE,
        zIndex: 45,
        width: CORNER_BOX, height: CORNER_BOX,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
        color: 'var(--sm2-primary-ink)',
      }}
    >
      {icon === 'home' ? (
        <span data-corner-ring style={CORNER_RING_STYLE}><PixelIcon name={icon} size={32} /></span>
      ) : (
        <PixelIcon name={icon} size={32} />
      )}
    </button>
  );
}
