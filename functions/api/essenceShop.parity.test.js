/** Paridade do Cambista de essências: catálogo e preço iguais no cliente e no servidor (§205). */
import { describe, it, expect } from 'vitest';
import * as server from './_essenceShop.js';
import { ESSENCE_ELEMENT_IDS } from '../../src/utils/elementDex';
import { essencePackPrice, essenceMaxBuy, ESSENCE_PACK_SIZES } from '../../src/utils/essenceShop';
import { ESSENCE_MAX_PER_ELEMENT } from '../../src/utils/essences';

describe('essenceShop — paridade', () => {
  it('mesmo catálogo (210 do dex + curados)', () => {
    expect([...server.essenceShopIds()].sort()).toEqual([...ESSENCE_ELEMENT_IDS].sort());
  });
  it('mesmo preço para todo id e pacote', () => {
    for (const id of ESSENCE_ELEMENT_IDS) for (const q of [0, 1, 2, 5, 7, 10, 12, 99, 100, 101, 1000, 999_999, 1_000_000, 1_000_001, 1.5, -1]) expect(essencePackPrice(id, q)).toBe(server.essencePackPrice(id, q));
  });
  it('mesmos pacotes e teto', () => {
    expect([...ESSENCE_PACK_SIZES]).toEqual([...server.ESSENCE_PACK_SIZES]);
    expect(server.ESSENCE_MAX_PER_ELEMENT).toBe(ESSENCE_MAX_PER_ELEMENT);
  });
  it('essenceMaxBuy: o cliente nunca oferece N que o servidor recusaria por preço', () => {
    for (const id of ESSENCE_ELEMENT_IDS) for (const credits of [0, 1, 3, 9, 40, 500, 123_457, 9_999_999]) {
      const { max } = essenceMaxBuy(id, credits, 0, ESSENCE_MAX_PER_ELEMENT);
      if (max > 0) { expect(server.essencePackPrice(id, max)).toBeLessThanOrEqual(credits); expect(max === ESSENCE_MAX_PER_ELEMENT || server.essencePackPrice(id, max + 1) > credits).toBe(true); }
      else expect(server.essencePackPrice(id, 1)).toBeGreaterThan(credits);
    }
  });
});
