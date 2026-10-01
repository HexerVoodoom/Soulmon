import { PixelIcon } from '../ui/PixelIcon';

/**
 * O LINK DE CANTO — a única navegação entre as duas telas de topo.
 *
 * Home: o Mapa, no canto inferior DIREITO. Mapa: a Home, no canto inferior
 * ESQUERDO (minimal-ui, decisão 1 do dono). Não é barra: é um botão só, fixo no
 * canto, acima da área segura do aparelho.
 *
 * **Ícone pelado, 32px (papel `nav` da escala, tokens.md §6.1)** — a regra
 * "ícone nunca dentro de box" vale aqui sem exceção (a exceção D1 é só do
 * voltar em círculo e dos cuidados). O alvo de 44px é do BOTÃO, invisível.
 * O rótulo existe no `aria-label` e no `title`; na tela o ícone fala sozinho,
 * como nos mocks aprovados. O ícone é a ARTE do squad de arte (`mapa.png` /
 * `home.png`, `assets/soulmon/icones-ui`) — até a correção pós-F3 era um glifo
 * vetorial de linha fina no lugar dela, por engano.
 */
export function CornerLink({ icon, label, side, onClick, glow = false, ring = false }: {
  icon: 'mapa' | 'home';
  label: string;
  side: 'left' | 'right';
  onClick: () => void;
  /** Brilho sutil (F3, mock do Mapa): a casa recebe um halo leve para não
   *  sumir no canto vinhetado sobre a arte isométrica. */
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
        bottom: 'calc(var(--sm2-space-3) + env(safe-area-inset-bottom, 0px))',
        [side]: 'var(--sm2-space-3)',
        zIndex: 45,
        width: 56, height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
        color: 'var(--sm2-primary-ink)',
        filter: glow ? 'drop-shadow(0 0 6px rgba(95, 243, 224, 0.45))' : undefined,
      }}
    >
      {ring ? (
        <span
          aria-hidden="true"
          data-corner-ring
          style={{
            width: 44, height: 44, boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(233,245,242,.6)',
            borderRadius: '50%',
          }}
        >
          <PixelIcon name={icon} size={32} />
        </span>
      ) : <PixelIcon name={icon} size={32} />}
    </button>
  );
}
