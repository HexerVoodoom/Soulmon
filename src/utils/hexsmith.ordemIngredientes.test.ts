import { describe, it, expect } from 'vitest';
import { ingredienteRelevante, ordenarPorRelevancia, type IngredienteOrdenavel } from './hexsmith';

const rel = new Set(['terra']);

describe('ordem dos ingredientes (24/11/2026)', () => {
  it('poção e fragmento do elemento relevante são prioritários; Bits nunca', () => {
    expect(ingredienteRelevante({ tipo: 'pocao', elemento: 'terra' }, rel)).toBe(true);
    expect(ingredienteRelevante({ tipo: 'fragmento', elemento: 'terra' }, rel)).toBe(true);
    expect(ingredienteRelevante({ tipo: 'bits', elemento: 'terra' }, rel)).toBe(false);
    expect(ingredienteRelevante({ tipo: 'pocao', elemento: 'fogo' }, rel)).toBe(false);
    expect(ingredienteRelevante({ tipo: 'pocao' }, rel)).toBe(false);
  });

  it('os relevantes sobem ao topo, estável, sem mutar a entrada; Bits fica onde estava', () => {
    const itens: Array<IngredienteOrdenavel & { n: number }> = [
      { n: 1, tipo: 'bits' }, { n: 2, tipo: 'pocao', elemento: 'fogo' }, { n: 3, tipo: 'pocao', elemento: 'terra' },
      { n: 4, tipo: 'fragmento', elemento: 'terra' }, { n: 5, tipo: 'fragmento', elemento: 'agua' },
    ];
    const copia = [...itens];
    const out = ordenarPorRelevancia(itens, (i) => ingredienteRelevante(i, rel));
    expect(out.map((i) => i.n)).toEqual([3, 4, 1, 2, 5]);
    expect(itens).toEqual(copia);
  });

  it('sem nenhum relevante a ordem não muda', () => {
    expect(ordenarPorRelevancia([3, 1, 2], () => false)).toEqual([3, 1, 2]);
  });
});
