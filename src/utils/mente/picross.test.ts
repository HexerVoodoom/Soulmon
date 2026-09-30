import { describe, it, expect } from 'vitest';
import { PICROSS_PATTERNS } from './picrossPatterns';
import {
  CROSSED, EMPTY, FILLED, PICROSS_BITS_BY_SIZE, PICROSS_DAILY_BONUS, PICROSS_MAX_BITS, cluesOf, dailyPattern,
  isLineSolvable, lineClue, matchesClues, parsePattern, picrossBits, solveByLines, type CellMark,
} from './picross';

describe('picross — pistas', () => {
  it('lineClue conta os blocos, e linha vazia devolve []', () => {
    expect(lineClue([true, true, false, true])).toEqual([2, 1]);
    expect(lineClue([false, false])).toEqual([]);
    expect(lineClue([true, true, true])).toEqual([3]);
  });

  it('cluesOf lê linhas e colunas', () => {
    const g = parsePattern(['#.', '##']);
    expect(cluesOf(g)).toEqual({ rows: [[1], [2]], cols: [[2], [1]] });
  });

  it('matchesClues aceita qualquer grade que bate as pistas; X conta como vazia', () => {
    const clues = cluesOf(parsePattern(['#.', '.#']));
    // as duas diagonais têm as mesmas pistas — e as duas contam
    const a: CellMark[][] = [[FILLED, CROSSED], [EMPTY, FILLED]];
    const b: CellMark[][] = [[CROSSED, FILLED], [FILLED, EMPTY]];
    const c: CellMark[][] = [[FILLED, FILLED], [EMPTY, EMPTY]];
    expect(matchesClues(a, clues)).toBe(true);
    expect(matchesClues(b, clues)).toBe(true);
    expect(matchesClues(c, clues)).toBe(false);
  });

  it('o resolvedor devolve null quando as pistas se contradizem', () => {
    expect(solveByLines({ rows: [[2], [0]], cols: [[0], [0]] })).toBeNull();
  });
});

describe('picross — a biblioteca de desenhos', () => {
  it('tem ao menos 18 desenhos: 6+ de 5×5, 6+ de 7×7, 6+ de 10×10', () => {
    expect(PICROSS_PATTERNS.length).toBeGreaterThanOrEqual(18);
    for (const size of [5, 7, 10]) {
      expect(PICROSS_PATTERNS.filter(p => p.rows.length === size).length).toBeGreaterThanOrEqual(6);
    }
  });

  it('toda grade é quadrada, só com # e ., e com ids únicos e nomes PT+EN', () => {
    const ids = new Set<string>();
    for (const p of PICROSS_PATTERNS) {
      expect(ids.has(p.id), p.id).toBe(false);
      ids.add(p.id);
      expect(p.namePt.length).toBeGreaterThan(0);
      expect(p.nameEn.length).toBeGreaterThan(0);
      for (const r of p.rows) {
        expect(r.length, p.id).toBe(p.rows.length);
        expect(/^[#.]+$/.test(r), p.id).toBe(true);
      }
      expect(p.rows.join('').includes('#'), p.id).toBe(true);
    }
  });

  it.each(PICROSS_PATTERNS.map(p => [p.id, p] as const))('%s sai inteiro e único só por lógica de linha', (_id, p) => {
    expect(isLineSolvable(p)).toBe(true);
  });
});

describe('picross — o puzzle do dia', () => {
  it('é determinístico pela chave do dia', () => {
    expect(dailyPattern('2026-09-30').id).toBe(dailyPattern('2026-09-30').id);
  });

  it('varia ao longo dos dias (não é sempre o mesmo)', () => {
    const ids = new Set<string>();
    for (let d = 1; d <= 30; d++) ids.add(dailyPattern(`2026-09-${String(d).padStart(2, '0')}`).id);
    expect(ids.size).toBeGreaterThan(5);
  });

  it('paga pelo TAMANHO da grade, e o do dia soma o bônus (balanço de 30/09/2026)', () => {
    expect(picrossBits(5, false)).toBe(PICROSS_BITS_BY_SIZE[5]);
    expect(picrossBits(7, false)).toBe(PICROSS_BITS_BY_SIZE[7]);
    expect(picrossBits(10, false)).toBe(PICROSS_BITS_BY_SIZE[10]);
    expect(picrossBits(10, true)).toBe(PICROSS_BITS_BY_SIZE[10] + PICROSS_DAILY_BONUS);
    // Grade maior nunca paga menos (senão o certo seria fugir dela).
    expect(PICROSS_BITS_BY_SIZE[5]).toBeLessThan(PICROSS_BITS_BY_SIZE[7]);
    expect(PICROSS_BITS_BY_SIZE[7]).toBeLessThan(PICROSS_BITS_BY_SIZE[10]);
    // O que a folha anuncia é alcançável: todo tamanho de desenho tem valor, e o máximo existe.
    for (const p of PICROSS_PATTERNS) expect(PICROSS_BITS_BY_SIZE[p.rows.length], p.id).toBeGreaterThan(0);
    expect(PICROSS_MAX_BITS).toBe(PICROSS_BITS_BY_SIZE[10] + PICROSS_DAILY_BONUS);
  });
});
