import { ALL_ELEMENT_IDS, ESSENCE_ELEMENT_IDS } from "./elementDex";
import { essenceDropsOfFoe } from "./essences";
import { describe, it, expect, vi } from 'vitest';
import {
  potionCost, potionIngredients, essenceThresholdCrossings, potionKey, canAffordPotion, elementsMatchingBases, affordablePotionElements, craftPotion, givePotion, isPotionUnlocked,
  applyPotionOnEvolve, isPotionKey, potionCostFor, elementComposition, readVescaOffered, writeVescaOffered,
} from './elementPotion';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { SPECIAL_ITEMS } from './shop';
import { applySpecialItem } from './specialItemUse';
import { spendEssences } from './essences';
import { petElementOf } from './starterElements';

const vapor = DERIVED_ELEMENT_PAIRS.find(d => d.id === 'vapor')!; // fogo + agua
const [a, b] = vapor.componentes;
const base = (e: Record<string, number> = {}, defeated: string[] = [...ALL_ELEMENT_IDS]): { defeatedElements?: string[]; essences: Record<string, number>; essenceSpent?: Record<string, number>; foodInventory: Record<string, number> } => ({ defeatedElements: defeated, essences: e, foodInventory: {} });

describe('poção de elemento', () => {
  it('custos: base 100 da própria; composto = 50 do composto + 1 poção de cada base', () => {
    expect(potionCost('fogo')).toEqual([{ id: 'fogo', qty: 100 }]);
    expect(potionIngredients('fogo')).toEqual([]);
    expect(potionCost('vapor')).toEqual([{ id: 'vapor', qty: 50 }]);
    expect(potionIngredients('vapor')).toEqual([{ id: a, qty: 1 }, { id: b, qty: 1 }]);
    expect(potionCostFor('xx_yy', ['fogo', 'agua', 'terra'])).toEqual([]);
    expect(potionCostFor('vapor', ['fogo', 'agua', 'terra'])).toEqual([{ id: 'vapor', qty: 50 }]); // 3 componentes: mesma regra
    expect(potionCost('nao_existe')).toEqual([]);
  });
  it('filtro E', () => {
    const w = elementsMatchingBases(['agua']);
    expect(w).toContain('agua'); expect(w).toContain('vapor');
    expect(w.every(id => elementComposition(id)!.includes('agua'))).toBe(true);
    const both = elementsMatchingBases([a, b], ESSENCE_ELEMENT_IDS);
    expect(both).toContain('vapor'); expect(both).toContain('geiser');
    expect(elementsMatchingBases([]).length).toBe(210);
    expect(elementsMatchingBases([], ESSENCE_ELEMENT_IDS).length).toBe(ESSENCE_ELEMENT_IDS.length);
    expect(ESSENCE_ELEMENT_IDS.length).toBe(269);
    expect(elementsMatchingBases([a, null, a])).toEqual(elementsMatchingBases([a]));
  });
  it('só o que dá para pagar (composto exige as poções das bases)', () => {
    const inv = { [potionKey(a)]: 1, [potionKey(b)]: 1 };
    expect(affordablePotionElements({}, ['agua'])).toEqual([]);
    expect(affordablePotionElements({ agua: 99 }, ['agua'])).toEqual([]);
    expect(affordablePotionElements({ agua: 100 }, ['agua'])).toEqual(['agua']);
    expect(affordablePotionElements({ vapor: 50 }, [a, b])).toEqual([]); // faltam as poções
    expect(affordablePotionElements({ vapor: 50 }, [a, b], { [potionKey(a)]: 1 })).toEqual([]); // falta uma
    expect(affordablePotionElements({ vapor: 49 }, [a, b], inv)).toEqual([]);
    expect(affordablePotionElements({ vapor: 50 }, [a, b], inv)).toEqual(['vapor']);
  });
  it('gatilho da Vesca: só ao CRUZAR 100 em elemento base (uma vez por cruzamento)', () => {
    expect(essenceThresholdCrossings({ fogo: 99 }, { fogo: 100 })).toEqual(['fogo']);
    expect(essenceThresholdCrossings({ fogo: 100 }, { fogo: 101 })).toEqual([]); // já estava acima: não repete
    expect(essenceThresholdCrossings({}, { fogo: 5 })).toEqual([]);
    expect(essenceThresholdCrossings(undefined, { agua: 100, vapor: 49 })).toEqual(['agua']); // composto só aos 50 (16/11/2026)
    expect(essenceThresholdCrossings({ vapor: 49 }, { vapor: 50 })).toEqual(['vapor']);
    expect(essenceThresholdCrossings({ neutro: 49 }, { neutro: 50 })).toEqual(['neutro']);
    expect(essenceThresholdCrossings({ pesadelo: 0 }, { pesadelo: 500 })).toEqual([]);
    expect(essenceThresholdCrossings({ fogo: 100 }, { fogo: 0 })).toEqual([]);
    expect(essenceThresholdCrossings({ fogo: 0 }, { fogo: 100 })).toEqual(['fogo']); // gastou e atingiu de novo: oferece de novo
  });
  it('elemento não desbloqueado na Biblioteca não se fabrica (mesmo com saldo)', () => {
    const s0 = base({ agua: 100 }, []);
    expect(isPotionUnlocked('agua', s0.defeatedElements)).toBe(false);
    expect(craftPotion(s0, 'agua')).toBe(s0);
    const s1 = base({ agua: 100 }, ['agua']);
    expect(craftPotion(s1, 'agua').foodInventory[potionKey('agua')]).toBe(1);
  });
  it('fabricar base consome 100 e soma gasto; idempotente sem saldo', () => {
    const s0 = base({ fogo: 250 });
    const s1 = craftPotion(s0, 'fogo');
    expect(s1.essences).toEqual({ fogo: 150 });
    expect(s1.essenceSpent).toEqual({ fogo: 100 });
    expect(s1.foodInventory[potionKey('fogo')]).toBe(1);
    expect(craftPotion(base({ fogo: 99 }), 'fogo').essences).toEqual({ fogo: 99 });
    expect(craftPotion(s0, 'nao_existe')).toBe(s0);
  });
  it('fabricar composto consome 1 poção de cada base + 50 do composto; sem poção = nada muda', () => {
    const sem = base({ vapor: 80 });
    expect(craftPotion(sem, 'vapor')).toBe(sem);
    const s0 = { ...base({ vapor: 80 }), foodInventory: { [potionKey(a)]: 2, [potionKey(b)]: 1 } };
    const s1 = craftPotion(s0, 'vapor');
    expect(s1.essences).toEqual({ vapor: 30 });
    expect(s1.essenceSpent).toEqual({ vapor: 50 });
    expect(s1.foodInventory).toEqual({ [potionKey(a)]: 1, [potionKey('vapor')]: 1 });
    expect(craftPotion(s1, 'vapor')).toBe(s1); // segundo toque: sem saldo de essência nem de poção
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
    expect(petElementOf({ potionElement: 'lava', soulmonMeta: { dominantElement: 'fogo' } })).toBe('lava');
  });
  it('a poção vale só para a PRÓXIMA evolução; a seguinte volta ao elemento da pontuação', () => {
    const meta = { dominantElement: 'fogo' };
    const e1 = applyPotionOnEvolve({ evolutionPotion: 'lava' as string | undefined, potionElement: undefined as string | undefined });
    expect(petElementOf({ potionElement: e1.potionElement, soulmonMeta: meta })).toBe('lava');
    const e2 = applyPotionOnEvolve(e1);
    expect(e2.potionElement).toBeUndefined();
    expect(petElementOf({ potionElement: e2.potionElement, soulmonMeta: meta })).toBe(petElementOf({ soulmonMeta: meta }));
    expect(applyPotionOnEvolve(e2)).toBe(e2);
  });
});

