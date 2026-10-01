import { describe, it, expect } from 'vitest';
import { DREAM_DECOR_TWIN, equippableTwin } from './dreamDecorTwin';
import { DREAM_CATALOG } from './restWindow';
import { ALL_SHOP_ITEMS } from './shop';

describe('equippableTwin (F2 — "Equipar" do prêmio da manhã)', () => {
  it('sofá do sonho + sofá na coleção → equipa no espaço do sofá', () => {
    expect(equippableTwin('dream-old-couch', ['furn-sofa'])).toEqual({ decorId: 'furn-sofa', slot: 'floor-left' });
  });

  it('sem possuir o gêmeo, não há botão (o sonho não dá item de graça)', () => {
    expect(equippableTwin('dream-old-couch', [])).toBeNull();
    expect(equippableTwin('dream-old-couch', undefined)).toBeNull();
  });

  it('cena sem gêmeo, ou sem sonho, não equipa nada', () => {
    expect(equippableTwin('dream-aurora', ['furn-sofa'])).toBeNull();
    expect(equippableTwin(null, ['furn-sofa'])).toBeNull();
  });

  it('todo par aponta para um sonho do catálogo e uma decoração com espaço', () => {
    for (const [dream, decor] of Object.entries(DREAM_DECOR_TWIN)) {
      expect(DREAM_CATALOG.some(d => d.id === dream), dream).toBe(true);
      const item = ALL_SHOP_ITEMS.find(i => i.id === decor);
      expect(item?.kind, decor).toBe('furniture');
      expect(item?.slot, decor).toBeTruthy();
    }
  });
});
