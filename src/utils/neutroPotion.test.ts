import { describe, it, expect } from 'vitest';
import { BASE_ELEMENT_IDS, ESSENCE_ELEMENT_IDS } from './elementDex';
import { NEUTRO_POTION_COST, NEUTRO_TOTAL, NEUTRO_IDS_POR_GRUPO, neutroProgresso, canAffordNeutroPotion } from './neutroPotion';
import { craftPotion, canAffordPotion, potionKey, isPotionKey, sanitizeElementId, POTION_SPECIAL_ITEMS } from './elementPotion';
import { essenceDropsOfFoe, sanitizeEssences, ehEssenciaColetavel } from './essences';
import { RAVEN_ENTRY } from './enemyRoster';

const cheio = () => Object.fromEntries(NEUTRO_POTION_COST.map(c => [c.id, c.qty]));
const base = (over: Record<string, unknown> = {}) => ({ defeatedElements: ['neutro'], essences: cheio(), essenceSpent: {}, foodInventory: {}, ...over });

describe('receita do Neutro (REGISTRO §452)', () => {
  it('20 base x100 + 249 compostos x50 = 269 itens; grupos 20/190/40/19; neutro e pesadelo fora', () => {
    expect(NEUTRO_TOTAL).toBe(269);
    expect(ESSENCE_ELEMENT_IDS).toHaveLength(269);
    expect(NEUTRO_IDS_POR_GRUPO.base).toHaveLength(20);
    expect(NEUTRO_IDS_POR_GRUPO.par).toHaveLength(190);
    expect(NEUTRO_IDS_POR_GRUPO.trio.length + NEUTRO_IDS_POR_GRUPO.quad.length).toBe(59);
    for (const c of NEUTRO_POTION_COST) expect(c.qty).toBe(BASE_ELEMENT_IDS.includes(c.id) ? 100 : 50);
    expect(NEUTRO_POTION_COST.some(c => c.id === 'neutro' || c.id === 'pesadelo')).toBe(false);
  });
  it('progresso agrupado', () => {
    const p = neutroProgresso({ [BASE_ELEMENT_IDS[0]]: 100, [BASE_ELEMENT_IDS[1]]: 99 });
    expect(p.feitos).toBe(1);
    expect(p.grupos[0].faltam).toHaveLength(19);
    expect(p.completo).toBe(false);
    expect(neutroProgresso(cheio()).completo).toBe(true);
  });
  it('recusa sem consumir quando falta 1', () => {
    const e = cheio(); e[NEUTRO_POTION_COST[5].id] -= 1;
    const prev = base({ essences: e });
    expect(canAffordNeutroPotion(e)).toBe(false);
    expect(craftPotion(prev, 'neutro')).toBe(prev);
  });
  it('recusa se o Neutro ainda não foi conhecido', () => {
    const prev = base({ defeatedElements: [] });
    expect(craftPotion(prev, 'neutro')).toBe(prev);
  });
  it('aceita e consome exatamente o custo, soma essenceSpent, entrega potion:neutro', () => {
    const prev = base({ essences: { ...cheio(), [BASE_ELEMENT_IDS[0]]: 130 } });
    expect(canAffordPotion(prev.essences, 'neutro', prev.foodInventory)).toBe(true);
    const n = craftPotion(prev, 'neutro');
    expect(n.foodInventory[potionKey('neutro')]).toBe(1);
    expect(n.essences[BASE_ELEMENT_IDS[0]]).toBe(30);
    expect(Object.values(n.essences).filter(v => v > 0)).toEqual([30]);
    expect(Object.keys(n.essenceSpent)).toHaveLength(269);
  });
  it('save antigo: chave potion:neutro e id neutro valem; pesadelo não tem poção', () => {
    expect(isPotionKey('potion:neutro')).toBe(true);
    expect(isPotionKey('potion:pesadelo')).toBe(false);
    expect(sanitizeElementId('neutro')).toBe('neutro');
    expect(sanitizeElementId('pesadelo')).toBeUndefined();
    expect(POTION_SPECIAL_ITEMS['potion:neutro']).toBeTruthy();
  });
});

describe('essências do Neutro e do Pesadelo', () => {
  it('o Corvo (neutro) deixa essência neutra', () => {
    expect(ehEssenciaColetavel('neutro')).toBe(true);
    expect(essenceDropsOfFoe(RAVEN_ENTRY, RAVEN_ENTRY.stage).some(d => d.id === 'neutro')).toBe(true);
  });
  it('saldo com neutro e pesadelo sobrevive à leitura do save (limite 271 chaves)', () => {
    const s = sanitizeEssences({ neutro: 3, pesadelo: 2 });
    expect(s).toEqual({ neutro: 3, pesadelo: 2 });
  });
});
