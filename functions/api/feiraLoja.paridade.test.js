import { describe, it, expect } from 'vitest';
import { FEIRA_LOJA_CATALOGO, FEIRA_LOJA_VENDEDORES, FEIRA_LOJA_MATERIAIS, FEIRA_LOJA_PRATOS, FEIRA_LOJA_HONRA } from './_feiraLoja.js';
import { COUNTER_RING } from './_elementoBase.js';
import { MATERIAL_IDS } from '../../src/utils/buildingQuests.ts';
import { DISHES } from '../../src/utils/restaurant.ts';
import { TOURNAMENT_ITEMS } from '../../src/utils/shop.ts';
import { POTION_SPECIAL_ITEMS, potionKey } from '../../src/utils/elementPotion.ts';
import { hexCost } from './_hexsmith.js';
import { SHOP_ITEMS } from '../../src/utils/shop.ts';
import { isNeverForSale } from '../../src/utils/mercadoCatalog.ts';
import { hexCost as hexCostSrc } from '../../src/utils/hexsmith.ts';
import { HEX_COSTS } from '../../src/utils/hexsmith.ts';

/**
 * Pages Functions não importam de `src/`: o catálogo da feira de verdade é uma CÓPIA de (id, tipo, preço, ambiente) dos itens à venda em Bits
 * de `src/utils/shop.ts`. Aqui a cópia fica presa à fonte (footgun 9: regra copiada diverge em silêncio).
 */
describe('o catálogo da feira de verdade espelha `src/utils/shop.ts`', () => {
  const fonte = SHOP_ITEMS
    .filter(i => i.price > 0 && !i.unlock && !i.element && (i.currency ?? 'bits') === 'bits' && !isNeverForSale(i) && ['chip', 'furniture', 'bg'].includes(i.kind))
    .map(i => [i.id, i.kind, i.price, i.fits ?? '']);
  it('mesmos ids, tipos, preços e ambientes (nada trancado, nada exclusivo de elemento, nada em Honra)', () => {
    expect(FEIRA_LOJA_CATALOGO.map(r => [...r])).toEqual(fonte);
  });
  it('nenhum item do catálogo tem `unlock` nem moeda diferente de Bits', () => {
    for (const [id] of FEIRA_LOJA_CATALOGO) {
      const it = SHOP_ITEMS.find(x => x.id === id);
      expect(it, id).toBeTruthy();
      expect(it.unlock, id).toBeUndefined();
      expect(it.currency ?? 'bits', id).toBe('bits');
    }
  });
  it('o preço-base da Hexsmith (só a parte em Bits) é o do cliente', () => {
    for (const id of ['coroa:heal', 'luvas:magic', 'amuleto:fervor', 'garra:fervor', 'couraca:fervor']) {
      expect(hexCost(id).bits, id).toBe(hexCostSrc(id).bits);
    }
    expect([HEX_COSTS.coroa.bits, HEX_COSTS.luvas.bits, HEX_COSTS.element.bits].sort()).toEqual([1500, 2000, 500].sort());
  });
  it('os vendedores ativos espelham o cliente e cada arte existe no repo (reuso, nada novo)', async () => {
    const { readFileSync, existsSync } = await import('node:fs');
    const txt = readFileSync(new URL('../../src/utils/feiraLoja.ts', import.meta.url), 'utf8');
    const ativos = FEIRA_LOJA_VENDEDORES.filter(v => v.ativo).map(v => v.id);
    expect(txt).toContain(`FEIRA_LOJA_VENDORS = [${ativos.map(i => `'${i}'`).join(', ')}] as const`);
    for (const v of FEIRA_LOJA_VENDEDORES) {
      expect(existsSync(new URL(`../../${v.file}`, import.meta.url)), v.file).toBe(true);
      expect(['vesca', 'tessaria']).not.toContain(v.id);
    }
  });
});

describe('as prateleiras novas espelham o cliente', () => {
  it('materiais = MATERIAL_IDS', () => { expect([...FEIRA_LOJA_MATERIAIS]).toEqual([...MATERIAL_IDS]); });
  it('pratos = DISHES (id, Bits, efeito de combate)', () => {
    expect(FEIRA_LOJA_PRATOS.map(r => [...r])).toEqual(DISHES.map(d => [d.id, d.bits, ['atk', 'def', 'spd'].includes(d.effect.kind)]));
  });
  it('Honra = itens de TOURNAMENT_ITEMS pagos em Honra, sem trava nem elemento', () => {
    // A decoração de Honra de combate (`hon-*`, utils/honraDecor.ts) fica FORA da Feira até o dono decidir a P6 (docs/PLANO-HONRA-DECORACAO.md).
    const fonte = TOURNAMENT_ITEMS.filter(i => !i.id.startsWith('hon-') && i.currency === 'emblems' && i.price > 0 && !i.unlock && !i.element && ['furniture', 'bg'].includes(i.kind)).map(i => [i.id, i.kind, i.price, i.fits ?? '']);
    expect(FEIRA_LOJA_HONRA.map(r => [...r])).toEqual(fonte);
  });
  it('toda poção vendida existe no catálogo de uso do cliente', () => {
    for (const e of COUNTER_RING) expect(POTION_SPECIAL_ITEMS[potionKey(e)], e).toBeTruthy();
  });
});
