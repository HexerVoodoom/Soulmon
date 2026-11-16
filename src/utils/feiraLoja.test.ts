import { describe, it, expect } from 'vitest';
import { MATERIAL_CAP } from './buildingQuests';
import { applyFeiraLojaBuy, sanitizeFeiraLoja, shopItemOnOffer, type FeiraLojaItem } from './feiraLoja';

const base = { gamePoints: 500, foodInventory: {} as Record<string, number> };
const offer = (o: Partial<FeiraLojaItem> & { id: string; type: FeiraLojaItem['type']; kind: FeiraLojaItem['kind'] }): FeiraLojaItem => ({ price: 10, was: 20, pct: 50, bought: false, ...o });

describe('a feira de verdade no cliente: prateleiras novas', () => {
  it('material: +1 no estoque e debita o preço da oferta', () => {
    const r = applyFeiraLojaBuy(base as any, offer({ id: 'material:ore', type: 'material', kind: 'material', price: 9 }));
    expect(r.refused).toBeUndefined();
    expect(r.state.gamePoints).toBe(491);
    expect((r.state as any).buildingQuests.materials.ore).toBe(1);
  });
  it('material no teto: recusa com cap ANTES de debitar (nada cobrado, nada entregue)', () => {
    const cheio = { ...base, buildingQuests: { day: '', visited: [], claimed: [], materials: { ore: MATERIAL_CAP } } };
    const r = applyFeiraLojaBuy(cheio as any, offer({ id: 'material:ore', type: 'material', kind: 'material', price: 9 }));
    expect(r.refused).toBe('cap');
    expect(r.state).toBe(cheio);
  });
  it('§373: prato de combate pago só com Bit de Crédito passa (antes recusava); sem saldo, recusa e devolve o MESMO estado', () => {
    const credito = { ...base, gamePoints: 500, bitsOrigin: { day: 'd', free: 0, fromCredits: 500, paidLeft: 500 } };
    const r = applyFeiraLojaBuy(credito as any, offer({ id: 'dish:espetinho-de-vinha', type: 'dish', kind: 'dish', price: 8 }), 1_000_000);
    expect(r.refused).toBeUndefined();
    expect(r.state.gamePoints).toBe(492);
    const pobre = { ...base, gamePoints: 5 };
    const n = applyFeiraLojaBuy(pobre as any, offer({ id: 'dish:espetinho-de-vinha', type: 'dish', kind: 'dish', price: 8 }), 1_000_000);
    expect(n.refused).toBe('no-bits');
    expect(n.state).toBe(pobre);
  });
  it('poção de elemento: +1 na pastinha (potion:<elemento>)', () => {
    const r = applyFeiraLojaBuy(base as any, offer({ id: 'potion:fogo', type: 'potion', kind: 'potion', price: 40 }));
    expect(r.state.foodInventory['potion:fogo']).toBe(1);
    expect(r.state.gamePoints).toBe(460);
  });
  it('sem saldo: recusa e devolve o MESMO estado', () => {
    const pobre = { ...base, gamePoints: 5 };
    const r = applyFeiraLojaBuy(pobre as any, offer({ id: 'potion:fogo', type: 'potion', kind: 'potion', price: 40 }));
    expect(r.refused).toBe('no-funds');
    expect(r.state).toBe(pobre);
  });
  it('prato pronto (16/11/2026): sem ingrediente, debita só o preço, vai para Files como dish:<id> e NÃO serve na hora', () => {
    const r = applyFeiraLojaBuy({ ...base, foodInventory: {} } as any, offer({ id: 'dish:cha-de-orvalho', type: 'dish', kind: 'dish', price: 8 }), 1_000_000);
    expect(r.refused).toBeUndefined();
    expect(r.state.gamePoints).toBe(492);
    expect(r.state.foodInventory).toEqual({ 'dish:cha-de-orvalho': 1 });
    expect(r.state.restaurant?.buff).toBeUndefined();
    expect(r.state.restaurant?.count).toBeUndefined();
  });
  it('prato da Feira soma ao que já havia na pastinha (save antigo sem a chave também funciona)', () => {
    const r = applyFeiraLojaBuy({ ...base, foodInventory: { 'dish:cha-de-orvalho': 2, '🥗': 1 } }, offer({ id: 'dish:cha-de-orvalho', type: 'dish', kind: 'dish', price: 8 }), 1_000_000);
    expect(r.state.foodInventory).toEqual({ 'dish:cha-de-orvalho': 3, '🥗': 1 });
  });
  it('equipamento de Honra vira item em Bits ao preço da oferta (sem moeda de Honra)', () => {
    const it = shopItemOnOffer(offer({ id: 'furn-crate', type: 'shop', kind: 'furniture', price: 60 }));
    expect(it?.currency).toBeUndefined();
    expect(it?.price).toBe(60);
    const r = applyFeiraLojaBuy({ ...base, ownedFurniture: [] } as any, offer({ id: 'furn-crate', type: 'shop', kind: 'furniture', price: 60 }));
    expect(r.state.gamePoints).toBe(440);
    expect((r.state as any).emblems).toBeUndefined();
  });
  it('o sanitizador recusa material/prato/poção com id desconhecido', () => {
    const l = sanitizeFeiraLoja({ day: '2026-11-10', vendor: 'morcego', items: [
      { id: 'material:ore', type: 'material', kind: 'material', price: 9, was: 15, pct: 40 },
      { id: 'material:lixo', type: 'material', kind: 'material', price: 9, was: 15, pct: 40 },
      { id: 'dish:nao-existe', type: 'dish', kind: 'dish', price: 9, was: 15, pct: 40 },
    ] });
    expect(l?.items.map(i => i.id)).toEqual(['material:ore']);
  });
});
