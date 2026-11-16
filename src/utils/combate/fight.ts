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
import type { FightEvent, FightFxPair, FighterFx, FightOptions, FightResult, FightSide, FightWinner } from './fightTypes';
import { REFERENCE_BUILDS, combatantAt } from './level';
import { PHASE_SALT, VARIANCE, ar1Multiplier, mulberry32, sideSeed, type VarianceConfig } from './rng';
import { planoInvocacao } from './companheiro';
import {
  CHEER, cleanCheerScale, cleanDotResist, EFFECT_TUNE_PVP, ENERGY, ENERGY_TRIGGER, FAMILY_TUNE, shieldAbsorbPoints, SPECIAL_BUDGET_HITS, type ShieldSource, type Special,
} from './specials';

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

/**
 * INTEGER HP (owner, 30/10/2026 — REGISTRO §192): the core still reasons in HP fractions 0..1, but every
 * fighter has `hpPoints(hp)` whole points and EVERY change of HP is snapped to them: a damaging hit removes
 * max(1, round(frac·pts)) points (never a fraction), heal and shield are whole points too, and 0 points = knocked out
 * at once. The scale ×30 keeps even the weakest chip hit of the Dungeon (slot 0, power 0.026, at L1) near 1 point (the min-1 rule does not inflate it), so the length and the
 * win rates of the fights stay where they were. Mirrored in `functions/api/_combate.js`.
 */
export const HP_POINTS_PER_HP = 30;

/** Whole HP points of a fighter whose (already scaled) core HP is `hp`; what every screen shows as the max HP. */
export function hpPoints(hp: number): number {
  return Math.max(1, Math.round(hp * HP_POINTS_PER_HP));
}

/**
 * HP EXIBIDO no PvP/Duelo (decisão do dono, 09/11/2026, §252): a tela mostra o HP BASE, o mesmo número da Arena,
 * e não o inflado por `PVP_HP_SCALE`. Só apresentação: o motor segue lutando com `hp × PVP_HP_SCALE` (a luta dura o
 * mesmo); a barra é fração, então a proporção não muda, e dano/HP atual derivam da fração × este máximo.
 */
export function hpExibidoPvp(combatantHp: number): number {
  return hpPoints(combatantHp);
}

/** Fator SÓ VISUAL de ataque/defesa/velocidade (decisão do dono, 09/11/2026, §252). HP não multiplica. */
export const STAT_DISPLAY_SCALE = 10;

/** Ataque, defesa ou velocidade como a tela mostra: valor de combate × `STAT_DISPLAY_SCALE`, arredondado. Mecânica intocada. */
export function statExibido(v: number): number {
  return Math.round(v * STAT_DISPLAY_SCALE);
}

/** Points removed by a hit worth `frac` of a `pts`-point bar: at least 1 when it does any damage, 0 when it does none. */
export function damagePoints(frac: number, pts: number): number {
  return frac > 1e-9 ? Math.max(1, Math.round(frac * pts)) : 0;
}

/** A starting HP fraction snapped to whole points (at least 1 point while alive; above 1 is allowed — the Feira boss starts "huge"). */
export function startPoints(frac: number, pts: number): number {
  return Math.max(1, Math.round(frac * pts));
}

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

export type { CheerEvent, FightEvent, FightFxPair, FightOptions, FightResult, FightSide, FighterFx, FightWinner } from './fightTypes';

interface Fighter {
  readonly c: Combatant;
  readonly sp: Special | null;
  readonly mult: () => number;
  /** Whole HP points of the bar (INTEGER HP). `hp` and `shield` are always multiples of 1/pts. */
  readonly pts: number;
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
  /** Hexsmith H2 (1v1): golpes de silêncio, de lentidão, de reforço de defesa e de debuff de ataque que faltam; pulsos de cura contínua. */
  nSil: number;
  nSlow: number;
  /** `spdDebuff` (família só de Coroa): golpes de arrasto que faltam (contador à parte do `nSlow` do efeito de lentidão). */
  nDrag: number;
  nGuard: number;
  nWeak: number;
  nHot: number;
  hots: { readonly pulse: number; left: number }[];
  dotResist: number;
  /** §334: DoTs que este lutador CARREGA; cada um tica no começo de cada golpe dele (`tickOwnTurn`). */
  dots: OwnTurnDot[];
  readonly invoca: boolean;
}

