import { describe, it, expect } from 'vitest';
import { soulmonDisplayName } from './petName';

describe('soulmonDisplayName — o batismo nunca apaga o save antigo', () => {
  it('save antigo (só baseName) segue mostrando o nome do oráculo', () => {
    expect(soulmonDisplayName({ baseName: 'Kaelen' })).toBe('Kaelen');
  });

  it('batizado ganha o nome escolhido', () => {
    expect(soulmonDisplayName({ baseName: 'Kaelen', petName: 'Farofa' })).toBe('Farofa');
  });

  it('batismo em branco ou só espaços conta como ausente', () => {
    expect(soulmonDisplayName({ baseName: 'Kaelen', petName: '   ' })).toBe('Kaelen');
    expect(soulmonDisplayName({ baseName: 'Kaelen', petName: '' })).toBe('Kaelen');
  });

  it('sem meta nenhuma devolve string vazia, nunca "undefined" na tela', () => {
    expect(soulmonDisplayName(undefined)).toBe('');
    expect(soulmonDisplayName(null)).toBe('');
    expect(soulmonDisplayName({})).toBe('');
  });
});
