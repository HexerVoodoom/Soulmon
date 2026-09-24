import { describe, it, expect } from 'vitest';
import {
  MERCADO_STALLS, STALL_CURRENCIES, stallItems, tournamentShopItems, itemCurrency, isNeverForSale,
} from './mercadoCatalog';
import { SHOP_ITEMS, TOURNAMENT_ITEMS, GLITCHTAMA_EMOJI, HEART_ITEM_EMOJI } from './shop';
import { MISSIONS, MISSION_CATEGORIES } from './missions';

/**
 * A vitrine do Mercado e da Arena (minimal-ui F5). O que trava aqui são as
 * regras de produto que a `ShopModal` carregava numa lista só e que agora
 * atravessam cinco prateleiras — cada uma é um lugar novo onde elas podiam
 * vazar em silêncio.
 */
const todas = () => MERCADO_STALLS.flatMap(st => STALL_CURRENCIES[st].map(c => ({ st, c, items: stallItems(st, c) })));

describe('as três moedas não se misturam', () => {
  it('cada aba lista SÓ itens cobrados na moeda dela', () => {
    for (const { st, c, items } of todas()) {
      for (const i of items) expect(itemCurrency(i), `${st}/${c}: ${i.id}`).toBe(c);
    }
  });

  it('a aba de Créditos não vende item nenhum (é a troca)', () => {
    for (const st of MERCADO_STALLS) expect(stallItems(st, 'credits')).toEqual([]);
  });

  it('a loja do Torneio cobra só em Emblemas', () => {
    for (const i of tournamentShopItems()) expect(i.currency).toBe('emblems');
  });
});

describe('a aba de Emblemas só vende cosmético', () => {
  it('nenhum item de Emblemas é consumível ou vantagem', () => {
    const emb = [...todas().filter(x => x.c === 'emblems').flatMap(x => x.items), ...tournamentShopItems()];
    expect(emb.length).toBeGreaterThan(0);
    for (const i of emb) expect(['bg', 'furniture'], i.id).toContain(i.kind);
  });

  it('Itens (consumíveis) não tem aba de Emblemas', () => {
    expect(STALL_CURRENCIES.itens).not.toContain('emblems');
  });
});

describe('Glitchtama nunca à venda, Coraçãozinho fora da vitrine', () => {
  it('nenhuma prateleira tem 🌀 nem 💗', () => {
    const vitrine = [...todas().flatMap(x => x.items), ...tournamentShopItems()];
    for (const i of vitrine) {
      expect(i.icon).not.toBe(GLITCHTAMA_EMOJI);
      expect(i.icon).not.toBe(HEART_ITEM_EMOJI);
      expect(i.kind).not.toBe('heart');
    }
  });

  it('o filtro é defensivo: um coraçãozinho devolvido ao catálogo continuaria fora', () => {
    expect(isNeverForSale({ id: 'x', kind: 'heart', icon: HEART_ITEM_EMOJI, namePt: '', nameEn: '', descPt: '', descEn: '', price: 1 })).toBe(true);
    expect(isNeverForSale({ id: 'glitchtama', kind: 'chip', icon: GLITCHTAMA_EMOJI, namePt: '', nameEn: '', descPt: '', descEn: '', price: 1 })).toBe(true);
  });
});

describe('nada que a loja vendia sumiu na repartição', () => {
  it('todo item vendável de SHOP_ITEMS e TOURNAMENT_ITEMS está em alguma prateleira', () => {
    const vitrine = new Set(todas().flatMap(x => x.items.map(i => i.id)));
    const faltando = [...SHOP_ITEMS, ...TOURNAMENT_ITEMS]
      .filter(i => !isNeverForSale(i))
      .filter(i => !vitrine.has(i.id))
      .map(i => i.id);
    expect(faltando).toEqual([]);
  });

  it('a loja de Emblemas do Torneio tem todos os prêmios do Torneio', () => {
    expect(tournamentShopItems().map(i => i.id)).toEqual(TOURNAMENT_ITEMS.map(i => i.id));
  });
});

describe('Conquistas filtra por categoria', () => {
  it('toda missão tem categoria, e toda categoria tem missão', () => {
    for (const m of MISSIONS) expect(MISSION_CATEGORIES).toContain(m.category);
    for (const c of MISSION_CATEGORIES) expect(MISSIONS.some(m => m.category === c), c).toBe(true);
  });
});