/**
 * §334 (dono, 13/11/2026): um DoT é guardado em quem o CARREGA e tica no turno DELE: no começo de cada golpe básico do
 * afetado, antes de o golpe sair. `left` = golpes do afetado que ainda levam tick (a duração conta os turnos dele).
 */
interface OwnTurnDot {
  readonly src: Fighter;
  readonly E: number;
  left: number;
  /** Ataque do companheiro invocado (PR 2): é um DoT como outro qualquer, só marcado para a cena e para a regra de 1 por combatente. */
  readonly comp?: true;
}

/** §334: ticks de um DoT (a duração, em golpes do afetado). */
export const DOT_TICKS = 3;

/** `comp` só entra no contador quando há companheiro em cena (os eventos de quem não invoca ficam byte a byte iguais). */
export const compFx = (n: number): { comp?: number } => (n > 0 ? { comp: n } : {});

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
    const pts = hpPoints(c.hp);
    return {
      c, sp: s.special, mult, pts, hp: startPoints(opts.startHp?.[i] ?? 1, pts) / pts, en: opts.startEnergy?.[i] ?? 0, shield: 0,
      next: interval(c.spd) * phases[i], casts: 0, dead: Infinity, nAtk: 0, nVuln: 0, nSpd: 0, nHit: 0, nSil: 0, nSlow: 0, nDrag: 0, nGuard: 0, nWeak: 0, nHot: 0, hots: [], dotResist: cleanDotResist(s.dotResist), dots: [], invoca: s.invoca === true,
    };
  };
  const F: [Fighter, Fighter] = [mk(a, 0), mk(b, 1)];
  const timed: Timed[] = [];
  for (const ch of opts.cheer ?? []) {
    timed.push({
      t: ch.t,
      fn: () => {
        const f = F[ch.side];
        if (f.sp && f.dead === Infinity) f.en += CHEER.pvpEnergyPerDischarge * cleanCheerScale(ch.scale);
      },
    });
  }
  let t = 0;
  let tPrev = 0;
  const pending: FightEvent[] = [];
  const trace = opts.fxTrace;
  const ev = (kind: FightEvent['kind'], side: 0 | 1, frac: number, at: number): FightEvent => {
    trace?.push(snapFx());
    return { kind, t: at, side, frac, hp: [F[0].hp, F[1].hp], energy: [F[0].en, F[1].en] };
  };

  const hitsOn = (me: Fighter, foe: Fighter) => hitsToKnockOut(me.c, foe.c) / u;
  const fxOf = (f: Fighter, foe: Fighter): FighterFx => ({
    nAtk: f.nAtk, nVuln: f.nVuln, nSpd: f.nSpd, shield: f.shield, shieldHits: f.shield * hitsOn(foe, f),
    dot: f.dots.reduce((n, d) => n + d.left, 0),
    ...(f.nSil > EPS ? { nSil: f.nSil } : {}), ...(f.nSlow + f.nDrag > EPS ? { nSlow: f.nSlow + f.nDrag } : {}), ...(f.nHot > 0 ? { hot: f.nHot } : {}),
    ...(f.nGuard > EPS ? { nGuard: f.nGuard } : {}), ...(f.nWeak > EPS ? { nWeak: f.nWeak } : {}),
    ...(f.invoca ? compFx(foe.dots.reduce((n, d) => (d.src === f && d.comp ? n + d.left : n), 0)) : {}),
  });
  const snapFx = (): FightFxPair => [fxOf(F[0], F[1]), fxOf(F[1], F[0])];
  const gain = (f: Fighter, x: number, per: number) => {
    if (f.sp && f.dead === Infinity) f.en += per * x;
  };
  const hit = (src: Fighter, v: Fighter, frac: number, kind: 'attack' | 'tick', from: ShieldSource) => {
    if (v.dead < Infinity) return; // leftover damage expires
    // INTEGER HP: the hit is worth whole points (min 1); the event carries the points that left the BAR
    const d = damagePoints(frac, v.pts);
    let lose = d;
    // §327: o escudo absorve o básico inteiro, METADE do especial direto e METADE de cada tick de DoT (`SHIELD_ABSORB`)
    const sh = Math.round(v.shield * v.pts);
    const ab = shieldAbsorbPoints(sh, lose, from);
    if (ab > 0) {
      v.shield = (sh - ab) / v.pts;
      lose -= ab;
    }
    const hp0 = Math.round(v.hp * v.pts);
    lose = Math.min(lose, hp0);
    v.hp = (hp0 - lose) / v.pts;
    gain(src, d / v.pts, ENERGY.perDealt);
    gain(v, d / v.pts, ENERGY.perReceived);
    pending.push(ev(kind, src === F[0] ? 0 : 1, lose / v.pts, t));
  };
  /**
   * §334: o começo do golpe de `me`: cada DoT que ele carrega tica (o escudo dele absorve metade, §327) e gasta 1 turno.
   * Devolve `true` quando o tick o derrubou: aí ele NÃO golpeia neste turno.
   */
  const tickOwnTurn = (me: Fighter): boolean => {
    if ((!me.dots.length && !me.hots.length) || me.dead < Infinity || me.hp <= EPS) return false;
    for (const d of me.dots) {
      d.left--; // antes do golpe: o evento do tick já mostra os ticks que FALTAM (o contador real do selo)
      if (me.hp > EPS) hit(d.src, me, (d.E / DOT_TICKS) * d.src.mult() / hitsOn(d.src, me) * (1 - me.dotResist), 'tick', 'tick');
    }
    me.dots = me.dots.filter((d) => d.left > 0);
    // Hexsmith H2: a cura contínua (Coroa de cura contínua) pulsa depois dos ticks, no começo do golpe de quem a recebe (como em `group.ts`)
    for (const h of me.hots) {
      h.left--;
      me.nHot--;
      if (me.hp > EPS) me.hp = Math.min(me.pts, Math.round(me.hp * me.pts) + h.pulse) / me.pts;
    }
    me.hots = me.hots.filter((h) => h.left > 0);
    return me.hp <= EPS;
  };
  const cast = (me: Fighter, foe: Fighter, t0: number, scale: number) => {
    const plano = me.invoca ? planoInvocacao(me.sp, scale) : null;
    if (!plano) { castFamilia(me, foe, t0, scale); return; }
    // 1 companheiro por combatente: invocar de novo troca o que estava em cena
    for (const f of F) f.dots = f.dots.filter((d) => !(d.src === me && d.comp));
    if (plano.escalaEfeito > 0) castFamilia(me, foe, t0, plano.escalaEfeito);
    foe.dots.push({ src: me, E: plano.ataqueE, left: plano.turnosAtaque, comp: true });
  };
  const castFamilia = (me: Fighter, foe: Fighter, t0: number, scale: number) => {
    const sp = me.sp as Special;
    const E = SPECIAL_BUDGET_HITS * sp.power * scale;
    const iv = interval(me.c.spd);
    const tune = sp.tune ?? EFFECT_TUNE_PVP;
    switch (sp.family) {
      case 'direct':
        hit(me, foe, (E * me.mult()) / hitsOn(me, foe), 'attack', 'direct');
        break;
      case 'dot':
        // §334: o veneno fica em quem o recebe e tica nos PRÓXIMOS golpes dele (não num relógio, nem no turno de quem lançou)
        foe.dots.push({ src: me, E, left: DOT_TICKS });
        break;
      case 'heal':
        me.hp = Math.min(me.pts, Math.round(me.hp * me.pts) + Math.round((E / hitsOn(foe, me)) * me.pts)) / me.pts;
        break;
      case 'shield':
        if (sp.effect === 'hot') {
          // Hexsmith H2: 3 pulsos de E/3 em pontos inteiros no começo dos 3 próximos golpes de quem recebe (a regra de `group.ts`)
          const pulse = Math.round(((E * tune.hotScale) / DOT_TICKS / hitsOn(foe, me)) * me.pts);
          me.nHot += DOT_TICKS;
          me.hots.push({ pulse, left: DOT_TICKS });
          break;
        }
        me.shield = (Math.round(me.shield * me.pts) + Math.round((E / hitsOn(foe, me)) * me.pts)) / me.pts;
        break;
      case 'atkBuff':
        me.nAtk += E;
        break;
      case 'defDebuff':
        if (sp.effect === 'slow') { foe.nSlow += E * tune.slowScale; foe.nVuln += E * tune.slowKeep; }
        else if (sp.effect === 'silence' && foe.sp) { foe.nSil = Math.max(foe.nSil, tune.silenceHits); foe.nVuln += E * tune.silenceKeep; } // alvo sem especial: `defDebuff` inteiro
        else foe.nVuln += E;
        break;
      case 'defBuff':
        me.nGuard += E / FAMILY_TUNE.guardCut;
        break;
      case 'atkDebuff':
        foe.nWeak += E / FAMILY_TUNE.weakCut;
        break;
      case 'spdDebuff':
        foe.nDrag += E * FAMILY_TUNE.spdDebuffScale;
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
    if (me.sp && me.dead === Infinity && me.nSil <= EPS && me.en >= ENERGY_TRIGGER - 1e-6) {
      // §334 (dono, 13/11/2026: "Sim, o especial também"): lançar o especial também é turno do afetado. O DoT tica no começo
      // da ação, antes de o especial sair; quem cai no tick não lança (a energia fica, ele já caiu).
      const caiu = tickOwnTurn(me);
      yield* flush();
      if (caiu) return;
      me.en = Math.max(0, me.en - ENERGY_TRIGGER);
      me.casts++;
      const e = ev('cast', i, 0, tt);
      const k = trace ? trace.length - 1 : -1;
      const m = yield e;
      cast(me, F[1 - i], tt, m ?? 1);
      if (trace) trace[k] = snapFx(); // the cast event reports the state AFTER it takes effect
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
      // silenciado não acorda o relógio (com a barra cheia o tempo pararia); a energia segue guardada e sai no primeiro instante livre
      if (f.sp && f.dead === Infinity && f.nSil <= EPS) tEn = Math.min(tEn, t + Math.max(0, ENERGY_TRIGGER - f.en) / ENERGY.perSecond);
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
      // §334: o DoT tica no COMEÇO do turno do afetado; quem cai no tick não golpeia (o turno passa do mesmo jeito)
      if (tickOwnTurn(me)) { me.next = t + interval(me.c.spd); continue; }
      let mulN = 1;
      if (me.nAtk > EPS) { const x = Math.min(1, me.nAtk); mulN += x; me.nAtk -= x; }
      if (foe.nVuln > EPS) { const x = Math.min(1, foe.nVuln); mulN += x; foe.nVuln -= x; }
      // Hexsmith H2: o reforço de defesa de quem apanha (`guardCut`) e o debuff de ataque de quem bate (`weakCut`) cortam o golpe, cada um (só com contador)
      if (foe.nGuard > EPS) { const x = Math.min(1, foe.nGuard); mulN *= 1 - FAMILY_TUNE.guardCut * x; foe.nGuard -= x; }
      if (me.nWeak > EPS) { const x = Math.min(1, me.nWeak); mulN *= 1 - FAMILY_TUNE.weakCut * x; me.nWeak -= x; }
      const hs = opts.hitScale ? opts.hitScale(i, me.nHit) : 1;
      me.nHit++;
      hit(me, foe, (mulN * me.mult() * hs) / hitsOn(me, foe), 'attack', 'basic');
      if (me.nSpd > EPS) {
        const x = Math.min(1, me.nSpd);
        me.nSpd -= x;
        me.next = t + interval(me.c.spd) / (1 + x);
      } else {
        me.next = t + interval(me.c.spd);
      }
      if (me.nSlow > EPS) { const x = Math.min(1, me.nSlow); me.nSlow -= x; me.next += interval(me.c.spd) * x; }
      if (me.nDrag > EPS) { const x = Math.min(1, me.nDrag); me.nDrag -= x; me.next += interval(me.c.spd) * x * FAMILY_TUNE.dragStretch; }
      if (me.nSil > EPS) me.nSil = Math.max(0, me.nSil - 1);
    }
    yield* flush();
    yield* markDead();
    // §196: os golpes de cada cast saem ANTES do próximo cast do mesmo instante, (só a ORDEM dos eventos muda; o empate de dois especiais no mesmo instante continua existindo)
    yield* tryCast(0, t);
    yield* flush();
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
