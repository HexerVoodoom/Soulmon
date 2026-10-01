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

/** A lupa (e o X que a fecha): ícone pelado num alvo de 44. */
const lupa = {
  flex: '0 0 44px', width: 44, height: 44,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  color: 'var(--sm2-ink)',
} as const;

export function CatalogBrowserModal({ isOpen, onClose, language = 'en-US', onAdd, onCreateFromScratch }: CatalogBrowserModalProps) {
  const isPt = language === 'pt-BR';
  const [area, setArea] = useState<LifeArea | 'todas'>('todas');
  const [query, setQuery] = useState('');
  const [pendingMindItem, setPendingMindItem] = useState<CatalogItem | null>(null);
  /* D4 (navegação do dono, 01/10/2026): a busca é uma LUPA no canto, que
     expande no campo ao toque. Fechar a lupa limpa o filtro — busca invisível
     filtrando a lista seria um estado escondido. */
  const [buscaAberta, setBuscaAberta] = useState(false);

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
          {/* D4: filtros e a lupa na MESMA faixa. A faixa de áreas rola na
              horizontal SEM barra visível (`.sm2-scroll-x-quiet`). */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {buscaAberta ? (
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Field
                  autoFocus
                  placeholder={isPt ? 'Buscar…' : 'Search…'}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label={isPt ? 'Buscar no catálogo' : 'Search the catalog'}
                  style={{ flex: 1, minWidth: 0 }}
                />
                <button
                  type="button"
                  onClick={() => { setQuery(''); setBuscaAberta(false); }}
                  aria-label={isPt ? 'Fechar busca' : 'Close search'}
                  style={lupa}
                >
                  <Icon name="close" size={24} />
                </button>
              </div>
            ) : (
              <>
                <div
                  role="radiogroup"
                  aria-label={isPt ? 'Área' : 'Area'}
                  className="sm2-scroll-x-quiet"
                  style={{ flex: 1, minWidth: 0, display: 'flex', gap: 6, overflowX: 'auto' }}
                >
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
                <button
                  type="button"
                  onClick={() => setBuscaAberta(true)}
                  aria-label={isPt ? 'Buscar no catálogo' : 'Search the catalog'}
                  aria-expanded={false}
                  data-catalog-search
                  style={lupa}
                >
                  <Icon name="search" size={24} />
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item) => (
              <div key={item.id} className="sm2-conta-card" style={{ padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  {/* D5: sem emoji como ícone — o nome fala sozinho. */}
                  <span style={{ ...sm2Text, fontWeight: 600 }}>
                    {isPt ? item.name.pt : item.name.en}
                  </span>
                  {/* D6: "Adicionar" mais baixo (32) — o cartão inteiro não
                      precisa de um botão de 44 de altura para uma ação curta. */}
                  <button type="button" onClick={() => requestAdd(item)} style={{ ...sm2Button('primary', false, 'sm'), minHeight: 32, height: 32, padding: '0 12px' }}>
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
