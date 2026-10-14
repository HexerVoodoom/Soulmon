import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { chromaKeyPng, BadChromaError } from './_chroma.js';
import { decodePng, encodePng } from './_png.js';

const GREEN = [0, 255, 0];

/** Imagem w×h de fundo verde com retângulos [x,y,w,h,[r,g,b]] por cima. */
function img(w, h, rects, bg = GREEN) {
  const d = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) d.set([...bg, 255], i * 4);
  for (const [x0, y0, rw, rh, c] of rects) {
    for (let y = y0; y < y0 + rh; y++) for (let x = x0; x < x0 + rw; x++) d.set([...c, 255], (y * w + x) * 4);
  }
  return encodePng(w, h, d);
}
const out = png => decodePng(chromaKeyPng(png));

describe('chroma-key do sprite', () => {
  it('fundo verde puro vira alfa 0 e a criatura fica intacta, recortada com margem', () => {
    const r = out(img(100, 100, [[40, 30, 20, 40, [200, 40, 40]]]));
    const opacos = [];
    for (let i = 0; i < r.width * r.height; i++) if (r.data[i * 4 + 3]) opacos.push(i);
    expect(opacos).toHaveLength(20 * 40);
    for (const i of opacos) expect([...r.data.subarray(i * 4, i * 4 + 4)]).toEqual([200, 40, 40, 255]);
    expect(r.width).toBe(r.height); // quadrado
    expect(r.width).toBe(40 + 2 * Math.max(2, Math.floor(40 * 0.04))); // lado maior + margem
    expect(r.data[3]).toBe(0); // canto transparente
  });

  it('sem franja: borda semi-verde some ou é dessaturada (g <= max(r,b) em todo pixel opaco)', () => {
    // anel de transição (d entre 35 e 60) em volta do corpo
    const r = out(img(100, 100, [[28, 28, 44, 44, [90, 160, 90]], [32, 32, 36, 36, [210, 60, 60]]]));
    for (let i = 0; i < r.width * r.height; i++) {
      if (!r.data[i * 4 + 3]) continue;
      const [R, G, B] = r.data.subarray(i * 4, i * 4 + 3);
      expect(G - Math.max(R, B)).toBeLessThanOrEqual(0);
    }
  });

  it('alfa é binário e ilhas < 24 px somem', () => {
    const r = out(img(100, 100, [[40, 40, 20, 20, [200, 40, 40]], [5, 5, 4, 4, [200, 40, 40]], [80, 80, 5, 5, [30, 30, 200]]]));
    const alfas = new Set();
    let n = 0;
    for (let i = 0; i < r.width * r.height; i++) { alfas.add(r.data[i * 4 + 3]); if (r.data[i * 4 + 3]) n++; }
    expect([...alfas].sort()).toEqual([0, 255]);
    expect(n).toBe(425); // 400 + a de 25 px (>=24 fica); a de 16 px some
  });

  it('buraco de verde entre partes (não ligado à borda) também vira transparente', () => {
    const r = out(img(100, 100, [[20, 20, 60, 60, [200, 40, 40]], [45, 45, 10, 10, GREEN]]));
    const cx = (r.width - 1) >> 1;
    expect(r.data[(cx * r.width + cx) * 4 + 3]).toBe(0);
  });

  it('imagem sem verde (fundo branco) => bad-chroma', () => {
    expect(() => chromaKeyPng(img(100, 100, [[40, 40, 20, 20, [200, 40, 40]]], [255, 255, 255]))).toThrow(BadChromaError);
  });

  it('criatura verde demais => bad-chroma', () => {
    // verde dentro do corpo, sem tocar a borda
    expect(() => chromaKeyPng(img(100, 100, [[10, 10, 80, 80, [200, 40, 40]], [14, 14, 72, 72, GREEN]]))).toThrow(/bad-chroma/);
  });

  it('PNG codec: ida e volta preserva os pixels', () => {
    const d = new Uint8Array(4 * 3 * 4).map((_, i) => (i * 37) & 255);
    const r = decodePng(encodePng(4, 3, d));
    expect([...r.data]).toEqual([...d]);
  });
});

const REAIS = 'E:/soulmon-sprites-teste/v-pet';
describe.skipIf(!existsSync(REAIS))('imagens reais da API (fundo verde)', () => {
  for (const nome of ['flare-verde-verde.png', 'alpha-verde-verde.png']) {
    it(`${nome}: tem alfa e nenhuma franja verde na borda`, () => {
      const r = out(new Uint8Array(readFileSync(`${REAIS}/${nome}`)));
      const { width: w, height: h, data } = r;
      let transp = 0, opacos = 0, franja = 0;
      const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : data[(y * w + x) * 4 + 3]);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!A(x, y)) { transp++; continue; }
        opacos++;
        if (A(x - 1, y) && A(x + 1, y) && A(x, y - 1) && A(x, y + 1)) continue; // só borda
        const p = (y * w + x) * 4;
        if (data[p + 1] > Math.max(data[p], data[p + 2]) + 10) franja++;
      }
      console.log(nome, `${w}x${h}`, 'transparentes', transp, 'opacos', opacos, 'franja', franja);
      expect(transp).toBeGreaterThan(0);
      expect(opacos).toBeGreaterThan(1000);
      expect(franja).toBe(0);
    });
  }
});
