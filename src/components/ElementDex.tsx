import { useMemo, useState } from 'react';
import { elementIcon } from '../utils/elementIconArt';
import { LIBRARY_ELEMENT_IDS, dexUnlockedSet, elementComponents } from '../utils/elementDex';
import { curatedComponents } from '../utils/elementosCurados';
import { NewBadge } from './LibraryNewBadge';
import { ElementBaseSlots, emptySlots } from './ElementBaseSlots';
import { compositionHasBases, selectedBases } from '../utils/elementPotion';
import { ElementModal, dexElementName } from './ElementModal';
import { ELEMENTO_CATEGORIAS, ELEMENTO_CATEGORIA_ROTULO, elementoCategoria, type ElementoCategoria } from '../utils/elementoCategoria';

/**
 * DEX DE ELEMENTOS (aba "Elemento" da Biblioteca, 27/10/2026): os 20 base + 190 derivados + 59 curados (205–207, 212–267) + neutro (01/11/2026). Trancado = "?" SEM nome e SEM ícone (nem
 * no aria: o id não vai para o DOM da célula trancada). Destranca ao vencer um inimigo identificado (`utils/elementDex.ts`). Tocar
 * num destrancado abre a ficha (`ElementModal`, P5/24: constituintes clicáveis e Voltar). Filtros combinam em E: categoria
 * (Base/Comb II/III/IV/Special), "Novo" e bases. Ícone pelado (nunca dentro de box).
 */
export { dexElementName };

export function ElementDex({ defeated, language = 'en-US', isNew }: { defeated: readonly string[] | undefined; language?: string; isNew?: ReadonlySet<string> }) {
  const isPt = language === 'pt-BR';
  const unlocked = useMemo(() => dexUnlockedSet(defeated), [defeated]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [bases, setBases] = useState<(string | null)[]>(emptySlots);
  const [cat, setCat] = useState<ElementoCategoria | null>(null);
  const [soNovos, setSoNovos] = useState(false);
  const baseFiltering = selectedBases(bases).length > 0;
  const filtering = baseFiltering || cat !== null || soNovos;
  // Trancado nunca revela composição nem selo: com filtro de bases ou "Novo", só destrancados.
  const shown = LIBRARY_ELEMENT_IDS.filter(id =>
    (cat === null || elementoCategoria(id) === cat)
    && (!soNovos || (unlocked.has(id) && !!isNew?.has(id)))
    && (!baseFiltering || (unlocked.has(id) && compositionHasBases(elementComponents(id) ?? curatedComponents(id) ?? [id], bases))));
  const count = LIBRARY_ELEMENT_IDS.filter(id => unlocked.has(id)).length;
  return (
    <section data-element-dex aria-label={isPt ? 'Elementos' : 'Elements'}>
      <p className="sm2-lib-s" style={{ margin: '0 0 8px' }}>
        <span className="sm2-num" data-element-count>{count} / {LIBRARY_ELEMENT_IDS.length}</span>
      </p>
      <div role="group" aria-label={isPt ? 'Categoria' : 'Category'} data-element-categories style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', margin: '0 0 12px' }}>
        {ELEMENTO_CATEGORIAS.map(c => (
          <button key={c} type="button" data-element-cat={c} aria-pressed={cat === c} className={cat === c ? 'sm2-kit-chip sm2-kit-chip-on' : 'sm2-kit-chip'}
            onClick={() => setCat(cat === c ? null : c)}>{ELEMENTO_CATEGORIA_ROTULO[c][isPt ? 'pt' : 'en']}</button>
        ))}
        <label data-element-only-new style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, cursor: 'pointer' }}>
          <input type="checkbox" checked={soNovos} onChange={e => setSoNovos(e.target.checked)} />
          <span className="sm2-lib-s">{isPt ? 'Novo' : 'New'}</span>
        </label>
      </div>
      <div style={{ margin: '0 0 12px' }} data-base-filter>
        <ElementBaseSlots slots={bases} isPt={isPt} onChange={(i, v) => setBases(s => s.map((x, j) => (j === i ? v : x)))} />
      </div>
      {filtering && shown.length === 0 && (
        <p className="sm2-lib-s" data-filter-empty style={{ textAlign: 'center', padding: '16px 0', margin: 0 }}>{baseFiltering ? (isPt ? 'Nenhum elemento com essas bases.' : 'No element with these bases.') : (isPt ? 'Nenhum elemento com esse filtro.' : 'No element matches this filter.')}</p>
      )}
      <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
        {shown.map((id, i) => {
          if (!unlocked.has(id)) {
            // Trancado: nenhum id, nome ou ícone na célula (nem no aria).
            return (
              <li key={i} data-element-cell="locked" aria-label={isPt ? 'Elemento ainda trancado' : 'Element still locked'}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 64 }}>
                <span aria-hidden="true" className="sm2-lib-h2 sm-dex-lock">?</span>
              </li>
            );
          }
          const icon = elementIcon(id);
          const nome = dexElementName(id, isPt);
          return (
            <li key={id} style={{ display: 'flex' }}>
              <button type="button" data-element-cell={id} aria-label={nome} onClick={() => setOpenId(id)}
                style={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: 4, background: 'none', border: 0, cursor: 'pointer' }}>
                {isNew?.has(id) && <NewBadge overlay />}
                {icon && <img src={icon} alt="" aria-hidden="true" width={32} height={32} draggable={false} style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />}
                <span className="sm2-lib-s" style={{ fontSize: 10, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--sm2-ink)' }}>{nome}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {openId && <ElementModal id={openId} unlocked={unlocked} isPt={isPt} onClose={() => setOpenId(null)} />}
    </section>
  );
}
