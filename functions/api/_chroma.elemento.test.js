// Fundo chroma POR PROMPT de elemento (dono, 10/11/2026): o prompt de sprite escolhe verde #00FF00 ou magenta #FF00FF conforme as cores do
// elemento e o recorte do servidor (`chromaKeyOfPrompt` → `chromaKeyPng`) lê essa cor DO PRÓPRIO PROMPT. Sprites sintéticos nos dois fundos.
import { describe, expect, it } from 'vitest';
import { chromaKeyPng, chromaKeyOfPrompt } from './_chroma.js';
import { decodePng, encodePng } from './_png.js';
import { stagesComElemento } from '../../src/utils/elementoCombinado';

const FUNDO = 'Tamagotchi-style v-pet sprite, 16x16 pixel art, isolated subject, on a solid flat pure #00FF00 chroma-green background (uniform, no gradient, no shadow), the creature itself contains no green and no green fringe: macaw. Flat dark violet colors.';
const promptDe = id => stagesComElemento([{ stage: 'perfeito', imagePrompt: FUNDO, imagePromptFallback: FUNDO }], undefined, { ultimate: id }, 'sombra')[0].imagePrompt;

function img(bg, fg) {
  const W = 64, H = 64; const d = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) d.set([...(x >= 20 && x < 44 && y >= 20 && y < 44 ? fg : bg), 255], (y * W + x) * 4);
  return encodePng(W, H, d);
}
const opacos = png => { const o = decodePng(png); let n = 0; for (let i = 3; i < o.data.length; i += 4) if (o.data[i]) n++; return n; };

describe('recorte pela cor de fundo que o prompt do elemento escolheu', () => {
  it('elemento COM verde (planta): o prompt pede magenta e a criatura verde sobre magenta sobrevive', () => {
    const p = promptDe('planta');
    expect(chromaKeyOfPrompt(p)).toBe('magenta');
    expect(opacos(chromaKeyPng(img([255, 0, 255], [40, 200, 60]), chromaKeyOfPrompt(p)))).toBeGreaterThan(24 * 24 * 0.9);
  });
  it('elemento sem verde (marcial): o prompt fica no verde e a criatura rosa-choque sobre verde sobrevive', () => {
    const p = promptDe('marcial');
    expect(chromaKeyOfPrompt(p)).toBe('green');
    expect(opacos(chromaKeyPng(img([0, 255, 0], [255, 60, 190]), chromaKeyOfPrompt(p)))).toBeGreaterThan(24 * 24 * 0.9);
  });
  it('o fundo é removido nos dois casos (só sobra a criatura)', () => {
    const mag = chromaKeyPng(img([255, 0, 255], [200, 60, 60]), 'magenta');
    const ver = chromaKeyPng(img([0, 255, 0], [200, 60, 60]), 'green');
    expect(opacos(mag)).toBe(opacos(ver));
    expect(opacos(ver)).toBeLessThan(64 * 64 * 0.5);
  });
});
