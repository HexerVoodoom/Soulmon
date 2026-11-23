import { describe, it, expect } from 'vitest';
import { LIFE_AREAS, LIFE_AREA_LABEL } from '../types/categories';
import { categoryExample, CATEGORY_EXAMPLES } from './categoryExamples';

describe('categoryExample', () => {
  it('toda categoria tem exemplo PT e EN', () => {
    for (const id of LIFE_AREAS) {
      expect(CATEGORY_EXAMPLES[id].pt.length).toBeGreaterThan(3);
      expect(CATEGORY_EXAMPLES[id].en.length).toBeGreaterThan(3);
    }
  });
  it('prefixa Exemplo/Example e cai em corpo sem categoria', () => {
    expect(categoryExample('mente', true)).toBe('Exemplo: Meditar 10 minutos');
    expect(categoryExample('mente', false)).toBe('Example: Meditate 10 minutes');
    expect(categoryExample(undefined, false)).toBe('Example: Walk 20 minutes');
  });
});

describe('Focus & Work', () => {
  it('rótulo junta foco e trabalho; id foco segue aceito', () => {
    expect(LIFE_AREA_LABEL.foco).toEqual({ pt: 'Foco e Trabalho', en: 'Focus & Work' });
  });
});
