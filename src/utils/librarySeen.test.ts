// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { readSeenIds, addSeenId, markSeenId } from './librarySeen';
import { STORAGE_KEYS } from './storageKeys';
import { opponentElementFor, visualElementFor } from './combatFx';

describe('librarySeen: oponente enfrentado (simulado ou real) entra nos vistos', () => {
  beforeEach(() => { localStorage.clear(); });
  it('marca uma vez só (idempotente) e preserva a ordem', () => {
    markSeenId('abc12345'); markSeenId('abc12345'); markSeenId('zzz99999');
    expect(readSeenIds()).toEqual(['abc12345', 'zzz99999']);
  });
  it('ignora id vazio e tolera lixo no storage', () => {
    markSeenId(''); markSeenId(undefined);
    expect(readSeenIds()).toEqual([]);
    localStorage.setItem(STORAGE_KEYS.LIBRARY_SEEN, '{"x":1}');
    expect(readSeenIds()).toEqual([]);
    localStorage.setItem(STORAGE_KEYS.LIBRARY_SEEN, JSON.stringify(['a', 3, null, 'b']));
    expect(readSeenIds()).toEqual(['a', 'b']);
  });
  it('addSeenId devolve a mesma referência se já visto', () => {
    const l = ['a']; expect(addSeenId(l, 'a')).toBe(l); expect(addSeenId(l, 'b')).toEqual(['a', 'b']);
  });
  it('elemento do oponente: o publicado vence; sem ele, o determinístico pelo id', () => {
    expect(opponentElementFor({ id: 'p1', element: 'planta' })).toBe('planta');
    expect(opponentElementFor({ id: 'p1', element: null })).toBe(visualElementFor('p1'));
    expect(opponentElementFor({ id: 'p1', element: 'Inválido!' })).toBe(visualElementFor('p1'));
  });
});
