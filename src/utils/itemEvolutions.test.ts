import { describe, it, expect } from 'vitest';
import { getNextEvolution } from './dailyReset';
import { getStageLevel, MAX_HP_BY_FORM } from '../types/progression';

// Item digivolutions (shop): the artificial form replaces the branch form at
// its level, then the line continues NORMALLY from it.
describe('item digivolutions — branch continuity', () => {
  it('artificial forms map to their levels (HP/requirements follow)', () => {
    expect(getStageLevel('greymon')).toBe('champion');
    expect(getStageLevel('garurumon')).toBe('champion');
    expect(getStageLevel('meramon')).toBe('champion');
    expect(getStageLevel('monzaemon')).toBe('ultimate');
    expect(getStageLevel('etemon')).toBe('ultimate');
    expect(MAX_HP_BY_FORM[getStageLevel('monzaemon')]).toBe(3);
  });

  it('champion item form evolves into the line ultimate of the current branch', () => {
    expect(getNextEvolution('greymon', 'tapirmon', 'virus', [])).toBe('gigadramon');
    expect(getNextEvolution('garurumon', 'veemon', 'data', [])).toBe('paildramon');
    expect(getNextEvolution('meramon', 'salamon', 'vaccine', [])).toBe('angewomon');
  });

  it('ultimate item form evolves into the line mega of the current branch', () => {
    expect(getNextEvolution('monzaemon', 'tapirmon', 'data', [])).toBe('ultimatebrachiomon');
    expect(getNextEvolution('etemon', 'salamon', 'virus', [])).toBe('lilithmon');
  });
});
