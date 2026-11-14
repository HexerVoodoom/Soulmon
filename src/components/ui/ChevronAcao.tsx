import type { CSSProperties } from 'react';
import { Icon } from './Icon';

/**
 * `ChevronAcao` — a SETA de ação do app: um chevron `>` turquesa SEM haste e SEM círculo (dono, 14/11/2026, REGISTRO §364).
 * UM dono para dois lugares: o fim da linha de hábito que leva a um prédio (`RitualRow`) e o fim do texto do balão dourado.
 *
 * · Glifo autoral `chevron_right` (`ui/NavGlyphs.tsx`), tinta `--sm2-primary-ink` (o mesmo token do link "Ir ao…" que ela substitui).
 * · Com `onClick`: é um `<button>` com alvo de toque de 44 px (largura E altura) e `aria-label` = `label`; não aumenta a linha
 *   (que já tem 44 px). Sem `onClick`: é só desenho (`<span aria-hidden>`), para morar DENTRO de um botão que já tem nome acessível.
 */
export function ChevronAcao({
  onClick, label, size = 20, style, ...dados
}: {
  onClick?: () => void;
  /** Nome acessível do botão (obrigatório quando há `onClick`). */
  label?: string;
  size?: number;
  style?: CSSProperties;
  [k: `data-${string}`]: string | undefined;
}) {
  const glifo = <Icon name="chevron_right" size={size} weight={600} />;
  const base: CSSProperties = { color: 'var(--sm2-primary-ink)', ...style };
  if (!onClick) {
    return <span aria-hidden="true" data-chevron-acao style={{ display: 'inline-flex', alignItems: 'center', ...base }} {...dados}>{glifo}</span>;
  }
  return (
    <button
      type="button"
      data-chevron-acao
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        flex: '0 0 auto', minWidth: 44, minHeight: 44, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...base,
      }}
      {...dados}
    >
      {glifo}
    </button>
  );
}
