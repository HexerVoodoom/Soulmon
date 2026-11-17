/**
 * ELEMENTAL FUSION — PVP e Aventura (REGISTRO §471, 17/11/2026): os 6 elementos MISTURADOS (semente, sem repetir) agora são da Aventura; o PVP
 * usa os 6 básicos FIXOS, tem 1 inimigo com o MESMO HP do jogador, o adversário é sempre um jogador (real ou simulado) e paga o que a Arena/Torneio pagam.
 */
import { describe, it, expect } from 'vitest';
import { mulberry32 } from './combate/rng';
import { elementIconIds } from './elementIconArt';
import { M3_KINDS, M3_TILE_ELEMENTS, type Step } from './match3';
import { M3C_ADVENTURE_ENEMY_HP, M3C_ENEMY_HP, M3C_PLAYER_HP, M3C_PVP_ENEMY_HP, applyPlayerSteps, newCombat, newPvpCombat } from './match3Combat';
import { ARENA_FIGHT_BITS } from './arena';
import { EMBLEMS_PER_LOSS, EMBLEMS_PER_WIN } from './currencies';
import { ENEMY_ROSTER_KEYS } from './enemyRoster';
import { BASE_ELEMENT_LABELS } from './soulProfile/derivedElements';
import { MIXED_ELEMENT_COUNT, pickMixedElements, pvpRewards, simulatedFoe, pickPvpOpponent, mixedElementPool, mixedElementsForSeed, tileElementName } from './match3Pvp';

const BASE = new Set(Object.keys(BASE_ELEMENT_LABELS));

