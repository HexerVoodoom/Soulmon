import { useMemo, useState } from 'react';
import { Icon } from '../ui/Icon';
import { ModalSheet, Segment, sm2Button, sm2Hint, sm2Text, Field } from '../form/FormKit';
import { CatalogMindNotice } from './CatalogMindNotice';
import { ACTIVITY_CATALOG } from '../../data/activityCatalog';
import { LIFE_AREA_LABEL, LIFE_AREAS, type CatalogItem, type LifeArea } from '../../types/activityCatalog';

/**
 * F4 do `docs/PLANO-CATALOGO-ATIVIDADES.md` — o `CreateModal` "vira
 * Catálogo": abas por área, busca, cartão com "por que funciona", e
 * "Algo que não está aqui?" para quem quer criar do zero (legado).
 *
 * Decisão do dono (28/09/2026): o "criar do zero" continua existindo, mas
 * ESCONDIDO atrás desse botão — nunca é a primeira coisa que a pessoa vê.
 *
 * Este componente é ADITIVO: não altera `CreateModal.tsx` (o fluxo legado,
 * que continua servindo o botão "Algo que não está aqui?" sem nenhuma
 * mudança de comportamento) — reduz o risco de regressão no formulário que
 * já está em produção.
 */
interface CatalogBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'pt-BR' | 'en-US';
  /** Item escolhido no nível 1 (o navegador só oferece o nível inicial; subir
   *  de nível é convite de `EvolveTaskModal`/`catalogLevel.ts`, depois). */
  onAdd: (item: CatalogItem) => void;
  /** "Algo que não está aqui?" — abre o fluxo legado de criar do zero. */
  onCreateFromScratch: () => void;
}

export function CatalogBrowserModal({ isOpen, onClose, language = 'en-US', onAdd, onCreateFromScratch }: CatalogBrowserModalProps) {
  const isPt = language === 'pt-BR';
  const [area, setArea] = useState<LifeArea | 'todas'>('todas');
  const [query, setQuery] = useState('');
  const [pendingMindItem, setPendingMindItem] = useState<CatalogItem | null>(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ACTIVITY_CATALOG.filter((item) => {
      if (area !== 'todas' && item.area !== area) return false;
      if (!q) return true;
      const name = (isPt ? item.name.pt : item.name.en).toLowerCase();
      return name.includes(q);
    });
  }, [area, query, isPt]);

  const requestAdd = (item: CatalogItem) => {
    if (item.optInOnly) { setPendingMindItem(item); return; }
    onAdd(item);
  };

  return (
    <ModalSheet open={isOpen} onClose={onClose} language={language} title={isPt ? 'Catálogo de atividades' : 'Activity catalog'}>
      {pendingMindItem ? (
        <CatalogMindNotice
          item={pendingMindItem}
          language={language}
          onCancel={() => setPendingMindItem(null)}
          onConfirm={() => { onAdd(pendingMindItem); setPendingMindItem(null); }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
          <Field
            placeholder={isPt ? 'Buscar…' : 'Search…'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={isPt ? 'Buscar no catálogo' : 'Search the catalog'}
          />

          <div role="radiogroup" aria-label={isPt ? 'Área' : 'Area'} style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            <Segment selected={area === 'todas'} onSelect={() => setArea('todas')} label={isPt ? 'Todas' : 'All'} />
            {LIFE_AREAS.map((a) => (
              <Segment
                key={a}
                selected={area === a}
                onSelect={() => setArea(a)}
                label={isPt ? LIFE_AREA_LABEL[a].pt : LIFE_AREA_LABEL[a].en}
              />
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item) => (
              <div key={item.id} className="sm2-conta-card" style={{ padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ ...sm2Text, fontWeight: 600 }}>
                    {item.emoji} {isPt ? item.name.pt : item.name.en}
                  </span>
                  <button type="button" onClick={() => requestAdd(item)} style={sm2Button('primary', false, 'sm')}>
                    {isPt ? 'Adicionar' : 'Add'}
                  </button>
                </div>
                <p style={{ ...sm2Hint, margin: '4px 0 0' }}>{isPt ? item.why.pt : item.why.en}</p>
              </div>
            ))}
            {items.length === 0 && (
              <p style={sm2Text}>{isPt ? 'Nada encontrado.' : 'Nothing found.'}</p>
            )}
          </div>

          <button type="button" onClick={onCreateFromScratch} style={{ ...sm2Button('outline'), width: '100%' }}>
            <Icon name="add" size={20} fill={0} tone="inherit" />
            {isPt ? 'Algo que não está aqui?' : "Something not here?"}
          </button>
        </div>
      )}
    </ModalSheet>
  );
}
