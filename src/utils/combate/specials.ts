/**
 * Combat v3 — special-move families and energy (story PR1).
 *
 * Every special spends the same budget E = 3 hits, shaped by its family. The
 * per-family power `p` was calibrated in the spike so that the time to win of
 * each family stays within ±5% of the reference (direct damage), measured by
 * the paired ruler (see `ruler.ts`). Buffs are allowed −15% at rookie (§2.5).
 */

/** Budget of every special, in hits. */
export const SPECIAL_BUDGET_HITS = 3;

/** Lasting buff/debuff families act on the next E·p own attacks (not on a timer). */
export const SPECIAL_FAMILIES = ['direct', 'dot', 'heal', 'shield', 'atkBuff', 'defDebuff', 'spdBuff'] as const;
export type SpecialFamily = (typeof SPECIAL_FAMILIES)[number];

/** The family every other one is measured against. */
export const REFERENCE_FAMILY: SpecialFamily = 'direct';

/** Families that get the rookie tolerance (−15%) in the ruler. */
export const BUFF_FAMILIES: readonly SpecialFamily[] = ['atkBuff', 'defDebuff', 'spdBuff'];

/** Calibrated power per family (spike-sistema.md, held in the Pass 1 holdout). */
export const SPECIAL_POWER: Readonly<Record<SpecialFamily, number>> = {
  direct: 1,
  dot: 1,
  heal: 1,
  shield: 1,
  atkBuff: 1.01,
  defDebuff: 1.01,
  spdBuff: 1.82,
};

export interface Special {
  readonly family: SpecialFamily;
  readonly power: number;
}

export function specialOf(family: SpecialFamily): Special {
  return { family, power: SPECIAL_POWER[family] };
}

/**
 * Energy: 60 per fraction of the foe's HP dealt, 60 per fraction of own HP
 * received, +2 per second; the special fires at 100 (and spends 100).
 */
export interface EnergyRates {
  readonly perDealt: number;
  readonly perReceived: number;
  readonly perSecond: number;
}
export const ENERGY: EnergyRates = { perDealt: 60, perReceived: 60, perSecond: 2 };
export const ENERGY_TRIGGER = 100;
