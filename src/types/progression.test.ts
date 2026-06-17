import { describe, it, expect } from 'vitest';
import { getStageLevel, canSelectWeekdays, FORM_REQUIREMENTS, MAX_HP_BY_FORM } from './progression';

describe('getStageLevel', () => {
  it('maps digiegg to digiegg', () => {
    expect(getStageLevel('digiegg')).toBe('digiegg');
  });

  it('maps baby-i stages correctly', () => {
    expect(getStageLevel('pichimon')).toBe('baby-i');
  });

  it('maps baby-ii stages correctly', () => {
    expect(getStageLevel('pukamon')).toBe('baby-ii');
  });

  it('maps rookie stages correctly', () => {
    expect(getStageLevel('tapirmon')).toBe('rookie');
  });

  it('maps champion variants', () => {
    expect(getStageLevel('monochromon')).toBe('champion');
    expect(getStageLevel('tuskmon')).toBe('champion');
    expect(getStageLevel('bakemon')).toBe('champion');
  });

  it('maps ultimate variants', () => {
    expect(getStageLevel('gigadramon')).toBe('ultimate');
    expect(getStageLevel('triceramon')).toBe('ultimate');
    expect(getStageLevel('digitamamon')).toBe('ultimate');
  });

  it('maps mega variants', () => {
    expect(getStageLevel('gaioumon')).toBe('mega');
    expect(getStageLevel('ultimatebrachiomon')).toBe('mega');
    expect(getStageLevel('titamon')).toBe('mega');
  });

  it('maps ultra', () => {
    expect(getStageLevel('gaioumon-itto')).toBe('ultra');
  });

  it('falls back to digiegg for unknown stages', () => {
    expect(getStageLevel('unknown-digimon')).toBe('digiegg');
  });
});

describe('canSelectWeekdays', () => {
  it('returns false for pre-rookie stages', () => {
    expect(canSelectWeekdays('digiegg')).toBe(false);
    expect(canSelectWeekdays('pichimon')).toBe(false);
    expect(canSelectWeekdays('pukamon')).toBe(false);
  });

  it('returns true for rookie and above', () => {
    expect(canSelectWeekdays('tapirmon')).toBe(true);
    expect(canSelectWeekdays('monochromon')).toBe(true);
    expect(canSelectWeekdays('gigadramon')).toBe(true);
    expect(canSelectWeekdays('gaioumon')).toBe(true);
    expect(canSelectWeekdays('gaioumon-itto')).toBe(true);
  });

  it('returns false for unknown stages', () => {
    expect(canSelectWeekdays('unknown')).toBe(false);
  });
});

describe('FORM_REQUIREMENTS consistency', () => {
  it('required increases monotonically across stages', () => {
    const order = ['digiegg', 'baby-i', 'baby-ii', 'rookie', 'champion', 'ultimate', 'mega', 'ultra'] as const;
    for (let i = 1; i < order.length; i++) {
      expect(FORM_REQUIREMENTS[order[i]].required).toBeGreaterThan(
        FORM_REQUIREMENTS[order[i - 1]].required,
      );
    }
  });

  it('cap increases monotonically across stages', () => {
    const order = ['digiegg', 'baby-i', 'baby-ii', 'rookie', 'champion', 'ultimate', 'mega', 'ultra'] as const;
    for (let i = 1; i < order.length; i++) {
      expect(FORM_REQUIREMENTS[order[i]].cap).toBeGreaterThan(
        FORM_REQUIREMENTS[order[i - 1]].cap,
      );
    }
  });
});

describe('MAX_HP_BY_FORM', () => {
  it('all stages have positive HP', () => {
    const stages = Object.keys(MAX_HP_BY_FORM) as (keyof typeof MAX_HP_BY_FORM)[];
    stages.forEach(stage => {
      expect(MAX_HP_BY_FORM[stage]).toBeGreaterThan(0);
    });
  });

  it('ultra has highest HP', () => {
    expect(MAX_HP_BY_FORM['ultra']).toBeGreaterThan(MAX_HP_BY_FORM['mega']);
  });
});
