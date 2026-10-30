import { describe, it, expect } from 'vitest';
import {
  POTION_COSTS, potionCost, potionKey, canAffordPotion, elementsMatchingBases, affordablePotionElements, craftPotion, givePotion,
  applyPotionOnEvolve, isPotionKey, potionCostFor, elementComposition,
} from './elementPotion';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { SPECIAL_ITEMS } from './shop';
import { applySpecialItem } from './specialItemUse';
import { spendEssences } from './essences';
import { petElementOf } from './starterElements';

const vapor = DERIVED_ELEMENT_PAIRS.find(d => d.id === 'vapor')!; // fogo + agua
const [a, b] = vapor.componentes;
const base = (e: Record<string, number> = {}): { essences: Record<string, number>; essenceSpent?: Record<string, number>; foodInventory: Record<string, number> } => ({ essences: e, foodInventory: {} });

describe('poção de elemento', () => {
  it('custos: base 300; par 300+300+200; trio genérico', () => {
    expect(potionCost('fogo')).toEqual([{ id: 'fogo', qty: POTION_COSTS.baseOwn }]);
    expect(potionCost('vapor')).toEqual([{ id: a, qty: 300 }, { id: b, qty: 300 }, { id: 'vapor', qty: 200 }]);
    expect(potionCostFor('xx_yy', ['fogo', 'agua', 'terra'])).toEqual([]);
    expect(potionCostFor('vapor', ['fogo', 'agua', 'terra'])).toEqual([
      { id: 'fogo', qty: 200 }, { id: 'agua', qty: 200 }, { id: 'terra', qty: 200 }, { id: 'vapor', qty: 150 }]);
    expect(potionCost('nao_existe')).toEqual([]);
  });
  it('filtro E', () => {
    const w = elementsMatchingBases(['agua']);
    expect(w).toContain('agua'); expect(w).toContain('vapor');
    expect(w.every(id => elementComposition(id)!.includes('agua'))).toBe(true);
    const both = elementsMatchingBases([a, b]);
    expect(both).toEqual(['vapor']);
    expect(elementsMatchingBases([]).length).toBe(210);
    expect(elementsMatchingBases([a, null, a])).toEqual(elementsMatchingBases([a]));
  });
  it('só o que dá para pagar', () => {
    expect(affordablePotionElements({}, ['agua'])).toEqual([]);
    expect(affordablePotionElements({ agua: 300 }, ['agua'])).toEqual(['agua']);
    expect(affordablePotionElements({ [a]: 300, [b]: 300, vapor: 199 }, [a])).toEqual([a]); // o par vapor falta 1 de essência final
    expect(affordablePotionElements({ [a]: 300, [b]: 300, vapor: 200 }, [a, b])).toEqual(['vapor']);
  });
  it('fabricar consome exatamente, soma gasto, e é idempotente sem saldo', () => {
    const s0 = base({ [a]: 700, [b]: 300, vapor: 250 });
    const s1 = craftPotion(s0, 'vapor');
    expect(s1.essences).toEqual({ [a]: 400, vapor: 50 });
    expect(s1.essenceSpent).toEqual({ [a]: 300, [b]: 300, vapor: 200 });
    expect(s1.foodInventory[potionKey('vapor')]).toBe(1);
    expect(craftPotion(s1, 'vapor')).toBe(s1); // segundo toque no mesmo lote: sem saldo
    expect(craftPotion(s0, 'nao_existe')).toBe(s0);
  });
  it('spendEssences é tudo-ou-nada', () => {
    expect(spendEssences({ essences: { fogo: 5 } }, [{ id: 'fogo', qty: 3 }, { id: 'agua', qty: 1 }])).toBeNull();
  });
  it('dar a poção: sobrescreve a anterior e consome', () => {
    const k1 = potionKey('fogo'); const k2 = potionKey('agua');
    let s = { ...base(), foodInventory: { [k1]: 1, [k2]: 2 } } as ReturnType<typeof base> & { evolutionPotion?: string };
    s = givePotion(s, k1); expect(s.evolutionPotion).toBe('fogo'); expect(s.foodInventory[k1]).toBeUndefined();
    s = givePotion(s, k2); expect(s.evolutionPotion).toBe('agua'); expect(s.foodInventory[k2]).toBe(1);
    expect(givePotion(s, k1)).toBe(s);
  });
  it('catálogo especial + uso pela porta única', () => {
    const k = potionKey('lava');
    expect(isPotionKey(k)).toBe(true); expect(isPotionKey('potion:xx')).toBe(false);
    expect(SPECIAL_ITEMS[k]?.kind).toBe('potion');
    const prev = { foodInventory: { [k]: 1 }, perfectDays: 0, healthPoints: 1, maxHealthPoints: 3 } as unknown as Parameters<typeof applySpecialItem>[0];
    const r = applySpecialItem(prev, k, new Date());
    expect(r.state.evolutionPotion).toBe('lava'); expect(r.state.foodInventory[k]).toBeUndefined();
    expect(applySpecialItem(r.state, k, new Date()).refused).toBe('no-stock');
  });
  it('evolução consome a poção uma vez e o elemento passa a valer', () => {
    const s = applyPotionOnEvolve({ evolutionPotion: 'lava' });
    expect(s).toEqual({ evolutionPotion: undefined, potionElement: 'lava' });
    expect(applyPotionOnEvolve(s)).toBe(s);
    expect(petElementOf({ potionElement: 'lava', soulmonMeta: { dominantElement: 'fogo' } })).toBe('lava');
  });
});
