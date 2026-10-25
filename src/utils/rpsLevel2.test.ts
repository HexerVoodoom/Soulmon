import { describe, it, expect } from 'vitest';
import { freshInventory, spendPiece, petPick, remainingTypes, totalPieces } from './rpsLevel2';

describe('PPT nível 2', () => {
  it('começa com 3 de cada e gasta uma peça por jogada', () => {
    const inv = spendPiece(freshInventory(), 1);
    expect(inv).toEqual([3, 2, 3]);
    expect(totalPieces(inv)).toBe(8);
  });
  it('nunca fica negativo', () => {
    let inv = freshInventory();
    for (let i = 0; i < 5; i++) inv = spendPiece(inv, 0);
    expect(inv[0]).toBe(0);
  });
  it('inimigo só escolhe o que resta', () => {
    const inv: [number, number, number] = [0, 2, 0];
    for (const r of [0, 0.5, 0.99]) expect(petPick(inv, () => r)).toBe(1);
    expect(remainingTypes(inv)).toEqual([1]);
    expect(petPick([0, 0, 0])).toBeNull();
  });
});
