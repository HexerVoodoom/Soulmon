import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { TOURNAMENT_ITEMS, ALL_SHOP_ITEMS } from './shop';
import {
  HONRA_DECOR, HONRA_DECOR_PLANEJADA, HONRA_PRECO, HONRA_PRECO_TAPETE, MATERIAIS_HONRA, MATERIAIS_CRISTAL, ARTE_DECOR_HONRA,
  HONRA_PRECO_CRISTAL_TURQUESA, HONRA_PRECO_CRISTAL_IRISDESCENTE,
} from './honraDecor';
import { DECOR_ART } from './decorArt';
import { DECOR_SLOTS, SLOT_ORDER, decorFitsSetting } from './petStage';
import { DECOR_ART_SCALE } from './cosmeticosNovos';

const DECOR_DIR = path.resolve(__dirname, '../assets/decor');

describe('catálogo de Honra: decoração de combate (14–15/11/2026)', () => {
  it('o plano tem 83 peças: 75 de bronze a mithril + 8 armas de cristal (as outras de cristal entram quando o PNG existir)', () => {
    const por = (c: string) => HONRA_DECOR_PLANEJADA.filter(i => i.categoria === c).length;
    // 24 armas de metal + 8 de cristal = 32; o resto é a conta de sempre
    expect([por('arma'), por('estatua'), por('chao'), por('manequim'), por('bigorna'), por('estandarte'), por('pedestal'), por('tapete')])
      .toEqual([32, 16, 16, 4, 4, 4, 4, 3]);
    expect(HONRA_DECOR_PLANEJADA.length).toBe(83); // a contagem É a regra: 75 + 8
    expect(HONRA_DECOR_PLANEJADA.filter(i => /-cristal-/.test(i.id)).length).toBe(8);
  });

  it('a escada de preço é 25 / 70 / 180 / 450 e acima do mithril o cristal custa 700 (turquesa) e 1100 (irisdescente); chão de arena 40', () => {
    expect(HONRA_PRECO).toEqual({
      bronze: 25, prata: 70, ouro: 180, mithril: 450, 'cristal-turquesa': 700, 'cristal-irisdescente': 1100,
    });
    expect([HONRA_PRECO_CRISTAL_TURQUESA, HONRA_PRECO_CRISTAL_IRISDESCENTE]).toEqual([700, 1100]);
    expect(HONRA_PRECO['cristal-turquesa']).toBeGreaterThan(HONRA_PRECO.mithril);
    expect(HONRA_PRECO['cristal-irisdescente']).toBeGreaterThan(HONRA_PRECO['cristal-turquesa']);
    expect(HONRA_PRECO_TAPETE).toBe(40);
    for (const i of HONRA_DECOR_PLANEJADA) {
      const mat = [...MATERIAIS_HONRA, ...MATERIAIS_CRISTAL].find(m => i.id.endsWith(`-${m}`));
      expect(i.price, i.id).toBe(mat ? HONRA_PRECO[mat] : HONRA_PRECO_TAPETE);
    }
  });

  it('as 8 armas de cristal: parede, cosmético puro, ids e nomes EN primeiro + PT-BR', () => {
    const cristal = HONRA_DECOR_PLANEJADA.filter(i => /-cristal-/.test(i.id));
    expect(cristal.map(i => i.id).sort()).toEqual(
      ['espada', 'lanca', 'escudo', 'cajado'].flatMap(p => ['turquesa', 'irisdescente'].map(v => `hon-arma-${p}-cristal-${v}`)).sort());
    for (const i of cristal) { expect(i.slot, i.id).toBe('wall'); expect(i.categoria, i.id).toBe('arma'); }
    const por = Object.fromEntries(cristal.map(i => [i.id, i]));
    expect(por['hon-arma-espada-cristal-turquesa'].nameEn).toBe('Crystal Sword · Turquoise');
    expect(por['hon-arma-espada-cristal-turquesa'].namePt).toBe('Espada de cristal · turquesa');
    expect(por['hon-arma-cajado-cristal-irisdescente'].nameEn).toBe('Crystal Staff · Iridescent');
    expect(por['hon-arma-cajado-cristal-irisdescente'].namePt).toBe('Cajado de cristal · irisdescente');
    expect(por['hon-arma-escudo-cristal-turquesa'].price).toBe(700);
    expect(por['hon-arma-lanca-cristal-irisdescente'].price).toBe(1100);
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

  it('ouro e cristal entram sozinhos: as 83 peças planejadas têm arte e estão à venda', () => {
    expect(HONRA_DECOR.length).toBe(83);
    expect(HONRA_DECOR.filter(i => /-ouro$/.test(i.id)).length).toBe(18);
    expect(HONRA_DECOR.filter(i => /-cristal-/.test(i.id)).length).toBe(8);
    expect(HONRA_DECOR_PLANEJADA.filter(i => !ARTE_DECOR_HONRA[i.id]).map(i => i.id)).toEqual([]);
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
