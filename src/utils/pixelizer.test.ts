import { describe, it, expect } from 'vitest';
import {
  removeLightBackground, medianCutPalette, applyPalette,
  countDistinctColors, pixelizeBuffer,
} from './pixelizer';

/** Monta um buffer RGBA a partir de uma matriz de cores [r,g,b,a]. */
function buffer(rows: number[][][]): { data: Uint8ClampedArray; w: number; h: number } {
  const h = rows.length;
  const w = rows[0].length;
  const data = new Uint8ClampedArray(w * h * 4);
  rows.flat().forEach((px, i) => {
    data[i * 4] = px[0]; data[i * 4 + 1] = px[1]; data[i * 4 + 2] = px[2];
    data[i * 4 + 3] = px[3] ?? 255;
  });
  return { data, w, h };
}

const W = [255, 255, 255]; // branco (fundo)
const R = [200, 30, 30];   // corpo
const K = [10, 10, 10];    // contorno

describe('removeLightBackground', () => {
  it('apaga só o branco conectado à borda, preservando o branco interno', () => {
    // Moldura branca, anel de corpo, miolo branco (ex.: olho)
    const { data, w, h } = buffer([
      [W, W, W, W, W],
      [W, R, R, R, W],
      [W, R, W, R, W],
      [W, R, R, R, W],
      [W, W, W, W, W],
    ]);
    removeLightBackground(data, w, h);
    const alphaAt = (x: number, y: number) => data[(y * w + x) * 4 + 3];
    expect(alphaAt(0, 0)).toBe(0);   // canto: fundo removido
    expect(alphaAt(4, 2)).toBe(0);   // borda direita: removido
    expect(alphaAt(2, 2)).toBe(255); // miolo branco INTERNO: preservado
    expect(alphaAt(1, 1)).toBe(255); // corpo intacto
  });
});

describe('medianCutPalette', () => {
  it('reduz para no máximo N cores', () => {
    // 6 cores distintas → paleta de 4
    const { data } = buffer([
      [[255, 0, 0], [0, 255, 0], [0, 0, 255]],
      [[255, 255, 0], [0, 255, 255], [255, 0, 255]],
    ]);
    const palette = medianCutPalette(data, 4);
    expect(palette.length).toBeLessThanOrEqual(4);
    expect(palette.length).toBeGreaterThan(1);
  });

  it('ignora pixels transparentes', () => {
    const { data } = buffer([
      [[255, 0, 0, 255], [0, 255, 0, 0]], // verde é transparente
    ]);
    const palette = medianCutPalette(data, 4);
    expect(palette).toEqual([[255, 0, 0]]);
  });
});

describe('applyPalette + pipeline', () => {
  it('todo pixel opaco vira uma cor exata da paleta', () => {
    const { data } = buffer([
      [[250, 10, 10], [180, 40, 40], [20, 200, 20], [30, 180, 30]],
    ]);
    const palette = medianCutPalette(data, 2);
    applyPalette(data, palette);
    expect(countDistinctColors(data)).toBeLessThanOrEqual(2);
  });

  it('pixelizeBuffer limita as cores e remove o fundo', () => {
    const { data, w, h } = buffer([
      [W, W, W, W],
      [W, R, [190, 45, 35], W],
      [W, K, [25, 20, 15], W],
      [W, W, W, W],
    ]);
    pixelizeBuffer(data, w, h, { colors: 4, transparentBg: true });
    expect(countDistinctColors(data)).toBeLessThanOrEqual(4);
    expect(data[3]).toBe(0); // canto transparente
  });
});
