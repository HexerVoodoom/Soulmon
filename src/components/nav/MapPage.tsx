import type { Language } from '../../utils/i18n';
import { Icon } from '../ui/Icon';
import { AREAS, areaHint, areaLabel, type AreaId } from '../../navigation';

/**
 * O MAPA — a segunda tela de topo (minimal-ui F1).
 *
 * **Placeholder limpo de propósito.** A arte isométrica (fundo 9:16 + 6
 * construções posicionadas em %) é a fatia F3; aqui o Mapa é uma grade 2×3 de
 * cartões com ícone, nome e uma linha do que há dentro. A ordem é a do `AREAS`
 * (`navigation.ts`) — um dono só.
 *
 * O link da Home (canto inferior esquerdo) NÃO mora aqui: é o `CornerLink`
 * montado pelo `App`, o mesmo componente do link do Mapa na Home.
 *
 * Ícones: os glifos autorais onde existe um (`shop`, `activities`,
 * `evolution`), Material honesto onde não existe (`emoji_events`, `swords`,
 * `groups`) — o mesmo critério de corte do `NavGlyphs.tsx`, e os mesmos
 * ícones que essas páginas já usavam.
 */
const AREA_ICON: Record<AreaId, string> = {
  mercado: 'shop',
  jogos: 'activities',
  arena: 'emoji_events',
  exploracao: 'swords',
  laboratorio: 'evolution',
  hall: 'groups',
};

export function MapPage({ language, onOpenArea }: {
  language: Language;
  onOpenArea: (id: AreaId) => void;
}) {
  const isPt = language === 'pt-BR';
  return (
    <section aria-labelledby="sm-map-title" data-map-page>
      <h1
        id="sm-map-title"
        style={{
          margin: '0 0 var(--sm2-space-4)',
          textAlign: 'center',
          fontFamily: 'var(--sm2-font-display)',
          fontSize: 'var(--sm2-text-xl)',
          fontWeight: 600,
          lineHeight: 'var(--sm2-leading-title)',
          color: 'var(--sm2-ink)',
        }}
      >
        {isPt ? 'Mapa' : 'Map'}
      </h1>
      <ul
        style={{
          listStyle: 'none', margin: 0, padding: 0,
          display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 'var(--sm2-space-3)',
        }}
      >
        {AREAS.map(id => (
          <li key={id}>
            <button
              type="button"
              data-map-area={id}
              onClick={() => onOpenArea(id)}
              style={{
                width: '100%', minHeight: 120,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 'var(--sm2-space-2)',
                padding: 'var(--sm2-space-4) var(--sm2-space-3)',
                background: 'var(--sm2-surface)',
                border: '1px solid var(--sm2-line)',
                borderRadius: 'var(--sm2-radius-md)',
                color: 'var(--sm2-ink)', cursor: 'pointer', textAlign: 'center',
              }}
            >
              <Icon name={AREA_ICON[id]} size={32} tone="primary" />
              <span
                data-map-label
                style={{
                  fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-md)',
                  fontWeight: 600, lineHeight: 'var(--sm2-leading-title)',
                }}
              >
                {areaLabel(id, isPt)}
              </span>
              <span
                style={{
                  fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-xs)',
                  lineHeight: 'var(--sm2-leading-body)', color: 'var(--sm2-muted)',
                }}
              >
                {areaHint(id, isPt)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
