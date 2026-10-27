import { useMemo, useState } from 'react';
import { RitualDialog } from './ritual/RitualKit';
import { elementIcon } from '../utils/elementIconArt';
import { elementLabel } from '../utils/arena';
import { elementoNomeDe } from '../utils/soulProfile/ficha/elementoNome';
import { ALL_ELEMENT_IDS, BASE_ELEMENT_IDS, dexUnlockedSet, elementComponents } from '../utils/elementDex';
import { elementMatchups } from '../utils/elementDexMatchups';

/**
 * DEX DE ELEMENTOS (aba "Elemento" da Biblioteca, 27/10/2026): os 20 base + 190 derivados. Trancado = "?" SEM nome e SEM ícone (nem
 * no aria: o id não vai para o DOM da célula trancada). Destranca ao vencer um inimigo identificado (`utils/elementDex.ts`). Tocar
 * num destrancado abre a ficha: ícone grande, nome, composição (derivado) e forte/fraco contra — o que ainda está trancado ali
 * também aparece como "?". Ícone pelado (nunca dentro de box).
 */
const BASE_SET: ReadonlySet<string> = new Set(BASE_ELEMENT_IDS);
export const dexElementName = (id: string, isPt: boolean): string =>
  BASE_SET.has(id) ? elementLabel(id, isPt) : (isPt ? elementoNomeDe(id).pt : elementoNomeDe(id).en);

function ElementRef({ id, open, isPt }: { id: string; open: boolean; isPt: boolean }) {
  const icon = open ? elementIcon(id) : undefined;
  return (
    <li data-dex-ref={open ? id : undefined} data-open={open ? '1' : '0'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32 }}>
      {open ? (
        <>
          {icon && <img src={icon} alt="" aria-hidden="true" width={24} height={24} draggable={false} style={{ width: 24, height: 24, imageRendering: 'pixelated' }} />}
          <span className="sm2-lib-s" style={{ color: 'var(--sm2-ink)' }}>{dexElementName(id, isPt)}</span>
        </>
      ) : (
        <span className="sm2-lib-s" aria-label={isPt ? 'Elemento ainda trancado' : 'Element still locked'}>?</span>
      )}
    </li>
  );
}

function RefList({ title, ids, unlocked, isPt }: { title: string; ids: readonly string[]; unlocked: ReadonlySet<string>; isPt: boolean }) {
  return (
    <div>
      <p className="sm2-lib-s" style={{ margin: '0 0 4px' }}>{title}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {ids.map(id => <ElementRef key={id} id={id} open={unlocked.has(id)} isPt={isPt} />)}
      </ul>
    </div>
  );
}

export function ElementDex({ defeated, language = 'en-US' }: { defeated: readonly string[] | undefined; language?: string }) {
  const isPt = language === 'pt-BR';
  const unlocked = useMemo(() => dexUnlockedSet(defeated), [defeated]);
  const [openId, setOpenId] = useState<string | null>(null);
  const count = ALL_ELEMENT_IDS.filter(id => unlocked.has(id)).length;
  const comps = openId ? elementComponents(openId) : undefined;
  const m = openId ? elementMatchups(openId) : undefined;
  return (
    <section data-element-dex aria-label={isPt ? 'Elementos' : 'Elements'}>
      <p className="sm2-lib-s" style={{ margin: '0 0 8px' }}>
        <span className="sm2-num" data-element-count>{count} / {ALL_ELEMENT_IDS.length}</span>
      </p>
      <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
        {ALL_ELEMENT_IDS.map((id, i) => {
          if (!unlocked.has(id)) {
            // Trancado: nenhum id, nome ou ícone na célula (nem no aria).
            return (
              <li key={i} data-element-cell="locked" aria-label={isPt ? 'Elemento ainda trancado' : 'Element still locked'}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 64 }}>
                <span aria-hidden="true" className="sm2-lib-h2" style={{ color: 'var(--sm2-muted)' }}>?</span>
              </li>
            );
          }
          const icon = elementIcon(id);
          const nome = dexElementName(id, isPt);
          return (
            <li key={id} style={{ display: 'flex' }}>
              <button type="button" data-element-cell={id} aria-label={nome} onClick={() => setOpenId(id)}
                style={{ flex: 1, minWidth: 0, minHeight: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: 4, background: 'none', border: 0, cursor: 'pointer' }}>
                {icon && <img src={icon} alt="" aria-hidden="true" width={32} height={32} draggable={false} style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />}
                <span className="sm2-lib-s" style={{ fontSize: 10, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--sm2-ink)' }}>{nome}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {openId && m && (
        <RitualDialog onClose={() => setOpenId(null)} labelledBy="sm2-dex-title" closeLabel={isPt ? 'Fechar' : 'Close'} maxWidth={320}>
          <h2 id="sm2-dex-title" className="sm2-lib-h2" style={{ minHeight: 44, display: 'flex', alignItems: 'center', paddingRight: 48 }}>
            {dexElementName(openId, isPt)}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }} data-element-detail={openId}>
            {elementIcon(openId) && <img src={elementIcon(openId)} alt="" aria-hidden="true" width={96} height={96} draggable={false} style={{ width: 96, height: 96, imageRendering: 'pixelated' }} />}
            <div style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {comps && <RefList title={isPt ? 'Composição' : 'Composition'} ids={comps} unlocked={unlocked} isPt={isPt} />}
              <RefList title={isPt ? 'Forte contra' : 'Strong against'} ids={m.strong} unlocked={unlocked} isPt={isPt} />
              <RefList title={isPt ? 'Fraco contra' : 'Weak against'} ids={m.weak} unlocked={unlocked} isPt={isPt} />
            </div>
          </div>
        </RitualDialog>
      )}
    </section>
  );
}
