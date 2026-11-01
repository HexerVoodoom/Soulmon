import { describe, it, expect } from 'vitest';
import { BB_POOL, sortearBB } from './bbPool';
import { BB_POOL_ART } from './bbPoolArt';
import { VISUAL_ELEMENTS } from '../utils/combatFx';

describe('pool real de BBs (D30)', () => {
  it('280 BBs, ids únicos, um por elemento', () => {
    expect(BB_POOL).toHaveLength(280);
    expect(new Set(BB_POOL.map(b => b.id)).size).toBe(280);
    expect(new Set(BB_POOL.map(b => b.elemento)).size).toBe(280);
  });
  it('todo BB tem a arte instalada (chave do glob), e nada sobra', () => {
    for (const b of BB_POOL) expect(BB_POOL_ART[b.sprite], b.id).toBeTruthy();
    expect(Object.keys(BB_POOL_ART).sort()).toEqual(BB_POOL.map(b => b.sprite).sort());
  });
  it('todo elemento visual do oráculo casa com um BB do mesmo elemento', () => {
    for (const el of VISUAL_ELEMENTS) {
      const bb = sortearBB('qualquer-save', { elemento: el });
      expect(bb?.elemento, el).toBe(el);
    }
  });
  it('elemento fora do pool = fallback: qualquer BB, determinístico', () => {
    const a = sortearBB('save-x', { elemento: 'elemento-inexistente' });
    expect(a).not.toBeNull();
    expect(BB_POOL).toContain(a);
    expect(sortearBB('save-x', { elemento: 'elemento-inexistente' })).toBe(a);
  });
});
