/** Paridade do Cambista de essências: catálogo e preço iguais no cliente e no servidor (§205). */
import { describe, it, expect } from 'vitest';
import * as server from './_essenceShop.js';
import { ALL_ELEMENT_IDS } from '../../src/utils/elementDex';
import { essencePackPrice, ESSENCE_PACK_SIZES } from '../../src/utils/essenceShop';
import { ESSENCE_MAX_PER_ELEMENT } from '../../src/utils/essences';

describe('essenceShop — paridade', () => {
  it('mesmo catálogo (210 ids do dex)', () => {
    expect([...server.essenceShopIds()].sort()).toEqual([...ALL_ELEMENT_IDS].sort());
  });
  it('mesmo preço para todo id e pacote', () => {
    for (const id of ALL_ELEMENT_IDS) for (const q of [1, 5, 2]) expect(essencePackPrice(id, q)).toBe(server.essencePackPrice(id, q));
  });
  it('mesmos pacotes e teto', () => {
    expect([...ESSENCE_PACK_SIZES]).toEqual([...server.ESSENCE_PACK_SIZES]);
    expect(server.ESSENCE_MAX_PER_ELEMENT).toBe(ESSENCE_MAX_PER_ELEMENT);
  });
});
