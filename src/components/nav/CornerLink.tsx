import { PixelIcon } from '../ui/PixelIcon';
import { CORNER_BOX, CORNER_BOX_TOP, CORNER_SIDE, CORNER_GLOW, CORNER_RING_STYLE } from './cornerAnchor';

/**
 * O LINK DE CANTO — a única navegação entre as duas telas de topo.
 *
 * Home: o Mapa, no canto SUPERIOR direito. Mapa: a Home, no canto SUPERIOR
 * esquerdo (B2, 02/10/2026: antes ficavam embaixo). Não é barra: é um botão só, fixo no
 * canto, abaixo da área segura do aparelho (o anel de 44 cai em y=12, a linha do header da Home).
 *
 * **Ícone pelado, 32px (papel `nav` da escala, tokens.md §6.1)** — a regra
 * "ícone nunca dentro de box" vale aqui sem exceção (a exceção D1 é só do
 * voltar em círculo e dos cuidados). O alvo de 44px é do BOTÃO, invisível.
 * O rótulo existe no `aria-label` e no `title`; na tela o ícone fala sozinho,
 * como nos mocks aprovados. O ícone é a ARTE do squad de arte (`mapa.png` /
 * `home.png`, `assets/soulmon/icones-ui`) — até a correção pós-F3 era um glifo
 * vetorial de linha fina no lugar dela, por engano.
 */
export function CornerLink({ icon, label, side, onClick, glow = true, ring = false }: {
  icon: 'mapa' | 'home';
  label: string;
  side: 'left' | 'right';
  onClick: () => void;
  /** Brilho claro (F3, mock do Mapa), `true` por padrão desde H9 (02/10/2026):
   *  a casinha PERDEU o brilho quando o anel entrou — agora a casinha e o ícone
   *  do Mapa o têm sempre, para ler sobre qualquer fundo. A âncora (posição e
   *  tamanho) mora em `cornerAnchor.ts`, compartilhada com o voltar das áreas. */
  glow?: boolean;
  /** C14 (navegação do dono, 01/10/2026): o MESMO anel do voltar-ao-mapa das
   *  áreas (`AreaTopBar` sobre a cena: círculo de 44, borda 2px clara). Só o
   *  desenho em volta muda — o alvo continua o botão de 56. Vale também para a
   *  casinha do Mapa (H2). */
  ring?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-corner-link={side}
      data-corner-glow={glow || undefined}
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
        filter: glow ? CORNER_GLOW : undefined,
      }}
    >
      {ring ? (
        <span
          aria-hidden="true"
          data-corner-ring
          style={CORNER_RING_STYLE}
        >
          <PixelIcon name={icon} size={32} />
        </span>
      ) : <PixelIcon name={icon} size={32} />}
    </button>
  );
}
