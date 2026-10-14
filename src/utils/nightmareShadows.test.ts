import { describe, it, expect } from 'vitest';
import { SHADOW_SLOTS, SHADOW_ART, shadowSource, shadowRect, shadowEyes } from './nightmareShadows';
import { DUNGEON_LINE_SPRITES, DUNGEON_LINE_NAMES } from './sprites';

describe('as sombras do Pesadelo', () => {
  it('são 12 slots (4 degraus × 3 variantes), ids únicos no padrão da arte pedida', () => {
    expect(SHADOW_SLOTS).toHaveLength(4);
    const ids = SHADOW_SLOTS.flat().map(s => s.id);
    expect(ids).toEqual(['1', '1b', '1c', '2', '2b', '2c', '3', '3b', '3c', '4', '4b', '4c']);
    expect(new Set(ids).size).toBe(12);
  });
  it('só Solmons PRÓPRIOS (as 9 linhas da casa) e cada sprite existe', () => {
    for (const s of SHADOW_SLOTS.flat()) {
      expect(Object.keys(DUNGEON_LINE_NAMES), s.id).toContain(s.line);
      expect(DUNGEON_LINE_SPRITES[s.line][s.stage], s.id).toBeTruthy();
    }
  });
  it('sem arte instalada, vale o placeholder; com arte, a arte vence', () => {
    expect(Object.keys(SHADOW_ART).sort()).toEqual(SHADOW_SLOTS.flat().map(x=>x.id).sort());
    const p = shadowSource(0, 0);
    expect(p.art).toBe(true);
    expect(p.src).toBe(SHADOW_ART['1']);
    // índices absurdos não quebram o jogo
    expect(shadowSource(99, 99).id).toBe('4c');
    expect(shadowSource(-1, NaN).id).toBe('1');
  });
  it('o placeholder fica DENTRO da caixa de colisão e encostado no chão', () => {
    const cases: Array<[number, [number, number], number]> = [[38, [4 / 128, 124 / 128], 1 / 128], [50, [40 / 128, 88 / 128], 1 / 128], [56, [1 / 128, 127 / 128], 38 / 128]];
    for (const [size, hit, top] of cases) {
      const r = shadowRect(size, hit, top, 1);
      expect(r.x).toBeGreaterThanOrEqual(hit[0] * size - 1e-6);
      expect(r.x + r.w).toBeLessThanOrEqual(hit[1] * size + 1e-6);
      expect(r.y).toBeGreaterThanOrEqual(top * size - 1e-6);
      expect(r.y + r.h).toBeCloseTo(size, 6);
    }
  });
  it('dois olhos, dentro da silhueta, na parte alta', () => {
    const r = shadowRect(44, [6 / 128, 121 / 128], 1 / 128, 1);
    const [a, b] = shadowEyes(r);
    expect(a.x).toBeLessThan(b.x);
    for (const e of [a, b]) { expect(e.x).toBeGreaterThan(r.x); expect(e.x).toBeLessThan(r.x + r.w); expect(e.y).toBeLessThan(r.y + r.h / 2); }
  });
});
