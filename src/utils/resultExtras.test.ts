import { describe, it, expect } from 'vitest';
import { buildResultExtras } from './resultExtras';
import { MINIGAME_BITS_PER_DAY } from './currencies';

describe('resultExtras', () => {
  it('teto do dia e missões por evento', () => {
    const day = '2026-11-03';
    const e = buildResultExtras({ minigameBits: { day, earned: MINIGAME_BITS_PER_DAY } }, day, 30, true);
    expect(e.bitsToday).toBe(MINIGAME_BITS_PER_DAY);
    expect(e.bitsCap).toBe(MINIGAME_BITS_PER_DAY);
    for (const m of Object.values(e.missions)) expect(m!.target).toBeGreaterThan(0);
  });
  it('outro dia zera os Bits de hoje', () => {
    expect(buildResultExtras({ minigameBits: { day: '2026-11-02', earned: 99 } }, '2026-11-03', 30, false).bitsToday).toBe(0);
  });
});
