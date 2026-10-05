/**
 * Combat v3 — the fight simulator (story PR1). Pure and deterministic: the
 * result is a function of (sides, seed, options) only.
 *
 * Model (ported from the spike's `fight()` in cv3-sim3/cv3-sim6):
 * - each side has HP normalised to 1; one attack removes mult/hits of it,
 *   where `hits` comes from the curve and `mult` from the side's AR(1) stream;
 * - the attack interval is window/attacksPerWindow(SPD); the window is
 *   normalised per level so the balanced mirror lasts MIRROR_SECONDS;
 * - "ghost" timing: the fight runs until BOTH sides are down so each side's
 *   time-to-be-knocked-out is measured; whoever falls first loses, and the
 *   same instant is a DRAW (a valid result, contexto §2.4);
 * - energy and specials as in `specials.ts`.
 */

import { attacksPerWindow, hitsToKnockOut, type Combatant } from './curve';
import { REFERENCE_BUILDS, combatantAt } from './level';
import { PHASE_SALT, VARIANCE, ar1Multiplier, mulberry32, sideSeed, type VarianceConfig } from './rng';
import { ENERGY, ENERGY_TRIGGER, SPECIAL_BUDGET_HITS, type Special } from './specials';

/** The balanced mirror of every level lasts this long (seconds). */
export const MIRROR_SECONDS = 25;

const EPS = 1e-9;
const DRAW_EPS = 1e-6;
const MAX_EVENTS = 200_000;

/** Window length (s) at a level: the balanced mirror takes MIRROR_SECONDS. */
export function windowSeconds(level: number): number {
  const d = combatantAt(level, REFERENCE_BUILDS.balanced);
  return (MIRROR_SECONDS * attacksPerWindow(d.spd)) / hitsToKnockOut(d, d);
}

export interface FightSide {
  readonly combatant: Combatant;
  readonly special: Special | null;
}

export interface FightOptions {
  /** Fight seed (in PvP it is drawn by the server). */
  readonly seed: number;
  /** Multiplies both HPs (the ruler measures with HP×3 so a single special does not dominate). */
  readonly hpScale?: number;
  /** Damage variance; `null` turns it off. Default: VARIANCE. */
  readonly variance?: VarianceConfig | null;
  /** Level whose window is used. Default: the higher of the two levels. */
  readonly windowLevel?: number;
  /** Opening phases (fraction of the first interval) of A and B. Default: drawn from the seed. */
  readonly phases?: readonly [number, number];
}

export type FightWinner = 'A' | 'B' | 'draw';

export interface FightResult {
  /** Time at which A (resp. B) is knocked out, in seconds. */
  readonly timeA: number;
  readonly timeB: number;
  readonly castsA: number;
  readonly castsB: number;
  readonly winner: FightWinner;
}

interface Fighter {
  readonly c: Combatant;
  readonly sp: Special | null;
  readonly mult: () => number;
  hp: number;
  en: number;
  inMul: number;
  shield: number;
  next: number;
  casts: number;
  dead: number;
  nAtk: number;
  nVuln: number;
  nSpd: number;
}

interface Timed {
  readonly t: number;
  readonly fn: () => void;
}

