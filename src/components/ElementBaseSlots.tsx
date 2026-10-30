import { useState, type CSSProperties } from 'react';
import { sm2Hint, sm2Text } from './form/FormKit';
import { elementIcon } from '../utils/elementIconArt';
import { elementLabel } from '../utils/arena';
import { elementoNomeDe } from '../utils/soulProfile/ficha/elementoNome';
import { BASE_ELEMENT_IDS } from '../utils/elementDex';
import { POTION_MAX_BASES } from '../utils/elementPotion';

/**
 * Filtro de elementos BASE em três espaços lado a lado (dropdown). Dono único da UI do filtro: a Poção de Elemento (Laboratório) e as
 * Essências do Cambista usam este mesmo componente; a regra (E entre as bases) é `elementsMatchingBases` em `utils/elementPotion.ts`.
 */
export const elName = (id: string, isPt: boolean) => (BASE_ELEMENT_IDS.includes(id) ? elementLabel(id, isPt) : (isPt ? elementoNomeDe(id).pt : elementoNomeDe(id).en));

export function ElementIcon({ id, size }: { id: string; size: number }) {
  const src = elementIcon(id);
  return src ? <img src={src} alt="" aria-hidden="true" width={size} height={size} draggable={false} style={{ width: size, height: size, imageRendering: 'pixelated' }} /> : null;
}

export const emptySlots = (): (string | null)[] => Array.from({ length: POTION_MAX_BASES }, () => null);

export interface ElementBaseSlotsProps {
  slots: (string | null)[];
  isPt: boolean;
  /** Chamado com o índice e o novo valor (`null` limpa). */
  onChange: (index: number, id: string | null) => void;
}

export function ElementBaseSlots({ slots, isPt, onChange }: ElementBaseSlotsProps) {
  const [menu, setMenu] = useState<number | null>(null);
  const placeholder = isPt ? 'Escolher' : 'Select';
  const placeholderLong = isPt ? 'Escolha um elemento' : 'Select an element';
  const clear = isPt ? 'Limpar' : 'Clear';
  const set = (i: number, id: string | null) => { onChange(i, id); setMenu(null); };
  const field = (open: boolean): CSSProperties => ({
    all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flex: 1, minWidth: 0, minHeight: 44, padding: '6px 8px',
    display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, background: 'var(--sm2-surface)',
    border: `1.5px solid ${open ? 'var(--sm2-primary-ink)' : 'var(--sm2-line)'}`,
  });
  const option: CSSProperties = { all: 'unset', boxSizing: 'border-box', cursor: 'pointer', minHeight: 44, width: '100%', padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10, ...sm2Text };
  return (
    <div style={{ position: 'relative' }}>
      {/* Campos de seleção (caixa com borda arredondada, como um dropdown): tocar abre o menu logo abaixo; a 1ª opção é sempre "Limpar". */}
      <div style={{ display: 'flex', gap: 8 }} data-potion-slots>
        {slots.map((id, i) => (
          <button key={i} type="button" data-slot={i} aria-haspopup="listbox" aria-expanded={menu === i}
            aria-label={`${i + 1}: ${id ? elName(id, isPt) : placeholderLong}`}
            onClick={() => setMenu(menu === i ? null : i)} style={field(menu === i)}>
            {id && <ElementIcon id={id} size={20} />}
            <span style={{ ...sm2Hint, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: id ? 'var(--sm2-ink)' : 'var(--sm2-muted)' }}>
              {id ? elName(id, isPt) : placeholder}
            </span>
            <span aria-hidden="true" style={{ color: 'var(--sm2-muted)', fontSize: 12 }}>{menu === i ? '▴' : '▾'}</span>
          </button>
        ))}
      </div>
      {menu !== null && (
        <ul role="listbox" data-potion-menu
          style={{ listStyle: 'none', margin: '4px 0 0', padding: '4px 0', display: 'grid', maxHeight: 240, overflowY: 'auto',
            borderRadius: 10, border: '1.5px solid var(--sm2-line)', background: 'var(--sm2-surface)' }}>
          <li><button type="button" data-clear onClick={() => set(menu, null)} style={{ ...option, color: 'var(--sm2-muted)' }}>{clear}</button></li>
          {BASE_ELEMENT_IDS.filter(id => !slots.includes(id) || slots[menu] === id).map(id => (
            <li key={id}>
              <button type="button" role="option" aria-selected={slots[menu] === id} data-base={id} onClick={() => set(menu, id)} style={option}>
                <ElementIcon id={id} size={24} /><span>{elName(id, isPt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
