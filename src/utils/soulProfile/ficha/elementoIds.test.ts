import { describe, it, expect } from 'vitest';
import { DERIVED_ELEMENT_PAIRS } from '../derivedElements';
import { CLASS_ELEMENT_ORDER } from '../types';
import { elementoConhecido } from './elementoNome';
import { elementoConhecidoLeve, IDS_DOS_PARES } from './elementoIds';

describe('elementoIds (lista leve de ids)', () => {
  it('é exatamente os ids de DERIVED_ELEMENT_PAIRS, na mesma ordem', () => {
    expect([...IDS_DOS_PARES]).toEqual(DERIVED_ELEMENT_PAIRS.map(d => d.id));
  });
  it('elementoConhecidoLeve bate com elementoConhecido', () => {
    for (const id of [...CLASS_ELEMENT_ORDER, ...DERIVED_ELEMENT_PAIRS.map(d => d.id), 'x', '', 'planta2', null, 3, undefined]) {
      expect(elementoConhecidoLeve(id)).toBe(elementoConhecido(id));
    }
  });
});
