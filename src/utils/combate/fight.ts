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
import { planoInvocacao } from './companheiro';
import { CHEER, cleanCheerScale, cleanDotResist, ENERGY, ENERGY_TRIGGER, shieldAbsorbPoints, SPECIAL_BUDGET_HITS, type ShieldSource, type Special } from './specials';

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

export interface FightSide {
  readonly combatant: Combatant;
  readonly special: Special | null;
  /** Read only by `groupFight`: 'area' splits the special over every living foe. Default 'single'. */
  readonly area?: 'single' | 'area';
  /** Tarefa B (`tal-pvp-06`): fraction of the DoT damage this side RECEIVES that never lands (capped by `cleanDotResist`). Default 0. */
  readonly dotResist?: number;
  /** Tarefa B (`tal-pve-07`): opening shield of this side, as a fraction of its HP (capped by `cleanStartShield`). Read by `groupFight`. */
  readonly startShield?: number;
  /**
   * COMPANHEIRO INVOCADO (PR 2, 16/11/2026): `true` = este lado é evocador COM companheiro neste estágio; o especial dele invoca
   * (regra em `companheiro.ts`; cura nunca invoca). Ausente/false = nada muda, byte a byte. Quem decide é o chamador a partir de
   * `companheiroAtivo` (flag desligada = nunca `true`); o núcleo não lê a flag, para os testes exercitarem a regra.
   */
  readonly invoca?: boolean;
}

export interface CheerEvent {
  readonly t: number;
  readonly side: 0 | 1;
  /** PR7b: yield multiplier of this discharge (a talent); default 1, sanitised by `cleanCheerScale`. */
  readonly scale?: number;
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
  /**
   * PR16 (read-only, opt-in): the driver passes an array and the core pushes ONE `FightFxPair` per yielded event, in the
   * same order — the REAL counters of each side at that event (for a `cast`, AFTER it takes effect). It changes nothing in
   * the fight (no draw, no event field), so the events stay byte-identical to the server mirror (`_combate.js`).
   */
  readonly fxTrace?: FightFxPair[];
}

/**
 * The real status counters of a fighter (PR16): what the scene draws as the seal's turns, read from the core instead of
 * guessed from the events. `nAtk`/`nSpd` = attack/speed boosts left (each basic attack spends up to 1); `nVuln` = defence-down
 * hits left ON this fighter; `shield` = absorption left (HP fraction) and `shieldHits` = the same in hits of the enemy;
 * `dot` = DoT ticks still to land ON this fighter.
 */
export interface FighterFx {
  readonly nAtk: number;
  readonly nVuln: number;
  readonly nSpd: number;
  readonly shield: number;
  readonly shieldHits: number;
  readonly dot: number;
  /** §228, só `group.ts`: golpes de silêncio, de lentidão, e pulsos de cura contínua que faltam. */
  readonly nSil?: number;
  readonly nSlow?: number;
  readonly hot?: number;
  /** Companheiro invocado: turnos de ATAQUE que o companheiro deste lutador ainda tem (ausente = sem companheiro em cena). Só a cena lê. */
  readonly comp?: number;
}
export type FightFxPair = readonly [FighterFx, FighterFx];

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
  /** HP fraction that LEFT the bar (attack/tick) — whole points / pts (INTEGER HP; 0 = fully absorbed); 0 for cast/ko. */
  readonly frac: number;
  readonly hp: readonly [number, number];
  readonly energy: readonly [number, number];
}

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
      next: interval(c.spd) * phases[i], casts: 0, dead: Infinity, nAtk: 0, nVuln: 0, nSpd: 0, nHit: 0, dotResist: cleanDotResist(s.dotResist), dots: [], invoca: s.invoca === true,
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
    if (!me.dots.length || me.dead < Infinity || me.hp <= EPS) return false;
    for (const d of me.dots) {
      d.left--; // antes do golpe: o evento do tick já mostra os ticks que FALTAM (o contador real do selo)
      if (me.hp > EPS) hit(d.src, me, (d.E / DOT_TICKS) * d.src.mult() / hitsOn(d.src, me) * (1 - me.dotResist), 'tick', 'tick');
    }
    me.dots = me.dots.filter((d) => d.left > 0);
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
        me.shield = (Math.round(me.shield * me.pts) + Math.round((E / hitsOn(foe, me)) * me.pts)) / me.pts;
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
      // §334: o DoT tica no COMEÇO do turno do afetado; quem cai no tick não golpeia (o turno passa do mesmo jeito)
      if (tickOwnTurn(me)) { me.next = t + interval(me.c.spd); continue; }
      let mulN = 1;
      if (me.nAtk > EPS) { const x = Math.min(1, me.nAtk); mulN += x; me.nAtk -= x; }
      if (foe.nVuln > EPS) { const x = Math.min(1, foe.nVuln); mulN += x; foe.nVuln -= x; }
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