describe('Vesca: memória de ofertas', () => {
  it('grava e relê os elementos já oferecidos; lixo vira vazio', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) });
    writeVescaOffered(new Set(['agua', 'fogo']));
    expect([...readVescaOffered()].sort()).toEqual(['agua', 'fogo']);
    store.set('soulmon:vescaOffered', '{x');
    expect(readVescaOffered().size).toBe(0);
    vi.unstubAllGlobals();
  });
});

describe('curados (3–4 bases) funcionam como os pares', () => {
  it('composição, custo e receita', () => {
    expect(elementComposition('geiser')).toEqual(['fogo', 'agua', 'terra']);
    expect(potionCost('geiser')).toEqual([{ id: 'geiser', qty: 50 }]);
    expect(potionIngredients('geiser').map(i => i.id)).toEqual(['fogo', 'agua', 'terra']);
    expect(isPotionKey(potionKey('geiser'))).toBe(true);
    expect(isPotionKey(potionKey('neutro'))).toBe(true); // §452: o Neutro tem poção própria
    expect(isPotionKey(potionKey('pesadelo'))).toBe(false);
  });
  it('fabrica com 50 essências + 1 poção de cada base', () => {
    const st = { ...base({ geiser: 50 }, ['geiser']), foodInventory: { 'potion:fogo': 1, 'potion:agua': 1, 'potion:terra': 1 } as Record<string, number> };
    const out = craftPotion(st, 'geiser');
    expect(out.foodInventory['potion:geiser']).toBe(1);
    expect(out.essences.geiser ?? 0).toBe(0);
    expect(out.foodInventory['potion:fogo'] ?? 0).toBe(0);
  });
  it('inimigo de sprite curado dropa a essência do curado além da do par', () => {
    const d = essenceDropsOfFoe({ elements: ['fogo', 'agua'], element: 'geiser' }, 'rookie');
    expect(d.map(x => x.id).sort()).toEqual(['geiser', 'vapor']);
  });
});
