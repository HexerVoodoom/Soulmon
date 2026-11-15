import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { COSMETICOS_PLANEJADOS, COSMETICOS_NOVOS, DECOR_ART_SCALE } from './cosmeticosNovos';
import { ALL_SHOP_ITEMS } from './shop';
import { FRAMES } from './frames';
import { PET_BACKGROUNDS } from './backgrounds';
import { DECOR_ART } from './decorArt';
import { DECOR_SLOTS } from './petStage';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { petHasElement } from './elementExclusive';
// @ts-expect-error módulo JS do servidor
import { FRAME_IDS } from '../../functions/api/_frames.js';

const A = path.join(process.cwd(), 'src/assets');

describe('cosméticos novos (temas e elementos, 04/11/2026)', () => {
  it('planejadas: 33 cenários (32 + o `bg-el-queimada` do §408), 32 molduras, 44 decorações, ids únicos', () => {
    const n = (k: string) => COSMETICOS_PLANEJADOS.filter(c => c.kind === k).length;
    expect([n('bg'), n('frame'), n('furn')]).toEqual([33, 32, 44]);
    expect(new Set(COSMETICOS_PLANEJADOS.map(c => c.id)).size).toBe(109);
  });
  it('§408: fogo+planta (`queimada`) tem cenário próprio exclusivo, preço dos `bg-el-*`, arte instalada e id único', () => {
    const c = COSMETICOS_NOVOS.find(x => x.id === 'bg-el-queimada');
    expect(c, 'arte instalada').toBeDefined();
    expect([c!.kind, c!.element, c!.price]).toEqual(['bg', 'queimada', 720]);
    expect(c!.price).toBe(COSMETICOS_PLANEJADOS.find(x => x.id === 'bg-el-fogo')!.price);
    expect(COSMETICOS_PLANEJADOS.filter(x => x.id === 'bg-el-queimada')).toHaveLength(1);
    expect(DERIVED_ELEMENT_PAIRS.find(d => d.id === 'queimada')!.componentes).toEqual(['planta', 'fogo']);
    expect(petHasElement('queimada', 'queimada')).toBe(true);
    expect(petHasElement('queimada', 'fogo')).toBe(false);
    // o id antigo do vulcão segue intacto (saves de quem comprou); o bosque real troca só a arte dele
    expect(COSMETICOS_NOVOS.some(x => x.id === 'bg-cerejeira-bosque-de-cerejeiras')).toBe(true);
  });
  it('só as peças com arte entram no jogo, e todas as instaladas têm nome PT/EN, descrição e preço', () => {
    expect(COSMETICOS_NOVOS.length).toBeGreaterThan(0);
    for (const c of COSMETICOS_NOVOS) {
      expect(c.namePt && c.nameEn && c.descPt && c.descEn, c.id).toBeTruthy();
      expect(c.price, c.id).toBeGreaterThan(0);
    }
  });
  it('cenário: item na loja + PET_BACKGROUNDS com chão em 74% e baseColor; exclusivo de elemento carrega `element`', () => {
    for (const c of COSMETICOS_NOVOS.filter(x => x.kind === 'bg')) {
      expect(ALL_SHOP_ITEMS.find(i => i.id === c.id)?.kind, c.id).toBe('bg');
      expect(ALL_SHOP_ITEMS.find(i => i.id === c.id)?.element, c.id).toBe(c.element);
      expect(PET_BACKGROUNDS[c.id].horizonY, c.id).toBe(74);
      expect(PET_BACKGROUNDS[c.id].baseColor, c.id).toMatch(/^#[0-9a-f]{6}$/);
      expect(fs.existsSync(path.join(A, 'backgrounds/thumbs', `${c.id}.png`)), `${c.id}: miniatura`).toBe(true);
    }
  });
  it('cenário: arte 1200×648 WebP', async () => {
    for (const c of COSMETICOS_NOVOS.filter(x => x.kind === 'bg')) {
      const m = await sharp(path.join(A, 'backgrounds', `${c.id}.webp`)).metadata();
      expect([m.format, m.width, m.height], c.id).toEqual(['webp', 1200, 648]);
    }
  });
  it('moldura: está em FRAMES (loja, com `element` quando exclusiva) e na lista do servidor', () => {
    for (const c of COSMETICOS_NOVOS.filter(x => x.kind === 'frame')) {
      const f = FRAMES.find(x => x.id === c.id);
      expect(f?.origin, c.id).toBe('shop');
      expect(f?.element, c.id).toBe(c.element);
      expect(FRAME_IDS.has(c.id), `${c.id}: functions/api/_frames.js`).toBe(true);
    }
  });
  it('decoração: item no slot certo, arte no mapa e do tamanho da caixa × escala', async () => {
    for (const c of COSMETICOS_NOVOS.filter(x => x.kind === 'furn')) {
      const item = ALL_SHOP_ITEMS.find(i => i.id === c.id)!;
      expect(item.kind, c.id).toBe('furniture');
      expect(item.slot, c.id).toBe(c.slot);
      expect(DECOR_ART[c.id], c.id).toBeTruthy();
      const slot = DECOR_SLOTS[c.slot!];
      expect([c.box!.w, c.box!.h], `${c.id}: caixa do contrato = DECOR_SLOTS`).toEqual([slot.w, slot.h]);
      const m = await sharp(path.join(A, 'decor', `${c.id}.webp`)).metadata();
      expect([m.width, m.height], c.id).toEqual([c.box!.w * DECOR_ART_SCALE(c.slot!), c.box!.h * DECOR_ART_SCALE(c.slot!)]);
      expect(m.hasAlpha, c.id).toBe(true);
    }
  });
});
