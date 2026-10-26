/**
 * ELEMENTAL FUSION — PVP (26/10/2026): os 6 elementos sorteados (semente, sem repetir, com mistos), o pareamento por poder, o NPC de
 * reserva e o combate 1 contra 1 (recompensa igual à do Normal: mesma função de Bits).
 */
import { describe, it, expect } from 'vitest';
import { mulberry32 } from './combate/rng';
import { elementIconIds } from './elementIconArt';
import { M3_KINDS, M3_TILE_ELEMENTS, match3Bits, type Step } from './match3';
import { M3C_ENEMY_HP, M3C_PVP_ENEMY_HP, applyPlayerSteps, combatScore, newCombat, newPvpCombat } from './match3Combat';
import { ENEMY_ROSTER_KEYS } from './enemyRoster';
import { BASE_ELEMENT_LABELS } from './soulProfile/derivedElements';
import { PVP_ELEMENT_COUNT, npcFoe, pickPvpElements, pickPvpOpponent, pvpElementPool, pvpElementsForSeed, tileElementName } from './match3Pvp';

const BASE = new Set(Object.keys(BASE_ELEMENT_LABELS));

describe('PVP — os 6 elementos do tabuleiro', () => {
  it('o pool é o conjunto INTEIRO de ícones (base e mistos), sem o neutro', () => {
    const pool = pvpElementPool();
    expect(pool.length).toBe(elementIconIds().length - 1);
    expect(pool).not.toContain('neutro');
    expect(pool.some(id => BASE.has(id))).toBe(true);
    expect(pool.some(id => !BASE.has(id))).toBe(true); // há misto
    expect(new Set(pool).size).toBe(pool.length);
  });

  it('são 6, distintos e todos do pool, para qualquer semente', () => {
    const pool = new Set(pvpElementPool());
    expect(PVP_ELEMENT_COUNT).toBe(M3_KINDS);
    for (let sd = 1; sd <= 200; sd++) {
      const els = pvpElementsForSeed(sd * 7919);
      expect(els.length).toBe(6);
      expect(new Set(els).size).toBe(6);
      for (const e of els) expect(pool.has(e)).toBe(true);
    }
  });

  it('a mesma semente dá os mesmos 6; sementes diferentes variam', () => {
    expect(pvpElementsForSeed(31337)).toEqual(pvpElementsForSeed(31337));
    const variantes = new Set(Array.from({ length: 30 }, (_, i) => pvpElementsForSeed(i + 1).join(',')));
    expect(variantes.size).toBeGreaterThan(20);
  });

  it('com muitas sementes, os mistos aparecem (e não só os base)', () => {
    let mistos = 0;
    for (let sd = 1; sd <= 100; sd++) mistos += pvpElementsForSeed(sd).filter(e => !BASE.has(e)).length;
    expect(mistos).toBeGreaterThan(100);
  });

  it('pool menor que n devolve o que houver, sem repetir', () => {
    expect(pickPvpElements(mulberry32(1), ['a', 'b'], 6).sort()).toEqual(['a', 'b']);
    expect(pickPvpElements(mulberry32(1), ['a', 'b', 'c'], 3).sort()).toEqual(['a', 'b', 'c']);
  });

  it('nome acessível PT/EN para base e misto (nunca vazio)', () => {
    expect(tileElementName('fogo', true)).toBe('Fogo');
    expect(tileElementName('fogo', false)).toBe('Fire');
    expect(tileElementName('vapor', true)).toBe('Vapor');
    expect(tileElementName('vapor', false)).toBe('Steam');
    for (const id of pvpElementPool()) { expect(tileElementName(id, true)).toBeTruthy(); expect(tileElementName(id, false)).toBeTruthy(); }
  });

  it('o Normal segue com os 6 fixos (nada mudou)', () => {
    expect([...M3_TILE_ELEMENTS]).toEqual(['fogo', 'agua', 'terra', 'vida', 'ar', 'luz']);
  });
});