describe('Aventura — os 6 elementos misturados do tabuleiro', () => {
  it('o pool é o conjunto INTEIRO de ícones (base e mistos), sem o neutro', () => {
    const pool = mixedElementPool();
    expect(pool.length).toBe(elementIconIds().length - 1);
    expect(pool).not.toContain('neutro');
    expect(pool.some(id => BASE.has(id))).toBe(true);
    expect(pool.some(id => !BASE.has(id))).toBe(true); // há misto
    expect(new Set(pool).size).toBe(pool.length);
  });

  it('são 6, distintos e todos do pool, para qualquer semente', () => {
    const pool = new Set(mixedElementPool());
    expect(MIXED_ELEMENT_COUNT).toBe(M3_KINDS);
    for (let sd = 1; sd <= 200; sd++) {
      const els = mixedElementsForSeed(sd * 7919);
      expect(els.length).toBe(6);
      expect(new Set(els).size).toBe(6);
      for (const e of els) expect(pool.has(e)).toBe(true);
    }
  });

  it('a mesma semente dá os mesmos 6; sementes diferentes variam', () => {
    expect(mixedElementsForSeed(31337)).toEqual(mixedElementsForSeed(31337));
    const variantes = new Set(Array.from({ length: 30 }, (_, i) => mixedElementsForSeed(i + 1).join(',')));
    expect(variantes.size).toBeGreaterThan(20);
  });

  it('com muitas sementes, os mistos aparecem (e não só os base)', () => {
    let mistos = 0;
    for (let sd = 1; sd <= 100; sd++) mistos += mixedElementsForSeed(sd).filter(e => !BASE.has(e)).length;
    expect(mistos).toBeGreaterThan(100);
  });

  it('pool menor que n devolve o que houver, sem repetir', () => {
    expect(pickMixedElements(mulberry32(1), ['a', 'b'], 6).sort()).toEqual(['a', 'b']);
    expect(pickMixedElements(mulberry32(1), ['a', 'b', 'c'], 3).sort()).toEqual(['a', 'b', 'c']);
  });

  it('nome acessível PT/EN para base e misto (nunca vazio)', () => {
    expect(tileElementName('fogo', true)).toBe('Fogo');
    expect(tileElementName('fogo', false)).toBe('Fire');
    expect(tileElementName('vapor', true)).toBe('Vapor');
    expect(tileElementName('vapor', false)).toBe('Steam');
    for (const id of mixedElementPool()) { expect(tileElementName(id, true)).toBeTruthy(); expect(tileElementName(id, false)).toBeTruthy(); }
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
  it('lista vazia = null (cai no jogador simulado de reserva)', () => {
    expect(pickPvpOpponent([], 5)).toBeNull();
  });
  it('level inválido do jogador não quebra', () => {
    expect(pickPvpOpponent([c(1, 'a'), c(2, 'b')], Number.NaN)?.tag).toBe('a');
  });
  it('a reserva é um JOGADOR simulado (arte do roster, no level do jogador), nunca um inimigo genérico, e é determinístico', () => {
    const a = simulatedFoe(10, mulberry32(5));
    const b = simulatedFoe(10, mulberry32(5));
    expect(a.foe).toEqual(b.foe);
    expect(a.foe.kind).toBe('player');
    expect(a.foe.simulated).toBe(true);
    expect(a.foe.level).toBe(10);
    expect(ENEMY_ROSTER_KEYS.has(a.foe.roster!)).toBe(true);
  });
});

describe('PVP — o combate 1 contra 1', () => {
  const els = M3_TILE_ELEMENTS;
  const passo = (kind: number, n: number): Step => ({
    cleared: Array.from({ length: n }, (_, i) => ({ r: Math.floor(i / 7), c: i % 7 })),
    kinds: Array(n).fill(kind), triggered: [], created: [], chain: 1, gained: 0, after: [],
  });

  it('nasce com UM inimigo, o elemento dele é um dos 6 básicos fixos', () => {
    const s = newPvpCombat(mulberry32(1), els);
    expect(s.enemies.length).toBe(1);
    expect(els).toContain(s.enemies[0].element);
    expect(s.elements).toEqual([...M3_TILE_ELEMENTS]);
  });

  it('HP SIMÉTRICO: o inimigo tem o mesmo HP do jogador', () => {
    const s = newPvpCombat(mulberry32(1), els);
    expect(s.enemies[0].hp).toBe(s.player.hp);
    expect(s.enemies[0].hp).toBe(M3C_PLAYER_HP);
    expect(M3C_PVP_ENEMY_HP).toBe(M3C_PLAYER_HP);
  });

  it('o golpe usa o elemento do tipo da peça (os 6 básicos)', () => {
    const s = applyPlayerSteps(newPvpCombat(mulberry32(1), els), [passo(3, 4)]);
    expect(s.log[0].element).toBe(M3_TILE_ELEMENTS[3]);
    expect(s.dealt).toBe(40);
  });

  it('derrotar o único inimigo é a vitória', () => {
    let s = newPvpCombat(mulberry32(1), els);
    for (let i = 0; i < 40 && s.outcome === 'playing'; i++) s = applyPlayerSteps(s, [passo(i % 6, 49)]);
    expect(s.outcome).toBe('win');
    expect(s.defeated).toBe(1);
  });
});

describe('PVP — a recompensa é a da Arena e do Torneio (§471)', () => {
  it('vitória = Bits do combate médio da Arena + Honra de vitória do Torneio', () => {
    expect(pvpRewards(true)).toEqual({ bits: ARENA_FIGHT_BITS, honor: EMBLEMS_PER_WIN });
    expect(ARENA_FIGHT_BITS).toBeGreaterThan(0);
  });
  it('derrota = só a Honra de consolo (nenhum Bit; perder nunca custa)', () => {
    expect(pvpRewards(false)).toEqual({ bits: 0, honor: EMBLEMS_PER_LOSS });
  });
});

describe('Aventura — o time de 4 com elementos misturados', () => {
  it('4 inimigos, os 3 primeiros com o HP de sempre e o 4º o mais duro', () => {
    const s = newCombat(mulberry32(1), [], undefined, undefined, undefined, { elements: mixedElementsForSeed(7) });
    expect(s.enemies.length).toBe(4);
    expect(s.enemies.map(e => e.hp)).toEqual([...M3C_ADVENTURE_ENEMY_HP]);
    expect(M3C_ADVENTURE_ENEMY_HP.slice(0, 3)).toEqual([...M3C_ENEMY_HP]);
    expect(M3C_ADVENTURE_ENEMY_HP[3]).toBeGreaterThan(M3C_ENEMY_HP[2]);
  });
  it('os 6 elementos do tabuleiro saem do pool inteiro e vão no estado; o golpe usa o da partida', () => {
    const els = mixedElementsForSeed(7);
    const pool = new Set(mixedElementPool());
    const s = newCombat(mulberry32(1), [], undefined, undefined, undefined, { elements: els });
    expect(s.elements).toEqual(els);
    expect(els.every(e => pool.has(e))).toBe(true);
    const passo = (kind: number, n: number): Step => ({ cleared: [], kinds: Array(n).fill(kind), triggered: [], created: [], chain: 1, gained: 0, after: [] });
    expect(applyPlayerSteps(s, [passo(3, 4)]).log[0].element).toBe(els[3]);
  });
  it('o modo desafio do Calabouço segue com 3 inimigos e sem `elements` no estado', () => {
    const s = newCombat(mulberry32(1), [], undefined);
    expect(s.enemies.length).toBe(3);
    expect(s.elements).toBeUndefined();
  });
  it('com level, as 4 vagas pedem rookie/champion/champion/ultimate sem repetir criatura', () => {
    const s = newCombat(mulberry32(3), [], undefined, 99, undefined, { elements: mixedElementsForSeed(7) });
    const keys = s.enemies.map(e => e.roster);
    expect(keys.every(Boolean)).toBe(true);
    expect(new Set(keys).size).toBe(4);
  });
});
