/**
 * Combat v3 — N-versus-1 fight (story PR3a; contexto §2.15 P2). Pure and
 * deterministic, an extension of `fight.ts` that is EQUIVALENT to it when N = 1
 * (same first KO, same winner), ported from the measured `groupfight.ts`.
 *
 * - the player (who 0) aims at the first living foe; each foe (who 1..N) aims
 *   at the player and has its own AR(1) stream and phase:
 *   foe 0 uses `sideSeed(seed, 2)` (so N = 1 is the 1v1 stream) and foe i uses
 *   `sideSeed(seed ^ i·φ, 2)`; phases come from the same `phaseRng`: player,
 *   foe 0, then the next ones;
 * - AREA × SINGLE with the SAME total budget E: area gives each living foe
 *   E/k at the cast; single gives the target the whole E. Only the families
 *   that aim at the enemy (`AREA_FAMILIES`) respond; heal, shield and buffs are
 *   personal. A single DoT whose target falls passes the remaining ticks to the
 *   next living foe (nothing is lost);
 * - the fight ends at the first KO of the player (`foes`), when every foe has
 *   fallen (`player`), or both at the same instant (`draw`).
 */

import { attacksPerWindow, hitsToKnockOut, type Combatant } from './curve';
import { EPS, HIT_UNIT_H0, hitUnit, windowSeconds, type FighterFx, type FightSide } from './fight';
import { PHASE_SALT, VARIANCE, ar1Multiplier, mulberry32, sideSeed, type VarianceConfig } from './rng';
import {
  AREA_EFFICIENCY, AREA_FAMILIES, CHEER, ENERGY, ENERGY_TRIGGER, SPECIAL_BUDGET_HITS, type Special,
} from './specials';

const MAX_EVENTS = 400_000;

export interface GroupOptions {
  readonly seed: number;
  readonly hpScale?: number;
  /** Damage variance; `null` turns it off. Default: VARIANCE. */
  readonly variance?: VarianceConfig | null;
  /** Level whose window is used. Default: the highest level of the fight. */
  readonly windowLevel?: number;
  /** Normalised-hit constant. Default HIT_UNIT_H0; `null` = raw curve hits. */
  readonly unitH0?: number | null;
  /** Player starting HP fraction (default 1) and energy (default 0). */
  readonly startHp?: number;
  readonly startEnergy?: number;
  /** Multiplier of the n-th basic attack of `who` (0 = player, 1+i = foe i). */
  readonly hitScale?: (who: number, n: number) => number;
  /** Cheer discharges of the player (`side` 0); other sides are ignored. */
  readonly cheer?: readonly { readonly t: number; readonly side: 0 | 1 }[];
  /**
   * LIVE cheer (PR3b): called once per step of the clock; returns how many discharges the
   * player accumulated since the last call (each = CHEER.energyPerDischarge). The scene uses it
   * because the taps happen DURING the fight; the offline `cheer` list is fixed up front.
   */
  readonly cheerDrain?: () => number;
  /** Efficiency of the area. Default AREA_EFFICIENCY (1); a knob for the ruler to price the alternatives (0.9, or full E per foe). */
  readonly areaEfficiency?: number;
  /**
   * PR16 (read-only, opt-in): when `true` every event carries `fx` — the REAL status counters of each fighter
   * (index = `who`). Nothing else changes: same draws, same events, same result. Off by default (the ruler runs this
   * loop hundreds of thousands of times and pays nothing).
   */
  readonly withFx?: boolean;
}

export type GroupWinner = 'player' | 'foes' | 'draw';

export interface GroupResult {
  readonly winner: GroupWinner;
  /** Time of the end of the fight, in seconds. */
  readonly t: number;
  /** Player HP fraction and energy when it ended. */
  readonly hpLeft: number;
  readonly energyLeft: number;
  readonly casts: number;
}

/** `cast` PAUSES: the driver answers with the cast multiplier of `who` (ring, dodge...). */
export interface GroupEvent {
  readonly kind: 'attack' | 'cast' | 'tick' | 'ko';
  readonly t: number;
  /** 0 = player, 1+i = foe i. */
  readonly who: number;
  /** Index of this cast for `who` (0-based); 0 for other kinds. */
  readonly n: number;
  readonly frac: number;
  readonly hp: number;
  readonly foesHp: readonly number[];
  readonly energy: number;
  /**
   * Only with `GroupOptions.withFx` (PR16): the real counters of each fighter right after this event (for a `cast`,
   * after it takes effect — the field is filled when the driver answers the pause). Index = `who`.
   */
  readonly fx?: readonly FighterFx[];
}

