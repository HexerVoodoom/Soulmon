import { NavGlyph, type NavGlyphName } from '../ui/NavGlyphs';

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
 * O rótulo existe no `aria-label` e no `title`; na tela o glifo fala sozinho,
 * como nos mocks aprovados.
 */
export function CornerLink({ icon, label, side, onClick }: {
  icon: NavGlyphName;
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
        bottom: 'calc(var(--sm2-space-3) + env(safe-area-inset-bottom, 0px))',
        [side]: 'var(--sm2-space-3)',
        zIndex: 45,
        width: 56, height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
        color: 'var(--sm2-primary-ink)',
      }}
    >
      <NavGlyph name={icon} size={32} tone="primary" />
    </button>
  );
}
