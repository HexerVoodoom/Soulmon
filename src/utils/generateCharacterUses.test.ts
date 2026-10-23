/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  MAX_GENERATE_CHARACTER_USES,
  generateCharacterUsed,
  generateCharacterUsesLeft,
  spendGenerateCharacterUse,
} from './generateCharacterUses';
import { STORAGE_KEYS } from './storageKeys';

describe('generateCharacterUses — 3 usos do botão "Gerar Soulmon"', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEYS.GENERATE_CHARACTER_USES);
  });

  it('nasce com 3 usos disponíveis e 0 gastos', () => {
    expect(MAX_GENERATE_CHARACTER_USES).toBe(3);
    expect(generateCharacterUsed()).toBe(0);
    expect(generateCharacterUsesLeft()).toBe(3);
  });

  it('gasta 1 uso por vez até zerar e nunca fica negativo', () => {
    expect(spendGenerateCharacterUse()).toBe(2);
    expect(generateCharacterUsesLeft()).toBe(2);
    expect(spendGenerateCharacterUse()).toBe(1);
    expect(spendGenerateCharacterUse()).toBe(0);
    expect(spendGenerateCharacterUse()).toBe(0);
    expect(generateCharacterUsed()).toBe(3);
  });

  it('lê de forma tolerante valores corrompidos ou fora da faixa', () => {
    localStorage.setItem(STORAGE_KEYS.GENERATE_CHARACTER_USES, 'lixo');
    expect(generateCharacterUsesLeft()).toBe(3);
    localStorage.setItem(STORAGE_KEYS.GENERATE_CHARACTER_USES, '-5');
    expect(generateCharacterUsesLeft()).toBe(3);
    localStorage.setItem(STORAGE_KEYS.GENERATE_CHARACTER_USES, '99');
    expect(generateCharacterUsesLeft()).toBe(0);
  });
});
