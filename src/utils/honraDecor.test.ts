import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { TOURNAMENT_ITEMS, ALL_SHOP_ITEMS } from './shop';
import {
  HONRA_DECOR, HONRA_DECOR_PLANEJADA, HONRA_PRECO, HONRA_PRECO_TAPETE, MATERIAIS_HONRA, ARTE_DECOR_HONRA,
} from './honraDecor';
import { DECOR_ART } from './decorArt';
import { DECOR_SLOTS, SLOT_ORDER, decorFitsSetting } from './petStage';
import { DECOR_ART_SCALE } from './cosmeticosNovos';

const DECOR_DIR = path.resolve(__dirname, '../assets/decor');

describe('catálogo de Honra: decoração de combate (14–15/11/2026)', () => {
  it('o plano tem 75 peças: 24 armas + 16 estátuas + 16 chão + 4 manequins + 4 bigornas + 4 estandartes + 4 pedestais + 3 tapetes', () => {
    const por = (c: string) => HONRA_DECOR_PLANEJADA.filter(i => i.categoria === c).length;
    expect([por('arma'), por('estatua'), por('chao'), por('manequim'), por('bigorna'), por('estandarte'), por('pedestal'), por('tapete')])
      .toEqual([24, 16, 16, 4, 4, 4, 4, 3]);
    expect(HONRA_DECOR_PLANEJADA.length).toBe(75);
  });

  it('a escada de preço é 25 / 70 / 180 / 450 e o chão de arena (sem nível) custa 40', () => {
    expect(HONRA_PRECO).toEqual({ bronze: 25, prata: 70, ouro: 180, mithril: 450 });
    expect(HONRA_PRECO_TAPETE).toBe(40);
    for (const i of HONRA_DECOR_PLANEJADA) {
      const mat = MATERIAIS_HONRA.find(m => i.id.endsWith(`-${m}`));
      expect(i.price, i.id).toBe(mat ? HONRA_PRECO[mat] : HONRA_PRECO_TAPETE);
    }
  });

  it('id estável hon-<categoria>-<peça>-<material> e sem repetição', () => {
    const ids = HONRA_DECOR_PLANEJADA.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const i of HONRA_DECOR_PLANEJADA) expect(i.id, i.id).toMatch(/^hon-(arma|estatua|chao|manequim|bigorna|estandarte|pedestal|tapete)(-[a-z]+)+$/);
    // ids que já existem no jogo nunca são renomeados nem sobrepostos
    const antigos = TOURNAMENT_ITEMS.filter(i => !i.id.startsWith('hon-')).map(i => i.id);
    expect(antigos).toEqual([
      'furn-crate', 'furn-shelf-simple', 'furniture-champion-banner', 'furniture-medal-wall',
      'furniture-trophy-shelf', 'bg-arena-champion', 'furniture-podium', 'bg-arena-spotlight',
    ]);
  });

  it('toda peça instalada é cosmético puro de Honra, num espaço válido do palco', () => {
    expect(HONRA_DECOR.length).toBeGreaterThan(0);
    for (const i of HONRA_DECOR) {
      expect(i.kind, i.id).toBe('furniture');
      expect(i.currency, i.id).toBe('emblems');
      expect(i.attr, i.id).toBeUndefined();
      expect(i.unlock, i.id).toBeUndefined();
      expect(i.element, i.id).toBeUndefined();
      expect(DECOR_SLOTS[i.slot], i.id).toBeDefined();
      expect(i.fits, i.id).toBe('any');
      expect(decorFitsSetting(i.fits ?? 'any', 'outdoor') && decorFitsSetting(i.fits ?? 'any', 'indoor'), i.id).toBe(true);
      expect(i.namePt.length, i.id).toBeGreaterThan(2);
      expect(i.nameEn.length, i.id).toBeGreaterThan(2);
      expect(TOURNAMENT_ITEMS.find(t => t.id === i.id), i.id).toBeDefined();
      expect(ALL_SHOP_ITEMS.find(t => t.id === i.id && t.kind === 'furniture'), i.id).toBeDefined();
    }
  });

  it('espaços conforme o plano: arma e estandarte na parede (sem espaço novo), estátua e manequim à esquerda, bigorna e chão de arma à direita, pedestal na vitrine, tapete no chão', () => {
    const slotDe = (c: string) => [...new Set(HONRA_DECOR_PLANEJADA.filter(i => i.categoria === c).map(i => i.slot))];
    expect(slotDe('arma')).toEqual(['wall']);
    expect(slotDe('estandarte')).toEqual(['wall']);
    expect(slotDe('estatua')).toEqual(['floor-left']);
    expect(slotDe('manequim')).toEqual(['floor-left']);
    expect(slotDe('bigorna')).toEqual(['floor-right']);
    expect(slotDe('chao')).toEqual(['floor-right']);
    expect(slotDe('pedestal')).toEqual(['trophy']);
    expect(slotDe('tapete')).toEqual(['rug']);
    // a arma mora DENTRO do `wall`: o palco continua com os cinco espaços de sempre
    expect([...SLOT_ORDER].sort()).toEqual(['floor-left', 'floor-right', 'rug', 'trophy', 'wall']);
  });

  it('guard de asset: toda peça à venda tem arte, e todo arquivo hon-*.webp tem peça no catálogo', () => {
    for (const i of HONRA_DECOR) expect(DECOR_ART[i.id], `sem arte: ${i.id}`).toBeTruthy();
    const arquivos = fs.readdirSync(DECOR_DIR).filter(f => /^hon-.*\.webp$/.test(f)).map(f => f.replace(/\.webp$/, ''));
    const planejados = new Set(HONRA_DECOR_PLANEJADA.map(i => i.id));
    expect(arquivos.filter(id => !planejados.has(id)), 'arquivo órfão em assets/decor').toEqual([]);
    expect(Object.keys(ARTE_DECOR_HONRA).sort()).toEqual(arquivos.sort());
    expect(HONRA_DECOR.map(i => i.id).sort()).toEqual(arquivos.sort());
  });

  it('a arte instalada tem a caixa do espaço × 3 (× 2 no chão), como as outras decorações', async () => {
    for (const i of HONRA_DECOR) {
      const s = DECOR_SLOTS[i.slot];
      const k = DECOR_ART_SCALE(i.slot);
      const m = await sharp(path.join(DECOR_DIR, `${i.id}.webp`)).metadata();
      expect([m.width, m.height], i.id).toEqual([s.w * k, s.h * k]);
      expect(m.hasAlpha, i.id).toBe(true);
    }
  }, 60_000);

  it('a Serpente da Feira não vende estas peças (P6 em aberto): o espelho do servidor não as lista', () => {
    const fonte = fs.readFileSync(path.resolve(__dirname, '../../functions/api/_feiraLoja.js'), 'utf8');
    expect(fonte).not.toMatch(/'hon-/);
  });
});
