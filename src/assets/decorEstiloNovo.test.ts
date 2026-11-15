/**
 * As 33 decorações refeitas no estilo novo (15/11/2026, REGISTRO §398): a arte troca no MESMO id.
 * Guard do que o instalador (tools/instalar-decor-refeitas.py) promete: as 33 existem, cabem
 * na caixa do espaço sem deformar, têm alfa real e o catálogo segue com os mesmos ids.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ALL_SHOP_ITEMS } from '../utils/shop';
import { DECOR_SLOTS } from '../utils/petStage';
import { DECOR_ART } from '../utils/decorArt';

const DIR = path.resolve(__dirname, 'decor');
const K = 3; // caixa × 3, como as peças da Honra

const IDS: Record<string, string[]> = {
  'floor-left': ['furn-arcade-cab', 'furn-books', 'furn-campfire', 'furn-cauldron', 'furn-chair', 'furn-crystal', 'furn-sofa', 'furn-tent', 'furn-well'],
  'floor-right': ['furn-food-bowl', 'furn-plant', 'furn-lamp', 'furn-rock', 'furn-mushrooms', 'furn-hourglass'],
  wall: ['furn-clock', 'furn-garland', 'furn-picture', 'furn-window', 'furn-wind-chime', 'furniture-champion-banner', 'furniture-medal-wall'],
  trophy: ['furn-crate', 'furn-shelf-simple', 'furniture-trophy-shelf', 'furniture-podium', 'trophy-concha-mare'],
  rug: ['furn-rug', 'furn-grass', 'furn-sand', 'furn-stone-tiles', 'furn-circuit-mat', 'furn-deck'],
};
const TODAS = Object.entries(IDS).flatMap(([slot, ids]) => ids.map(id => ({ id, slot })));

describe('decoração no estilo novo: 33 peças no mesmo id', () => {
  it('são 33 ids únicos e cada um é item de mobília do catálogo, no espaço esperado, com arte registrada', () => {
    expect(TODAS).toHaveLength(33);
    expect(new Set(TODAS.map(t => t.id)).size).toBe(33);
    for (const { id, slot } of TODAS) {
      const item = ALL_SHOP_ITEMS.find(i => i.id === id);
      expect(item, id).toBeDefined();
      expect(item!.kind, id).toBe('furniture');
      expect(item!.slot, id).toBe(slot);
      expect(DECOR_ART[id], id).toBeTruthy();
    }
  });

  it('nenhum PNG sem item: o acervo não ganhou id novo nem arquivo órfão', () => {
    const arquivos = fs.readdirSync(DIR).filter(f => f.endsWith('.png')).map(f => f.slice(0, -4));
    const furniture = new Set(ALL_SHOP_ITEMS.filter(i => i.kind === 'furniture').map(i => i.id));
    expect(arquivos.filter(id => !furniture.has(id))).toEqual([]);
    for (const { id } of TODAS) expect(arquivos, id).toContain(id);
  });

  it('cada peça é a caixa do espaço × 3, sem deformar, com alfa real e dentro do teto de bytes', async () => {
    let total = 0;
    for (const { id, slot } of TODAS) {
      const arquivo = path.join(DIR, `${id}.png`);
      const box = DECOR_SLOTS[slot as keyof typeof DECOR_SLOTS];
      const m = await sharp(arquivo).metadata();
      expect([m.width, m.height], id).toEqual([box.w * K, box.h * K]);
      expect(m.hasAlpha, id).toBe(true);
      const { channels } = await sharp(arquivo).stats();
      const a = channels[channels.length - 1];
      expect(a.min, `${id}: sem pixel transparente`).toBe(0);
      expect(a.max, `${id}: sem pixel opaco`).toBeGreaterThan(200);
      const kb = fs.statSync(arquivo).size;
      expect(kb, id).toBeLessThanOrEqual(400 * 1024);
      total += kb;
    }
    expect(total).toBeLessThanOrEqual(1024 * 1024); // folga: ~0,8 MB hoje
  }, 60_000);

  it('o instalador é idempotente: lê só o PNG canônico da origem, nunca o arquivo já instalado', () => {
    const fonte = fs.readFileSync(path.resolve(__dirname, '../../tools/instalar-decor-refeitas.py'), 'utf8');
    expect(fonte).toMatch(/PNG canônico/);
    expect(fonte).toContain("os.path.join(origem, nome + '.png')");
    expect(fonte).not.toMatch(/Image\.open\(out\)/);
  });
});
