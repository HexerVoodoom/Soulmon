// Proposta PR3a: luta N×1 (1 jogador × N inimigos simultâneos), extensão pura do núcleo.
// Com N=1 e sem ganchos tem de dar o mesmo 1º KO e o mesmo vencedor que fight() (checado em grupo.ts).
import { attacksPerWindow, hitsToKnockOut, type Combatant } from '../src/utils/combate/curve';
import { windowSeconds } from '../src/utils/combate/fight';
import { combatantAt, REFERENCE_BUILDS } from '../src/utils/combate/level';
import { PHASE_SALT, VARIANCE, ar1Multiplier, mulberry32, sideSeed, type VarianceConfig } from '../src/utils/combate/rng';
import { ENERGY, ENERGY_TRIGGER, SPECIAL_BUDGET_HITS, type Special } from '../src/utils/combate/specials';

export type Area = 'single' | 'area';
export interface GSide { combatant: Combatant; special: Special | null; area?: Area }
export interface GOpts {
  seed: number; hpScale?: number; variance?: VarianceConfig | null; windowLevel?: number; unitH0?: number;
  startHp?: number; startEnergy?: number;
  castScale?: (who: number, n: number) => number; // who 0 = jogador, 1+i = inimigo i
  hitScale?: (who: number, n: number) => number;
}
/** Família que respeita a área (as de alvo inimigo). */
export const AREA_FAMILIES = new Set(['direct', 'dot', 'defDebuff']);
const foeSeed = (seed: number, i: number) => (i === 0 ? sideSeed(seed, 2) : sideSeed(seed ^ Math.imul(i, 0x9e3779b1), 2));

