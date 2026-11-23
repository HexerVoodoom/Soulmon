/**
 * 🧪 As poções deixadas com o Soulmon na masmorra (08/11/2026): o jogador DEIXA N (idempotente), o Soulmon usa sozinho nas quedas da
 * descida de fora, e o que sobra VOLTA quando a descida acaba. O total (inventário + estoque) nunca sobe — só se move.
 */
import { describe, it, expect } from 'vitest';
import type { GameState } from '../contexts/GameStateContext';
import { HEART_ITEM_EMOJI } from './shop';
import {
  HEAL_POTIONS, deixarPocoes, devolverPocoes, gastarUmaDoEstoque, healPotionsOwned, pocoesDoJogador, potionsTotal, recolherPocoes, sanitizeDungeonPotions,
} from './dungeonPotions';
import { applyDungeonAway } from './dungeonAway';
import { soulCombatant } from './soulXP';
import type { DungeonAway } from './dungeonIdle';

const H = HEART_ITEM_EMOJI;
const T0 = Date.UTC(2026, 9, 11, 15, 0, 0);
const HORA = 3_600_000;
const fraca = { since: T0, seed: 1, layer: 1, slot: 0, hp: 1, en: 0, ms: false, player: { level: 1, atk: 1, def: 1, spd: 1, hp: 1, bonus: 0, fam: 'direct', sh: 0, hb: 0, rc: 0, stage: 'rookie' } } as DungeonAway;
const c = soulCombatant({ evolutionStage: 'ultimate' });
const forte: DungeonAway = { ...fraca, player: { level: c.level, atk: c.atk, def: c.def, spd: c.spd, hp: c.hp, bonus: c.bonus, fam: 'direct', sh: 0, hb: 0, rc: 0, stage: 'ultimate' } };
const st = (over: Record<string, unknown> = {}) => ({ foodInventory: { [H]: 20 }, dungeonAway: fraca, gamePoints: 0, energyPoints: 6, totalXP: 5_000_000, ...over }) as unknown as GameState;
const total = (s: GameState) => (s.foodInventory[H] ?? 0) + (s.dungeonPotions?.[H] ?? 0);

describe('tipos e higiene', () => {
  it('o Coraçãozinho é o tipo de cura de hoje', () => { expect(HEAL_POTIONS).toContain(H); });
  it('lixo no save vira nada; só tipo conhecido e inteiro >= 1 sobrevive', () => {
    for (const x of [null, 0, 'x', [], {}, { [H]: 0 }, { [H]: -4 }, { [H]: NaN }, { outro: 5 }]) expect(sanitizeDungeonPotions(x)).toBeUndefined();
    expect(sanitizeDungeonPotions({ [H]: 3.9, outro: 5 })).toEqual({ [H]: 3 });
  });
  it('healPotionsOwned / pocoesDoJogador somam inventário e estoque', () => {
    expect(healPotionsOwned({ [H]: 7, x: 2 })).toEqual({ [H]: 7 });
    expect(pocoesDoJogador({ foodInventory: { [H]: 7 }, dungeonPotions: { [H]: 3 } })).toEqual({ [H]: 10 });
  });
});

describe('deixar (modal "quantas poções deixar")', () => {
  it('pode deixar todas: 20 de 20', () => {
    const r = deixarPocoes(st(), { [H]: 20 });
    expect(r.foodInventory[H]).toBeUndefined();
    expect(r.dungeonPotions).toEqual({ [H]: 20 });
  });
  it('deixar parte move só essa parte', () => {
    const r = deixarPocoes(st(), { [H]: 5 });
    expect(r.foodInventory[H]).toBe(15);
    expect(r.dungeonPotions).toEqual({ [H]: 5 });
  });
  it('IDEMPOTENTE: o mesmo pedido duas vezes não gasta a mais (devolve o mesmo objeto)', () => {
    const a = deixarPocoes(st(), { [H]: 8 });
    expect(deixarPocoes(a, { [H]: 8 })).toBe(a);
  });
  it('mudar de ideia: pedir menos devolve a diferença; pedir mais busca no inventário; nunca passa do que tem', () => {
    const a = deixarPocoes(st(), { [H]: 8 });
    const menos = deixarPocoes(a, { [H]: 3 });
    expect(menos.dungeonPotions).toEqual({ [H]: 3 });
    expect(menos.foodInventory[H]).toBe(17);
    const demais = deixarPocoes(a, { [H]: 999 });
    expect(demais.dungeonPotions).toEqual({ [H]: 20 });
    expect(total(demais)).toBe(20);
    expect(deixarPocoes(a, { [H]: 0 }).dungeonPotions).toBeUndefined();
  });
  it('o total nunca sobe, qualquer que seja o pedido (negativo, NaN, enorme)', () => {
    for (const q of [-5, NaN, 1e12, 7, 0]) expect(total(deixarPocoes(st(), { [H]: q }))).toBe(20);
  });
  it('sem descida viva não deixa nada (o mesmo objeto)', () => {
    const s = st({ dungeonAway: undefined });
    expect(deixarPocoes(s, { [H]: 5 })).toBe(s);
  });
});

