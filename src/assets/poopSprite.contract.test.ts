/**
 * Contrato: a folha do cocô (3 quadros de 64x64) não pode ter pixel opaco na borda de nenhum quadro.
 * Causa real do bug (v246): quadros cortados no topo/base, linha 63 opaca; o SpriteAnim mostrava o cocô cortado.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const FILE = path.resolve(__dirname, 'soulmon/fx/anim-poop-plop.png');
const FW = 64;
const FH = 64;

describe('anim-poop-plop.png', () => {
  it('folha 192x64 com 3 quadros e nenhum pixel opaco na borda de qualquer quadro', async () => {
    const { data, info } = await sharp(fs.readFileSync(FILE)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([FW * 3, FH]);
    const opaco = (x: number, y: number) => data[(y * info.width + x) * 4 + 3] > 0;
    for (let f = 0; f < 3; f++) {
      const ox = f * FW;
      let temConteudo = false;
      const bordas: string[] = [];
      for (let y = 0; y < FH; y++) {
        for (let x = 0; x < FW; x++) {
          if (!opaco(ox + x, y)) continue;
          temConteudo = true;
          if (x === 0 || y === 0 || x === FW - 1 || y === FH - 1) bordas.push(`(${x},${y})`);
        }
      }
      expect(temConteudo, `quadro ${f} vazio`).toBe(true);
      expect(bordas, `quadro ${f} tem pixel opaco na borda`).toEqual([]);
    }
  });
});
