import { describe, it, expect } from 'vitest';
import * as srv from './_duelInvites.js';
import * as app from '../../src/utils/duelInvites';

const NOW = Date.UTC(2026, 10, 16, 12);
const MIN = 60_000;

describe('convites de duelo: servidor e app concordam', () => {
  it('mesmas constantes', () => {
    expect(srv.DUEL_INVITE_MAX).toBe(app.DUEL_INVITE_MAX);
    expect(srv.DUEL_INVITE_INITIAL).toBe(app.DUEL_INVITE_INITIAL);
    expect(srv.DUEL_INVITE_MIN_GAP_MS).toBe(app.DUEL_INVITE_MIN_GAP_MS);
  });
  it('mesma saneação em entradas boas e hostis', () => {
    const casos = [null, undefined, 3, 'x', [], {}, { n: 'a' }, { n: 99, at: 5 }, { n: -2, at: -1 }, { n: 3.9, at: 7.8 }, { n: NaN }, { n: 2, at: NaN }];
    for (const c of casos) expect(srv.sanitizeDuelInvites(c), JSON.stringify(c)).toEqual(app.sanitizeDuelInvites(c));
  });
});

describe('servidor: anti-trapaça dos convites', () => {
  it('gasto só desce e passa', () => {
    expect(srv.enforceDuelInvites({ n: 3, at: 0 }, { n: 5, at: 100 }, NOW)).toEqual({ n: 3, at: 100 });
  });
  it('sem gravado vale o estoque inicial 7: só dá para descer', () => {
    expect(srv.enforceDuelInvites({ n: 6, at: 0 }, undefined, NOW)).toEqual({ n: 6, at: 0 });
    expect(srv.enforceDuelInvites({ n: 7, at: NOW }, undefined, NOW)).toEqual({ n: 7, at: 0 });
  });
  it('aumento sem carimbo novo é recusado (editar o JSON não enche o estoque)', () => {
    expect(srv.enforceDuelInvites({ n: 7, at: 100 }, { n: 0, at: 100 }, NOW)).toEqual({ n: 0, at: 100 });
    expect(srv.enforceDuelInvites({ n: 7, at: 100 + MIN }, { n: 0, at: 100 }, NOW)).toEqual({ n: 0, at: 100 });
  });
  it('troca legítima (carimbo novo, depois da folga) entra, no teto de 7', () => {
    expect(srv.enforceDuelInvites({ n: 5, at: NOW }, { n: 0, at: NOW - 10 * MIN }, NOW)).toEqual({ n: 5, at: NOW });
    expect(srv.enforceDuelInvites({ n: 99, at: NOW }, { n: 0, at: 0 }, NOW)).toEqual({ n: 7, at: NOW });
  });
  it('relógio adiantado mais de 1 dia não vale; omitir mantém o gravado', () => {
    expect(srv.enforceDuelInvites({ n: 7, at: NOW + 3 * 86_400_000 }, { n: 0, at: 0 }, NOW)).toEqual({ n: 0, at: 0 });
    expect(srv.enforceDuelInvites(undefined, { n: 2, at: 9 }, NOW)).toEqual({ n: 2, at: 9 });
    expect(srv.enforceDuelInvites(undefined, undefined, NOW)).toBeUndefined();
  });
  it('o que o app produz numa troca real é aceito pelo servidor', () => {
    const prev = { energyPoints: 5, duelInvites: { n: 0, at: 1000 } };
    const depois = app.exchangeDuelInvites(prev, NOW);
    expect(depois.duelInvites).toEqual({ n: 3, at: NOW });
    expect(srv.enforceDuelInvites(depois.duelInvites, prev.duelInvites, NOW)).toEqual(depois.duelInvites);
  });
});
