import { describe, it, expect } from 'vitest';
import * as server from './_mercMission.js';
import { MERC_ORDENS, sanitizeMercMission } from '../../src/utils/mercMission';

describe('paridade mercMission (cliente x servidor)', () => {
  it('mesma lista de Ordens', () => { expect(server.MERC_ORDENS).toEqual([...MERC_ORDENS]); });
  it('mesma saneação, idempotente', () => {
    const ok = { day: 'Fri Oct 30 2026', ordem: 'tecelao', activityId: 'x', done: true };
    for (const raw of [undefined, null, 'x', 3, [], {}, ok, { ...ok, done: 'sim' }, { ...ok, ordem: 'cla' }, { ...ok, day: '' },
      { ...ok, day: 'd'.repeat(41) }, { ...ok, activityId: 'a'.repeat(65) }, { ...ok, extra: 1 }]) {
      const c = sanitizeMercMission(raw);
      expect(server.sanitizeMercMission(raw)).toEqual(c);
      expect(sanitizeMercMission(c)).toEqual(c);
    }
  });
});
