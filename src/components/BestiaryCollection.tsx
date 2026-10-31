import { useMemo, useState } from 'react';
import { RitualDialog } from './ritual/RitualKit';
import { elementIcon } from '../utils/elementIconArt';
import { dexElementName } from './ElementDex';
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
  const [openKey, setOpenKey] = useState<string | null>(null);
  const openEntry = openKey ? entries.find(e => e.key === openKey) : undefined;
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
            <li key={e.key} data-bestiary-cell={e.key} data-seen={vista ? '1' : '0'} aria-label={vista ? undefined : (isPt ? 'Ainda não encontrado' : 'Not met yet')}
              style={{ display: 'flex' }}>
              {(() => {
                const inner = (
                  <>
                    {src && (
                      <img src={src} alt="" aria-hidden="true" loading="lazy" draggable={false} width={48} height={48}
                        style={{ width: 48, height: 48, imageRendering: 'pixelated', objectFit: 'contain', filter: vista ? undefined : 'brightness(0) opacity(0.45)' }} />
                    )}
                    <span style={{ fontSize: 10, textAlign: 'center' }}>{vista ? `#${i + 1}` : '???'}</span>
                  </>
                );
                const st = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 };
                return vista ? (
                  <button type="button" data-bestiary-open={e.key} aria-label={`${e.name} (${wildFoeLabel(e.stage, isPt)} #${i + 1})`} onClick={() => setOpenKey(e.key)}
                    style={{ ...st, minHeight: 56, padding: 0, background: 'none', border: 0, cursor: 'pointer', color: 'inherit' }}>{inner}</button>
                ) : <div style={st}>{inner}</div>;
              })()}
            </li>
          );
        })}
      </ul>
      {openEntry && (
        <RitualDialog onClose={() => setOpenKey(null)} labelledBy="sm2-bestiary-title" closeLabel={isPt ? 'Fechar' : 'Close'} maxWidth={320}>
          <h2 id="sm2-bestiary-title" className="sm2-lib-h2" style={{ minHeight: 44, display: 'flex', alignItems: 'center', paddingRight: 48 }}>{openEntry.name}</h2>
          <div data-bestiary-detail={openEntry.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {rosterSpriteOf(openEntry) && (
              <img src={rosterSpriteOf(openEntry)} alt="" aria-hidden="true" draggable={false} width={160} height={160}
                style={{ width: 160, height: 160, imageRendering: 'pixelated', objectFit: 'contain' }} />
            )}
            <p className="sm2-lib-s" data-bestiary-element={openEntry.element} style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--sm2-ink)' }}>
              {elementIcon(openEntry.element) && <img src={elementIcon(openEntry.element)} alt="" aria-hidden="true" width={24} height={24} draggable={false} style={{ width: 24, height: 24, imageRendering: 'pixelated' }} />}
              <span>{isPt ? 'Elemento' : 'Element'}: {dexElementName(openEntry.element, isPt)}</span>
            </p>
          </div>
        </RitualDialog>
      )}
    </section>
  );
}
