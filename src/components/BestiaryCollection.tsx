import { useMemo } from 'react';
import { ENEMY_ROSTER, ENEMY_ROSTER_KEYS } from '../utils/enemyRoster';
import { rosterSpriteOf } from '../utils/novosSoulmon';
import { isStrayFoe, wildFoeLabel } from '../utils/wildFoeLabel';

/**
 * BESTIÁRIO — coleção de inimigos já vistos (M10), agora nas abas Selvagem/Desgarrado da Biblioteca (27/10/2026). Uma célula por
 * (criatura × estágio): vista = arte e nome; não vista = SILHUETA sem nome. A divisão é a de `wildFoeLabel` (estágios fortes =
 * Desgarrado; dono único em `utils/wildFoeLabel.ts`). O número é de COLEÇÃO ("N de M"), nunca percentual nem "faltam N". Chaves
 * antigas fora do roster (baby-i, linhas aposentadas) não contam.
 */
export function BestiaryCollection({ seen, mode, language = 'en-US' }: { seen: readonly string[] | undefined; mode: 'wild' | 'stray'; language?: string }) {
  const isPt = language === 'pt-BR';
  const seenSet = useMemo(() => new Set((seen ?? []).filter(k => ENEMY_ROSTER_KEYS.has(k))), [seen]);
  const entries = useMemo(() => ENEMY_ROSTER.filter(e => isStrayFoe(e.stage) === (mode === 'stray')), [mode]);
  const count = entries.filter(e => seenSet.has(e.key)).length;
  return (
    <section data-bestiary={mode} aria-label={wildFoeLabel(mode === 'stray' ? 'mega' : 'rookie', isPt)}>
      <p className="sm2-lib-s" style={{ margin: '0 0 8px' }}>
        <span className="sm2-num" data-bestiary-count>{count} / {entries.length}</span>
      </p>
      <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
        {entries.map((e, i) => {
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
    </section>
  );
}
