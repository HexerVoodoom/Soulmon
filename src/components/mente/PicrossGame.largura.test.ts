import { describe, expect, it } from 'vitest';
import { cellSizeFor, clueColFor, gridWidthFor } from './PicrossGame';

/** QA L11-14: a grade 10×10 de célula fixa 30 px não cabia em 320 px (coluna 10 com 16 px visíveis). */
describe('Nonograma: a grade cabe na janela', () => {
  it('348 px (padrão) mantém 44 px até 7×7 e 30 px acima', () => {
    expect(cellSizeFor(7)).toBe(44);
    expect(cellSizeFor(10)).toBe(30);
    expect(clueColFor(10)).toBe(48);
  });
  it('em 320 px a grade 10×10 cabe inteira (células + coluna de pistas = largura da grade)', () => {
    const w = gridWidthFor(320);
    expect(w).toBe(288);
    const c = cellSizeFor(10, w);
    expect(c).toBeLessThan(30);
    expect(c * 10 + clueColFor(10, w)).toBe(w);
    expect(clueColFor(10, w)).toBeGreaterThanOrEqual(48);
  });
  it('para qualquer janela e tamanho, células + pistas somam a largura da grade', () => {
    for (const vw of [320, 360, 375, 414, 1024]) for (const n of [5, 7, 8, 10]) {
      const w = gridWidthFor(vw);
      expect(cellSizeFor(n, w) * n + clueColFor(n, w)).toBe(w);
      expect(cellSizeFor(n, w)).toBeGreaterThan(0);
    }
  });
});
