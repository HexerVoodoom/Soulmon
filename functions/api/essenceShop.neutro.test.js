import { describe, it, expect } from 'vitest';
import { essenceUnitPrice, essencePackPrice, isKnownEssenceElement, essenceShopIds } from './_essenceShop.js';

describe('Cambista (servidor): neutro e pesadelo nunca à venda (REGISTRO §452)', () => {
  it('sem preço, desconhecidos e fora da lista de oferta', () => {
    for (const id of ['neutro', 'pesadelo']) {
      expect(isKnownEssenceElement(id)).toBe(false);
      expect(essenceUnitPrice(id)).toBe(0);
      expect(essencePackPrice(id, 1)).toBe(0);
      expect(essencePackPrice(id, 5)).toBe(0);
      expect(essenceShopIds()).not.toContain(id);
    }
  });
});
