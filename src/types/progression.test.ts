import { describe, it, expect } from 'vitest';
import { getStageLevel, getStageBranch, canSelectWeekdays, FORM_REQUIREMENTS, MAX_HP_BY_FORM } from './progression';

describe('getStageLevel', () => {
  it('maps rookie', () => {
    expect(getStageLevel('rookie')).toBe('rookie');
  });

  it('maps champion/ultimate/mega ids by prefix, regardless of branch', () => {
    expect(getStageLevel('champion-virus')).toBe('champion');
    expect(getStageLevel('champion-data')).toBe('champion');
    expect(getStageLevel('champion-vaccine')).toBe('champion');
    expect(getStageLevel('ultimate-virus')).toBe('ultimate');
    expect(getStageLevel('mega-data')).toBe('mega');
  });

  it('maps ultra', () => {
    expect(getStageLevel('ultra')).toBe('ultra');
  });

  it('classifies legacy static names (dungeon wild roster / sprite fallback)', () => {
    expect(getStageLevel('tapirmon')).toBe('rookie');
    expect(getStageLevel('tuskmon')).toBe('champion');
    expect(getStageLevel('gigadramon')).toBe('ultimate');
    expect(getStageLevel('gaioumon')).toBe('mega');
    expect(getStageLevel('gaioumon-itto')).toBe('ultra');
  });

  it('falls back to rookie for unknown stages', () => {
    expect(getStageLevel('unknown-creature')).toBe('rookie');
  });
});

describe('getStageBranch', () => {
  it('extracts the attribute embedded in the id', () => {
    expect(getStageBranch('champion-virus')).toBe('virus');
    expect(getStageBranch('mega-vaccine')).toBe('vaccine');
  });

  it('returns null when there is no branch (rookie/ultra/legacy names)', () => {
    expect(getStageBranch('rookie')).toBeNull();
    expect(getStageBranch('ultra')).toBeNull();
    expect(getStageBranch('tapirmon')).toBeNull();
  });
});

describe('canSelectWeekdays', () => {
  it('is always true — the Soulmon tree starts at rookie, no pre-rookie stages', () => {
    expect(canSelectWeekdays('rookie')).toBe(true);
    expect(canSelectWeekdays('champion-virus')).toBe(true);
    expect(canSelectWeekdays('ultra')).toBe(true);
  });
});

describe('FORM_REQUIREMENTS consistency', () => {
  const order = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'] as const;

  it('required increases monotonically across stages', () => {
    for (let i = 1; i < order.length; i++) {
      expect(FORM_REQUIREMENTS[order[i]].required).toBeGreaterThan(
        FORM_REQUIREMENTS[order[i - 1]].required,
      );
    }
  });

  it('cap increases monotonically across stages', () => {
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
