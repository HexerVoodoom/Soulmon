import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { ELEMENT_VISUAL } from './elementVisual.data';
import { M3_MIN_DELTA_E, m3DeltaE, m3ParProibido } from './match3Cores';
import { MIXED_ELEMENT_COUNT, mixedElementPool, mixedElementsForSeed } from './match3Pvp';

describe('PVP do Elemental Fusion: ícones distintos', () => {
  it('a tabela de assinaturas cobre todo el-*.png', () => {
    const dir = resolve(__dirname, '../assets/soulmon/elementos');
    const ids = readdirSync(dir).filter(f => /^el-.+\.png$/.test(f)).map(f => f.slice(3, -4));
    expect(ids.filter(id => !(id in ELEMENT_VISUAL))).toEqual([]);
  });
  it('mesma semente = mesmos 6, sempre distintos', () => {
    expect(mixedElementsForSeed(4242)).toEqual(mixedElementsForSeed(4242));
    for (let sd = 1; sd <= 2000; sd++) {
      const els = mixedElementsForSeed(sd * 7919);
      expect(els).toHaveLength(MIXED_ELEMENT_COUNT);
      expect(new Set(els).size).toBe(MIXED_ELEMENT_COUNT);
    }
  });
  it('em 2000 sementes nenhum par fica abaixo do limiar ', () => {
    let relaxadas = 0;
    for (let sd = 1; sd <= 2000; sd++) {
      const els = mixedElementsForSeed(sd);
      let min = Infinity;
      for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) min = Math.min(min, m3DeltaE(els[i], els[j]));
      if (min < M3_MIN_DELTA_E) relaxadas++;
    }
    expect(relaxadas).toBe(0); // medido: 0 de 20000 relaxam com o limiar 24
  });
  it('em 2000 sementes nenhum par da lista curada divide tabuleiro', () => {
    for (let sd = 1; sd <= 2000; sd++) {
      const els = mixedElementsForSeed(sd);
      for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) expect(m3ParProibido(els[i], els[j])).toBe(false);
    }
  });
  it('o pool inclui mistos e as sementes os sorteiam', () => {
    const base = new Set(['fogo', 'agua', 'terra', 'ar', 'luz', 'sombra']);
    expect(mixedElementPool().some(e => !base.has(e))).toBe(true);
    let mistos = 0;
    for (let sd = 1; sd <= 100; sd++) mistos += mixedElementsForSeed(sd).filter(e => !mixedElementPool().slice(0, 0).includes(e) && !base.has(e)).length;
    expect(mistos).toBeGreaterThan(0);
  });
});
