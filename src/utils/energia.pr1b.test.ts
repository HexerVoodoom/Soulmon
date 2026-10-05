/** PR1b (B1): uma barra cheia = um especial; depois do cast a barra mostra 0. */
import { describe, it, expect } from 'vitest';
import { ENERGY_MAX, ENERGY_DEALT, spendEnergy, strikeEnergy, addEnergy } from './energia';

describe('B1 — energia zera no cast', () => {
  it('barra cheia → depois do cast a energia é 0 (o golpe de cast não rende "dealt")', () => {
    expect(strikeEnergy(ENERGY_MAX, true)).toBe(0);
  });
  it('golpe comum segue rendendo "dealt"', () => {
    expect(strikeEnergy(0, false)).toBe(ENERGY_DEALT);
  });
  it('sem excedente: a barra trava em ENERGY_MAX (clamp), então gastar sempre devolve 0', () => {
    let e = 0;
    for (let i = 0; i < 50; i++) e = addEnergy(e, 'cheer');
    expect(e).toBe(ENERGY_MAX);
    expect(spendEnergy(e)).toBe(0);
    expect(spendEnergy(ENERGY_MAX + 37)).toBe(0);
  });
});
