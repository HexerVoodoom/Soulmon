import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { FRAMES, FRAME_ART, FRAME_ART_CANVAS, frameArt } from '../utils/frames';
import { ACTIVITY_CATALOG } from '../data/activityCatalog';
import { PET_PASSIVES } from '../utils/passives';
import { ACTIVITY_ICON_ART, PASSIVE_ICON_ART, REPORT_HEAD_ART, STATUS_ICON_ART } from './soulmon/icones-ui/interacao';
import { QUEST_ART } from './soulmon/icones-ui';
import { especialCargaArt } from '../components/games/TorcidaKit';

// ===========================================================================
// Instalação da arte do dono de 04/10/2026 (marca, molduras, quest, carga do
// especial, ícones de interação). Os mapas são glob — o nome do arquivo É a
// chave —, então o que este guard cobra é o 1:1 entre catálogo e pasta e o
// formato que o componente assume (o canvas normalizado das molduras).
// ===========================================================================

const ASSETS = path.resolve(__dirname);
const ls = (dir: string) => fs.readdirSync(path.join(ASSETS, dir)).filter(f => f.endsWith('.png')).map(f => f.replace(/\.png$/, '')).sort();

describe('molduras — FRAMES ↔ FRAME_ART ↔ assets/soulmon/molduras', () => {
  it('toda moldura do catálogo tem arte, e nenhuma arte sem moldura', () => {
    expect(Object.keys(FRAME_ART).sort()).toEqual(FRAMES.map(f => f.id).sort());
    expect(ls('soulmon/molduras')).toEqual(FRAMES.map(f => f.id).sort());
  });
  it('id inventado não ganha arte (o AvatarFrame cai no anel CSS)', () => {
    expect(frameArt('nao-existe')).toBeUndefined();
  });
  it('todas no canvas normalizado (a conta do AvatarFrame é uma só), alfa real binário', async () => {
    for (const id of ls('soulmon/molduras')) {
      const f = path.join(ASSETS, 'soulmon/molduras', `${id}.png`);
      const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect([info.width, info.height], id).toEqual([FRAME_ART_CANVAS, FRAME_ART_CANVAS]);
      let semi = 0, centroOpaco = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0 && data[i] < 255) semi++;
      // a abertura (96² centrada) é vazia: o miolo 64² não tem pixel opaco
      const c0 = FRAME_ART_CANVAS / 2 - 32;
      for (let y = c0; y < c0 + 64; y++) for (let x = c0; x < c0 + 64; x++) if (data[(y * info.width + x) * 4 + 3]) centroOpaco++;
      expect(semi, `${id}: névoa semitransparente`).toBe(0);
      expect(centroOpaco, `${id}: pixel opaco dentro da abertura`).toBe(0);
    }
  });
});

describe('ícones de interação (ui-*) — mapas ↔ catálogos', () => {
  it('toda chave de ACTIVITY_ICON_ART é um id do ACTIVITY_CATALOG (23 de 28)', () => {
    const ids = new Set(ACTIVITY_CATALOG.map(a => a.id));
    const chaves = Object.keys(ACTIVITY_ICON_ART);
    expect(chaves.filter(k => !ids.has(k))).toEqual([]);
    expect(chaves).toHaveLength(23);
  });
  it('toda passiva do jogo tem arte', () => {
    expect(PET_PASSIVES.filter(p => !PASSIVE_ICON_ART[p.id]).map(p => p.id)).toEqual([]);
  });
  it('peças avulsas resolvem', () => {
    for (const url of [...Object.values(REPORT_HEAD_ART), ...Object.values(STATUS_ICON_ART), QUEST_ART]) expect(typeof url).toBe('string');
  });
});

describe('carga do especial — 3 estados pela fração da barra', () => {
  it('vazio em 0, meio entre 0 e 1, cheio em 1', () => {
    expect(especialCargaArt(0)).toMatch(/especial-carga-0-vazio/);
    expect(especialCargaArt(0.5)).toMatch(/especial-carga-1-meio/);
    expect(especialCargaArt(1)).toMatch(/especial-carga-2-cheio/);
  });
});
