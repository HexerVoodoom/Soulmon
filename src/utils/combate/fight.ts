/**
 * Combat v3 — the fight simulator (story PR1, extended by PR3a). Pure and
 * deterministic: the result is a function of (sides, seed, options) only.
 *
 * Model (ported from the spike's `fight()` in cv3-sim3/cv3-sim6):
 * - each side has HP normalised to 1; one attack removes mult/hits of it,
 *   where `hits` comes from the curve and `mult` from the side's AR(1) stream;
 * - NORMALISED HIT (PR3a, §2.15 P1): `hits` is divided by `u = hitUnit(L)`, so a
 *   hit is ~1/10 of the balanced mirror at every level, and the attack interval
 *   is multiplied by `u` (the mirror still lasts MIRROR_SECONDS);
 * - the attack interval is window/attacksPerWindow(SPD); the window is
 *   normalised per level so the balanced mirror lasts MIRROR_SECONDS;
 * - "ghost" timing: the fight runs until BOTH sides are down so each side's
 *   time-to-be-knocked-out is measured; whoever falls first loses, and the
 *   same instant is a DRAW (a valid result, contexto §2.4). `stopAtFirstKo`
 *   ends at the first KO instead (PvE: no ghost timing) and reports HP/energy left;
 * - energy and specials as in `specials.ts`;
 * - `fightSteps` is the generator; a `cast` event pauses and receives the cast
 *   multiplier (ring / dodge). `fight()` is the driver that answers 1.
 */

import { attacksPerWindow, hitsToKnockOut, type Combatant } from './curve';
import { REFERENCE_BUILDS, combatantAt } from './level';
import { PHASE_SALT, VARIANCE, ar1Multiplier, mulberry32, sideSeed, type VarianceConfig } from './rng';
import { CHEER, ENERGY, ENERGY_TRIGGER, SPECIAL_BUDGET_HITS, type Special } from './specials';

/** The balanced mirror of every level lasts this long (seconds). */
export const MIRROR_SECONDS = 25;

/**
 * Normalised hit: every attack is worth ~1/H0 of the balanced mirror of ANY
 * level, so "a hit" means the same at L1 and at L40.
 */
export const HIT_UNIT_H0 = 10;

/**
 * PvP (PR5): both HPs are multiplied by this so the duel lasts ~38 s (balanco-motores §4, measured 38.1-39.1 s).
 * Mirrored in `functions/api/_combate.js` (`PVP_HP_SCALE`); the parity test pins both.
 */
export const PVP_HP_SCALE = 1.7;

export const EPS = 1e-9;
export const DRAW_EPS = 1e-6;
const MAX_EVENTS = 200_000;

/** Window length (s) at a level: the balanced mirror takes MIRROR_SECONDS. */
export function windowSeconds(level: number): number {
  const d = combatantAt(level, REFERENCE_BUILDS.balanced);
  return (MIRROR_SECONDS * attacksPerWindow(d.spd)) / hitsToKnockOut(d, d);
}

/** Curve hits per normalised hit at a level: u = hitsToKnockOut(bal, bal) / H0. */
export function hitUnit(level: number, h0: number = HIT_UNIT_H0): number {
  const bal = combatantAt(level, REFERENCE_BUILDS.balanced);
  return hitsToKnockOut(bal, bal) / h0;
}

export interface FightSide {
  readonly combatant: Combatant;
  readonly special: Special | null;
  /** Read only by `groupFight`: 'area' splits the special over every living foe. Default 'single'. */
  readonly area?: 'single' | 'area';
}

export interface CheerEvent {
  readonly t: number;
  readonly side: 0 | 1;
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
  /** Normalised-hit constant. Default HIT_UNIT_H0; `null` = raw curve hits (u = 1, the PR1 behaviour). */
  readonly unitH0?: number | null;
  /** Starting HP fraction of A and B (default 1, 1). */
  readonly startHp?: readonly [number, number];
  /** Starting energy of A and B (default 0, 0). */
  readonly startEnergy?: readonly [number, number];
  /** Multiplier of the n-th (0-based) BASIC attack of a side (auto-defence, counter-attack...). Default 1. */
  readonly hitScale?: (who: 0 | 1, n: number) => number;
  /** Cheer discharges: at `t` seconds `side` gains CHEER.pvpEnergyPerDischarge energy (if it has a special). The 1v1 is the PvP's. */
  readonly cheer?: readonly CheerEvent[];
  /** End at the first KO (PvE: no ghost timing); HP/energy left are reported at that instant. */
  readonly stopAtFirstKo?: boolean;
}

