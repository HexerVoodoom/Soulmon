// Proposta PR3: generalização de combate/fight.ts com ganchos (startHp, castScale, hitScale, cheer, log).
// Com ganchos desligados tem de reproduzir fight() bit a bit (checado em medir.ts).
import { attacksPerWindow, hitsToKnockOut, type Combatant } from '../src/utils/combate/curve';
import { windowSeconds } from '../src/utils/combate/fight';
import { combatantAt, REFERENCE_BUILDS } from '../src/utils/combate/level';
import { PHASE_SALT, VARIANCE, ar1Multiplier, mulberry32, sideSeed, type VarianceConfig } from '../src/utils/combate/rng';
import { ENERGY, ENERGY_TRIGGER, SPECIAL_BUDGET_HITS, type Special } from '../src/utils/combate/specials';
export interface Side { combatant: Combatant; special: Special | null }
export interface Opts {
  seed: number; hpScale?: number; variance?: VarianceConfig | null; windowLevel?: number;
  startHp?: [number, number]; startEn?: [number, number];
  castScale?: (side: 0 | 1, n: number) => number;
  hitScale?: (side: 0 | 1, n: number) => number; // multiplicador do n-ésimo golpe básico RECEBIDO... aplicado ao golpe do lado `side`
  cheerPerAttack?: [number, number];
  cheerPerSecond?: [number, number];
  /** Golpe normalizado: o golpe vale u = golpesDoEspelho(L)/H0 golpes da curva; intervalo × u. */
  unitH0?: number;
  log?: unknown[];
  /** 'fraction': ρ por golpe = ρ^(H0/h), h = golpes p/ derrubar o outro lado (correlação constante em fração de HP). */
  rhoMode?: 'hit' | 'fraction'; rhoH0?: number;
}
export function fightX(a: Side, b: Side, opts: Opts) {
  const EPS = 1e-9, DRAW_EPS = 1e-6;
  const seed = opts.seed | 0; const hpScale = opts.hpScale ?? 1;
  const variance = opts.variance === undefined ? VARIANCE : opts.variance;
  const win = windowSeconds(opts.windowLevel ?? Math.max(a.combatant.level, b.combatant.level));
  const wl = opts.windowLevel ?? Math.max(a.combatant.level, b.combatant.level);
  const bal = combatantAt(wl, REFERENCE_BUILDS.balanced);
  const u = opts.unitH0 ? hitsToKnockOut(bal, bal) / opts.unitH0 : 1;
  const interval = (spd: number) => (win / attacksPerWindow(spd)) * u;
  const phaseRng = mulberry32(seed ^ PHASE_SALT); const phases = [phaseRng(), phaseRng()];
  const mk = (s: Side, i: 0 | 1) => {
    const c = { ...s.combatant, hp: s.combatant.hp * hpScale };
    const r = mulberry32(sideSeed(seed, (i + 1) as 1 | 2));
    const other = (i === 0 ? b : a).combatant;
    const h = hitsToKnockOut(c, { ...other, hp: other.hp * hpScale }) / (opts.unitH0 ? hitsToKnockOut(combatantAt(opts.windowLevel ?? Math.max(a.combatant.level, b.combatant.level), REFERENCE_BUILDS.balanced), combatantAt(opts.windowLevel ?? Math.max(a.combatant.level, b.combatant.level), REFERENCE_BUILDS.balanced)) / opts.unitH0 : 1);
    const v = variance && opts.rhoMode === 'fraction' ? { ...variance, rho: variance.rho ** ((opts.rhoH0 ?? 10) / Math.max(h, 1e-9)) } : variance;
    const mult = v ? ar1Multiplier(r, v) : () => 1;
    return { i, c, sp: s.special, mult, hp: opts.startHp?.[i] ?? 1, en: opts.startEn?.[i] ?? 0, inMul: 1, shield: 0,
      next: interval(c.spd) * phases[i], casts: 0, dead: Infinity, nAtk: 0, nVuln: 0, nSpd: 0, nHit: 0, dealt: 0 };
  };
  type F = ReturnType<typeof mk>;
  const F: [F, F] = [mk(a, 0), mk(b, 1)];
  const timed: { t: number; fn: () => void }[] = [];
  let t = 0, tPrev = 0;
  const hitsOn = (me: F, foe: F) => hitsToKnockOut(me.c, foe.c) / u;
  const gain = (f: F, x: number, per: number) => { if (f.sp && f.dead === Infinity) f.en += per * x; };
  const hit = (src: F, v: F, frac: number) => {
    if (v.dead < Infinity) return;
    const dealt = frac * v.inMul; let amt = dealt;
    if (v.shield > EPS) { const ab = Math.min(v.shield, amt); v.shield -= ab; amt -= ab; }
    v.hp -= amt; src.dealt += amt;
    gain(src, dealt, ENERGY.perDealt); gain(v, dealt, ENERGY.perReceived);
  };
  const cast = (me: F, foe: F, t0: number) => {
    const sp = me.sp as Special;
    const E = SPECIAL_BUDGET_HITS * sp.power * (opts.castScale ? opts.castScale(me.i as 0 | 1, me.casts) : 1);
    const iv = interval(me.c.spd);
    switch (sp.family) {
      case 'direct': hit(me, foe, (E * me.mult()) / hitsOn(me, foe)); break;
      case 'dot': for (let k = 1; k <= 3; k++) timed.push({ t: t0 + 0.25 * iv * k, fn: () => hit(me, foe, (E / 3) * me.mult() / hitsOn(me, foe)) }); break;
      case 'heal': me.hp += Math.min(1 - me.hp, E / hitsOn(foe, me)); break;
      case 'shield': me.shield += E / hitsOn(foe, me); break;
      case 'atkBuff': me.nAtk += E; break;
      case 'defDebuff': foe.nVuln += E; break;
      case 'spdBuff': me.nSpd += E; me.next = Math.min(me.next, t0 + iv / 2); break;
    }
    opts.log?.push({ t: t0, k: 'cast', s: me.i, f: sp.family });
  };
  const tryCast = (i: 0 | 1, tt: number) => {
    const me = F[i];
    if (me.sp && me.dead === Infinity && me.en >= ENERGY_TRIGGER - 1e-6) { me.en = Math.max(0, me.en - ENERGY_TRIGGER); me.casts++; cast(me, F[1 - i], tt); }
  };
  for (let g = 0; g < 200000; g++) {
    let tt = Infinity; for (const e of timed) if (e.t < tt) tt = e.t;
    let tEn = Infinity;
    const rate = (f: F) => ENERGY.perSecond + (opts.cheerPerSecond?.[f.i] ?? 0);
    for (const f of F) if (f.sp && f.dead === Infinity) tEn = Math.min(tEn, t + Math.max(0, ENERGY_TRIGGER - f.en) / rate(f));
    t = Math.min(F[0].next, F[1].next, tt, tEn);
    for (const f of F) if (f.sp && f.dead === Infinity) f.en += rate(f) * (t - tPrev);
    tPrev = t;
    for (let i = timed.length - 1; i >= 0; i--) if (timed[i].t - t < EPS) timed.splice(i, 1)[0].fn();
    for (const i of [0, 1] as const) {
      const me = F[i], foe = F[1 - i];
      if (me.next - t >= EPS) continue;
      let mulN = 1;
      if (me.nAtk > EPS) { const u = Math.min(1, me.nAtk); mulN += u; me.nAtk -= u; }
      if (foe.nVuln > EPS) { const u = Math.min(1, foe.nVuln); mulN += u; foe.nVuln -= u; }
      const hs = opts.hitScale ? opts.hitScale(i, me.nHit) : 1; me.nHit++;
      hit(me, foe, (mulN * me.mult() * hs) / hitsOn(me, foe));
      if (opts.cheerPerAttack && me.sp && me.dead === Infinity) me.en += opts.cheerPerAttack[i];
      opts.log?.push({ t, k: 'hit', s: i, hpA: F[0].hp, hpB: F[1].hp });
      if (me.nSpd > EPS) { const u = Math.min(1, me.nSpd); me.nSpd -= u; me.next = t + interval(me.c.spd) / (1 + u); }
      else me.next = t + interval(me.c.spd);
    }
    for (const f of F) if (f.hp <= EPS && f.dead === Infinity) f.dead = t;
    tryCast(0, t); tryCast(1, t);
    for (const f of F) if (f.hp <= EPS && f.dead === Infinity) f.dead = t;
    for (const i of [0, 1] as const) if (F[i].dead < Infinity && F[1 - i].dead === Infinity && t > 10 * F[i].dead + 60) F[1 - i].dead = t;
    // PvE: luta acaba quando o 1º cai (sem fantasma) — guarda o HP restante
    if (F[0].dead < Infinity && F[1].dead < Infinity) {
      const timeA = F[0].dead, timeB = F[1].dead;
      const winner = Math.abs(timeA - timeB) < DRAW_EPS ? 'draw' : timeA > timeB ? 'A' : 'B';
      return { timeA, timeB, castsA: F[0].casts, castsB: F[1].casts, winner };
    }
  }
  throw new Error('no end');
}
// variante "sem fantasma" para PvE com HP carregado: para no 1º KO e devolve HP/energia restantes.
export function duelPve(a: Side, b: Side, opts: Opts) {
  // roda a luta fantasma, mas captura estado no instante do 1º KO via log
  const log: any[] = []; const r = fightX(a, b, { ...opts, log });
  const tEnd = Math.min(r.timeA, r.timeB);
  let hpA = opts.startHp?.[0] ?? 1;
  for (const e of log) { if (e.k === 'hit' && e.t <= tEnd + 1e-9) hpA = e.hpA; }
  return { ...r, tEnd, hpA: r.winner === 'A' ? Math.max(0, hpA) : 0, castsA: r.castsA };
}
