/**
 * ARTE PROCEDURAL DO PESADELO (15/10/2026): os 7 PNG do elemento (128², alfa) e os 3 cenários (608×1080, opacos), tudo
 * na paleta de pesadelo (preto, roxo-azulado, ciano) — nenhum rosa/vermelho — e gerado de forma reprodutível.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';

const A = path.resolve(process.cwd(), 'src/assets/soulmon');
const FX = ['el-pesadelo', 'fx-pesadelo-cast', 'fx-pesadelo-aura', 'fx-pesadelo-slash', 'fx-pesadelo-impact', 'fx-pesadelo-defended', 'fx-pesadelo-orb'];
const BG = ['pesadelo-abismo-glitch', 'pesadelo-corredor-impossivel', 'pesadelo-quarto-sem-fim'];
const PAL = ['05080c', '0e0b26', '1c1448', '3b2a7a', '5b34c8', '763bff', '4a1a7a', '12466e', '3fc8e8', '7fe6ff', 'a9fbff', 'e6feff'];

async function pixels(f: string) {
  const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

describe('arte do Pesadelo', () => {
  it.each(FX)('%s: 128×128, alfa real (fundo transparente), com conteúdo', async (n) => {
    const { data, w, h } = await pixels(path.join(A, 'pesadelo', `${n}.png`));
    expect([w, h]).toEqual([128, 128]);
    let on = 0;
    let off = 0;
    for (let i = 3; i < data.length; i += 4) { if (data[i] > 0) on++; else off++; }
    expect(off, 'sem fundo transparente').toBeGreaterThan(128 * 128 * 0.1);
    expect(on, 'vazio').toBeGreaterThan(300);
  });
  it('a aura é VAZADA no meio (o bicho fica dentro) e o orb aponta para a DIREITA (a massa fica à direita)', async () => {
    const aura = await pixels(path.join(A, 'pesadelo/fx-pesadelo-aura.png'));
    expect(aura.data[(64 * 128 + 64) * 4 + 3]).toBe(0);
    const orb = await pixels(path.join(A, 'pesadelo/fx-pesadelo-orb.png'));
    let esq = 0;
    let dir = 0;
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) if (orb.data[(y * 128 + x) * 4 + 3] > 0) (x < 64 ? esq++ : dir++);
    expect(dir).toBeGreaterThan(esq);
  });
  it.each([...FX.map(n => path.join(A, 'pesadelo', `${n}.png`)), ...BG.map(n => path.join(A, 'bg', `${n}.png`))])('%s: só cores da paleta de pesadelo, nenhum rosa/vermelho', async (f) => {
    const { data } = await pixels(f);
    const ok = new Set(PAL);
    const fora = new Set<string>();
    let avermelhado = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      const hex = [data[i], data[i + 1], data[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('');
      if (!ok.has(hex)) fora.add(hex);
      if (data[i] > data[i + 1] + 40 && data[i] > data[i + 2]) avermelhado++;
    }
    expect([...fora].slice(0, 5)).toEqual([]);
    expect(avermelhado, 'pixels vermelhos/rosa').toBe(0);
  });
  it.each(BG)('cenário %s: 608×1080 opaco (mesma caixa alta dos fundos pintados)', async (n) => {
    const { data, w, h } = await pixels(path.join(A, 'bg', `${n}.png`));
    expect([w, h]).toEqual([608, 1080]);
    let translucidos = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] !== 255) translucidos++;
    expect(translucidos).toBe(0);
  });
  it('o gerador está no repositório (reprodutível) e não usa relógio nem rede', () => {
    const src = fs.readFileSync(path.resolve(process.cwd(), 'scripts/gerar-pesadelo-arte.py'), 'utf8');
    expect(src).not.toMatch(/time\.time|datetime|urllib|requests/);
    expect(src).toMatch(/random\.Random\(\d+\)/);
  });
});