export type FightWinner = 'A' | 'B' | 'draw';

export interface FightResult {
  /** Time at which A (resp. B) is knocked out, in seconds (Infinity if it never fell, with stopAtFirstKo). */
  readonly timeA: number;
  readonly timeB: number;
  readonly castsA: number;
  readonly castsB: number;
  readonly winner: FightWinner;
  /** HP fraction and energy of A and B when the fight ended. */
  readonly hpA: number;
  readonly hpB: number;
  readonly energyA: number;
  readonly energyB: number;
}

/**
 * Step event. `cast` PAUSES the fight: the driver answers with the cast
 * multiplier (ring, dodge...) through `next(mult)`; `fight()` answers 1.
 */
export interface FightEvent {
  readonly kind: 'attack' | 'cast' | 'tick' | 'ko';
  readonly t: number;
  /** 0 = A, 1 = B: who attacks / casts / is knocked out. */
  readonly side: 0 | 1;
  /** HP fraction dealt (attack/tick); 0 for cast/ko. */
  readonly frac: number;
  readonly hp: readonly [number, number];
  readonly energy: readonly [number, number];
}

interface Fighter {
  readonly c: Combatant;
  readonly sp: Special | null;
  readonly mult: () => number;
  hp: number;
  en: number;
  shield: number;
  next: number;
  casts: number;
  dead: number;
  nAtk: number;
  nVuln: number;
  nSpd: number;
  nHit: number;
}

interface Timed {
  readonly t: number;
  readonly fn: () => void;
}

