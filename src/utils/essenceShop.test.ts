import { describe, it, expect } from 'vitest';
import { essenceMaxBuy, essencePackPrice, ESSENCE_MAX_PER_BUY } from './essenceShop';

const CAP = 1_000_000;

describe('essencePackPrice (§479)', () => {
  it('1 e 5 mantêm os preços de antes; grupos de 5 com 10% off, resto no unitário', () => {
    expect(essencePackPrice('fogo', 1)).toBe(1);
    expect(essencePackPrice('fogo', 5)).toBe(4);
    expect(essencePackPrice('vapor', 5)).toBe(9);
    expect(essencePackPrice('fogo', 12)).toBe(10);
    expect(essencePackPrice('fogo', 0)).toBe(0);
    expect(essencePackPrice('fogo', ESSENCE_MAX_PER_BUY + 1)).toBe(0);
  });
});

describe('essenceMaxBuy', () => {
  it('limitado pelo saldo', () => { expect(essenceMaxBuy('fogo', 3, 0, CAP)).toEqual({ max: 3, reason: 'ok' }); });
  it('limitado pelo teto por compra', () => { expect(essenceMaxBuy('fogo', 9999, 0, CAP).max).toBe(ESSENCE_MAX_PER_BUY); });
  it('limitado pelo teto de estoque', () => { expect(essenceMaxBuy('fogo', 50, CAP - 2, CAP)).toEqual({ max: 2, reason: 'ok' }); });
  it('estoque cheio e sem saldo dão motivo', () => {
    expect(essenceMaxBuy('fogo', 50, CAP, CAP)).toEqual({ max: 0, reason: 'cap' });
    expect(essenceMaxBuy('fogo', 0, 0, CAP)).toEqual({ max: 0, reason: 'credits' });
  });
});
