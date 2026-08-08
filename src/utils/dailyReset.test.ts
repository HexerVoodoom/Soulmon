import { describe, it, expect } from 'vitest';
import {
  getNextEvolution,
  getPreviousForm,
} from './dailyReset';

describe('getNextEvolution', () => {
  it('rookie → champion, by the current dominant attribute', () => {
    expect(getNextEvolution('rookie', 'virus', [])).toBe('champion-virus');
    expect(getNextEvolution('rookie', 'data', [])).toBe('champion-data');
    expect(getNextEvolution('rookie', 'vaccine', [])).toBe('champion-vaccine');
  });

  it('champion → ultimate, by the current dominant attribute (can differ from the champion\'s own branch)', () => {
    expect(getNextEvolution('champion-virus', 'virus', [])).toBe('ultimate-virus');
    expect(getNextEvolution('champion-virus', 'data', [])).toBe('ultimate-data');
  });

  it('ultimate → mega, by the current dominant attribute', () => {
    expect(getNextEvolution('ultimate-virus', 'virus', [])).toBe('mega-virus');
    expect(getNextEvolution('ultimate-data', 'vaccine', [])).toBe('mega-vaccine');
  });

  it('mega → ultra only when all 3 megas are unlocked', () => {
    const allMegas = ['mega-virus', 'mega-data', 'mega-vaccine'];
    expect(getNextEvolution('mega-virus', 'virus', allMegas)).toBe('ultra');
    expect(getNextEvolution('mega-data', 'data', allMegas)).toBe('ultra');
  });

  it('mega stays put when not all megas unlocked', () => {
    expect(getNextEvolution('mega-virus', 'virus', ['mega-virus'])).toBe('mega-virus');
  });

  it('ultra stays at ultra', () => {
    expect(getNextEvolution('ultra', 'virus', [])).toBe('ultra');
    expect(getNextEvolution('ultra', 'data', [])).toBe('ultra');
  });
});

// ── getPreviousForm ────────────────────────────────────────────

describe('getPreviousForm', () => {
  it('ultra → mega of the CURRENT branch (ultra has no branch embedded)', () => {
    expect(getPreviousForm('ultra', 'virus')).toBe('mega-virus');
    expect(getPreviousForm('ultra', 'data')).toBe('mega-data');
    expect(getPreviousForm('ultra', 'vaccine')).toBe('mega-vaccine');
  });

  it('mega → ultimate of the SAME branch (embedded in the id, ignores the passed branch)', () => {
    expect(getPreviousForm('mega-virus', 'data')).toBe('ultimate-virus');
    expect(getPreviousForm('mega-vaccine', 'virus')).toBe('ultimate-vaccine');
  });

  it('ultimate → champion of the SAME branch', () => {
    expect(getPreviousForm('ultimate-virus', 'data')).toBe('champion-virus');
    expect(getPreviousForm('ultimate-data', 'virus')).toBe('champion-data');
  });

  it('champion → rookie (all branches collapse to the single rookie)', () => {
    expect(getPreviousForm('champion-virus', 'virus')).toBe('rookie');
    expect(getPreviousForm('champion-data', 'data')).toBe('rookie');
    expect(getPreviousForm('champion-vaccine', 'vaccine')).toBe('rookie');
  });

  it('rookie stays at rookie — nothing below it', () => {
    expect(getPreviousForm('rookie', 'data')).toBe('rookie');
  });

  it('unknown stage → rookie', () => {
    expect(getPreviousForm('unknown-stage', 'data')).toBe('rookie');
  });

  it('is deterministic — same inputs always produce same output', () => {
    const r1 = getPreviousForm('ultra', 'virus');
    const r2 = getPreviousForm('ultra', 'virus');
    expect(r1).toBe(r2);
  });
});
