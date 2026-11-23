import { describe, it, expect } from 'vitest';
import { SHOP_ITEMS } from './shop';
import { DECOR_PRICE_TABLE } from './decorPrices';
import { elementShopVisible, petHasElement } from './elementExclusive';
import { FRAMES } from './frames';

describe('preço da decoração (2×/3×/5×, 04/11/2026)', () => {
  it('toda decoração de Bits está na tabela e o preço vivo é old × tier', () => {
    const decor = SHOP_ITEMS.filter(i => i.kind === 'furniture' && (i.currency ?? 'bits') === 'bits' && !i.unlock);
    expect(decor.length).toBe(DECOR_PRICE_TABLE.length);
    for (const row of DECOR_PRICE_TABLE) {
      const item = decor.find(i => i.id === row.id);
      expect(item, row.id).toBeDefined();
      expect(item!.price, row.id).toBe(row.old * row.tier);
    }
  });
  it('usa as três faixas', () => {
    const tiers = new Set(DECOR_PRICE_TABLE.map(r => r.tier));
    expect([...tiers].sort()).toEqual([2, 3, 5]);
  });
});

describe('cosmético exclusivo de elemento', () => {
  const comum = { id: 'x-comum' };
  const fogo = { id: 'x-fogo', element: 'fogo' };
  it('item comum aparece para todos, até sem elemento', () => {
    expect(elementShopVisible(comum, undefined)).toBe(true);
    expect(elementShopVisible(comum, 'agua')).toBe(true);
  });
  it('exclusivo só aparece para o elemento certo', () => {
    expect(elementShopVisible(fogo, 'fogo')).toBe(true);
    expect(elementShopVisible(fogo, 'agua')).toBe(false);
    expect(elementShopVisible(fogo, undefined)).toBe(false);
    expect(elementShopVisible(fogo, 'neutro')).toBe(false);
  });
  it('par derivado conta como seus dois componentes', () => {
    expect(petHasElement('fogo', 'vapor')).toBe(true);
    expect(petHasElement('agua', 'vapor')).toBe(true);
    expect(petHasElement('terra', 'vapor')).toBe(false);
  });
  it('posse vale mesmo com o elemento trocado', () => {
    expect(elementShopVisible(fogo, 'agua', ['x-fogo'])).toBe(true);
  });
  it('catálogo atual: nenhum item vendido ficou escondido por engano (só exclusivos declarados)', () => {
    for (const i of [...SHOP_ITEMS, ...FRAMES]) if (!i.element) expect(elementShopVisible(i, undefined)).toBe(true);
  });
});
