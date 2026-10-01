import { describe, it, expect } from 'vitest';
import { DREAM_DECOR_TWIN, dreamTwin, grantDreamTwin } from './dreamDecorTwin';
import { DREAM_CATALOG } from './restWindow';
import { ALL_SHOP_ITEMS } from './shop';

describe('dreamTwin (F2 — o sonho dá o item)', () => {
  it('sofá do sonho → o sofá da loja, no espaço dele', () => {
    const t = dreamTwin('dream-old-couch');
    expect(t?.decorId).toBe('furn-sofa');
    expect(t?.slot).toBe('floor-left');
  });

  it('cena sem gêmeo, ou sem sonho, não dá nada', () => {
    expect(dreamTwin('dream-aurora')).toBeNull();
    expect(dreamTwin(null)).toBeNull();
    expect(dreamTwin(undefined)).toBeNull();
  });

  it('todo par aponta para um sonho do catálogo e uma decoração com espaço', () => {
    for (const [dream, decor] of Object.entries(DREAM_DECOR_TWIN)) {
      expect(DREAM_CATALOG.some(d => d.id === dream), dream).toBe(true);
      const item = ALL_SHOP_ITEMS.find(i => i.id === decor);
      expect(item?.kind, decor).toBe('furniture');
      expect(item?.slot, decor).toBeTruthy();
      expect(dreamTwin(dream)?.decorId, dream).toBe(decor);
    }
  });
});

describe('grantDreamTwin (posse — decisão do dono 01/10/2026)', () => {
  it('quem não tem o sofá GANHA o sofá', () => {
    expect(grantDreamTwin([], 'dream-old-couch')).toEqual(['furn-sofa']);
    expect(grantDreamTwin(undefined, 'dream-old-couch')).toEqual(['furn-sofa']);
    expect(grantDreamTwin(['furn-chair'], 'dream-old-couch')).toEqual(['furn-chair', 'furn-sofa']);
  });

  it('idempotente: quem já tem não ganha um segundo (mesma referência)', () => {
    const owned = ['furn-sofa'];
    expect(grantDreamTwin(owned, 'dream-old-couch')).toBe(owned);
    const duas = grantDreamTwin(grantDreamTwin([], 'dream-old-couch'), 'dream-old-couch');
    expect(duas).toEqual(['furn-sofa']);
  });

  it('cena sem gêmeo não mexe na posse (mesma referência)', () => {
    const owned = ['furn-chair'];
    expect(grantDreamTwin(owned, 'dream-aurora')).toBe(owned);
    expect(grantDreamTwin(owned, null)).toBe(owned);
  });
});
