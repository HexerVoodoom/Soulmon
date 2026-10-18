import { describe, expect, it } from 'vitest';
import { FORGE_MAX_LEVEL, FORGE_PIECES } from './forge';
import { equipArtNames } from './equipArt';
import { LEVELS_PER_VISUAL_TIER, VISUAL_TIERS, forgeArtName, visualTier } from './forgeVisual';

describe('visual do Soulsmith por nível', () => {
  it('troca a cada 3 níveis: 1–3 cobre, 4–6 bronze, 7–9 prata, 10–12 dourado, 13–15 prismático', () => {
    expect([1, 3, 4, 6, 7, 9, 10, 12, 13, 15].map(visualTier)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
    expect(VISUAL_TIERS.length * LEVELS_PER_VISUAL_TIER).toBe(FORGE_MAX_LEVEL);
  });
  it('nível 0/absurdo é preso; o degrau 1 é o PNG original', () => {
    expect(visualTier(0)).toBe(1);
    expect(visualTier(99)).toBe(5);
    expect(forgeArtName('eq-nucleo-t1', 2)).toBe('eq-nucleo-t1');
    expect(forgeArtName('eq-nucleo-t1', 4)).toBe('eq-nucleo-t1-n2');
  });
  it('toda peça, em todos os níveis, tem arte instalada', () => {
    const have = new Set(equipArtNames());
    for (const p of FORGE_PIECES) for (let l = 1; l <= FORGE_MAX_LEVEL; l++) expect(have.has(forgeArtName(p.id, l)), `${p.id} nv ${l}`).toBe(true);
  });
});
