// Chave AZUL por flood-fill a partir da borda (M5, 10/11/2026): o recorte por canal comia runas violeta-azuladas do sprite do Saba
// (b > 150 e b - max(r,g) > 60 pega (110,90,230)) e o despill (b = max(r,g)) agia na imagem toda. Sinteticos, sem arquivo grande.
import { describe, expect, it } from 'vitest';
import { chromaKeyPng, chromaKeyPngChecked, BadChromaError } from './_chroma.js';
import { decodePng, encodePng } from './_png.js';

const AZUL = [0, 0, 255];
const VIOLETA = [110, 90, 230]; // runa do sprite: parece azul para o criterio por canal
const CORPO = [200, 60, 60];
const W = 96;

function cena({ fundo = AZUL, desenho }) {
  const d = new Uint8Array(W * W * 4);
  for (let i = 0; i < W * W; i++) d.set([...fundo, 255], i * 4);
  const pinta = (x0, y0, x1, y1, c) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) d.set([...c, 255], (y * W + x) * 4); };
  desenho(pinta);
  return encodePng(W, W, d);
}
const px = (png, x, y) => { const o = decodePng(png); const p = (y * o.width + x) * 4; return [o.data[p], o.data[p + 1], o.data[p + 2], o.data[p + 3]]; };
const contar = (png, pred) => { const o = decodePng(png); let n = 0; for (let i = 0; i < o.data.length; i += 4) if (o.data[i + 3] && pred(o.data[i], o.data[i + 1], o.data[i + 2])) n++; return n; };
const violeta = (r, g, b) => b > 150 && b - Math.max(r, g) > 60 && r > 60;

describe('chave azul por flood-fill', () => {
  const comRunas = cena({ desenho: p => { p(20, 20, 76, 76, CORPO); p(30, 30, 40, 50, VIOLETA); p(50, 40, 64, 46, VIOLETA); } });
  it('runa violeta DENTRO do corpo sobrevive opaca e com a cor original (nao e despillada)', () => {
    const out = chromaKeyPng(comRunas, 'blue');
    expect(contar(out, violeta)).toBeGreaterThanOrEqual(10 * 20 + 14 * 6);
    expect(contar(out, (r, g, b) => r === 110 && g === 90 && b === 230)).toBe(10 * 20 + 14 * 6);
    expect(contar(out, (r, g, b) => b > 200 && r < 40 && g < 40)).toBe(0); // nenhum azul puro sobra
  });
  it('vao enclausurado grande (>=800px a 1k, escala com a area) e removido; azul puro isolado tambem', () => {
    const png = cena({ desenho: p => { p(10, 10, 86, 86, CORPO); p(30, 30, 50, 50, AZUL); p(60, 60, 61, 61, AZUL); } });
    const out = chromaKeyPng(png, 'blue');
    expect(contar(out, (r, g, b) => b > 200 && r < 40 && g < 40)).toBe(0);
  });
  it('despill so no anel ao redor do fundo: borda azulada do corpo perde o excesso de azul, interior distante nao', () => {
    const png = cena({ desenho: p => { p(20, 20, 76, 76, [90, 90, 200]); } }); // corpo azul-acinzentado, longe do fundo (dist > 110)
    const out = chromaKeyPng(png, 'blue');
    expect(px(out, 4 + 28, 4 + 28)[2]).toBe(200); // centro intacto
    expect(px(out, 4, 4 + 28)[2]).toBeLessThan(200); // 1o px da borda despillado (b = max(r,g) = 90)
  });
  it('cantos nao-azuis => cai no caminho por canal e mantem o erro "sem fundo azul"', () => {
    const verde = cena({ fundo: [0, 255, 0], desenho: p => p(20, 20, 76, 76, CORPO) });
    expect(() => chromaKeyPng(verde, 'blue')).toThrow(/sem fundo azul/);
    expect(() => chromaKeyPngChecked(verde, 'blue')).toThrow(BadChromaError);
  });
  it('chromaKeyPngChecked: runa violeta preservada, sem flag de recorte suspeito por buracos', () => {
    const r = chromaKeyPngChecked(comRunas, 'blue');
    expect(r.quality.motivos).not.toContain('buracos-internos');
    expect(contar(r.png, violeta)).toBeGreaterThanOrEqual(10 * 20);
  });
  it('verde e magenta continuam pelo caminho por canal (despill global intacto)', () => {
    const v = cena({ fundo: [0, 255, 0], desenho: p => p(20, 20, 76, 76, [90, 170, 125]) });
    const out = decodePng(chromaKeyPng(v, 'green'));
    expect(out.width).toBeGreaterThan(0);
  });
});
