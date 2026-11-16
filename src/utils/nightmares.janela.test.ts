/** §430: a janela de abertura de 1,2 s do Pesadelo (o inimigo só golpeia a partir dela). */
import { describe, expect, it } from 'vitest';
import { nightmareFoe } from './nightmares';
import { nightmareFight } from './dungeonFight';
import { REFERENCE_BUILDS, combatantAt } from './combate/level';

describe('§430 janela de abertura de 1,2 s', () => {
  it('o inimigo do Pesadelo só golpeia a partir de NIGHTMARE_OPENING_WINDOW_S e a luta segue determinística', async () => {
    const { NIGHTMARE_OPENING_WINDOW_S } = await import('./dungeonFight');
    const { groupFightSteps } = await import('./combate/group');
    const p = { combatant: combatantAt(20, REFERENCE_BUILDS.balanced), family: 'direct' as const, jeito: undefined, pesadelo: true };
    const f = nightmareFight(p, nightmareFoe(20, 1), 7, () => 0);
    expect(f.options.foeOpeningDelay).toBe(NIGHTMARE_OPENING_WINDOW_S);
    expect(NIGHTMARE_OPENING_WINDOW_S).toBe(1.2);
    const firstFoeHit = (opts: object) => {
      const g = groupFightSteps(f.player, f.foes, { seed: f.seed, hitScale: f.hitScale, ...opts });
      let s = g.next();
      while (!s.done) { if (s.value.who !== 0 && s.value.kind === 'attack') return s.value.t; s = g.next(s.value.kind === 'cast' ? 1 : undefined); }
      return Infinity;
    };
    expect(firstFoeHit(f.options)).toBeGreaterThanOrEqual(1.2 - 1e-9);
    expect(firstFoeHit({ foeOpeningDelay: 3 })).toBeGreaterThanOrEqual(3 - 1e-9);
    expect(firstFoeHit(f.options)).toBe(firstFoeHit(f.options));
  });
});
