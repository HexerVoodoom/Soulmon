import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/** B6 (L2-backend): a simulação IMPORTA as constantes de `_coop.js` (footgun 9). */
describe('sim/guilda-sim.mjs não repete literal', () => {
  const src = readFileSync(new URL('../../docs/reviews/guilda/sim/guilda-sim.mjs', import.meta.url), 'utf8');
  it('importa as constantes da Feira e do Bosque', () => {
    for (const c of ['BOSQUE_THRESHOLDS', 'RAID_HP_PER_MEMBER', 'RAID_DMG_BASE', 'RAID_DMG_PER_POWER', 'RAID_DMG_JITTER', 'GUILD_MIN_RAID_MEMBERS']) {
      expect(src).toMatch(new RegExp(`import[^;]*\\b${c}\\b[^;]*_coop\\.js`));
    }
  });
  it('sem os literais antigos', () => {
    expect(src).not.toMatch(/K = 45|10 \+ 2 \* p|JITTER = 0\.2|MIN_HP_MEMBERS = 3/);
  });
});
