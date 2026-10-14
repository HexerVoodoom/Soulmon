import { describe, it, expect } from 'vitest';
import * as srv from './_dailyMissions.js';
import {
  DAILY_COUNT_CAP, DAILY_EVENTS, DAILY_MISSION_IDS, FIRST_TIME_IDS, sanitizeDailyMissions, sanitizeFirstTimes,
} from '../../src/utils/dailyMissions';

describe('missoes diarias e primeiras vezes: servidor e app concordam', () => {
  it('mesmas listas fechadas e mesmo teto', () => {
    expect(srv.DAILY_EVENTS).toEqual([...DAILY_EVENTS]);
    expect(srv.DAILY_MISSION_IDS).toEqual([...DAILY_MISSION_IDS]);
    expect(srv.FIRST_TIME_IDS).toEqual([...FIRST_TIME_IDS]);
    expect(srv.DAILY_COUNT_CAP).toBe(DAILY_COUNT_CAP);
  });
  it('a saneacao de dailyMissions bate em entradas boas e hostis', () => {
    const casos = [
      null, 3, 'x', [], {}, { day: '' }, { day: 'd' },
      { day: 'd', counts: { dino: 3.7, hack: 5, ppt: -1, foco: 1e9 }, claimed: ['d-dino', 'd-dino', 'x', 7] },
      { day: 'd', counts: [1], claimed: 'd-dino' },
    ];
    for (const c of casos) expect(srv.sanitizeDailyMissions(c), JSON.stringify(c)).toEqual(sanitizeDailyMissions(c));
  });
  it('a saneacao de firstTimes bate em entradas boas e hostis', () => {
    const casos = [
      null, 3, [], {}, { done: 'x' },
      { done: ['first-focus', 'first-focus', 'nope', 3], claimed: ['visit:hall.feira', 'first-stroll'] },
      { done: [...FIRST_TIME_IDS], claimed: [...FIRST_TIME_IDS] },
    ];
    for (const c of casos) expect(srv.sanitizeFirstTimes(c), JSON.stringify(c)).toEqual(sanitizeFirstTimes(c));
  });
});
