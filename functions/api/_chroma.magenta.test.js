// M14 (25/10/2026): criatura com verde => fundo MAGENTA #FF00FF no prompt; o recorte usa a cor certa.
import { describe, expect, it } from 'vitest';
import { chromaKeyPng, chromaKeyOfPrompt, BadChromaError } from './_chroma.js';
import { decodePng, encodePng } from './_png.js';

function img(bg, fg) {
  const W = 64, H = 64; const d = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = x >= 20 && x < 44 && y >= 20 && y < 44 ? fg : bg;
    d.set([...c, 255], (y * W + x) * 4);
  }
  return encodePng(W, H, d);
}

describe('chroma magenta', () => {
  it('a cor do chroma vem do prompt', () => {
    expect(chromaKeyOfPrompt('on a solid flat pure #FF00FF chroma-magenta background')).toBe('magenta');
    expect(chromaKeyOfPrompt('on a solid flat pure #00FF00 chroma-green background')).toBe('green');
    expect(chromaKeyOfPrompt(undefined)).toBe('green');
  });
  it('criatura VERDE sobre fundo magenta sobrevive ao recorte magenta', () => {
    const out = decodePng(chromaKeyPng(img([255, 0, 255], [40, 200, 60]), 'magenta'));
    let opaque = 0; let g = 0;
    for (let i = 0; i < out.data.length; i += 4) if (out.data[i + 3]) { opaque++; g = out.data[i + 1]; }
    expect(opaque).toBeGreaterThan(24 * 24 * 0.9);
    expect(g).toBeGreaterThan(150); // continua verde
  });
  it('o mesmo PNG com o recorte verde falha (a criatura seria comida): por isso a cor é por criatura', () => {
    let opaque = 0;
    try {
      const out = decodePng(chromaKeyPng(img([255, 0, 255], [40, 200, 60]), 'green'));
      for (let i = 3; i < out.data.length; i += 4) if (out.data[i]) opaque++;
      // o miolo verde virou buraco (alfa 0) e o fundo magenta ficou opaco
      expect(opaque).toBeLessThan(out.width * out.height - 24 * 24 * 0.9);
    } catch (e) { expect(e).toBeInstanceOf(BadChromaError); }
  });
});
