import { describe, it, expect } from 'vitest';
import { applyShopBuy, shopBuyRefusal, type ShopBuyState } from './shopBuy';
import type { ShopItem } from './shop';

/**
 * O DOIS-TOQUES da compra na loja (X-6, instância 2).
 *
 * O que estes testes provam não é aritmética de preço — é PROCEDÊNCIA: a
 * segunda aplicação encadeada sobre o resultado da primeira tem de enxergar o
 * que a primeira escreveu. Sem a reconferência dentro do updater, o saldo vai a
 * negativo e o cenário entra duas vezes na lista de posse.
 */

const base = (over: Partial<ShopBuyState> = {}): ShopBuyState => ({
  gamePoints: 0,
  emblems: 0,
  foodInventory: {},
  ownedBackgrounds: [],
  ownedFurniture: [],
  ...over,
});

const item = (over: Partial<ShopItem> & Pick<ShopItem, 'id' | 'kind' | 'price'>): ShopItem => ({
  icon: '🎶',
  namePt: '', nameEn: '', descPt: '', descEn: '',
  ...over,
});

describe('applyShopBuy — a recusa é reconferida sobre o prev', () => {
  it('saldo EXATAMENTE igual ao preço: dois toques no mesmo lote não deixam o saldo negativo', () => {
    const chip = item({ id: 'chip-harmony', kind: 'chip', price: 30, icon: '🎶' });
    const a = applyShopBuy(base({ gamePoints: 30 }), chip);
    const b = applyShopBuy(a.state, chip);

    expect(a.refused).toBeUndefined();
    expect(a.state.gamePoints).toBe(0);
    expect(b.refused).toBe('no-funds');
    expect(b.state.gamePoints).toBe(0);
    // O segundo toque não pode ter entregue o item de graça.
    expect(b.state.foodInventory['🎶']).toBe(1);
  });

  it('emblemas: mesma trava, na moeda do torneio', () => {
    const troféu = item({ id: 'emb-1', kind: 'chip', price: 5, currency: 'emblems', icon: '👊' });
    const a = applyShopBuy(base({ emblems: 5 }), troféu);
    const b = applyShopBuy(a.state, troféu);
    expect(a.state.emblems).toBe(0);
    expect(b.refused).toBe('no-funds');
    expect(b.state.emblems).toBe(0);
  });

  it('cenário: dois toques não duplicam o id em ownedBackgrounds nem cobram duas vezes', () => {
    const bg = item({ id: 'bg-neve', kind: 'bg', price: 100 });
    const a = applyShopBuy(base({ gamePoints: 250 }), bg);
    const b = applyShopBuy(a.state, bg);

    expect(a.state.ownedBackgrounds).toEqual(['bg-neve']);
    expect(a.state.equippedBackground).toBe('bg-neve');
    expect(b.refused).toBe('already-owned');
    expect(b.state.ownedBackgrounds).toEqual(['bg-neve']);
    expect(b.state.gamePoints).toBe(150); // cobrado UMA vez
  });

  it('decoração: dois toques não duplicam o id em ownedFurniture nem cobram duas vezes', () => {
    const sofa = item({ id: 'sofa', kind: 'furniture', price: 80, slot: 'floor-left' });
    const a = applyShopBuy(base({ gamePoints: 200 }), sofa);
    const b = applyShopBuy(a.state, sofa);

    expect(a.state.ownedFurniture).toEqual(['sofa']);
    expect(a.state.equippedDecor).toEqual({ 'floor-left': 'sofa' });
    expect(b.refused).toBe('already-owned');
    expect(b.state.ownedFurniture).toEqual(['sofa']);
    expect(b.state.gamePoints).toBe(120);
  });

  it('caminho feliz: nada de economia mudou — dois consumíveis com saldo sobrando somam', () => {
    const chip = item({ id: 'chip-harmony', kind: 'chip', price: 30, icon: '🎶' });
    const a = applyShopBuy(base({ gamePoints: 100 }), chip);
    const b = applyShopBuy(a.state, chip);
    expect(b.refused).toBeUndefined();
    expect(b.state.gamePoints).toBe(40);
    expect(b.state.foodInventory['🎶']).toBe(2);
  });

  it('shopBuyRefusal é a MESMA pergunta que a de fora — sem saldo, sem compra', () => {
    const chip = item({ id: 'chip-harmony', kind: 'chip', price: 30 });
    expect(shopBuyRefusal(base({ gamePoints: 29 }), chip)).toBe('no-funds');
    expect(shopBuyRefusal(base({ gamePoints: 30 }), chip)).toBeUndefined();
  });
});
