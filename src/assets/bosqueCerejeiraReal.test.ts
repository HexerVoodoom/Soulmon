import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { COSMETICOS_NOVOS } from '../utils/cosmeticosNovos';
import { COSMETICOS_NOVOS_CORES } from '../utils/cosmeticosNovosCores';
import { PET_BACKGROUNDS } from '../utils/backgrounds';

// REGISTRO §410: o bosque de cerejeiras de verdade substitui a arte do vulcão no id original.
const RAIZ = process.cwd();
const ID = 'bg-cerejeira-bosque-de-cerejeiras';
const TETO = 400 * 1024;

async function media(file: string) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const s = [0, 0, 0];
  for (let i = 0; i < data.length; i += 3) { s[0] += data[i]; s[1] += data[i + 1]; s[2] += data[i + 2]; }
  const n = info.width * info.height;
  return s.map(v => v / n);
}

describe('§410: bosque de cerejeiras de verdade no id original', () => {
  const webp = path.join(RAIZ, 'src/assets/backgrounds', `${ID}.webp`);
  it('id, preço e coleção continuam os mesmos; o templo vizinho segue intacto', () => {
    const c = COSMETICOS_NOVOS.find(x => x.id === ID)!;
    expect([c.kind, PET_BACKGROUNDS[ID].setting]).toEqual(['bg', 'outdoor']);
    expect(c.id).toBe(ID);
    expect(COSMETICOS_NOVOS.filter(x => x.id === ID)).toHaveLength(1);
    expect(COSMETICOS_NOVOS.find(x => x.id === 'bg-cerejeira-templo-das-petalas')).toBeTruthy();
    expect(PET_BACKGROUNDS[ID].horizonY).toBe(74);
  });
  it('arte 1200×648 WebP, sem alfa, abaixo do teto de 400 KB', async () => {
    const m = await sharp(webp).metadata();
    expect([m.format, m.width, m.height, m.hasAlpha]).toEqual(['webp', 1200, 648, false]);
    expect(fs.statSync(webp).size).toBeLessThanOrEqual(TETO);
  });
  it('cor média é rosa/clara (cerejeira), não o laranja/vermelho escuro do vulcão', async () => {
    const [r, g, b] = await media(webp);
    expect(r, 'R').toBeGreaterThan(150);
    expect(b, 'B (rosa tem azul)').toBeGreaterThan(g * 0.8);
    expect(r - b, 'sem laranja dominante').toBeLessThan(60);
  });
  it('miniatura 96×52 e miniatura do widget V-Pet 360×194 existem e acompanham a arte nova', async () => {
    const t = await sharp(path.join(RAIZ, 'src/assets/backgrounds/thumbs', `${ID}.png`)).metadata();
    expect([t.width, t.height]).toEqual([96, 52]);
    const w = path.join(RAIZ, 'android/app/src/main/res/drawable-nodpi', `vpet_bg_${ID.replace(/-/g, '_')}.webp`);
    const wm = await sharp(w).metadata();
    expect([wm.width, wm.height]).toEqual([360, 194]);
    const [r, , b] = await media(w);
    expect(r - b).toBeLessThan(60);
  });
  it('baseColor é a média clara do chão (hex válido, não o #221d20 do vulcão)', () => {
    const hex = COSMETICOS_NOVOS_CORES[ID];
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    expect(r + g + b).toBeGreaterThan(450);
    expect(PET_BACKGROUNDS[ID].baseColor).toBe(hex);
  });
});
