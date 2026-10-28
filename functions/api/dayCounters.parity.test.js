import { describe, it, expect } from 'vitest';
import * as srv from './_dayCounters.js';
import { sanitizeDungeonDaily, DUNGEON_MAX_LAYER } from '../../src/utils/dungeonIdle';
import { sanitizeArenaReroll, ARENA_REROLL_MAX_COUNT } from '../../src/utils/arenaSorteio';
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
  it('servidor: rerolls só crescem no dia e o dia só anda para a frente', () => {
    const d = '2026-10-13'; const now = Date.parse('2026-10-13T12:00:00Z');
    expect(srv.enforceArenaReroll({ day: d, count: 1 }, { day: d, count: 4 }, now)).toEqual({ day: d, count: 4 });
    expect(srv.enforceArenaReroll({ day: d, count: 5 }, { day: d, count: 4 }, now)).toEqual({ day: d, count: 5 });
    expect(srv.enforceArenaReroll(undefined, { day: d, count: 4 }, now)).toEqual({ day: d, count: 4 });
    expect(srv.enforceArenaReroll({ day: '2026-10-12', count: 0 }, { day: d, count: 4 }, now)).toEqual({ day: d, count: 4 });
    expect(srv.enforceArenaReroll({ day: '2026-12-01', count: 0 }, { day: d, count: 4 }, now)).toEqual({ day: d, count: 4 });
  });
});
