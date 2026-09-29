import { describe, it, expect } from 'vitest';
import {
  getNextEvolution,
  getPreviousForm,
} from './dailyReset';

describe('getNextEvolution', () => {
  it('rookie → champion, by the current dominant attribute', () => {
    expect(getNextEvolution('rookie', 'power', [])).toBe('champion-power');
    expect(getNextEvolution('rookie', 'harmony', [])).toBe('champion-harmony');
    expect(getNextEvolution('rookie', 'benevolence', [])).toBe('champion-benevolence');
  });

  it('champion → ultimate, by the current dominant attribute (can differ from the champion\'s own branch)', () => {
    expect(getNextEvolution('champion-power', 'power', [])).toBe('ultimate-power');
    expect(getNextEvolution('champion-power', 'harmony', [])).toBe('ultimate-harmony');
  });

  it('ultimate → mega, by the current dominant attribute', () => {
    expect(getNextEvolution('ultimate-power', 'power', [])).toBe('mega-power');
    expect(getNextEvolution('ultimate-harmony', 'benevolence', [])).toBe('mega-benevolence');
  });

  it('mega → ultra only when all 3 megas are unlocked', () => {
    const allMegas = ['mega-power', 'mega-harmony', 'mega-benevolence'];
    expect(getNextEvolution('mega-power', 'power', allMegas)).toBe('ultra');
    expect(getNextEvolution('mega-harmony', 'harmony', allMegas)).toBe('ultra');
  });

  it('mega stays put when not all megas unlocked', () => {
    expect(getNextEvolution('mega-power', 'power', ['mega-power'])).toBe('mega-power');
  });

  it('ultra stays at ultra', () => {
    expect(getNextEvolution('ultra', 'power', [])).toBe('ultra');
    expect(getNextEvolution('ultra', 'harmony', [])).toBe('ultra');
  });
});

// ── getPreviousForm ────────────────────────────────────────────

describe('getPreviousForm', () => {
  it('ultra → mega of the CURRENT branch (ultra has no branch embedded)', () => {
    expect(getPreviousForm('ultra', 'power')).toBe('mega-power');
    expect(getPreviousForm('ultra', 'harmony')).toBe('mega-harmony');
    expect(getPreviousForm('ultra', 'benevolence')).toBe('mega-benevolence');
  });

  it('mega → ultimate of the SAME branch (embedded in the id, ignores the passed branch)', () => {
    expect(getPreviousForm('mega-power', 'harmony')).toBe('ultimate-power');
    expect(getPreviousForm('mega-benevolence', 'power')).toBe('ultimate-benevolence');
  });

  it('ultimate → champion of the SAME branch', () => {
    expect(getPreviousForm('ultimate-power', 'harmony')).toBe('champion-power');
    expect(getPreviousForm('ultimate-harmony', 'power')).toBe('champion-harmony');
  });

  it('champion → rookie (all branches collapse to the single rookie)', () => {
    expect(getPreviousForm('champion-power', 'power')).toBe('rookie');
    expect(getPreviousForm('champion-harmony', 'harmony')).toBe('rookie');
    expect(getPreviousForm('champion-benevolence', 'benevolence')).toBe('rookie');
  });

  it('rookie stays at rookie — nothing below it', () => {
    expect(getPreviousForm('rookie', 'harmony')).toBe('rookie');
  });

  it('unknown stage → rookie', () => {
    expect(getPreviousForm('unknown-stage', 'harmony')).toBe('rookie');
  });

  it('is deterministic — same inputs always produce same output', () => {
    const r1 = getPreviousForm('ultra', 'power');
    const r2 = getPreviousForm('ultra', 'power');
    expect(r1).toBe(r2);
  });
});
