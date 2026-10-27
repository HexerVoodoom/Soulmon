import { describe, it, expect } from 'vitest';
import { arenaCardSeeds, isStraySeed, strayForTournament, STRAY_ROSTER } from './strayFoes';
import { buildArenaRound } from './arena';
import { mulberry32 } from './combate/rng';
import { isStrayFoe } from './wildFoeLabel';

const STRONG = new Set(['ultimate', 'mega', 'ultra']);

describe('Desgarrados como oponentes', () => {
  it('isStraySeed é determinístico e ocasional', () => {
    expect(isStraySeed(12345)).toBe(isStraySeed(12345));
    let n = 0;
    for (let s = 1; s <= 2000; s++) if (isStraySeed(s * 7919)) n++;
    expect(n).toBeGreaterThan(100);
    expect(n).toBeLessThan(450);
  });

  it('os 3 cards têm no máximo UM desgarrado, mesmo com sementes ruins', () => {
    let k = 0;
    const sempreStray = () => { while (!isStraySeed(++k)); return k; };
    expect(arenaCardSeeds(sempreStray).length).toBe(3);
    for (let t = 0; t < 50; t++) {
      let c = t * 1000;
      const seeds = arenaCardSeeds(() => (c += 7919));
      expect(seeds.length).toBe(3);
      expect(seeds.filter(isStraySeed).length).toBeLessThanOrEqual(1);
    }
  });

  it('rodada de desgarrado usa formas fortes; sem o flag, a rodada é a de antes (mesmo rng)', () => {
    for (let r = 1; r <= 5; r++) {
      const stray = buildArenaRound(r, 1, mulberry32(r), undefined, undefined, true);
      expect(stray.every(e => e.stray === true && STRONG.has(e.form as string))).toBe(true);
    }
    const a = buildArenaRound(2, 1, mulberry32(9), undefined, ['fogo']);
    const b = buildArenaRound(2, 1, mulberry32(9), undefined, ['fogo'], false);
    expect(b).toEqual(a);
    expect(a.every(e => e.stray === undefined)).toBe(true);
  });

  it('o desgarrado do Torneio é forte e estável por conta e dia', () => {
    expect(STRAY_ROSTER.length).toBeGreaterThan(0);
    expect(STRAY_ROSTER.every(e => isStrayFoe(e.stage))).toBe(true);
    const e = strayForTournament('conta-1', '2026-10-27');
    expect(e).toBe(strayForTournament('conta-1', '2026-10-27'));
    expect(isStrayFoe(e.stage)).toBe(true);
  });
});
