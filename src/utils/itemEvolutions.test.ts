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

  it('new artificial forms map to their levels too', () => {
    for (const champ of ['angemon', 'birdramon', 'kabuterimon', 'seadramon', 'airdramon', 'ogremon', 'kuwagamon', 'numemon']) {
      expect(getStageLevel(champ)).toBe('champion');
    }
    for (const ult of ['megadramon', 'vademon', 'nanimon']) {
      expect(getStageLevel(ult)).toBe('ultimate');
    }
  });

  it('champion item form evolves into the line ultimate of the current branch', () => {
    expect(getNextEvolution('greymon', 'tapirmon', 'virus', [])).toBe('gigadramon');
    expect(getNextEvolution('garurumon', 'veemon', 'data', [])).toBe('paildramon');
    expect(getNextEvolution('meramon', 'salamon', 'vaccine', [])).toBe('angewomon');
    expect(getNextEvolution('angemon', 'salamon', 'vaccine', [])).toBe('angewomon');
    expect(getNextEvolution('kabuterimon', 'tapirmon', 'data', [])).toBe('triceramon');
    expect(getNextEvolution('ogremon', 'veemon', 'virus', [])).toBe('aeroveedramon');
  });

  it('ultimate item form evolves into the line mega of the current branch', () => {
    expect(getNextEvolution('monzaemon', 'tapirmon', 'data', [])).toBe('ultimatebrachiomon');
    expect(getNextEvolution('etemon', 'salamon', 'virus', [])).toBe('lilithmon');
    expect(getNextEvolution('megadramon', 'veemon', 'data', [])).toBe('imperialdramon');
    expect(getNextEvolution('nanimon', 'tapirmon', 'vaccine', [])).toBe('titamon');
  });

  it('Ver.1 secret: Numemon always evolves into Monzaemon', () => {
    expect(getNextEvolution('numemon', 'tapirmon', 'virus', [])).toBe('monzaemon');
    expect(getNextEvolution('numemon', 'veemon', 'data', [])).toBe('monzaemon');
    expect(getNextEvolution('numemon', 'salamon', 'vaccine', [])).toBe('monzaemon');
    // …and Monzaemon then rejoins the line at mega, as usual
    expect(getNextEvolution('monzaemon', 'salamon', 'vaccine', [])).toBe('ophanimon');
  });
});

describe('rookie item forms (minigame drops)', () => {
  it('map to the rookie level (HP/energy/degeneration follow)', () => {
    for (const r of ['agumon', 'gabumon', 'piyomon', 'tentomon', 'patamon', 'palmon']) {
      expect(getStageLevel(r)).toBe('rookie');
    }
  });

  it('rookie item form evolves into the line champion of the current branch', () => {
    expect(getNextEvolution('agumon', 'tapirmon', 'virus', [])).toBe('tuskmon');
    expect(getNextEvolution('gabumon', 'veemon', 'data', [])).toBe('exveemon');
    expect(getNextEvolution('piyomon', 'salamon', 'vaccine', [])).toBe('gatomon');
    expect(getNextEvolution('tentomon', 'tapirmon', 'data', [])).toBe('monochromon');
  });
});

describe('armor digivolutions (digimentals)', () => {
  it('flamedramon and raidramon-armor are champion level', () => {
    expect(getStageLevel('flamedramon')).toBe('champion');
    expect(getStageLevel('raidramon-armor')).toBe('champion');
  });

  it('armor champion evolves into the line ultimate of the current branch, on any line', () => {
    // Non-veemon lines: the armor form continues THAT line
    expect(getNextEvolution('flamedramon', 'tapirmon', 'virus', [])).toBe('gigadramon');
    expect(getNextEvolution('raidramon-armor', 'salamon', 'vaccine', [])).toBe('angewomon');
    // Veemon line keeps its natural continuations
    expect(getNextEvolution('flamedramon', 'veemon', 'vaccine', [])).toBe('raidramon');
    expect(getNextEvolution('raidramon-armor', 'veemon', 'data', [])).toBe('paildramon');
  });
});
