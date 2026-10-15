import { describe, it, expect } from 'vitest';
import { claimDaily, claimFirst, sanitizeDailyMissions, sanitizeFirstTimes, bumpDaily, dailyMissionsFor, markFirst, dailyMissionsMark, seedFirstTimes } from './dailyMissions';
import { applyHungerPenalty, msToNextHungerLoss, sanitizeHungerPenalty } from './hungerPenalty';
import { energyStatus, settleEnergy, eat, tickEnergy } from './hunger';
import { sanitizeMissionsClaimed } from './missions';

const HOSTILE: unknown[] = [null, undefined, 0, -1, NaN, Infinity, '', 'x', [], {}, [1], { day: 5 }, { day: 'a', counts: { dino: 'x', foco: -3, banho: 1e99, __proto__: { dino: 5 } }, claimed: ['d-dino', 'd-dino', 5, '__proto__', 'constructor'] }, JSON.parse('{"day":"a","counts":{"__proto__":{"dino":9},"constructor":3},"claimed":["toString"]}')];

describe('QA2 missões e fome: entradas hostis', () => {
  it('sanitizers não lançam e não poluem', () => {
    for (const h of HOSTILE) {
      expect(() => sanitizeDailyMissions(h)).not.toThrow();
      expect(() => sanitizeFirstTimes(h)).not.toThrow();
      expect(() => sanitizeHungerPenalty(h)).not.toThrow();
      expect(() => sanitizeMissionsClaimed(h)).not.toThrow();
    }
    expect(({} as any).dino).toBeUndefined();
  });
  it('claim com bond hostil / id hostil', () => {
    for (const b of [NaN, -5, 0, 1e9, 'x', null, undefined, Infinity]) {
      for (const id of ['__proto__', 'constructor', '', 'd-dino', 'visit:laboratorio.perfil']) {
        const prev: any = { dailyMissions: { day: 'D', counts: { dino: 1, banho: 1, foco: 1 }, claimed: [] } };
        expect(() => claimDaily(prev, 'D', b, id)).not.toThrow();
        expect(() => claimFirst(prev, 'D', b, id)).not.toThrow();
        expect(() => dailyMissionsFor('D', b)).not.toThrow();
      }
    }
  });
  it('claim duas vezes paga uma', () => {
    for (const m of dailyMissionsFor('D', 99)) {
      let s: any = { dailyMissions: bumpDaily(undefined, 'D', m.event) };
      const a = claimDaily(s, 'D', 99, m.id); const b = claimDaily(a.state, 'D', 99, m.id);
      expect(a.paid).not.toBeNull(); expect(b.paid).toBeNull();
    }
  });
  it('fome: hostil', () => {
    for (const hp of [NaN, -3, 0, 0.3, 1e9, Infinity]) for (const at of [0, -5, 1e18, NaN, 5e12]) {
      const st: any = { healthPoints: hp, hunger: { v: 0, at }, evolutionStage: 'champion' };
      const r = applyHungerPenalty(st, 5e12 + 1e9);
      expect(Number.isFinite(r.healthPoints) || !Number.isFinite(hp)).toBe(true);
      expect(() => msToNextHungerLoss(st, 5e12)).not.toThrow();
      expect(() => energyStatus({ ...st, energyPoints: NaN, energyClock: { at: NaN, carry: NaN } }, 5e12)).not.toThrow();
    }
  });
  it('pagar duas vezes no mesmo now não cobra', () => {
    const st: any = { healthPoints: 10, hunger: { v: 0, at: 1000 }, evolutionStage: 'rookie' };
    const now = 1000 + 100 * 3600_000;
    const a = applyHungerPenalty(st, now); const b = applyHungerPenalty(a, now);
    expect(b).toBe(a); expect(a.healthPoints).toBe(9);
    const c = applyHungerPenalty(a, now + 12*3600_000); expect(c.healthPoints).toBe(8.5);
  });
});
