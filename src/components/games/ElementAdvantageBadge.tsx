import { ELEMENT_ADVANTAGE_TAG } from './pveTags';

/**
 * Selo "Super eficiente! / Pouco eficiente" (27/10/2026): sai de `elementAdvantage` (+1 / -1). Neutro (0) não renderiza NADA.
 * Vive no slot `badge` do `BattleStage` (ao lado do título, sobre a cena: tinta do visor). O texto é o sinal; a cor nunca é a única pista.
 */
export function ElementAdvantageBadge({ advantage, isPt, onScene = true }: { advantage: -1 | 0 | 1; isPt: boolean; /** Sobre a cena do visor (tinta de visor) ou sobre superfície comum. */ onScene?: boolean }) {
  if (advantage === 0) return null;
  const tag = ELEMENT_ADVANTAGE_TAG[isPt ? 'pt' : 'en'];
  return (
    <span
      role="status"
      data-element-advantage={advantage === 1 ? 'up' : 'down'}
      style={{
        fontSize: 'var(--sm2-text-xs)', lineHeight: 1.2, whiteSpace: 'nowrap',
        fontWeight: advantage === 1 ? 600 : 400,
        color: onScene ? 'var(--sm2-viewport-ink)' : (advantage === 1 ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)'),
        textShadow: onScene ? '0 1px 2px rgba(0,0,0,.8)' : undefined,
      }}
    >
      {advantage === 1 ? tag.up : tag.down}
    </span>
  );
}
