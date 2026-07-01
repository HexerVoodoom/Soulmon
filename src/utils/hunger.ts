import { getStageLevel } from '../types/progression';

// How many feedings it takes to fill the satiety meter, by stage level.
// Grows as the pet evolves (the user must feed more often / more times to fill).
const FEEDINGS_TO_FILL: Record<string, number> = {
  digiegg: 1,
  'baby-i': 1,
  'baby-ii': 2,
  rookie: 2,
  champion: 3,
  ultimate: 4,
  mega: 5,
  ultra: 5,
};

export function feedingsToFill(stage: string): number {
  return FEEDINGS_TO_FILL[getStageLevel(stage)] ?? 2;
}

/** Fraction of the satiety meter (0..1) added per feeding, by stage. */
export function satietyPerFeed(stage: string): number {
  return 1 / feedingsToFill(stage);
}

/**
 * Satiety (0..1) empties over this many minutes of decay time.
 * Decay is paused while sleeping AND while energy is full (see App.tsx).
 */
export const SATIETY_DECAY_MINUTES = 30;

/** Number of bars shown in the hunger meter. */
export const SATIETY_BARS = 5;

/** Lit bars (0..SATIETY_BARS) for a given satiety value. */
export function satietyBars(satiety: number): number {
  return Math.round(Math.max(0, Math.min(1, satiety)) * SATIETY_BARS);
}