describe('PVP — o pareamento por poder', () => {
  const c = (level?: number, tag = '') => ({ tag, duel: level === undefined ? null : { level } });
  it('escolhe o de level mais próximo do jogador', () => {
    expect(pickPvpOpponent([c(3, 'a'), c(9, 'b'), c(12, 'c')], 10)?.tag).toBe('b');
    expect(pickPvpOpponent([c(3, 'a'), c(9, 'b'), c(12, 'c')], 1)?.tag).toBe('a');
    expect(pickPvpOpponent([c(3, 'a'), c(9, 'b'), c(12, 'c')], 40)?.tag).toBe('c');
  });
  it('empate fica com o primeiro (o servidor já sorteou a ordem)', () => {
    expect(pickPvpOpponent([c(8, 'a'), c(12, 'b')], 10)?.tag).toBe('a');
  });
  it('quem não declara level só entra se ninguém declara', () => {
    expect(pickPvpOpponent([c(undefined, 'x'), c(30, 'y')], 5)?.tag).toBe('y');
    expect(pickPvpOpponent([c(undefined, 'x'), c(undefined, 'y')], 5)?.tag).toBe('x');
  });
  it('lista vazia = null (cai no NPC de reserva)', () => {
    expect(pickPvpOpponent([], 5)).toBeNull();
  });
  it('level inválido do jogador não quebra', () => {
    expect(pickPvpOpponent([c(1, 'a'), c(2, 'b')], Number.NaN)?.tag).toBe('a');
  });
  it('o NPC de reserva vem do roster, no level do jogador, e é determinístico', () => {
    const a = npcFoe(10, mulberry32(5));
    const b = npcFoe(10, mulberry32(5));
    expect(a.foe).toEqual(b.foe);
    expect(a.foe.kind).toBe('npc');
    expect(a.foe.level).toBe(10);
    expect(ENEMY_ROSTER_KEYS.has(a.foe.roster!)).toBe(true);
  });
});

describe('PVP — o combate 1 contra 1', () => {
  const els = pvpElementsForSeed(7);
  const passo = (kind: number, n: number): Step => ({
    cleared: Array.from({ length: n }, (_, i) => ({ r: Math.floor(i / 7), c: i % 7 })),
    kinds: Array(n).fill(kind), triggered: [], created: [], chain: 1, gained: 0, after: [],
  });

  it('nasce com UM inimigo, o elemento dele é um dos 6 da partida', () => {
    const s = newPvpCombat(mulberry32(1), els);
    expect(s.enemies.length).toBe(1);
    expect(els).toContain(s.enemies[0].element);
    expect(s.elements).toEqual(els);
    expect(s.enemies[0].hp).toBe(M3C_PVP_ENEMY_HP);
    expect(M3C_PVP_ENEMY_HP).toBe(M3C_ENEMY_HP.reduce((a, b) => a + b, 0));
  });

  it('o golpe usa o elemento da PARTIDA (índice do tipo), não os 6 fixos', () => {
    const s = applyPlayerSteps(newPvpCombat(mulberry32(1), els), [passo(3, 4)]);
    expect(s.log[0].element).toBe(els[3]);
    expect(s.dealt).toBe(40);
  });

  it('derrotar o único inimigo é a vitória, e a recompensa é a do Normal (mesma função de Bits, mesmo teto)', () => {
    let s = newPvpCombat(mulberry32(1), els);
    for (let i = 0; i < 40 && s.outcome === 'playing'; i++) s = applyPlayerSteps(s, [passo(i % 6, 49)]);
    expect(s.outcome).toBe('win');
    expect(s.defeated).toBe(1);
    expect(match3Bits(combatScore(s))).toBeLessThanOrEqual(8);
  });

  it('o Normal continua com 3 inimigos e sem `elements` no estado', () => {
    const s = newCombat(mulberry32(1), [], undefined);
    expect(s.enemies.length).toBe(3);
    expect(s.elements).toBeUndefined();
  });
});
