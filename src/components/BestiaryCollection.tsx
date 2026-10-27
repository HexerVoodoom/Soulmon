import { useMemo } from 'react';
import { ENEMY_ROSTER, ENEMY_ROSTER_KEYS } from '../utils/enemyRoster';
import { rosterSpriteOf } from '../utils/novosSoulmon';
import { wildFoeLabel } from '../utils/wildFoeLabel';

/**
 * BESTIÁRIO — coleção de inimigos já vistos (M10). Uma célula por (criatura × estágio): vista = arte e nome; não vista = SILHUETA
 * sem nome. O número é de COLEÇÃO ("N de M"), nunca percentual nem "faltam N". Chaves antigas fora do roster (baby-i, linhas
 * aposentadas) não contam.
 */
export function BestiaryCollection({ seen, language = 'en-US' }: { seen: readonly string[] | undefined; language?: string }) {
  const isPt = language === 'pt-BR';
  const seenSet = useMemo(() => new Set((seen ?? []).filter(k => ENEMY_ROSTER_KEYS.has(k))), [seen]);
  const total = ENEMY_ROSTER.length;
  return (
    <details className="sm2-stats-s" data-bestiary>
      <summary style={{ minHeight: 44, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        {isPt ? 'Bestiário' : 'Bestiary'} <span className="sm2-num" data-bestiary-count style={{ marginLeft: 8 }}>{seenSet.size} / {total}</span>
      </summary>
      <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 8, listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
        {ENEMY_ROSTER.map((e, i) => {
          const vista = seenSet.has(e.key);
          const src = rosterSpriteOf(e);
          return (
            <li key={e.key} data-bestiary-cell={e.key} data-seen={vista ? '1' : '0'} aria-label={vista ? `${wildFoeLabel(e.stage, isPt)} #${i + 1}` : (isPt ? 'Ainda não encontrado' : 'Not met yet')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {src && (
                <img src={src} alt="" aria-hidden="true" loading="lazy" draggable={false} width={48} height={48}
                  style={{ width: 48, height: 48, imageRendering: 'pixelated', objectFit: 'contain', filter: vista ? undefined : 'brightness(0) opacity(0.45)' }} />
              )}
              <span style={{ fontSize: 10, textAlign: 'center' }}>{vista ? `#${i + 1}` : '???'}</span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
