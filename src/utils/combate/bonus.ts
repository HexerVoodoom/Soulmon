/**
 * Combat v3 — the single damage-bonus cap (story PR1; contexto §2.8/§2.9).
 *
 * Talent, equipment, Commerce and Rebirth may each grant a damage bonus, but
 * they do NOT stack past one global cap: bonus = min(sum, 5%). The cap applies
 * to PvP too (owner's conscious decision, §2.9). This is the only place the
 * sum is taken — no consumer may add the sources by itself.
 */

export const COMBAT_BONUS_CAP = 0.05;

export interface BonusSources {
  readonly talent?: number;
  readonly equipment?: number;
  readonly commerce?: number;
  readonly rebirth?: number;
}

/** Negative, NaN or infinite sources count as 0: dirty input never lowers or explodes the bonus. */
export function combinedBonus(sources: BonusSources): number {
  let sum = 0;
  for (const v of [sources.talent, sources.equipment, sources.commerce, sources.rebirth]) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) sum += v;
  }
  return Math.min(sum, COMBAT_BONUS_CAP);
}

/**
 * PR7b (§2.25): the PvP bonus has one channel PER ATTRIBUTE (ATK = damage dealt, DEF = damage taken,
 * SPD = attack rhythm), but the cap is still ONE: the three channels TOGETHER never pass 5%. Sources
 * (talent, equipment, Commerce, Rebirth) add up per attribute; if the grand total is over the cap every
 * channel is scaled by the same factor (the shape of the build is kept, the sum is not).
 */
export interface AttrBonus {
  readonly atk: number;
  readonly def: number;
  readonly spd: number;
}

export const NO_ATTR_BONUS: AttrBonus = { atk: 0, def: 0, spd: 0 };

export type AttrBonusSources = { readonly [K in keyof BonusSources]?: Partial<AttrBonus> | undefined };

const clean = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

export function combinedAttrBonus(sources: AttrBonusSources): AttrBonus {
  const sum = { atk: 0, def: 0, spd: 0 };
  for (const src of [sources.talent, sources.equipment, sources.commerce, sources.rebirth]) {
    if (!src || typeof src !== 'object') continue;
    sum.atk += clean(src.atk);
    sum.def += clean(src.def);
    sum.spd += clean(src.spd);
  }
  const total = sum.atk + sum.def + sum.spd;
  const k = total > COMBAT_BONUS_CAP ? COMBAT_BONUS_CAP / total : 1;
  return { atk: sum.atk * k, def: sum.def * k, spd: sum.spd * k };
}

/** A scalar (the legacy ATK-only channel) or the three channels, as `combatantAt` takes them. */
export function toAttrBonus(b: number | Partial<AttrBonus> | undefined): AttrBonus {
  if (typeof b === 'number') return { atk: clean(b), def: 0, spd: 0 };
  return { atk: clean(b?.atk), def: clean(b?.def), spd: clean(b?.spd) };
}
