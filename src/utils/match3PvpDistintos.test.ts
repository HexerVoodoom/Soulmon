import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { ELEMENT_VISUAL } from './elementVisual.data';
import { M3_PVP_MIN_DELTA_E, PVP_ELEMENT_COUNT, iconDeltaE, pvpElementPool, pvpElementsForSeed } from './match3Pvp';

describe('PVP do Elemental Fusion: ícones distintos', () => {
  it('a tabela de assinaturas cobre todo el-*.png', () => {
    const dir = resolve(__dirname, '../assets/soulmon/elementos');
    const ids = readdirSync(dir).filter(f => /^el-.+\.png$/.test(f)).map(f => f.slice(3, -4));
    expect(ids.filter(id => !(id in ELEMENT_VISUAL))).toEqual([]);
  });
  it('mesma semente = mesmos 6, sempre distintos', () => {
    expect(pvpElementsForSeed(4242)).toEqual(pvpElementsForSeed(4242));
    for (let sd = 1; sd <= 2000; sd++) {
      const els = pvpElementsForSeed(sd * 7919);
      expect(els).toHaveLength(PVP_ELEMENT_COUNT);
      expect(new Set(els).size).toBe(PVP_ELEMENT_COUNT);
    }
  });
  it('em 2000 sementes nenhum par fica abaixo do limiar ', () => {
    let relaxadas = 0;
    for (let sd = 1; sd <= 2000; sd++) {
      const els = pvpElementsForSeed(sd);
      let min = Infinity;
      for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) min = Math.min(min, iconDeltaE(els[i], els[j]));
      if (min < M3_PVP_MIN_DELTA_E) relaxadas++;
    }
    expect(relaxadas).toBe(0); // medido: 0 de 2000 relaxam com o limiar 15
  });
  it('o pool inclui mistos e as sementes os sorteiam', () => {
    const base = new Set(['fogo', 'agua', 'terra', 'ar', 'luz', 'sombra']);
    expect(pvpElementPool().some(e => !base.has(e))).toBe(true);
    let mistos = 0;
    for (let sd = 1; sd <= 100; sd++) mistos += pvpElementsForSeed(sd).filter(e => !pvpElementPool().slice(0, 0).includes(e) && !base.has(e)).length;
    expect(mistos).toBeGreaterThan(0);
  });
});
