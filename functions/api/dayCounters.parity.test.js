import { describe, it, expect } from 'vitest';
import * as srv from './_dayCounters.js';
import { sanitizeDungeonDaily, DUNGEON_MAX_LAYER } from '../../src/utils/dungeonIdle';
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
});
