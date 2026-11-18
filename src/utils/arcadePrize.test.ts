import { describe, it, expect } from 'vitest';
import { grantGuildTrophy } from './guildClaimLocal';
import { ALL_SHOP_ITEMS, SHOP_ITEMS, isGuildReward } from './shop';
import { shopBuyRefusal } from './shopBuy';
import { sanitizeEntitlement } from './entitlements';

describe('Fliperama de Canto é prêmio, não item de loja (REGISTRO §482)', () => {
  it('sumiu da loja, segue resolvível pelo palco e nunca é comprável', () => {
    expect(SHOP_ITEMS.some(i => i.id === 'furn-arcade-cab')).toBe(false);
    const item = ALL_SHOP_ITEMS.find(i => i.id === 'furn-arcade-cab');
    expect(item?.slot).toBe('floor-left');
    expect(isGuildReward({ id: 'furn-arcade-cab' })).toBe(true);
    expect(shopBuyRefusal({ ownedFurniture: [], ownedBackgrounds: [], gamePoints: 999999, emblems: 999999 } as never, item!)).toBe('not-for-sale');
  });
  it('o item do servidor entra no save uma vez só', () => {
    const a = grantGuildTrophy({ ownedFurniture: [] as string[] }, 'furn-arcade-cab');
    expect(a.ownedFurniture).toEqual(['furn-arcade-cab']);
    expect(grantGuildTrophy(a, 'furn-arcade-cab')).toBe(a);
    expect(grantGuildTrophy(a, 'furn-sofa')).toBe(a); // dado do servidor não inventa item qualquer
  });
  it('a leitura do entitlement aceita só strings', () => {
    expect(sanitizeEntitlement({ tier: 'demo', credits: 0, adsLeft: 0, itemPrizes: ['furn-arcade-cab', 7] })?.itemPrizes).toEqual(['furn-arcade-cab']);
    expect(sanitizeEntitlement({ tier: 'demo', credits: 0, adsLeft: 0 })?.itemPrizes).toBeUndefined();
  });
});
