import { describe, it, expect } from 'vitest';
import * as server from './_conquistas.js';
import { ACHIEVEMENT_IDS, sanitizeConquistasPagas } from '../../src/utils/achievements';

describe('paridade conquistasPagas (cliente x servidor)', () => {
  it('mesma lista de ids', () => { expect(server.ACHIEVEMENT_IDS).toEqual([...ACHIEVEMENT_IDS]); });
  it('mesma saneação', () => {
    for (const raw of [undefined, null, 'x', {}, [], ['habit-7', 'habit-7', 'zzz', 3], [...ACHIEVEMENT_IDS].reverse()]) {
      expect(server.sanitizeConquistasPagas(raw)).toEqual(sanitizeConquistasPagas(raw));
    }
  });
});
