import { describe, it, expect } from 'vitest';
import { applyClaRewards, fruitRewards, sanitizeClaReceipts, CLA_RECEIPTS_MAX, FRUTO_DECOR, type ClaSaveSlice } from './claCredit';
import { CHIP_EMOJI } from './shop';
import { FOOD_BY_CATEGORY } from '../constants/labels';
import { sanitizeReward, sanitizePraca, sanitizePlantio, sanitizeMisterio } from './claApi';

const base = (): ClaSaveSlice => ({ gamePoints: 100, foodInventory: {}, ownedFurniture: ['furn-rug'], guildDonatedItem: null, claReceipts: [] });
const DAY = '2026-10-18';

describe('o crédito dos prédios do clã é idempotente por recibo', () => {
  it('Bits viram moeda (e contam como Bit grátis)', () => {
    const s = applyClaRewards(base(), 'r1', [{ kind: 'bits', amount: 12 }], DAY);
    expect(s.gamePoints).toBe(112);
    expect(s.bitsOrigin?.free).toBe(12);
    expect(s.claReceipts).toEqual(['r1']);
  });

  it('decoração vai ao inventário de decoração, sem duplicar o que já tem nem o que está na casa', () => {
    const a = applyClaRewards(base(), 'r1', [{ kind: 'decor', id: 'furn-lamp' }], DAY);
    expect(a.ownedFurniture).toEqual(['furn-rug', 'furn-lamp']);
    const jaTem = applyClaRewards(base(), 'r2', [{ kind: 'decor', id: 'furn-rug' }], DAY);
    expect(jaTem.ownedFurniture).toEqual(['furn-rug']);
    const naCasa = applyClaRewards({ ...base(), guildDonatedItem: 'furn-lamp' }, 'r3', [{ kind: 'decor', id: 'furn-lamp' }], DAY);
    expect(naCasa.ownedFurniture).toEqual(['furn-rug']);
  });

  it('chip vai à pastinha com o emoji do chip; comida é UMA comida comum', () => {
    const s = applyClaRewards(base(), 'r1', [{ kind: 'chip', id: 'chip-harmony' }], DAY);
    expect(s.foodInventory[CHIP_EMOJI.harmony]).toBe(1);
    const f = applyClaRewards(s, 'r2', [{ kind: 'food' }], DAY);
    expect(f.foodInventory[FOOD_BY_CATEGORY.Study.emoji]).toBe(1);
  });

  it('o MESMO recibo uma 2ª vez devolve a MESMA referência e não credita de novo', () => {
    const uma = applyClaRewards(base(), 'r1', [{ kind: 'bits', amount: 10 }], DAY);
    const duas = applyClaRewards(uma, 'r1', [{ kind: 'bits', amount: 10 }], DAY);
    expect(duas).toBe(uma);
    expect(duas.gamePoints).toBe(110);
  });

  it('recibo vazio não credita nada', () => {
    const s = base();
    expect(applyClaRewards(s, '', [{ kind: 'bits', amount: 10 }], DAY)).toBe(s);
  });

  it('guarda só os últimos recibos (teto) — e o mais novo continua protegido', () => {
    let s = base();
    for (let i = 0; i < CLA_RECEIPTS_MAX + 10; i++) s = applyClaRewards(s, `r${i}`, [{ kind: 'bits', amount: 5 }], DAY);
    expect(s.claReceipts).toHaveLength(CLA_RECEIPTS_MAX);
    const ultimo = `r${CLA_RECEIPTS_MAX + 9}`;
    expect(applyClaRewards(s, ultimo, [{ kind: 'bits', amount: 5 }], DAY)).toBe(s);
  });

  it('o fruto entra por UM recibo: Bits + a decoração da espécie, juntos', () => {
    const r = fruitRewards('fruto-girassol-t2', 10);
    expect(r).toEqual([{ kind: 'bits', amount: 10 }, { kind: 'decor', id: FRUTO_DECOR.girassol }]);
    const s = applyClaRewards(base(), 'g|2026-W42|2026-primavera', r, DAY);
    expect(s.gamePoints).toBe(110);
    expect(s.ownedFurniture).toContain(FRUTO_DECOR.girassol);
    expect(applyClaRewards(s, 'g|2026-W42|2026-primavera', r, DAY)).toBe(s);
  });

  it('toda decoração de fruto existe na loja', async () => {
    const { ALL_SHOP_ITEMS } = await import('./shop');
    for (const id of Object.values(FRUTO_DECOR)) expect(ALL_SHOP_ITEMS.some(i => i.id === id), id).toBe(true);
  });

  it('a lista de recibos vinda do save é higienizada', () => {
    expect(sanitizeClaReceipts(null)).toEqual([]);
    expect(sanitizeClaReceipts(['a', 3, '', 'b'])).toEqual(['a', 'b']);
  });
});

describe('o cliente trata a resposta do servidor como dado não confiável', () => {
  it('prêmio fora da lista fechada é descartado', () => {
    expect(sanitizeReward({ kind: 'bits', amount: 10 })).toEqual({ kind: 'bits', amount: 10 });
    expect(sanitizeReward({ kind: 'bits', amount: -5 })).toBeNull();
    expect(sanitizeReward({ kind: 'chip', id: 'chip-x' })).toBeNull();
    expect(sanitizeReward({ kind: 'decor', id: 'ABC<script>' })).toBeNull();
    expect(sanitizeReward({ kind: 'food' })).toEqual({ kind: 'food' });
    expect(sanitizeReward('bits')).toBeNull();
  });

  it('a praça sempre tem 4 lugares; presente malformado cai fora', () => {
    const p = sanitizePraca({ slots: [{ slot: 2, item: 'furn-lamp', by: 'abc', mine: true }], gifts: [{ id: 'x|d', from: 'x', day: '2026-10-18', item: { kind: 'food' } }, { id: 'y', item: null }], mine: { sentToday: ['x', 5] } });
    expect(p.slots).toHaveLength(4);
    expect(p.slots[2]).toMatchObject({ item: 'furn-lamp', mine: true });
    expect(p.gifts).toHaveLength(1);
    expect(p.sentToday).toEqual(['x']);
  });

  it('plantio e mistério: espécie/estação desconhecida e barra fora do intervalo', () => {
    expect(sanitizePlantio({ species: 'banana', season: 'verao' })).toBeNull();
    expect(sanitizePlantio({ species: 'melancia', season: 'verao', planted: true, stage: 9, progress: 250, today: {}, mine: {} })).toMatchObject({ stage: 4, progress: 100 });
    expect(sanitizeMisterio({ bar: 400, mine: { sent: true } })).toMatchObject({ bar: 99, sent: true });
    expect(sanitizeMisterio({})).toBeNull();
  });
});
