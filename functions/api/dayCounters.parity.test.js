import { describe, it, expect } from 'vitest';
import * as srv from './_dayCounters.js';
import { sanitizeDungeonDaily, DUNGEON_MAX_LAYER } from '../../src/utils/dungeonIdle';
import { sanitizeArenaReroll, ARENA_REROLL_MAX_COUNT } from '../../src/utils/arenaSorteio';
import { sanitizeArenaLadder, sanitizeArenaSeason, ARENA_LADDER_MAX } from '../../src/utils/arena';
import { sanitizeCheckIns, CHECKIN_SLOTS } from '../../src/utils/checkIns';

describe('contadores diários: servidor e app concordam na FORMA', () => {
  it('mesmo teto de camadas e mesma lista de janelas', () => {
    expect(srv.DUNGEON_MAX_LAYER).toBe(DUNGEON_MAX_LAYER);
    expect(srv.CHECKIN_SLOTS).toEqual([...CHECKIN_SLOTS]);
  });
  const casos = [
    null, undefined, 3, 'x', [], {}, { day: '2026-10-13' }, { day: 'Tue Oct 13 2026', layers: 1 }, { day: '2026-10-13', layers: 4 },
    { day: '2026-10-13', layers: 1e9 }, { day: '2026-10-13', layers: -3 }, { day: '2026-10-13', layers: 2.7 }, { day: '2026-10-13', layers: NaN },
    { day: '2026-10-13', claimed: ['night', 'x', 'morning', 'night'] }, { day: '2026-10-13', claimed: 'morning' }, { day: '2026-10-13', claimed: [] },
  ];
  it('a saneação de dungeonDaily bate em entradas boas e hostis', () => {
    for (const c of casos) expect(srv.sanitizeDungeonDaily(c), JSON.stringify(c)).toEqual(sanitizeDungeonDaily(c));
  });
  it('a saneação de checkIns bate em entradas boas e hostis', () => {
    for (const c of casos) expect(srv.sanitizeCheckIns(c), JSON.stringify(c)).toEqual(sanitizeCheckIns(c));
  });
  it('a saneação de arenaReroll bate em entradas boas e hostis (e o teto)', () => {
    expect(srv.ARENA_REROLL_MAX_COUNT).toBe(ARENA_REROLL_MAX_COUNT);
    for (const c of [...casos, { day: '2026-10-13', count: 3 }, { day: '2026-10-13', count: -1 }, { day: '2026-10-13', count: 1e9 }, { day: 5, count: 2 }, { day: '2026-10-13', count: 2.9 }]) {
      expect(srv.sanitizeArenaReroll(c), JSON.stringify(c)).toEqual(sanitizeArenaReroll(c));
    }
  });
  it('arenaLadder: mesma saneação e só cresce (cliente antigo que omite não zera)', () => {
    expect(srv.ARENA_LADDER_MAX).toBe(ARENA_LADDER_MAX);
    for (const c of [null, undefined, 'x', [], {}, 3, 0, -2, 2.9, NaN, Infinity, 1e9]) expect(srv.sanitizeArenaLadder(c), String(c)).toBe(sanitizeArenaLadder(c));
    expect(srv.enforceArenaLadder(undefined, 7)).toBe(7);
    expect(srv.enforceArenaLadder(2, 7)).toBe(7);
    expect(srv.enforceArenaLadder(8, 7)).toBe(8);
    expect(srv.enforceArenaLadder('lixo', undefined)).toBe(0);
  });
  it('servidor: giros por HORA (22/11/2026): a hora mais nova vence, na mesma hora o maior contador, hora futura demais é ignorada', () => {
    const now = Date.parse('2026-10-13T12:30:00Z'); const d = '2026-10-13';
    const reg = (hour, hcount, count = 5) => ({ day: d, count, hour, hcount });
    expect(srv.enforceArenaReroll(reg('2026-10-13T12', 1), reg('2026-10-13T12', 3), now)).toEqual(reg('2026-10-13T12', 3));
    expect(srv.enforceArenaReroll(reg('2026-10-13T12', 1), reg('2026-10-13T11', 3), now)).toEqual(reg('2026-10-13T12', 1));
    expect(srv.enforceArenaReroll(reg('2026-10-13T11', 0), reg('2026-10-13T12', 2), now)).toEqual(reg('2026-10-13T12', 2));
    expect(srv.enforceArenaReroll(reg('2026-10-13T20', 0), reg('2026-10-13T12', 2), now)).toEqual(reg('2026-10-13T12', 2));
    expect(srv.enforceArenaReroll({ day: d, count: 2 }, reg('2026-10-13T12', 2, 1), now)).toEqual(reg('2026-10-13T12', 2, 2));
    for (const x of [reg('lixo', 1), reg('2026-10-13T12', NaN), { day: d, count: 1, hour: 5 }]) expect(srv.sanitizeArenaReroll(x)).toEqual({ day: d, count: x.count });
    expect(sanitizeArenaReroll(reg('2026-10-13T12', 2))).toEqual(srv.sanitizeArenaReroll(reg('2026-10-13T12', 2)));
  });
  // campo `arenaSeason` do save (22/11/2026): `save.js` o valida por `enforceArenaSeason`
  it('servidor: temporada mensal da Arena (a nova vence e pode zerar; a velha ou futura é rejeitada)', () => {
    const now = Date.parse('2026-12-02T00:00:00Z');
    for (const c of [null, 3, '2026-13', '2026-12']) expect(srv.sanitizeArenaSeason(c), String(c)).toBe(sanitizeArenaSeason(c));
    expect(srv.enforceArenaSeason({ ladder: 0, season: '2026-12' }, { ladder: 9, season: '2026-11' }, now)).toEqual({ ladder: 0, season: '2026-12' });
    expect(srv.enforceArenaSeason({ ladder: 2, season: '2026-11' }, { ladder: 9, season: '2026-12' }, now)).toEqual({ ladder: 9, season: '2026-12' });
    expect(srv.enforceArenaSeason({ ladder: 3, season: '2026-12' }, { ladder: 9, season: '2026-12' }, now)).toEqual({ ladder: 9, season: '2026-12' });
    expect(srv.enforceArenaSeason({ ladder: 0, season: '2027-05' }, { ladder: 9, season: '2026-12' }, now)).toEqual({ ladder: 9, season: '2026-12' });
    expect(srv.enforceArenaSeason({ ladder: 4 }, { ladder: 9, season: '2026-12' }, now)).toEqual({ ladder: 9, season: '2026-12' });
    expect(srv.enforceArenaSeason({ ladder: 4, season: '2026-12' }, { ladder: 9 }, now)).toEqual({ ladder: 9, season: '2026-12' });
  });
  it('servidor: rerolls só crescem no dia e o dia só anda para a frente', () => {
    const d = '2026-10-13'; const now = Date.parse('2026-10-13T12:00:00Z');
    expect(srv.enforceArenaReroll({ day: d, count: 1 }, { day: d, count: 4 }, now)).toEqual({ day: d, count: 4 });
    expect(srv.enforceArenaReroll({ day: d, count: 5 }, { day: d, count: 4 }, now)).toEqual({ day: d, count: 5 });
    expect(srv.enforceArenaReroll(undefined, { day: d, count: 4 }, now)).toEqual({ day: d, count: 4 });
    expect(srv.enforceArenaReroll({ day: '2026-10-12', count: 0 }, { day: d, count: 4 }, now)).toEqual({ day: d, count: 4 });
    expect(srv.enforceArenaReroll({ day: '2026-12-01', count: 0 }, { day: d, count: 4 }, now)).toEqual({ day: d, count: 4 });
  });
});