export function* fightSteps(
  a: FightSide,
  b: FightSide,
  opts: FightOptions,
): Generator<FightEvent, FightResult, number | undefined> {
  const seed = opts.seed | 0;
  const hpScale = opts.hpScale ?? 1;
  const variance = opts.variance === undefined ? VARIANCE : opts.variance;
  const wl = opts.windowLevel ?? Math.max(a.combatant.level, b.combatant.level);
  const win = windowSeconds(wl);
  const u = opts.unitH0 === null ? 1 : hitUnit(wl, opts.unitH0 ?? HIT_UNIT_H0);
  const interval = (spd: number) => (win / attacksPerWindow(spd)) * u;
  const phaseRng = mulberry32(seed ^ PHASE_SALT);
  const drawn = [phaseRng(), phaseRng()];
  const phases = opts.phases ?? drawn;

  const mk = (s: FightSide, i: 0 | 1): Fighter => {
    const c = { ...s.combatant, hp: s.combatant.hp * hpScale };
    const r = mulberry32(sideSeed(seed, (i + 1) as 1 | 2));
    const mult = variance ? ar1Multiplier(r, variance) : () => 1;
    return {
      c, sp: s.special, mult, hp: opts.startHp?.[i] ?? 1, en: opts.startEnergy?.[i] ?? 0, shield: 0,
      next: interval(c.spd) * phases[i], casts: 0, dead: Infinity, nAtk: 0, nVuln: 0, nSpd: 0, nHit: 0,
    };
  };
  const F: [Fighter, Fighter] = [mk(a, 0), mk(b, 1)];
  const timed: Timed[] = [];
  for (const ch of opts.cheer ?? []) {
    timed.push({
      t: ch.t,
      fn: () => {
        const f = F[ch.side];
        if (f.sp && f.dead === Infinity) f.en += CHEER.pvpEnergyPerDischarge;
      },
    });
  }
  let t = 0;
  let tPrev = 0;
  const pending: FightEvent[] = [];
  const ev = (kind: FightEvent['kind'], side: 0 | 1, frac: number, at: number): FightEvent => (
    { kind, t: at, side, frac, hp: [F[0].hp, F[1].hp], energy: [F[0].en, F[1].en] }
  );

  const hitsOn = (me: Fighter, foe: Fighter) => hitsToKnockOut(me.c, foe.c) / u;
  const gain = (f: Fighter, x: number, per: number) => {
    if (f.sp && f.dead === Infinity) f.en += per * x;
  };
  const hit = (src: Fighter, v: Fighter, frac: number, kind: 'attack' | 'tick') => {
    if (v.dead < Infinity) return; // leftover damage expires
    let amt = frac;
    if (v.shield > EPS) {
      const ab = Math.min(v.shield, amt);
      v.shield -= ab;
      amt -= ab;
    }
    v.hp -= amt;
    gain(src, frac, ENERGY.perDealt);
    gain(v, frac, ENERGY.perReceived);
    pending.push(ev(kind, src === F[0] ? 0 : 1, frac, t));
  };
  const cast = (me: Fighter, foe: Fighter, t0: number, scale: number) => {
    const sp = me.sp as Special;
    const E = SPECIAL_BUDGET_HITS * sp.power * scale;
    const iv = interval(me.c.spd);
    switch (sp.family) {
      case 'direct':
        hit(me, foe, (E * me.mult()) / hitsOn(me, foe), 'attack');
        break;
      case 'dot':
        for (let k = 1; k <= 3; k++) {
          timed.push({ t: t0 + 0.25 * iv * k, fn: () => hit(me, foe, (E / 3) * me.mult() / hitsOn(me, foe), 'tick') });
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
  function* flush(): Generator<FightEvent, void, number | undefined> {
    while (pending.length) yield pending.shift() as FightEvent;
  }
  function* markDead(): Generator<FightEvent, void, number | undefined> {
    for (const i of [0, 1] as const) {
      if (F[i].hp <= EPS && F[i].dead === Infinity) {
        F[i].dead = t;
        yield ev('ko', i, 0, t);
      }
    }
  }
  function* tryCast(i: 0 | 1, tt: number): Generator<FightEvent, void, number | undefined> {
    const me = F[i];
    if (me.sp && me.dead === Infinity && me.en >= ENERGY_TRIGGER - 1e-6) {
      me.en = Math.max(0, me.en - ENERGY_TRIGGER);
      me.casts++;
      const m = yield ev('cast', i, 0, tt);
      cast(me, F[1 - i], tt, m ?? 1);
    }
  }
  const finish = (): FightResult => {
    const timeA = F[0].dead, timeB = F[1].dead;
    const winner: FightWinner = Math.abs(timeA - timeB) < DRAW_EPS ? 'draw' : timeA > timeB ? 'A' : 'B';
    return {
      timeA, timeB, castsA: F[0].casts, castsB: F[1].casts, winner,
      hpA: Math.max(0, F[0].hp), hpB: Math.max(0, F[1].hp), energyA: F[0].en, energyB: F[1].en,
    };
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
      if (me.nAtk > EPS) { const x = Math.min(1, me.nAtk); mulN += x; me.nAtk -= x; }
      if (foe.nVuln > EPS) { const x = Math.min(1, foe.nVuln); mulN += x; foe.nVuln -= x; }
      const hs = opts.hitScale ? opts.hitScale(i, me.nHit) : 1;
      me.nHit++;
      hit(me, foe, (mulN * me.mult() * hs) / hitsOn(me, foe), 'attack');
      if (me.nSpd > EPS) {
        const x = Math.min(1, me.nSpd);
        me.nSpd -= x;
        me.next = t + interval(me.c.spd) / (1 + x);
      } else {
        me.next = t + interval(me.c.spd);
      }
    }
    yield* flush();
    yield* markDead();
    yield* tryCast(0, t);
    yield* tryCast(1, t);
    yield* flush();
    yield* markDead();
    // An immortal side (heal above the ghost's damage) is cut at 10× + 60 s.
    for (const i of [0, 1] as const) {
      if (F[i].dead < Infinity && F[1 - i].dead === Infinity && t > 10 * F[i].dead + 60) F[1 - i].dead = t;
    }
    const over = opts.stopAtFirstKo
      ? F[0].dead < Infinity || F[1].dead < Infinity
      : F[0].dead < Infinity && F[1].dead < Infinity;
    if (over) return finish();
  }
  throw new Error(`combate: fight did not end within ${MAX_EVENTS} events (seed ${seed})`);
}

/** Plays a fight answering 1 to every cast; the result equals stepping `fightSteps` by hand. */
export function fight(a: FightSide, b: FightSide, opts: FightOptions): FightResult {
  const g = fightSteps(a, b, opts);
  let r = g.next();
  while (!r.done) r = g.next(1);
  return r.value;
}
