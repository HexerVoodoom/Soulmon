import { describe, it, expect } from 'vitest';
import { essenceMaxBuy, essencePackPrice } from './essenceShop';

const CAP = 1_000_000;

describe('essencePackPrice (§479)', () => {
  it('1 e 5 mantêm os preços de antes; grupos de 5 com 10% off, resto no unitário', () => {
    expect(essencePackPrice('fogo', 1)).toBe(3); // ×3 (dono, 24/11/2026)
    expect(essencePackPrice('fogo', 5)).toBe(13);
    expect(essencePackPrice('vapor', 5)).toBe(27);
    expect(essencePackPrice('fogo', 12)).toBe(32);
    expect(essencePackPrice('fogo', 0)).toBe(0);
    expect(essencePackPrice('fogo', 999_999)).toBe(199_999 * 13 + 12);
    expect(essencePackPrice('fogo', CAP + 1)).toBe(0);
  });
});

describe('essenceMaxBuy', () => {
  it('limitado pelo saldo', () => { expect(essenceMaxBuy('fogo', 9, 0, CAP)).toEqual({ max: 3, reason: 'ok' }); });
  it('sem limite por compra: o saldo paga milhares', () => { expect(essenceMaxBuy('fogo', 8000, 0, CAP).max).toBe(3076); });
  it('saldo enorme: o estoque é o teto', () => { expect(essenceMaxBuy('fogo', 99_999_999, 0, CAP).max).toBe(CAP); });
  it('limitado pelo teto de estoque', () => { expect(essenceMaxBuy('fogo', 50, CAP - 2, CAP)).toEqual({ max: 2, reason: 'ok' }); });
  it('estoque cheio e sem saldo dão motivo', () => {
    expect(essenceMaxBuy('fogo', 50, CAP, CAP)).toEqual({ max: 0, reason: 'cap' });
    expect(essenceMaxBuy('fogo', 0, 0, CAP)).toEqual({ max: 0, reason: 'credits' });
  });
});
