import { describe, it, expect } from 'vitest';
import * as server from './_bossShards.js';
import { BOSS_SHARDS_MAX, sanitizeBossShards } from '../../src/utils/bossShards';

describe('paridade bossShards (cliente x servidor)', () => {
  it('mesmo teto', () => { expect(server.BOSS_SHARDS_MAX).toBe(BOSS_SHARDS_MAX); });
  it('mesma saneação, idempotente', () => {
    for (const raw of [undefined, null, 'x', '3', [], {}, NaN, Infinity, -4, 0, 1, 2.7, 5e9]) {
      const c = sanitizeBossShards(raw);
      expect(server.sanitizeBossShards(raw)).toEqual(c);
      expect(sanitizeBossShards(c)).toEqual(c);
    }
  });
});
