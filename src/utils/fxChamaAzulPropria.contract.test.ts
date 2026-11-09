// §262: o FX da chama_azul (fogo+morte) já foi o da `fada` repintado (com corações). Nenhuma peça dela pode voltar a ser a da fada.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const DIR = join(__dirname, '../assets/soulmon/fx-ataque');
const ESTADOS = ['orb', 'slash', 'impact', 'cast', 'aura', 'defended', 'aura-96'];

describe('fx da chama_azul é própria', () => {
  it.each(ESTADOS)('fx-chama_azul-%s não é a da fada (bytes nem pixels)', async (e) => {
    const a = join(DIR, `fx-chama_azul-${e}.png`);
    const f = join(DIR, `fx-fada-${e}.png`);
    expect(readFileSync(a).equals(readFileSync(f))).toBe(false);
    const A = await sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const F = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let igual = 0, total = 0;
    if (A.info.width === F.info.width && A.info.height === F.info.height) {
      for (let i = 0; i < A.data.length; i += 4) {
        if (A.data[i + 3] < 128 && F.data[i + 3] < 128) continue;
        total++;
        if (Math.abs(A.data[i + 3] - F.data[i + 3]) < 128) igual++;
      }
      // mesma silhueta (máscara de alfa quase idêntica) = a mesma forma repintada
      const mascaraIgual = total > 0 && igual / total > 0.98;
      let cor = 0;
      for (let i = 0; i < A.data.length; i += 4) if (A.data[i + 3] > 128 && F.data[i + 3] > 128 && Math.abs(A.data[i] - F.data[i]) + Math.abs(A.data[i + 1] - F.data[i + 1]) + Math.abs(A.data[i + 2] - F.data[i + 2]) < 24) cor++;
      expect(mascaraIgual && cor / total > 0.9).toBe(false);
    }
  });
});
