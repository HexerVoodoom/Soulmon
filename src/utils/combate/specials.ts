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

/**
 * Families that aim at the ENEMY (PR3a, §2.15 P2): only these respond to the
 * area. Heal, shield and the self buffs are personal; area does not touch them.
 */
export const AREA_FAMILIES: readonly SpecialFamily[] = ['direct', 'dot', 'defDebuff'];

/**
 * Efficiency of the area (PR3a). 1 = same TOTAL budget as the single target
 * (owner: "mesmo orçamento total"). The combat core does NOT use the
 * class-system's EFICIENCIA_AREA = 0.9: with 0.9 the area direct loses 6-17pp.
 */
export const AREA_EFFICIENCY = 1;

export type PveEngine = 'arena' | 'dungeon';

/**
 * Per-engine multiplier of SPECIAL_POWER, PvE only (outside the mirror ruler).
 * Values from builder/balanco-motores.md §3 (dungeon) and §6 (arena, groups).
 */
export const PVE_FAMILY_POWER: Readonly<Record<PveEngine, Readonly<Record<SpecialFamily, number>>>> = {
  arena: { direct: 1, dot: 0.95, heal: 1.25, shield: 1.2, atkBuff: 1.35, defDebuff: 1.55, spdBuff: 1.25 },
  dungeon: { direct: 1, dot: 1.1, heal: 0.8, shield: 1, atkBuff: 1.3, defDebuff: 1.3, spdBuff: 1.5 },
};

/**
 * Cheer: 24 accepted taps = 1 discharge, at most 16 taps accepted per bucket of 3 s.
 *
 * - `energyPerDischarge` is the yield of the ARENA (`groupFightSteps`); the Dungeon and the Nightmare have no cheer
 *   (contexto §2.19). PR4 raised it from 3 to 90 and the cheer alone won 95% of the runs; PR4b (owner's decision,
 *   §2.19) fixed it at the BIGGEST value where, with the same skill, the run win rate with the cheer at the ceiling
 *   minus without cheering stays ≤ 25pp and the TTK stays within ±25% (`arena.v3.test.ts`, AC5/AC6).
 * - `pvpEnergyPerDischarge` is the PvP yield (`fight()`, the 1v1 of the duel). PR5 (contexto §2.19) calibrated it for the
 *   BUCKET cheer (the discharge of a 3 s bucket lands at the END of the bucket, `functions/api/_duel.js`): 2.5 gives ~65%
 *   against the ghost at the tap ceiling (3 gave 68.4%; §2.13 asks ~65%) and the TTK of whoever cheers moves < 2%.
 *   It is NOT the PvE one (`energyPerDischarge`): the two are separate on purpose.
 */
export const CHEER = {
  tapsFull: 24, tapsCapPerBucket: 16, bucketSeconds: 3, energyPerDischarge: 9, pvpEnergyPerDischarge: 2.5,
} as const;

/**
 * Turns tap timestamps (seconds) into discharge events for `FightOptions.cheer`.
 * Taps beyond the per-bucket cap are dropped; every `tapsFull` accepted taps fire a discharge.
 */
export function cheerEvents(taps: readonly number[], side: 0 | 1): { t: number; side: 0 | 1 }[] {
  const out: { t: number; side: 0 | 1 }[] = [];
  const perBucket = new Map<number, number>();
  let acc = 0;
  for (const tap of [...taps].filter((x) => Number.isFinite(x) && x >= 0).sort((x, y) => x - y)) {
    const b = Math.floor(tap / CHEER.bucketSeconds);
    const n = perBucket.get(b) ?? 0;
    if (n >= CHEER.tapsCapPerBucket) continue;
    perBucket.set(b, n + 1);
    acc++;
    if (acc % CHEER.tapsFull === 0) out.push({ t: tap, side });
  }
  return out;
}

/**
 * Skill tables of the v3 engine (contexto §2.15 P4: win gap between "does not act" and
 * "plays well" capped at 25pp). They live HERE, not in `utils/energia.ts`, on purpose:
 * `energia.ts` still feeds the LIVE Arena/Pesadelo/Masmorra, calibrated on 0.75/1.35 and
 * 0.5/0.85 (its simulation tests fail with the new values). PR3b swaps the engine and then
 * moves `RING_MULT`/`DODGE_REDUCE` of `energia.ts` to these numbers (a test pins them).
 */
export const RING_MULT_V3 = { ruim: 0.92, bom: 1, otimo: 1.08 } as const;
export const DODGE_REDUCE_V3 = { nada: 0, bom: 0.2, otimo: 0.35 } as const;
