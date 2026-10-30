import { useState } from 'react';
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
  const empty = isPt ? 'Vazio' : 'Empty';
  const clear = isPt ? 'Limpar espaço' : 'Clear slot';
  const set = (i: number, id: string | null) => { onChange(i, id); setMenu(null); };
  return (
    <>
      <div style={{ display: 'flex', gap: 8 }} data-potion-slots>
        {slots.map((id, i) => (
          <button key={i} type="button" data-slot={i} aria-expanded={menu === i} aria-label={`${i + 1}: ${id ? elName(id, isPt) : empty}`}
            onClick={() => setMenu(menu === i ? null : i)}
            style={{ all: 'unset', cursor: 'pointer', flex: 1, minWidth: 0, minHeight: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, borderBottom: `2px solid ${menu === i ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)'}` }}>
            {id ? <ElementIcon id={id} size={32} /> : <span aria-hidden="true" style={{ fontSize: 24, color: 'var(--sm2-muted)' }}>+</span>}
            <span style={{ ...sm2Hint, textAlign: 'center' }}>{id ? elName(id, isPt) : empty}</span>
          </button>
        ))}
      </div>
      {menu !== null && (
        <ul data-potion-menu style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 2, maxHeight: 220, overflowY: 'auto' }}>
          {slots[menu] && <li><button type="button" onClick={() => set(menu, null)} style={{ all: 'unset', cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center', ...sm2Text }}>{clear}</button></li>}
          {BASE_ELEMENT_IDS.filter(id => !slots.includes(id) || slots[menu] === id).map(id => (
            <li key={id}>
              <button type="button" data-base={id} onClick={() => set(menu, id)} style={{ all: 'unset', cursor: 'pointer', minHeight: 44, width: '100%', display: 'flex', alignItems: 'center', gap: 10, ...sm2Text }}>
                <ElementIcon id={id} size={24} /><span>{elName(id, isPt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
