import { describe, expect, it } from 'vitest';
import { generateZip, validateZip, canStep, zipSizeForLevel, zipBits, ZIP_MAX_BITS, serpentinePath, seededRng } from './zip';
import { generatePatches, validatePatches, patchesSizeForLevel, patchesBits, PATCHES_MAX_BITS, placeRect, rectBetween, type Rect } from './patches';

describe('Trilha do Pet (zip)', () => {
  it('grade ímpar: o caminho começa numa casa da cor maioritária e quase nunca é a serpentina trivial', () => {
    const triviais = (size: number) => {
      const set = new Set<string>();
      for (let s = 1; s <= 30; s++) set.add(serpentinePath(size, seededRng(s)).join(','));
      return set;
    };
    for (const size of [5, 7]) {
      const trivial = triviais(size);
      let naSerpentina = 0;
      const N = 60;
      for (let seed = 1; seed <= N; seed++) {
        const p = generateZip(size, seededRng(seed * 104729 + size));
        const start = p.solution[0];
        expect((Math.floor(start / size) + (start % size)) % 2, `${size}/${seed}`).toBe(0);
        if (trivial.has(p.solution.join(','))) naSerpentina++;
      }
      expect(naSerpentina, `serpentina em ${size}×${size}`).toBeLessThan(N * 0.25);
    }
  });
  it('todo puzzle gerado é solucionável, em todos os tamanhos e muitas sementes', () => {
    for (let size = 4; size <= 8; size++) {
      for (let seed = 1; seed <= 40; seed++) {
        const p = generateZip(size, seededRng(seed * 7919 + size));
        expect(p.size).toBe(size);
        expect(validateZip(p, p.solution), `${size}/${seed}`).toBe(true);
        expect(p.numbers.length).toBeGreaterThanOrEqual(3);
        expect(new Set(p.numbers).size).toBe(p.numbers.length);
      }
    }
  });
  it('a serpente de segurança também resolve', () => {
    for (let s = 1; s < 20; s++) {
      const path = serpentinePath(5, seededRng(s));
      expect(validateZip({ size: 5, numbers: [path[0], path[12], path[24]] }, path)).toBe(true);
    }
  });
  it('rejeita caminho curto, repetido, com salto ou fora de ordem', () => {
    const p = generateZip(4, seededRng(3));
    expect(validateZip(p, p.solution.slice(0, 15))).toBe(false);
    const jump = [...p.solution];
    [jump[3], jump[9]] = [jump[9], jump[3]];
    expect(validateZip(p, jump)).toBe(false);
    const dup = [...p.solution];
    dup[5] = dup[4];
    expect(validateZip(p, dup)).toBe(false);
    // números trocados de ordem: o mesmo caminho não resolve outra numeração
    expect(validateZip({ size: 4, numbers: [...p.numbers].reverse() }, p.solution)).toBe(false);
  });
  it('canStep: começa no 1 e só entra número na vez dele; a solução anda inteira', () => {
    const p = generateZip(5, seededRng(11));
    expect(canStep(p, [], p.numbers[0])).toBe(true);
    expect(canStep(p, [], p.numbers[1])).toBe(false);
    const walked: number[] = [];
    for (const c of p.solution) { expect(canStep(p, walked, c)).toBe(true); walked.push(c); }
  });
  it('tamanho sobe por nível e os Bits ficam sob o teto', () => {
    expect(zipSizeForLevel(1)).toBe(4);
    expect(zipSizeForLevel(3)).toBe(5);
    expect(zipSizeForLevel(99)).toBe(8);
    for (let s = 4; s <= 8; s++) expect(zipBits(s)).toBeLessThanOrEqual(ZIP_MAX_BITS);
  });
});

describe('Colcha (patches)', () => {
  it('todo puzzle gerado é solucionável e cada retângulo tem uma pista', () => {
    for (let size = 4; size <= 8; size++) {
      for (let seed = 1; seed <= 60; seed++) {
        const p = generatePatches(size, seededRng(seed * 104729 + size));
        expect(validatePatches(p, p.solution), `${size}/${seed}`).toBe(true);
        expect(p.clues.length).toBe(p.solution.length);
        expect(p.clues.reduce((s, c) => s + c.area, 0)).toBe(size * size);
      }
    }
  });
  it('rejeita cobertura incompleta e sobreposição', () => {
    const p = generatePatches(4, seededRng(5));
    expect(validatePatches(p, p.solution.slice(1))).toBe(false);
    expect(validatePatches(p, [...p.solution, { r: 0, c: 0, h: 1, w: 1 }])).toBe(false);
  });
  it('forma dada precisa bater', () => {
    const puzzle = { size: 4, clues: [{ cell: 0, area: 8, shape: 'tall' as const }, { cell: 3, area: 8, shape: 'any' as const }] };
    expect(validatePatches(puzzle, [{ r: 0, c: 0, h: 4, w: 2 }, { r: 0, c: 2, h: 4, w: 2 }])).toBe(true);
    expect(validatePatches(puzzle, [{ r: 0, c: 0, h: 2, w: 4 }, { r: 2, c: 0, h: 2, w: 4 }])).toBe(false);
  });
  it('placeRect substitui o que atropela; rectBetween normaliza a ordem', () => {
    const a: Rect = { r: 0, c: 0, h: 2, w: 2 };
    expect(placeRect([a], { r: 1, c: 1, h: 2, w: 2 })).toEqual([{ r: 1, c: 1, h: 2, w: 2 }]);
    expect(placeRect([a], { r: 2, c: 2, h: 1, w: 1 })).toHaveLength(2);
    expect(rectBetween(15, 0, 4)).toEqual({ r: 0, c: 0, h: 4, w: 4 });
  });
  it('tamanho por nível e Bits sob o teto', () => {
    expect(patchesSizeForLevel(1)).toBe(4);
    expect(patchesSizeForLevel(99)).toBe(8);
    for (let s = 4; s <= 8; s++) expect(patchesBits(s)).toBeLessThanOrEqual(PATCHES_MAX_BITS);
  });
});
