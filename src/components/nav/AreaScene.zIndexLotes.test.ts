import { describe, expect, it } from 'vitest';
import { lotZIndex } from './AreaScene';

/** QA L06-12: o rótulo do lote de cima era coberto pela arte do vizinho de baixo. */
describe('lotZIndex — o lote mais alto fica por cima', () => {
  it('quanto menor o top, maior o z-index', () => {
    expect(lotZIndex('20%')).toBeGreaterThan(lotZIndex('50%'));
    expect(lotZIndex('50%')).toBeGreaterThan(lotZIndex('78%'));
  });
  it('aceita número e px; sem top legível cai em 1; nunca abaixo de 1', () => {
    expect(lotZIndex(30)).toBe(lotZIndex('30%'));
    expect(lotZIndex(undefined)).toBe(1);
    expect(lotZIndex('auto')).toBe(1);
    expect(lotZIndex('5000%')).toBe(1);
  });
});
