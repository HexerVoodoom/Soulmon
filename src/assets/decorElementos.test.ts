/**
 * As 20 decorações sem arte (4 ruínas + 16 de elemento), a lanterna refeita e o ícone `prism`
 * (REGISTRO §406, P9 opção (a)). Guard do que tools/instalar-decor-elementos.py promete.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { COSMETICOS_PLANEJADOS, COSMETICOS_NOVOS, DECOR_ART_SCALE } from '../utils/cosmeticosNovos';
import { DECOR_ART } from '../utils/decorArt';
import { materialIconSrc } from '../utils/materialIcons';
import { ALL_SHOP_ITEMS } from '../utils/shop';

const DIR = path.resolve(__dirname, 'decor');
const NOVAS = [
  'furn-ruinas-carro-engolido', 'furn-ruinas-placa-torta', 'furn-ruinas-asfalto-rachado', 'furn-ruinas-fiacao-com-musgo',
  ...['sombra', 'luz', 'vileza', 'morte', 'vida', 'vigor', 'marcial', 'tempo', 'som', 'gravidade', 'espaco', 'fada', 'industrial', 'planta', 'arcano', 'eletricidade']
    .map(e => `furn-el-${e}`),
];
const kb = (f: string) => fs.statSync(f).size;

describe('20 decorações novas, lanterna refeita e prism', () => {
  it('são 20 ids únicos, cada um peça do catálogo planejado, com arte registrada em DECOR_ART', () => {
    expect(new Set(NOVAS).size).toBe(20);
    for (const id of NOVAS) {
      const c = COSMETICOS_PLANEJADOS.find(p => p.id === id);
      expect(c, id).toBeDefined();
      expect(c!.kind, id).toBe('furn');
      expect(COSMETICOS_NOVOS.some(p => p.id === id), `${id} entra na loja`).toBe(true);
      expect(DECOR_ART[id], id).toBeTruthy();
    }
  });

  it('cada peça é a caixa do espaço × escala (3; 2 no tapete), com alfa real e teto de bytes', async () => {
    let total = 0;
    for (const id of NOVAS) {
      const c = COSMETICOS_PLANEJADOS.find(p => p.id === id)!;
      const arq = path.join(DIR, `${id}.webp`);
      const m = await sharp(arq).metadata();
      const k = DECOR_ART_SCALE(c.slot!);
      expect([m.format, m.width, m.height], id).toEqual(['webp', c.box!.w * k, c.box!.h * k]);
      expect(m.hasAlpha, id).toBe(true);
      const a = (await sharp(arq).stats()).channels[3];
      expect(a.min, `${id}: sem pixel transparente`).toBe(0);
      expect(a.max, `${id}: sem pixel opaco`).toBeGreaterThan(200);
      expect(kb(arq), id).toBeLessThanOrEqual(60 * 1024);
      total += kb(arq);
    }
    expect(total).toBeLessThanOrEqual(700 * 1024); // ~0,43 MB hoje
  }, 60_000);

  it('slots seguem o código: asfalto é tapete (13:2), fiação é parede, elementos alternam esquerdo/direito', () => {
    const slot = (id: string) => COSMETICOS_PLANEJADOS.find(p => p.id === id)!.slot;
    expect(slot('furn-ruinas-asfalto-rachado')).toBe('rug');
    expect(slot('furn-ruinas-fiacao-com-musgo')).toBe('wall');
    expect(slot('furn-ruinas-carro-engolido')).toBe('floor-left');
    expect(slot('furn-ruinas-placa-torta')).toBe('floor-right');
  });

  it('a lanterna troca a arte no mesmo id: 144×156 (canto direito ×3), PNG com alfa real, mesmo item da loja', async () => {
    const item = ALL_SHOP_ITEMS.find(i => i.id === 'furn-lantern')!;
    expect([item.slot, item.price]).toEqual(['floor-right', 330]);
    const arq = path.join(DIR, 'furn-lantern.png');
    const m = await sharp(arq).metadata();
    expect([m.width, m.height, m.hasAlpha]).toEqual([144, 156, true]);
    expect((await sharp(arq).stats()).channels[3].min).toBe(0);
    expect(kb(arq)).toBeLessThanOrEqual(400 * 1024);
    expect(DECOR_ART['furn-lantern']).toBeTruthy();
  });

  it('nenhum furn-*.webp órfão: todo arquivo é peça do catálogo planejado', () => {
    const ids = new Set(COSMETICOS_PLANEJADOS.map(c => c.id));
    const orfas = fs.readdirSync(DIR).filter(f => /^furn-.*\.webp$/.test(f)).map(f => f.slice(0, -5)).filter(id => !ids.has(id));
    expect(orfas).toEqual([]);
  });

  it('o catálogo planejado segue com os mesmos 109 ids (108 + o bg-el-queimada do §409) (nenhum preço, slot ou id inventado)', () => {
    expect(COSMETICOS_PLANEJADOS).toHaveLength(109);
    expect(COSMETICOS_PLANEJADOS.filter(c => c.kind === 'furn')).toHaveLength(44);
    expect(COSMETICOS_PLANEJADOS.find(c => c.id === 'furn-el-luz')!.price).toBe(500);
  });

  it('prism: 128×128 com alfa real e o material resolve a imagem em vez do emoji', async () => {
    const arq = path.resolve(__dirname, 'soulmon/icons/materiais/prism.webp');
    const m = await sharp(arq).metadata();
    expect([m.format, m.width, m.height, m.hasAlpha]).toEqual(['webp', 128, 128, true]);
    expect(kb(arq)).toBeLessThanOrEqual(30 * 1024);
    expect(materialIconSrc('prism')).toBeTruthy();
  });

  it('o instalador é idempotente: lê só o PNG canônico da origem, nunca o arquivo já instalado', () => {
    const f = fs.readFileSync(path.resolve(__dirname, '../../tools/instalar-decor-elementos.py'), 'utf8');
    expect(f).toContain("os.path.join(origem, id_ + '.png')");
    expect(f).toMatch(/PNG canônico/);
    expect(f).not.toMatch(/Image\.open\(out\)/);
  });
});
