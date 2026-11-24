// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { favoritesFirst, toggleFavorite, readPotionFavorites, writePotionFavorites, POTION_FAVORITES_KEY } from './potionFavorites';

describe('potionFavorites', () => {
  beforeEach(() => { try { localStorage.removeItem(POTION_FAVORITES_KEY); } catch { /* sem DOM */ } });
  it('toggle liga e desliga sem mutar', () => {
    const a = new Set<string>();
    const b = toggleFavorite(a, 'fogo');
    expect(a.size).toBe(0);
    expect([...b]).toEqual(['fogo']);
    expect(toggleFavorite(b, 'fogo').size).toBe(0);
  });
  it('favoritas no topo, ordem estável', () => {
    const l = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    expect(favoritesFirst(l, new Set(['d', 'b'])).map(x => x.id)).toEqual(['b', 'd', 'a', 'c']);
    expect(favoritesFirst(l, new Set()).map(x => x.id)).toEqual(['a', 'b', 'c', 'd']);
  });
  it('lê lixo como vazio e ignora não-strings', () => {
    expect(readPotionFavorites().size).toBe(0);
    writePotionFavorites(new Set(['agua']));
    expect([...readPotionFavorites()]).toEqual(['agua']);
  });
});
