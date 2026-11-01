import { describe, it, expect } from 'vitest';
import {
  HEX_COSTS, hexItemId, parseHexItem, hexValuesOf, hexCost, sanitizeHexsmith, hexForgeRefusal, forgeHexItem,
  equipHexItem, unequipHexSlot, hexOverrides, HEX_SLOTS, type HexForgeState,
} from './hexsmith';
import { potionKey } from './elementPotion';
import { ALL_ELEMENT_IDS } from './elementDex';

const rico = (over: Partial<HexForgeState> = {}): HexForgeState => ({
  foodInventory: { [potionKey('agua')]: 5 },
  gamePoints: 10_000,
  equipment: { owned: [], equipped: {}, fragments: 50 },
  ...over,
});

describe('hexsmith — catálogo', () => {
  it('cinco slots, ids válidos e inválidos', () => {
    expect(HEX_SLOTS).toEqual(['coroa', 'amuleto', 'garra', 'couraca', 'luvas']);
    expect(parseHexItem('garra:agua')).toEqual({ slot: 'garra', value: 'agua' });
    expect(parseHexItem('coroa:heal')).toEqual({ slot: 'coroa', value: 'heal' });
    expect(parseHexItem('luvas:ranged')).toEqual({ slot: 'luvas', value: 'ranged' });
    for (const bad of ['garra:nao_existe', 'coroa:agua', 'luvas:agua', 'chapeu:agua', ':agua', 'garra', 42, null]) {
      expect(parseHexItem(bad)).toBeUndefined();
    }
  });
  it('slots de elemento aceitam os 210 do dex', () => {
    expect(hexValuesOf('amuleto')).toBe(ALL_ELEMENT_IDS);
    expect(ALL_ELEMENT_IDS.length).toBe(210);
    expect(hexValuesOf('coroa').length).toBe(7);
    expect(hexValuesOf('luvas')).toEqual(['ranged', 'melee']);
  });
  it('custos: elemento paga poções do próprio elemento; coroa e luvas pagam fragmentos + Bits', () => {
    expect(hexCost('couraca:agua')).toEqual({ ...HEX_COSTS.element, potionElement: 'agua' });
    expect(hexCost('coroa:dot')).toEqual(HEX_COSTS.coroa);
    expect(hexCost('luvas:melee')).toEqual(HEX_COSTS.luvas);
    expect(hexCost('x')).toBeUndefined();
  });
});

describe('hexsmith — forjar', () => {
  it('paga tudo, entra na posse e equipa se o slot estava vazio', () => {
    const s = forgeHexItem(rico(), 'garra:agua');
    expect(s.foodInventory[potionKey('agua')]).toBe(5 - HEX_COSTS.element.potions);
    expect(s.gamePoints).toBe(10_000 - HEX_COSTS.element.bits);
    expect(s.hexsmith).toEqual({ owned: ['garra:agua'], equipped: { garra: 'garra:agua' } });
  });
  it('não troca o que já estava equipado no slot', () => {
    const s0 = { ...rico({ foodInventory: { [potionKey('agua')]: 3, [potionKey('fogo')]: 3 } }) };
    const s1 = forgeHexItem(forgeHexItem(s0, 'garra:agua'), 'garra:fogo');
    expect(s1.hexsmith!.owned).toEqual(['garra:agua', 'garra:fogo']);
    expect(s1.hexsmith!.equipped.garra).toBe('garra:agua');
  });
  it('recusa motivada e devolve o MESMO objeto', () => {
    const pobre = rico({ foodInventory: {} });
    expect(hexForgeRefusal(pobre, 'garra:agua')).toBe('potions');
    expect(forgeHexItem(pobre, 'garra:agua')).toBe(pobre);
    expect(hexForgeRefusal(rico({ equipment: { owned: [], equipped: {}, fragments: 0 } }), 'coroa:heal')).toBe('fragments');
    expect(hexForgeRefusal(rico({ gamePoints: 10 }), 'garra:agua')).toBe('bits');
    expect(hexForgeRefusal(rico(), 'x:y')).toBe('invalid');
    const tem = forgeHexItem(rico(), 'garra:agua');
    expect(hexForgeRefusal(tem, 'garra:agua')).toBe('owned');
  });
  it('Bit de Crédito não paga (só Bits ganhos)', () => {
    const s = rico({ gamePoints: 2000, bitsOrigin: { day: 'd', free: 0, fromCredits: 0, paidLeft: 1000 } as never });
    expect(hexForgeRefusal(s, 'garra:agua')).toBe('bits');
  });
});

describe('hexsmith — equipar e ler', () => {
  it('troca de slot nunca perde o item; esvaziar mantém a posse', () => {
    const s0 = { hexsmith: { owned: ['garra:agua', 'garra:fogo'], equipped: { garra: 'garra:agua' } } };
    const s1 = equipHexItem(s0, 'garra:fogo');
    expect(s1.hexsmith!.equipped.garra).toBe('garra:fogo');
    expect(s1.hexsmith!.owned).toEqual(['garra:agua', 'garra:fogo']);
    const s2 = unequipHexSlot(s1, 'garra');
    expect(s2.hexsmith!.equipped.garra).toBeUndefined();
    expect(s2.hexsmith!.owned.length).toBe(2);
    expect(equipHexItem(s0, 'garra:terra')).toBe(s0);
  });
  it('sanitiza lixo: posse inválida sai, equipado sem posse ou no slot errado sai', () => {
    expect(sanitizeHexsmith({ owned: ['garra:agua', 'garra:agua', 'lixo', 3], equipped: { garra: 'garra:agua', coroa: 'garra:agua', luvas: 'luvas:melee' } }))
      .toEqual({ owned: ['garra:agua'], equipped: { garra: 'garra:agua' } });
    expect(sanitizeHexsmith(null)).toEqual({ owned: [], equipped: {} });
  });
  it('overrides: só o equipado reescreve', () => {
    const hx = { owned: ['coroa:heal', 'amuleto:fogo', 'garra:agua', 'couraca:terra', 'luvas:ranged'],
      equipped: { coroa: 'coroa:heal', amuleto: 'amuleto:fogo', garra: 'garra:agua', couraca: 'couraca:terra', luvas: 'luvas:ranged' } };
    expect(hexOverrides(hx)).toEqual({ specialFamily: 'heal', specialElement: 'fogo', basicElement: 'agua', defenseElement: 'terra', strike: 'ranged' });
    expect(hexOverrides(undefined)).toEqual({});
  });
});