interface G {
  readonly who: number;
  readonly c: Combatant;
  readonly sp: Special | null;
  readonly area: 'single' | 'area';
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

/** Seed of the stream of foe i (foe 0 is the 1v1 stream, so N = 1 ≡ fight()). */
export function foeSeed(seed: number, i: number): number {
  return i === 0 ? sideSeed(seed, 2) : sideSeed(seed ^ Math.imul(i, 0x9e3779b1), 2);
}

export function* groupFightSteps(
  player: FightSide,
  foes: readonly FightSide[],
  opts: GroupOptions,
): Generator<GroupEvent, GroupResult, number | undefined> {
  const seed = opts.seed | 0;
  const hpS = opts.hpScale ?? 1;
  const variance = opts.variance === undefined ? VARIANCE : opts.variance;
  const wl = opts.windowLevel ?? Math.max(player.combatant.level, ...foes.map((f) => f.combatant.level));
  const win = windowSeconds(wl);
  const u = opts.unitH0 === null ? 1 : hitUnit(wl, opts.unitH0 ?? HIT_UNIT_H0);
  const interval = (spd: number) => (win / attacksPerWindow(spd)) * u;
  const ph = mulberry32(seed ^ PHASE_SALT);
  const phases = [ph(), ph()];
  for (let i = 1; i < foes.length; i++) phases.push(ph());

  const mk = (s: FightSide, who: number, stream: number, hp0: number, en0: number): G => {
    const c = { ...s.combatant, hp: s.combatant.hp * hpS };
    const r = mulberry32(stream);
    return {
      who, c, sp: s.special, area: s.area ?? 'single', mult: variance ? ar1Multiplier(r, variance) : () => 1,
      hp: hp0, en: en0, shield: 0, next: interval(c.spd) * phases[who], casts: 0, dead: Infinity,
      nAtk: 0, nVuln: 0, nSpd: 0, nHit: 0,
    };
  };
  const pl = mk(player, 0, sideSeed(seed, 1), opts.startHp ?? 1, opts.startEnergy ?? 0);
  const E = foes.map((f, i) => mk(f, i + 1, foeSeed(seed, i), 1, 0));
  const all = [pl, ...E];
  const timed: { t: number; fn: () => void }[] = [];
  for (const ch of opts.cheer ?? []) {
    if (ch.side !== 0) continue;
    timed.push({ t: ch.t, fn: () => { if (pl.sp && pl.dead === Infinity) pl.en += CHEER.energyPerDischarge; } });
  }
  let t = 0;
  let tPrev = 0;
  const pending: GroupEvent[] = [];
  const alive = () => E.filter((f) => f.dead === Infinity);
  const target = () => alive()[0];
  const hitsOn = (a: G, d: G) => hitsToKnockOut(a.c, d.c) / u;
  /** DoT ticks still to land: who each pending tick lands on (single: the current target, as the tick itself will pick). */
  const dots: { owner: G; vs: readonly G[]; single: boolean }[] = [];
  const snapFx = (): FighterFx[] => {
    const left = all.map(() => 0);
    for (const d of dots) {
      if (d.single) { const v = target() ?? d.vs[0]; left[all.indexOf(v)]++; } else for (const v of d.vs) left[all.indexOf(v)]++;
    }
    return all.map((f, i) => {
      const atk = f === pl ? target() : pl;
      return {
        nAtk: f.nAtk, nVuln: f.nVuln, nSpd: f.nSpd, shield: f.shield,
        shieldHits: atk ? f.shield * hitsOn(atk, f) : 0, dot: left[i],
      };
    });
  };
  const ev = (kind: GroupEvent['kind'], who: number, frac: number, n = 0): GroupEvent => (
    opts.withFx
      ? { kind, t, who, n, frac, hp: pl.hp, foesHp: E.map((f) => f.hp), energy: pl.en, fx: snapFx() }
      : { kind, t, who, n, frac, hp: pl.hp, foesHp: E.map((f) => f.hp), energy: pl.en }
  );
  const gain = (f: G, x: number, per: number) => {
    if (f.sp && f.dead === Infinity) f.en += per * x;
  };
  const hit = (src: G, v: G, frac: number, kind: 'attack' | 'tick') => {
    if (v.dead < Infinity) return;
    let amt = frac;
    if (v.shield > EPS) {
      const ab = Math.min(v.shield, amt);
      v.shield -= ab;
      amt -= ab;
    }
    v.hp -= amt;
    gain(src, frac, ENERGY.perDealt);
    gain(v, frac, ENERGY.perReceived);
    pending.push(ev(kind, src.who, frac));
  };
  const cast = (me: G, t0: number, scale: number) => {
    const sp = me.sp as Special;
    const Eb = SPECIAL_BUDGET_HITS * sp.power * scale;
    const iv = interval(me.c.spd);
    const enemies = me === pl ? alive() : [pl];
    const tgt = enemies[0];
    if (!tgt) return;
    const isArea = me.area === 'area' && AREA_FAMILIES.includes(sp.family);
    const spread = isArea ? enemies : [tgt];
    // same total budget: the area divides it (times the area efficiency, 1), the single concentrates it
    const share = isArea ? (Eb * (opts.areaEfficiency ?? AREA_EFFICIENCY)) / spread.length : Eb;
    switch (sp.family) {
      case 'direct':
        for (const v of spread) hit(me, v, (share * me.mult()) / hitsOn(me, v), 'attack');
        break;
      case 'dot':
        for (let k = 1; k <= 3; k++) {
          const vs = [...spread];
          const single = spread.length === 1 && me === pl;
          const rec = { owner: me, vs, single };
          dots.push(rec);
          timed.push({
            t: t0 + 0.25 * iv * k,
            // single: the remaining ticks pass to the next living foe (nothing is lost);
            // area: only whoever was inside the radius at the cast
            fn: () => {
              dots.splice(dots.indexOf(rec), 1);
              const ts = single ? [target() ?? vs[0]] : vs;
              for (const v of ts) hit(me, v, (share / 3) * me.mult() / hitsOn(me, v), 'tick');
            },
          });
        }
        break;
      case 'defDebuff':
        for (const v of spread) v.nVuln += share;
        break;
      case 'heal':
        me.hp += Math.min(1 - me.hp, Eb / hitsOn(tgt, me));
        break;
      case 'shield':
        me.shield += Eb / hitsOn(tgt, me);
        break;
      case 'atkBuff':
        me.nAtk += Eb;
        break;
      case 'spdBuff':
        me.nSpd += Eb;
        me.next = Math.min(me.next, t0 + iv / 2);
        break;
    }
  };
  function* flush(): Generator<GroupEvent, void, number | undefined> {
    while (pending.length) yield pending.shift() as GroupEvent;
  }
  function* markDead(): Generator<GroupEvent, void, number | undefined> {
    for (const f of all) {
      if (f.hp <= EPS && f.dead === Infinity) {
        f.dead = t;
        yield ev('ko', f.who, 0);
      }
    }
  }
  function* tryCast(me: G, tt: number): Generator<GroupEvent, void, number | undefined> {
    if (me.sp && me.dead === Infinity && me.en >= ENERGY_TRIGGER - 1e-6) {
      me.en = Math.max(0, me.en - ENERGY_TRIGGER);
      me.casts++;
      const e = ev('cast', me.who, 0, me.casts - 1);
      const m = yield e;
      cast(me, tt, m ?? 1);
      if (opts.withFx) (e as { fx?: readonly FighterFx[] }).fx = snapFx(); // the cast reports the state AFTER it takes effect
    }
  }

  for (let g = 0; g < MAX_EVENTS; g++) {
    let tt = Infinity;
    for (const e of timed) if (e.t < tt) tt = e.t;
    if (opts.cheerDrain && pl.sp && pl.dead === Infinity) {
      const n = Math.max(0, Math.floor(opts.cheerDrain()));
      if (n > 0) pl.en += CHEER.energyPerDischarge * n;
    }
    let tEn = Infinity;
    for (const f of all) {
      if (f.sp && f.dead === Infinity) tEn = Math.min(tEn, t + Math.max(0, ENERGY_TRIGGER - f.en) / ENERGY.perSecond);
    }
    let tN = Infinity;
    for (const f of all) if (f.dead === Infinity) tN = Math.min(tN, f.next);
    t = Math.min(tN, tt, tEn);
    for (const f of all) if (f.sp && f.dead === Infinity) f.en += ENERGY.perSecond * (t - tPrev);
    tPrev = t;
    for (let i = timed.length - 1; i >= 0; i--) if (timed[i].t - t < EPS) timed.splice(i, 1)[0].fn();
    for (const me of all) {
      if (me.dead < Infinity || me.next - t >= EPS) continue;
      const v = me === pl ? target() : pl;
      if (!v) continue;
      let mulN = 1;
      if (me.nAtk > EPS) { const x = Math.min(1, me.nAtk); mulN += x; me.nAtk -= x; }
      if (v.nVuln > EPS) { const x = Math.min(1, v.nVuln); mulN += x; v.nVuln -= x; }
      const hs = opts.hitScale ? opts.hitScale(me.who, me.nHit) : 1;
      me.nHit++;
      hit(me, v, (mulN * me.mult() * hs) / hitsOn(me, v), 'attack');
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
    for (const f of all) yield* tryCast(f, t);
    yield* flush();
    yield* markDead();
    const pDead = pl.dead < Infinity;
    const fDead = alive().length === 0;
    if (pDead || fDead) {
      const winner: GroupWinner = pDead && fDead ? 'draw' : pDead ? 'foes' : 'player';
      return { winner, t, hpLeft: Math.max(0, pl.hp), energyLeft: pl.en, casts: pl.casts };
    }
  }
  throw new Error(`combate: groupFight did not end within ${MAX_EVENTS} events (seed ${seed})`);
}

/** Plays a group fight; `castMult(who, n)` answers each cast (default 1). */
export function groupFight(
  player: FightSide,
  foes: readonly FightSide[],
  opts: GroupOptions,
  castMult: (who: number, n: number) => number = () => 1,
): GroupResult {
  const g = groupFightSteps(player, foes, opts);
  let r = g.next();
  while (!r.done) r = g.next(r.value.kind === 'cast' ? castMult(r.value.who, r.value.n) : undefined);
  return r.value;
}

