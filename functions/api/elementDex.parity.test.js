import { describe, it, expect } from 'vitest';
import * as server from './_elementDex.js';
import { ELEMENT_DEX_MAX, sanitizeDefeatedElements } from '../../src/utils/elementDex';

describe('dex de elementos: servidor e app', () => {
  it('mantém o mesmo teto', () => {
    expect(server.ELEMENT_DEX_MAX).toBe(ELEMENT_DEX_MAX);
  });
  it('higieniza entradas boas e hostis da mesma forma', () => {
    const cases = [[], ['fogo', 'lava'], ['fogo', 'fogo'], ['Fogo', 'a', 'x'.repeat(30), 3, null, 'ok_id'],
      Array.from({ length: 300 }, (_, i) => `e${String.fromCharCode(97 + (i % 26))}${String.fromCharCode(97 + Math.floor(i / 26))}`)];
    for (const value of cases) expect(server.sanitizeDefeatedElements(value), JSON.stringify(value).slice(0, 80)).toEqual(sanitizeDefeatedElements(value));
  });
  it('sem lista, o servidor descarta e o cliente devolve vazio', () => {
    for (const v of [null, 5, 'fogo', {}]) {
      expect(server.sanitizeDefeatedElements(v)).toBeUndefined();
      expect(sanitizeDefeatedElements(v)).toEqual([]);
    }
  });
});