export function fight(a: FightSide, b: FightSide, opts: FightOptions): FightResult {
  const seed = opts.seed | 0;
  const hpScale = opts.hpScale ?? 1;
  const variance = opts.variance === undefined ? VARIANCE : opts.variance;
  const win = windowSeconds(opts.windowLevel ?? Math.max(a.combatant.level, b.combatant.level));
  const interval = (spd: number) => win / attacksPerWindow(spd);
  const phaseRng = mulberry32(seed ^ PHASE_SALT);
  const drawn = [phaseRng(), phaseRng()];
  const phases = opts.phases ?? drawn;

  const mk = (s: FightSide, i: 0 | 1): Fighter => {
    const c = { ...s.combatant, hp: s.combatant.hp * hpScale };
    const r = mulberry32(sideSeed(seed, (i + 1) as 1 | 2));
    const mult = variance ? ar1Multiplier(r, variance) : () => 1;
    return {
      c, sp: s.special, mult, hp: 1, en: 0, inMul: 1, shield: 0,
      next: interval(c.spd) * phases[i], casts: 0, dead: Infinity, nAtk: 0, nVuln: 0, nSpd: 0,
    };
  };
  const F: [Fighter, Fighter] = [mk(a, 0), mk(b, 1)];
  const timed: Timed[] = [];
  let t = 0;
  let tPrev = 0;

  const hitsOn = (me: Fighter, foe: Fighter) => hitsToKnockOut(me.c, foe.c);
  const gain = (f: Fighter, x: number, per: number) => {
    if (f.sp && f.dead === Infinity) f.en += per * x;
  };
  const hit = (src: Fighter, v: Fighter, frac: number) => {
    if (v.dead < Infinity) return; // leftover damage expires
    const dealt = frac * v.inMul;
    let amt = dealt;
    if (v.shield > EPS) {
      const ab = Math.min(v.shield, amt);
      v.shield -= ab;
      amt -= ab;
    }
    v.hp -= amt;
    gain(src, dealt, ENERGY.perDealt);
    gain(v, dealt, ENERGY.perReceived);
  };
  const cast = (me: Fighter, foe: Fighter, t0: number) => {
    const sp = me.sp as Special;
    const E = SPECIAL_BUDGET_HITS * sp.power;
    const iv = interval(me.c.spd);
    switch (sp.family) {
      case 'direct':
        hit(me, foe, (E * me.mult()) / hitsOn(me, foe));
        break;
      case 'dot':
        for (let k = 1; k <= 3; k++) {
          timed.push({ t: t0 + 0.25 * iv * k, fn: () => hit(me, foe, (E / 3) * me.mult() / hitsOn(me, foe)) });
        }
        break;
      case 'heal':
        me.hp += Math.min(1 - me.hp, E / hitsOn(foe, me));
        break;
      case 'shield':
        me.shield += E / hitsOn(foe, me);
        break;
      case 'atkBuff':
        me.nAtk += E;
        break;
      case 'defDebuff':
        foe.nVuln += E;
        break;
      case 'spdBuff':
        me.nSpd += E;
        me.next = Math.min(me.next, t0 + iv / 2);
        break;
    }
  };
  const tryCast = (i: 0 | 1, tt: number) => {
    const me = F[i];
    if (me.sp && me.dead === Infinity && me.en >= ENERGY_TRIGGER - 1e-6) {
      me.en = Math.max(0, me.en - ENERGY_TRIGGER);
      me.casts++;
      cast(me, F[1 - i], tt);
    }
  };

  for (let g = 0; g < MAX_EVENTS; g++) {
    let tt = Infinity;
    for (const e of timed) if (e.t < tt) tt = e.t;
    let tEn = Infinity;
    for (const f of F) {
      if (f.sp && f.dead === Infinity) tEn = Math.min(tEn, t + Math.max(0, ENERGY_TRIGGER - f.en) / ENERGY.perSecond);
    }
    t = Math.min(F[0].next, F[1].next, tt, tEn);
    for (const f of F) if (f.sp && f.dead === Infinity) f.en += ENERGY.perSecond * (t - tPrev);
    tPrev = t;
    for (let i = timed.length - 1; i >= 0; i--) {
      if (timed[i].t - t < EPS) timed.splice(i, 1)[0].fn();
    }
    for (const i of [0, 1] as const) {
      const me = F[i];
      const foe = F[1 - i];
      if (me.next - t >= EPS) continue;
      let mulN = 1;
      if (me.nAtk > EPS) { const u = Math.min(1, me.nAtk); mulN += u; me.nAtk -= u; }
      if (foe.nVuln > EPS) { const u = Math.min(1, foe.nVuln); mulN += u; foe.nVuln -= u; }
      hit(me, foe, (mulN * me.mult()) / hitsOn(me, foe));
      if (me.nSpd > EPS) {
        const u = Math.min(1, me.nSpd);
        me.nSpd -= u;
        me.next = t + interval(me.c.spd) / (1 + u);
      } else {
        me.next = t + interval(me.c.spd);
      }
    }
    for (const f of F) if (f.hp <= EPS && f.dead === Infinity) f.dead = t;
    tryCast(0, t);
    tryCast(1, t);
    for (const f of F) if (f.hp <= EPS && f.dead === Infinity) f.dead = t;
    // An immortal side (heal above the ghost's damage) is cut at 10× + 60 s.
    for (const i of [0, 1] as const) {
      if (F[i].dead < Infinity && F[1 - i].dead === Infinity && t > 10 * F[i].dead + 60) F[1 - i].dead = t;
    }
    if (F[0].dead < Infinity && F[1].dead < Infinity) {
      const timeA = F[0].dead, timeB = F[1].dead;
      const winner: FightWinner = Math.abs(timeA - timeB) < DRAW_EPS ? 'draw' : timeA > timeB ? 'A' : 'B';
      return { timeA, timeB, castsA: F[0].casts, castsB: F[1].casts, winner };
    }
  }
  throw new Error(`combate: fight did not end within ${MAX_EVENTS} events (seed ${seed})`);
}