describe('devolver / recolher', () => {
  it('estoque sem descida volta inteiro ao inventário; de novo = no-op', () => {
    const s = st({ dungeonAway: undefined, foodInventory: { [H]: 2 }, dungeonPotions: { [H]: 5 } });
    const r = devolverPocoes(s);
    expect(r.foodInventory[H]).toBe(7);
    expect(r.dungeonPotions).toBeUndefined();
    expect(devolverPocoes(r)).toBe(r);
  });
  it('com a descida viva, devolver não mexe (o Soulmon ainda precisa delas)', () => {
    const s = st({ dungeonPotions: { [H]: 5 } });
    expect(devolverPocoes(s)).toBe(s);
  });
  it('recolher traz de volta mesmo com a descida viva', () => {
    const r = recolherPocoes(st({ foodInventory: {}, dungeonPotions: { [H]: 5 } }));
    expect(r.foodInventory[H]).toBe(5);
    expect(r.dungeonPotions).toBeUndefined();
  });
  it('gastarUmaDoEstoque tira de uma em uma e some a chave no zero', () => {
    const a = gastarUmaDoEstoque({ [H]: 2 })!;
    expect(a.stock).toEqual({ [H]: 1 });
    expect(gastarUmaDoEstoque(a.stock)!.stock).toBeUndefined();
    expect(gastarUmaDoEstoque(undefined)).toBeNull();
    expect(potionsTotal(a.stock)).toBe(1);
  });
});

describe('a descida de fora usa e devolve', () => {
  it('sem poção, o Soulmon fraco cai e a descida acaba (linha de base)', () => {
    const { report } = applyDungeonAway(st({ dungeonPotions: undefined, foodInventory: {} }), T0 + 8 * HORA);
    expect(report!.ended).toBe('hp');
    expect(report!.potions ?? 0).toBe(0);
  });
  it('com poções deixadas, usa sozinho nas quedas e ao acabar nada fica preso no estoque', () => {
    const s = st({ foodInventory: {}, dungeonPotions: { [H]: 2 } });
    const { next, report } = applyDungeonAway(s, T0 + 8 * HORA);
    expect(report!.potions).toBe(2);
    expect(report!.ended).toBe('hp');
    expect(next.dungeonAway).toBeUndefined();
    expect(next.dungeonPotions).toBeUndefined();
    expect(next.foodInventory[H] ?? 0).toBe(0);
  });
  it('determinística e idempotente', () => {
    const s = st({ foodInventory: {}, dungeonPotions: { [H]: 2 } });
    expect(applyDungeonAway(s, T0 + 8 * HORA).next).toEqual(applyDungeonAway(s, T0 + 8 * HORA).next);
    const { next } = applyDungeonAway(s, T0 + 8 * HORA);
    expect(applyDungeonAway(next, T0 + 8 * HORA).next).toBe(next);
  });
  it('a descida que acaba (jogador forte) devolve o que sobrou ao inventário, sem perder nem criar', () => {
    const s = st({ dungeonAway: forte, energyPoints: 1, foodInventory: { [H]: 1 }, dungeonPotions: { [H]: 4 }, evolutionStage: 'ultimate' });
    const { next, report } = applyDungeonAway(s, T0 + 8 * HORA);
    expect(report!.ended).not.toBeNull();
    expect(next.dungeonAway).toBeUndefined();
    expect(next.dungeonPotions).toBeUndefined();
    expect(total(next)).toBeLessThanOrEqual(5);
    expect(total(next)).toBeGreaterThanOrEqual(5 - (report!.potions ?? 0));
  });
  it('descida ainda viva (pouco tempo): o estoque segue com ela', () => {
    const s = st({ dungeonAway: forte, foodInventory: {}, dungeonPotions: { [H]: 4 }, evolutionStage: 'ultimate' });
    const { next, report } = applyDungeonAway(s, T0 + 20_000);
    expect(report!.ended).toBeNull();
    expect(next.dungeonPotions).toEqual({ [H]: 4 });
  });
});
