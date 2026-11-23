import { describe, it, expect } from 'vitest';
import { tallyEssences, essenceLedgerRows, essenceIconSrc } from './resultEssences';

describe('essências do resultado', () => {
  it('soma por id na ordem da primeira aparição e descarta lixo', () => {
    expect(tallyEssences([{ id: 'fogo', qty: 1 }, undefined, { id: 'agua', qty: 2 }, { id: 'fogo', qty: 3 }, { id: 'x', qty: 0 }, { id: '', qty: 4 }, null]))
      .toEqual([{ id: 'fogo', qty: 4 }, { id: 'agua', qty: 2 }]);
  });
  it('vira linhas "essence" do livro, uma por elemento', () => {
    expect(essenceLedgerRows([{ id: 'fogo', qty: 1 }, { id: 'fogo', qty: 2 }])).toEqual([{ key: 'essence-fogo', kind: 'essence', id: 'fogo', qty: 3 }]);
    expect(essenceLedgerRows([])).toEqual([]);
  });
  it('ícone: o do elemento; o pesadelo tem o seu', () => {
    expect(typeof essenceIconSrc('pesadelo')).toBe('string');
  });
});
