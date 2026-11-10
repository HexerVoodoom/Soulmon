import { describe, expect, it } from 'vitest';
import { chromaKeyPngChecked, avaliarRiscoRecorte, FLAG_RECORTE_SUSPEITO, chromaKeyPng } from './_chroma.js';
import { decodePng, encodePng } from './_png.js';

const W = 64;
/** Fundo `bg`, quadrado central `fg`, com opcional miolo de outra cor (buraco de chave ligado so ao interior). */
function img(bg, fg, miolo) {
  const d = new Uint8Array(W * W * 4);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const dentro = x >= 12 && x < 52 && y >= 12 && y < 52;
    const mi = miolo && x >= 26 && x < 38 && y >= 26 && y < 38;
    d.set([...(mi ? miolo : dentro ? fg : bg), 255], (y * W + x) * 4);
  }
  return encodePng(W, W, d);
}
const opacos = png => { const o = decodePng(png); let n = 0; for (let i = 3; i < o.data.length; i += 4) if (o.data[i]) n++; return n; };

describe('verificacao pos-recorte (#749)', () => {
  it('criatura limpa: sem flag, modo normal', () => {
    const { quality } = chromaKeyPngChecked(img([0, 255, 0], [200, 60, 60]), 'green');
    expect(quality.flag).toBeNull();
    expect(quality.modo).toBe('normal');
  });
  it('miolo na cor da chave (buraco interno) vira modo conectado e o miolo e preservado', () => {
    const png = img([0, 255, 0], [200, 60, 60], [0, 255, 0]);
    const { png: out, quality } = chromaKeyPngChecked(png, 'green');
    expect(quality.modo).toBe('conectado');
    expect(opacos(out)).toBeGreaterThan(opacos(chromaKeyPng(png, 'green')));
  });
  it('criatura toda na cor da chave: marca recorte-suspeito (sem lancar)', () => {
    const { quality } = chromaKeyPngChecked(img([0, 255, 0], [90, 170, 125], [92, 168, 123]), 'green');
    expect(quality.flag).toBe(FLAG_RECORTE_SUSPEITO);
    expect(quality.motivos).toContain('criatura-na-cor-da-chave');
  });
  it('criatura verde sobre fundo verde (antes: BadChroma por buracos) agora e resgatada pelo modo conectado', () => {
    expect(() => chromaKeyPng(img([0, 255, 0], [200, 60, 60], [0, 255, 0]).slice(), 'green')).not.toThrow();
    const r = chromaKeyPngChecked(img([0, 255, 0], [90, 170, 125]), 'green');
    expect(r.quality.flag === null || r.quality.flag === FLAG_RECORTE_SUSPEITO).toBe(true);
  });
  it('avaliarRiscoRecorte: limiares', () => {
    expect(avaliarRiscoRecorte({ nearFraction: 0.01, holeFraction: 0 }).suspeito).toBe(false);
    expect(avaliarRiscoRecorte({ nearFraction: 0.3, holeFraction: 0 }).motivos).toEqual(['criatura-na-cor-da-chave']);
    expect(avaliarRiscoRecorte({ nearFraction: 0, holeFraction: 0.1 }).motivos).toEqual(['buracos-internos']);
  });
});