export function groupFight(P: GSide, foes: GSide[], o: GOpts) {
  const EPS = 1e-9;
  const seed = o.seed | 0; const hpS = o.hpScale ?? 1;
  const variance = o.variance === undefined ? VARIANCE : o.variance;
  const wl = o.windowLevel ?? Math.max(P.combatant.level, ...foes.map((f) => f.combatant.level));
  const win = windowSeconds(wl);
  const bal = combatantAt(wl, REFERENCE_BUILDS.balanced);
  const u = o.unitH0 ? hitsToKnockOut(bal, bal) / o.unitH0 : 1;
  const interval = (spd: number) => (win / attacksPerWindow(spd)) * u;
  const ph = mulberry32(seed ^ PHASE_SALT); const phases = [ph(), ph()]; for (let i = 1; i < foes.length; i++) phases.push(ph());
  const mk = (s: GSide, who: number, stream: number, hp0: number, en0: number) => {
    const c = { ...s.combatant, hp: s.combatant.hp * hpS };
    const r = mulberry32(stream);
    return { who, c, sp: s.special, area: s.area ?? 'single', mult: variance ? ar1Multiplier(r, variance) : () => 1, hp: hp0, en: en0, shield: 0,
      next: interval(c.spd) * phases[who], casts: 0, dead: Infinity, nAtk: 0, nVuln: 0, nSpd: 0, nHit: 0 };
  };
  type F = ReturnType<typeof mk>;
  const pl = mk(P, 0, sideSeed(seed, 1), o.startHp ?? 1, o.startEnergy ?? 0);
  const E: F[] = foes.map((f, i) => mk(f, i + 1, foeSeed(seed, i), 1, 0));
  const all = [pl, ...E];
  const timed: { t: number; fn: () => void }[] = [];
  let t = 0, tPrev = 0;
  const alive = () => E.filter((f) => f.dead === Infinity);
  const target = () => alive()[0];
  const hitsOn = (a: F, d: F) => hitsToKnockOut(a.c, d.c) / u;
  const gain = (f: F, x: number, per: number) => { if (f.sp && f.dead === Infinity) f.en += per * x; };
  const hit = (src: F, v: F, frac: number) => {
    if (v.dead < Infinity) return;
    let amt = frac;
    if (v.shield > EPS) { const ab = Math.min(v.shield, amt); v.shield -= ab; amt -= ab; }
    v.hp -= amt; gain(src, frac, ENERGY.perDealt); gain(v, frac, ENERGY.perReceived);
  };
  const cast = (me: F, t0: number) => {
    const sp = me.sp as Special;
    const Eb = SPECIAL_BUDGET_HITS * sp.power * (o.castScale ? o.castScale(me.who, me.casts - 1) : 1);
    const iv = interval(me.c.spd);
    const enemies = me === pl ? alive() : [pl];
    const tgt = enemies[0]; if (!tgt) return;
    const spread = me.area === 'area' && AREA_FAMILIES.has(sp.family) ? enemies : [tgt];
    const share = Eb / spread.length; // mesmo orçamento total: a área divide, o único concentra
    switch (sp.family) {
      case 'direct': for (const v of spread) hit(me, v, (share * me.mult()) / hitsOn(me, v)); break;
      case 'dot': for (let k = 1; k <= 3; k++) { const vs = [...spread]; const single = spread.length === 1 && me === pl; timed.push({ t: t0 + 0.25 * iv * k, fn: () => { const ts = single ? [target() ?? vs[0]] : vs; for (const v of ts) hit(me, v, (share / 3) * me.mult() / hitsOn(me, v)); } }); } break; // único: o tick restante passa ao próximo alvo vivo (sem perda); área: só quem estava no raio
      case 'defDebuff': for (const v of spread) v.nVuln += share; break;
      case 'heal': me.hp += Math.min(1 - me.hp, Eb / hitsOn(tgt, me)); break;
      case 'shield': me.shield += Eb / hitsOn(tgt, me); break;
      case 'atkBuff': me.nAtk += Eb; break;
      case 'spdBuff': me.nSpd += Eb; me.next = Math.min(me.next, t0 + iv / 2); break;
    }
  };
  const tryCast = (me: F, tt: number) => {
    if (me.sp && me.dead === Infinity && me.en >= ENERGY_TRIGGER - 1e-6) { me.en = Math.max(0, me.en - ENERGY_TRIGGER); me.casts++; cast(me, tt); }
  };
  for (let g = 0; g < 400000; g++) {
    let tt = Infinity; for (const e of timed) if (e.t < tt) tt = e.t;
    let tEn = Infinity; for (const f of all) if (f.sp && f.dead === Infinity) tEn = Math.min(tEn, t + Math.max(0, ENERGY_TRIGGER - f.en) / ENERGY.perSecond);
    let tN = Infinity; for (const f of all) if (f.dead === Infinity) tN = Math.min(tN, f.next);
    t = Math.min(tN, tt, tEn);
    for (const f of all) if (f.sp && f.dead === Infinity) f.en += ENERGY.perSecond * (t - tPrev);
    tPrev = t;
    for (let i = timed.length - 1; i >= 0; i--) if (timed[i].t - t < EPS) timed.splice(i, 1)[0].fn();
    for (const me of all) {
      if (me.dead < Infinity || me.next - t >= EPS) continue;
      const v = me === pl ? target() : pl; if (!v) continue;
      let mulN = 1;
      if (me.nAtk > EPS) { const x = Math.min(1, me.nAtk); mulN += x; me.nAtk -= x; }
      if (v.nVuln > EPS) { const x = Math.min(1, v.nVuln); mulN += x; v.nVuln -= x; }
      const hs = o.hitScale ? o.hitScale(me.who, me.nHit) : 1; me.nHit++;
      hit(me, v, (mulN * me.mult() * hs) / hitsOn(me, v));
      if (me.nSpd > EPS) { const x = Math.min(1, me.nSpd); me.nSpd -= x; me.next = t + interval(me.c.spd) / (1 + x); }
      else me.next = t + interval(me.c.spd);
    }
    for (const f of all) if (f.hp <= EPS && f.dead === Infinity) f.dead = t;
    for (const f of all) tryCast(f, t);
    for (const f of all) if (f.hp <= EPS && f.dead === Infinity) f.dead = t;
    const pDead = pl.dead < Infinity, fDead = alive().length === 0;
    if (pDead || fDead) {
      const winner = pDead && fDead ? 'draw' : pDead ? 'foes' : 'player';
      return { winner, t, hpLeft: Math.max(0, pl.hp), energyLeft: pl.en, casts: pl.casts };
    }
  }
  throw new Error('groupFight sem fim');
}
