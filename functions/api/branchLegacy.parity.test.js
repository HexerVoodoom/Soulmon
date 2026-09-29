import { describe, it, expect } from 'vitest';
import { legacyFormIdOf } from './_branchLegacy.js';
import { newFormIdToLegacy } from '../../src/utils/branchMigration';

// Paridade servidor × app do mapeamento de ids de forma renomeados em
// 29/09/2026 (footgun 9): o servidor lê a chave KV antiga pelo MESMO id que o
// app migra no save.
describe('_branchLegacy.js × branchMigration.ts', () => {
  it('mesmo id antigo para cada forma nova', () => {
    for (const t of ['champion', 'ultimate', 'mega']) {
      for (const b of ['power', 'harmony', 'benevolence']) {
        expect(legacyFormIdOf(`${t}-${b}`)).toBe(newFormIdToLegacy(`${t}-${b}`));
        expect(legacyFormIdOf(`${t}-${b}`)).not.toBeNull();
      }
    }
    expect(legacyFormIdOf('rookie')).toBeNull();
    expect(legacyFormIdOf('ultra')).toBeNull();
    expect(legacyFormIdOf(42)).toBeNull();
  });
});
