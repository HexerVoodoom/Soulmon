import { describe, it, expect } from 'vitest';
import { BASE_ELEMENT_IDS } from './elementDex';
import { neutroProgresso, neutroPlano, canAffordNeutroPotion } from './neutroPotion';
import { craftPotion, canAffordPotion, potionKey, isPotionKey, sanitizeElementId, POTION_SPECIAL_ITEMS, essenceThresholdCrossings, limiarDaPocao, POTION_COSTS } from './elementPotion';
import { essenceDropsOfFoe, sanitizeEssences, ehEssenciaColetavel } from './essences';
import { essenceUnitPrice, essencePackPrice } from './essenceShop';
import { RAVEN_ENTRY } from './enemyRoster';

const bases = (q: number) => Object.fromEntries(BASE_ELEMENT_IDS.map(b => [b, q]));
const cheio = () => ({ ...bases(100), neutro: 50 });
const st = (over: Record<string, unknown> = {}) => ({ defeatedElements: ['neutro'], essences: cheio() as Record<string, number>, essenceSpent: {} as Record<string, number>, foodInventory: {} as Record<string, number>, ...over });

describe('poção do Neutro (REGISTRO §452)', () => {
  it('progresso: x de 20 bases e neutro x/50; poção-base vale no lugar das 100 essências', () => {
    const p = neutroProgresso({ ...bases(100), [BASE_ELEMENT_IDS[0]]: 10, neutro: 20 }, { [potionKey(BASE_ELEMENT_IDS[0])]: 1 });
    expect(p.basesFeitas).toBe(20);
    expect(p.bases[0].via).toBe('pocao');
    expect(p.neutro).toBe(20);
    expect(p.completo).toBe(false);
    expect(neutroProgresso(bases(100)).completo).toBe(false);
    expect(neutroProgresso(cheio()).completo).toBe(true);
  });
  it('recusa sem consumir: falta 1 essência base, ou neutro 49, ou Neutro desconhecido', () => {
    for (const prev of [st({ essences: { ...cheio(), [BASE_ELEMENT_IDS[3]]: 99 } }), st({ essences: { ...cheio(), neutro: 49 } }), st({ defeatedElements: [] })]) {
      expect(craftPotion(prev, 'neutro')).toBe(prev);
    }
  });
  it('mistura por elemento: consome essência onde basta e a poção onde não', () => {
    const [a, ...resto] = BASE_ELEMENT_IDS;
    const prev = st({ essences: { ...cheio(), [a]: 0 }, foodInventory: { [potionKey(a)]: 2 } });
    expect(canAffordPotion(prev.essences, 'neutro', prev.foodInventory)).toBe(true);
    const n = craftPotion(prev, 'neutro');
    expect(n.foodInventory[potionKey('neutro')]).toBe(1);
    expect(n.foodInventory[potionKey(a)]).toBe(1);
    expect(n.essences.neutro ?? 0).toBe(0);
    expect(resto.every(b => (n.essences[b] ?? 0) === 0)).toBe(true);
    expect(n.essenceSpent.neutro).toBe(50);
  });
  it('NÃO exige nada dos compostos e com saldo sobrando só desconta o custo', () => {
    const prev = st({ essences: { ...cheio(), neutro: 80, [BASE_ELEMENT_IDS[0]]: 130 } });
    const n = craftPotion(prev, 'neutro');
    expect(n.essences.neutro).toBe(30);
    expect(n.essences[BASE_ELEMENT_IDS[0]]).toBe(30);
    expect(neutroPlano(cheio())!.essences).toHaveLength(21);
  });
  it('save antigo: potion:neutro vale, potion:pesadelo não', () => {
    expect(isPotionKey('potion:neutro')).toBe(true);
    expect(isPotionKey('potion:pesadelo')).toBe(false);
    expect(sanitizeElementId('neutro')).toBe('neutro');
    expect(sanitizeElementId('pesadelo')).toBeUndefined();
    expect(POTION_SPECIAL_ITEMS['potion:neutro']).toBeTruthy();
    expect(canAffordNeutroPotion(undefined)).toBe(false);
  });
});

describe('pop-up da Vesca aos 50 (mesma constante do custo)', () => {
  it('composto e Neutro aos 50, base aos 100, Pesadelo nunca', () => {
    expect(limiarDaPocao('vapor')).toBe(POTION_COSTS.compositeFinal);
    expect(limiarDaPocao('neutro')).toBe(50);
    expect(limiarDaPocao('fogo')).toBe(100);
    expect(limiarDaPocao('pesadelo')).toBeUndefined();
    expect(essenceThresholdCrossings({ vapor: 49, neutro: 49, fogo: 99 }, { vapor: 50, neutro: 50, fogo: 100 }).sort()).toEqual(['fogo']) // 17/11: a Vesca só oferece base;
    expect(essenceThresholdCrossings({}, { pesadelo: 999 })).toEqual([]);
  });
});

describe('essências do Neutro e do Pesadelo', () => {
  it('o Corvo deixa essência neutra', () => {
    expect(ehEssenciaColetavel('neutro')).toBe(true);
    expect(essenceDropsOfFoe(RAVEN_ENTRY, RAVEN_ENTRY.stage).some(d => d.id === 'neutro')).toBe(true);
  });
  it('saldo com neutro e pesadelo sobrevive à leitura do save', () => {
    expect(sanitizeEssences({ neutro: 3, pesadelo: 2 })).toEqual({ neutro: 3, pesadelo: 2 });
  });
  it('Cambista (cliente): neutro e pesadelo sem preço de compra', () => {
    for (const id of ['neutro', 'pesadelo']) { expect(essenceUnitPrice(id)).toBe(0); expect(essencePackPrice(id, 1)).toBe(0); expect(essencePackPrice(id, 5)).toBe(0); }
  });
});
