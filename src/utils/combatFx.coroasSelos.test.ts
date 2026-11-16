/**
 * Hexsmith H4: os selos das 3 famílias só de Coroa (`defBuff`, `atkDebuff`, `spdDebuff`) aparecem enquanto o efeito dura, lendo
 * `nGuard`/`nWeak`/`nDrag` (este vem somado em `nSlow`) do rastro real, e somem quando o contador zera.
 */
import { describe, it, expect } from 'vitest';
import { fightSteps, type FightFxPair, type FightSide } from './combate/fight';
import { combatantAt, REFERENCE_BUILDS } from './combate/level';
import { specialOf, type SpecialFamily } from './combate/specials';
import { castStatus, emptyStatusBoard, stageStatusOf, withRealFx } from './combatFx';

const ZERO = { nAtk: 0, nVuln: 0, nSpd: 0, shield: 0, shieldHits: 0, dot: 0 };
const mk = (family: SpecialFamily): FightSide => ({ combatant: combatantAt(30, REFERENCE_BUILDS.balanced), special: specialOf(family) });

describe('selos das Coroas de família nova, pelos contadores reais', () => {
  it('nGuard acende buff/def em quem conjurou; nWeak acende debuff/atk em quem recebeu; nSlow herda a variante spd do arrasto', () => {
    const base = emptyStatusBoard(1);
    const guard = withRealFx(castStatus(base, { caster: 0, family: 'defBuff', power: 1, area: false, targets: [1] }), [{ ...ZERO, nGuard: 2.2 }, ZERO]);
    expect(stageStatusOf(guard[0])).toEqual([{ kind: 'buff', variant: 'def', turns: 3 }]);
    const weak = withRealFx(castStatus(base, { caster: 0, family: 'atkDebuff', power: 1, area: false, targets: [1] }), [ZERO, { ...ZERO, nWeak: 1.4 }]);
    expect(stageStatusOf(weak[1])).toEqual([{ kind: 'debuff', variant: 'atk', turns: 2 }]);
    const drag = withRealFx(castStatus(base, { caster: 0, family: 'spdDebuff', power: 1, area: false, targets: [1] }), [ZERO, { ...ZERO, nSlow: 1 }]);
    expect(stageStatusOf(drag[1])).toEqual([{ kind: 'lento', variant: 'spd', turns: 1 }]);
  });

  it('contador zerado = selo some; sem contador de arrasto, a lentidão de efeito segue sem variante', () => {
    const base = emptyStatusBoard(1);
    const guard = castStatus(base, { caster: 0, family: 'defBuff', power: 1, area: false, targets: [1] });
    expect(stageStatusOf(withRealFx(guard, [ZERO, ZERO])[0])).toEqual([]);
    expect(stageStatusOf(withRealFx(base, [ZERO, { ...ZERO, nSlow: 1 }])[1])).toEqual([{ kind: 'lento', variant: undefined, turns: 1 }]);
  });

  for (const [fam, campo, holder] of [['defBuff', 'nGuard', 0], ['atkDebuff', 'nWeak', 1], ['spdDebuff', 'nSlow', 1]] as const) {
    it(`numa luta real, ${fam} deixa o contador ${campo} aceso no rastro e depois o gasta`, () => {
      const fx: FightFxPair[] = [];
      const g = fightSteps(mk(fam), mk('direct'), { seed: 7, hpScale: 1.7, fxTrace: fx });
      let r = g.next();
      while (!r.done) r = g.next(1);
      const vals = fx.map((p) => (p[holder] as unknown as Record<string, number | undefined>)[campo] ?? 0);
      expect(Math.max(...vals)).toBeGreaterThan(0);
      expect(vals[vals.length - 1]).toBeLessThan(Math.max(...vals) + 1e-9);
    });
  }
});
