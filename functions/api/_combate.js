/**
 * NUCLEO DE COMBATE v3, do lado do SERVIDOR (combate v3, PR5; contexto §2.19).
 *
 * Espelho de `src/utils/combate/` (curve, level, rng, bonus, specials, fight): as Pages Functions nao
 * importam de `src/`, e o duelo PvP e decidido AQUI (o servidor nunca aceita nem o resultado nem a
 * ficha de luta do cliente). O precedente e `_soulXP.js` + `soulXP.parity.test.js`: copiar o minimo e
 * travar o encontro por teste de PARIDADE COMPORTAMENTAL.
 *
 * QUEM TRAVA: `functions/api/combate.parity.test.js` compara o log de eventos (tempo, lado, fracao,
 * energia) e o vencedor de `fight()` aqui e em `src/utils/combate/fight.ts`, em 15 `RULER_LEVELS` x 4
 * builds x 7 familias x 10 sementes, com e sem torcida. Mudou uma constante de um lado so: o teste cai.
 *
 * O que NAO foi copiado, de proposito: `fightSteps` em grupo (`group.ts`, Arena), a regua pareada
 * (`ruler.ts`) e as tabelas de PvE (`PVE_FAMILY_POWER`, `RING_MULT`...). O PvP e 1v1 e sem anel nem esquiva.
 * Os tetos de estagio vem de `_soulXP.js` (nao se copia duas vezes).
 */
import { STAGE_LEVEL_CAPS, MAX_LEVEL, soulLevel } from './_soulXP.js';
import { SPECIAL_BUDGET_HITS, SHIELD_DIRECT_SPECIAL_ABSORB, SHIELD_DOT_TICK_ABSORB, SHIELD_ABSORB, shieldAbsorbPoints, CHEER, CHEER_SCALE_MAX, START_ENERGY_MAX, DOT_RESIST_MAX, cleanStartEnergy, cleanDotResist, cleanCheerScale, cheerEvents, COMPANHEIRO_TURNOS, COMPANHEIRO_EFEITO_FATOR, COMPANHEIRO_ATAQUE_FATOR, especialInvoca, planoInvocacao } from './_combateAux.js';
export { SPECIAL_BUDGET_HITS, SHIELD_DIRECT_SPECIAL_ABSORB, SHIELD_DOT_TICK_ABSORB, SHIELD_ABSORB, shieldAbsorbPoints, CHEER, CHEER_SCALE_MAX, START_ENERGY_MAX, DOT_RESIST_MAX, cleanStartEnergy, cleanDotResist, cleanCheerScale, cheerEvents, COMPANHEIRO_TURNOS, COMPANHEIRO_EFEITO_FATOR, COMPANHEIRO_ATAQUE_FATOR, especialInvoca, planoInvocacao };

// ── rng.ts ───────────────────────────────────────────────────────────────────
/** mulberry32: 32 bits, uniforme em [0, 1). */
export function mulberry32(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Fluxo independente por lado (1 = A, 2 = B) derivado da semente. */
export function sideSeed(seed, side) {
  return (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) + side * 0x632be59b) | 0;
}
export const PHASE_SALT = 0x51ed;
function gaussian(r) {
  return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
}
/** Variancia do dano por golpe: AR(1), rho 0,9, sigma 8% (PR3a, §2.15 P1), piso 0,05. */
export const VARIANCE = { rho: 0.9, sigma: 0.08, floor: 0.05 };
function ar1Multiplier(r, cfg) {
  let z = gaussian(r);
  const k = Math.sqrt(1 - cfg.rho * cfg.rho);
  return () => {
    z = cfg.rho * z + k * gaussian(r);
    return Math.max(cfg.floor, 1 + cfg.sigma * z);
  };
}

// ── curve.ts ─────────────────────────────────────────────────────────────────
export const CURVE_K = 8;
export const BASE_ATTACKS_PER_WINDOW = 9;
/** hits = HP*(1+DEF/K) / (1+ATK/K) / (1+bonus). */
export function hitsToKnockOut(attacker, defender) {
  return (defender.hp * (1 + defender.def / CURVE_K)) / (1 + attacker.atk / CURVE_K) / (1 + attacker.bonus);
}
export function attacksPerWindow(spd) {
  return (BASE_ATTACKS_PER_WINDOW * (1 + spd / CURVE_K)) / (1 + 1 / CURVE_K);
}

// ── level.ts ─────────────────────────────────────────────────────────────────
export { STAGE_LEVEL_CAPS, MAX_LEVEL };
export const MAX_SHARE = 0.45;
export const MIN_SHARE = 0.15;
export const HP_BASE = 10;
export const HP_LEVEL_DIVISOR = 10;
export const STAGE_FACTOR = 1.5;
export const REFERENCE_BUILDS = {
  atk: { atk: 1, def: 0, spd: 0 },
  def: { atk: 0, def: 1, spd: 0 },
  spd: { atk: 0, def: 0, spd: 1 },
  balanced: { atk: 1 / 3, def: 1 / 3, spd: 1 / 3 },
};
export function clampLevel(level) {
  if (!Number.isFinite(level)) return 1;
  return Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
}
export function stageOfLevel(level) {
  const L = clampLevel(level);
  return STAGE_LEVEL_CAPS.findIndex((cap) => L <= cap);
}
export function firstLevelOfStage(stage) {
  return stage <= 0 ? 1 : STAGE_LEVEL_CAPS[stage - 1] + 1;
}
export function stageBase(stage) {
  return Math.ceil(STAGE_FACTOR ** stage);
}
export function autoHp(level) {
  const L = clampLevel(level);
  return HP_BASE * STAGE_FACTOR ** stageOfLevel(L) * (1 + L / HP_LEVEL_DIVISOR);
}
const ORDER = ['atk', 'spd', 'def'];
function cleanWeights(w) {
  const c = (x) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : 0);
  const atk = c(w?.atk), def = c(w?.def), spd = c(w?.spd);
  const sum = atk + def + spd;
  return sum > 0 ? { atk: atk / sum, def: def / sum, spd: spd / sum } : REFERENCE_BUILDS.balanced;
}
/** Distribui exatamente L pontos em ATK/DEF/SPD (piso 15%, teto 45%, desempate ATK, SPD, DEF). */
export function distributePoints(level, weights) {
  const L = clampLevel(level);
  const w = cleanWeights(weights);
  const cap = Math.max(Math.ceil(L / 3), Math.floor(MAX_SHARE * L));
  const floor = Math.min(Math.floor(MIN_SHARE * L), Math.floor(L / 3));
  const p = { atk: floor, def: floor, spd: floor };
  for (let n = 3 * floor + 1; n <= L; n++) {
    let best = null;
    let bestNeed = -Infinity;
    for (const a of ORDER) {
      if (p[a] >= cap) continue;
      const need = w[a] * n - p[a];
      if (need > bestNeed + 1e-9) {
        best = a;
        bestNeed = need;
      }
    }
    p[best]++;
  }
  return p;
}
export function combatantAt(level, weights, bonus = 0, floor) {
  const L = clampLevel(level);
  const b = stageBase(stageOfLevel(L));
  const p = distributePoints(L, weights);
  // "Evoluir nunca reduz" (REGISTRO §229): o piso (do estagio certo) entra ANTES do bonus de PvP. Espelho de `combate/level.ts`.
  const f = floor && floor.s === stageOfLevel(L) ? floor : undefined;
  const atk = Math.max(b + p.atk, f?.atk ?? 0), def0 = Math.max(b + p.def, f?.def ?? 0), spd0 = Math.max(b + p.spd, f?.spd ?? 0);
  if (typeof bonus === 'number') return { level: L, atk, def: def0, spd: spd0, hp: autoHp(L), bonus };
  const ab = toAttrBonus(bonus);
  const fold = (v, x) => (x > 0 ? CURVE_K * ((1 + v / CURVE_K) * (1 + x) - 1) : v);
  return { level: L, atk, def: fold(def0, ab.def), spd: fold(spd0, ab.spd), hp: autoHp(L), bonus: ab.atk };
}
/** Maior valor de UM atributo no estagio `s` (espelho de `statMaxOfStage`). */
export function statMaxOfStage(s) {
  const L = STAGE_LEVEL_CAPS[s];
  return stageBase(s) + Math.max(Math.ceil(L / 3), Math.floor(MAX_SHARE * L));
}
/** Le o piso gravado no save (espelho de `sanitizeStatFloor`): lixo -> undefined; cada valor limitado ao teto legitimo. */
export function sanitizeStatFloor(v) {
  if (!v || typeof v !== 'object') return undefined;
  const s = v.s;
  if (typeof s !== 'number' || !Number.isInteger(s) || s < 1 || s >= STAGE_LEVEL_CAPS.length) return undefined;
  const max = statMaxOfStage(s - 1);
  const c = (x) => (typeof x === 'number' && Number.isFinite(x) ? Math.min(max, Math.max(0, Math.floor(x))) : 0);
  return { s, atk: c(v.atk), def: c(v.def), spd: c(v.spd) };
}

// ── bonus.ts ─────────────────────────────────────────────────────────────────
export const COMBAT_BONUS_CAP = 0.05;
/** Soma das fontes de bonus de dano com UM teto global (5%). Fonte negativa/NaN/infinita conta 0. */
export function combinedBonus(sources) {
  let sum = 0;
  for (const v of [sources?.talent, sources?.equipment, sources?.commerce, sources?.rebirth]) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) sum += v;
  }
  return Math.min(sum, COMBAT_BONUS_CAP);
}

/** PR7b: o bonus de PvP por atributo (ATK/DEF/SPD), com UM teto de 5% para a soma dos tres canais. */
export const NO_ATTR_BONUS = { atk: 0, def: 0, spd: 0 };
const cleanN = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);
export function combinedAttrBonus(sources) {
  const sum = { atk: 0, def: 0, spd: 0 };
  for (const src of [sources?.talent, sources?.equipment, sources?.commerce, sources?.rebirth]) {
    if (!src || typeof src !== 'object') continue;
    sum.atk += cleanN(src.atk);
    sum.def += cleanN(src.def);
    sum.spd += cleanN(src.spd);
  }
  const total = sum.atk + sum.def + sum.spd;
  const k = total > COMBAT_BONUS_CAP ? COMBAT_BONUS_CAP / total : 1;
  return { atk: sum.atk * k, def: sum.def * k, spd: sum.spd * k };
}
export function toAttrBonus(b) {
  if (typeof b === 'number') return { atk: cleanN(b), def: 0, spd: 0 };
  return { atk: cleanN(b?.atk), def: cleanN(b?.def), spd: cleanN(b?.spd) };
}

// ── specials.ts ──────────────────────────────────────────────────────────────
export const SPECIAL_FAMILIES = ['direct', 'dot', 'heal', 'shield', 'atkBuff', 'defDebuff', 'spdBuff'];
/** Hexsmith H2: familias que so existem via Coroa (espelho de `CROWN_ONLY_FAMILIES`); nunca sorteadas. */
export const CROWN_ONLY_FAMILIES = ['defBuff', 'atkDebuff', 'spdDebuff'];
export const ALL_SPECIAL_FAMILIES = [...SPECIAL_FAMILIES, ...CROWN_ONLY_FAMILIES];
export const SPECIAL_POWER = { direct: 1, dot: 1.14, heal: 1, shield: 1, atkBuff: 1.01, defDebuff: 1.01, spdBuff: 2, defBuff: 1.1, atkDebuff: 1.1, spdDebuff: 0.64 };
/** Hexsmith H2 (espelho de `EFFECT_TUNE_PVP`, `FAMILY_TUNE`, `EFFECT_FAMILY`). */
export const EFFECT_TUNE_PVP = { silenceHits: 1, silenceKeep: 1, slowScale: 0.3, slowKeep: 0.8, hotScale: 1.05 };
export const FAMILY_TUNE = { guardCut: 0.5, weakCut: 0.57, spdDebuffScale: 1, dragStretch: 1.75 };
export const EFFECT_FAMILY = { hot: 'shield', slow: 'defDebuff', silence: 'defDebuff' };
/** Familia desconhecida cai em `direct` (nunca lanca): o save e do cliente. O efeito so vale sobre a familia-base dele. */
export function specialOf(family, effect) {
  const f = typeof family === 'string' && Object.prototype.hasOwnProperty.call(SPECIAL_POWER, family) ? family : 'direct';
  const base = { family: f, power: SPECIAL_POWER[f] };
  return typeof effect === 'string' && Object.prototype.hasOwnProperty.call(EFFECT_FAMILY, effect) && EFFECT_FAMILY[effect] === f ? { ...base, effect } : base;
}
export const ENERGY = { perDealt: 60, perReceived: 60, perSecond: 2 };
export const ENERGY_TRIGGER = 100;
// ── fight.ts ─────────────────────────────────────────────────────────────────
export const MIRROR_SECONDS = 25;
export const HIT_UNIT_H0 = 10;
/** A vida dos dois lados do PvP e multiplicada por isto (a luta dura ~38 s; balanco-motores §4). */
export const PVP_HP_SCALE = 1.7;
/** VIDA INTEIRA (dono, 30/10/2026): espelho de `HP_POINTS_PER_HP`/`hpPoints`/`damagePoints`/`startPoints` de fight.ts. */
export const HP_POINTS_PER_HP = 30;
export function hpPoints(hp) {
  return Math.max(1, Math.round(hp * HP_POINTS_PER_HP));
}
export function damagePoints(frac, pts) {
  return frac > 1e-9 ? Math.max(1, Math.round(frac * pts)) : 0;
}
export function startPoints(frac, pts) {
  return Math.max(1, Math.round(frac * pts));
}
export const EPS = 1e-9;
export const DRAW_EPS = 1e-6;
const MAX_EVENTS = 200_000;
/** §334: ticks de um DoT, em golpes do AFETADO (espelho de `DOT_TICKS`). */
export const DOT_TICKS = 3;

export function windowSeconds(level) {
  const d = combatantAt(level, REFERENCE_BUILDS.balanced);
  return (MIRROR_SECONDS * attacksPerWindow(d.spd)) / hitsToKnockOut(d, d);
}
export function hitUnit(level, h0 = HIT_UNIT_H0) {
  const bal = combatantAt(level, REFERENCE_BUILDS.balanced);
  return hitsToKnockOut(bal, bal) / h0;
}

/**
 * Gerador da luta. `cast` PAUSA e recebe o multiplicador (no PvP sempre 1: nao ha anel nem esquiva).
 * @param {{ combatant: any, special: any, dotResist?: number, invoca?: boolean }} a
 * @param {{ combatant: any, special: any, dotResist?: number, invoca?: boolean }} b
 * @param {{ seed: number, hpScale?: number, variance?: any, windowLevel?: number, phases?: number[], unitH0?: number | null,
 *   startHp?: number[], startEnergy?: number[], hitScale?: (who: 0 | 1, n: number) => number,
 *   cheer?: { t: number, side: 0 | 1, scale?: number }[], stopAtFirstKo?: boolean }} opts
 * @returns {Generator<any, any, any>}
 */
export function* fightSteps(a, b, opts) {
  const seed = opts.seed | 0;
  const hpScale = opts.hpScale ?? 1;
  const variance = opts.variance === undefined ? VARIANCE : opts.variance;
  const wl = opts.windowLevel ?? Math.max(a.combatant.level, b.combatant.level);
  const win = windowSeconds(wl);
  const u = opts.unitH0 === null ? 1 : hitUnit(wl, opts.unitH0 ?? HIT_UNIT_H0);
  const interval = (spd) => (win / attacksPerWindow(spd)) * u;
  const phaseRng = mulberry32(seed ^ PHASE_SALT);
  const drawn = [phaseRng(), phaseRng()];
  const phases = opts.phases ?? drawn;

  const mk = (s, i) => {
    const c = { ...s.combatant, hp: s.combatant.hp * hpScale };
    const r = mulberry32(sideSeed(seed, i + 1));
    const mult = variance ? ar1Multiplier(r, variance) : () => 1;
    const pts = hpPoints(c.hp);
    return {
      c, sp: s.special, mult, pts, hp: startPoints(opts.startHp?.[i] ?? 1, pts) / pts, en: opts.startEnergy?.[i] ?? 0, shield: 0,
      next: interval(c.spd) * phases[i], casts: 0, dead: Infinity, nAtk: 0, nVuln: 0, nSpd: 0, nHit: 0, nSil: 0, nSlow: 0, nDrag: 0, nGuard: 0, nWeak: 0, nHot: 0, hots: /** @type {{ pulse: number, left: number }[]} */ ([]), dotResist: cleanDotResist(s.dotResist), dots: /** @type {{ src: object, E: number, left: number, comp?: boolean }[]} */ ([]), invoca: s.invoca === true,
    };
  };
  const F = [mk(a, 0), mk(b, 1)];
  const timed = [];
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
  const pending = [];
  const ev = (kind, side, frac, at) => (
    { kind, t: at, side, frac, hp: [F[0].hp, F[1].hp], energy: [F[0].en, F[1].en] }
  );

  const hitsOn = (me, foe) => hitsToKnockOut(me.c, foe.c) / u;
  const gain = (f, x, per) => {
    if (f.sp && f.dead === Infinity) f.en += per * x;
  };
  const hit = (src, v, frac, kind, from) => {
    if (v.dead < Infinity) return;
    // VIDA INTEIRA: o golpe vale pontos inteiros (min 1); o evento leva os pontos que SAIRAM da barra
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
  /** §334: o comeco do golpe de `me` (espelho de `tickOwnTurn` de `fight.ts`); `true` = o tick o derrubou e ele nao golpeia. */
  const tickOwnTurn = (me) => {
    if ((!me.dots.length && !me.hots.length) || me.dead < Infinity || me.hp <= EPS) return false;
    for (const d of me.dots) {
      d.left--;
      if (me.hp > EPS) hit(d.src, me, (d.E / DOT_TICKS) * d.src.mult() / hitsOn(d.src, me) * (1 - me.dotResist), 'tick', 'tick');
    }
    me.dots = me.dots.filter((d) => d.left > 0);
    // Hexsmith H2: a cura continua pulsa depois dos ticks, no comeco do golpe de quem a recebe (espelho de `fight.ts`)
    for (const h of me.hots) {
      h.left--;
      me.nHot--;
      if (me.hp > EPS) me.hp = Math.min(me.pts, Math.round(me.hp * me.pts) + h.pulse) / me.pts;
    }
    me.hots = me.hots.filter((h) => h.left > 0);
    return me.hp <= EPS;
  };
  const cast = (me, foe, t0, scale) => {
    const plano = me.invoca ? planoInvocacao(me.sp, scale) : null;
    if (!plano) { castFamilia(me, foe, t0, scale); return; }
    // 1 companheiro por combatente: invocar de novo troca o que estava em cena
    for (const f of F) f.dots = f.dots.filter((d) => !(d.src === me && d.comp));
    if (plano.escalaEfeito > 0) castFamilia(me, foe, t0, plano.escalaEfeito);
    foe.dots.push({ src: me, E: plano.ataqueE, left: plano.turnosAtaque, comp: true });
  };
  const castFamilia = (me, foe, t0, scale) => {
    const sp = me.sp;
    const E = SPECIAL_BUDGET_HITS * sp.power * scale;
    const iv = interval(me.c.spd);
    const tune = sp.tune ?? EFFECT_TUNE_PVP;
    switch (sp.family) {
      case 'direct':
        hit(me, foe, (E * me.mult()) / hitsOn(me, foe), 'attack', 'direct');
        break;
      case 'dot':
        // §334: o veneno fica em quem o recebe e tica nos PROXIMOS golpes dele (espelho de `fight.ts`)
        foe.dots.push({ src: me, E, left: DOT_TICKS });
        break;
      case 'heal':
        me.hp = Math.min(me.pts, Math.round(me.hp * me.pts) + Math.round((E / hitsOn(foe, me)) * me.pts)) / me.pts;
        break;
      case 'shield':
        if (sp.effect === 'hot') {
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
        else if (sp.effect === 'silence' && foe.sp) { foe.nSil = Math.max(foe.nSil, tune.silenceHits); foe.nVuln += E * tune.silenceKeep; }
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
  function* flush() {
    while (pending.length) yield pending.shift();
  }
  function* markDead() {
    for (const i of [0, 1]) {
      if (F[i].hp <= EPS && F[i].dead === Infinity) {
        F[i].dead = t;
        yield ev('ko', i, 0, t);
      }
    }
  }
  function* tryCast(i, tt) {
    const me = F[i];
    if (me.sp && me.dead === Infinity && me.nSil <= EPS && me.en >= ENERGY_TRIGGER - 1e-6) {
      // §334 (dono, 13/11/2026): lancar o especial tambem e turno do afetado (espelho de `fight.ts`): o DoT tica antes; quem cai nao lanca
      const caiu = tickOwnTurn(me);
      yield* flush();
      if (caiu) return;
      me.en = Math.max(0, me.en - ENERGY_TRIGGER);
      me.casts++;
      const m = yield ev('cast', i, 0, tt);
      cast(me, F[1 - i], tt, m ?? 1);
    }
  }
  const finish = () => {
    const timeA = F[0].dead, timeB = F[1].dead;
    const winner = Math.abs(timeA - timeB) < DRAW_EPS ? 'draw' : timeA > timeB ? 'A' : 'B';
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
      if (f.sp && f.dead === Infinity && f.nSil <= EPS) tEn = Math.min(tEn, t + Math.max(0, ENERGY_TRIGGER - f.en) / ENERGY.perSecond);
    }
    t = Math.min(F[0].next, F[1].next, tt, tEn);
    for (const f of F) if (f.sp && f.dead === Infinity) f.en += ENERGY.perSecond * (t - tPrev);
    tPrev = t;
    for (let i = timed.length - 1; i >= 0; i--) {
      if (timed[i].t - t < EPS) timed.splice(i, 1)[0].fn();
    }
    for (const i of /** @type {(0 | 1)[]} */ ([0, 1])) {
      const me = F[i];
      const foe = F[1 - i];
      if (me.next - t >= EPS) continue;
      // §334: o DoT tica no COMECO do turno do afetado; quem cai no tick nao golpeia
      if (tickOwnTurn(me)) { me.next = t + interval(me.c.spd); continue; }
      let mulN = 1;
      if (me.nAtk > EPS) { const x = Math.min(1, me.nAtk); mulN += x; me.nAtk -= x; }
      if (foe.nVuln > EPS) { const x = Math.min(1, foe.nVuln); mulN += x; foe.nVuln -= x; }
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
    for (const i of [0, 1]) {
      if (F[i].dead < Infinity && F[1 - i].dead === Infinity && t > 10 * F[i].dead + 60) F[1 - i].dead = t;
    }
    const over = opts.stopAtFirstKo
      ? F[0].dead < Infinity || F[1].dead < Infinity
      : F[0].dead < Infinity && F[1].dead < Infinity;
    if (over) return finish();
  }
  throw new Error(`combate: fight did not end within ${MAX_EVENTS} events (seed ${seed})`);
}

/** Joga a luta respondendo 1 a todo cast (PvP). */
export function fight(a, b, opts) {
  const g = fightSteps(a, b, opts);
  let r = g.next();
  while (!r.done) r = g.next(1);
  return r.value;
}

// ── soulXP.ts › soulCombatant (do SAVE) ──────────────────────────────────────
function safe(n) {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0;
}
/** Pesos da distribuicao a partir do galho do save: Poder->ATK, Harmonia->SPD, Beneficencia->DEF. */
export function soulWeights(state) {
  return { atk: safe(state?.powerPoints), spd: safe(state?.harmonyPoints), def: safe(state?.benevolencePoints) };
}
/**
 * Combatente do Soulmon de um SAVE. `maxLevel` (opcional) limita o level (teto S1 do duelo): o valor e
 * LIMITADO, nunca rejeitado. O level e sempre derivado de `evolutionStage` + `perfectDays` (`_soulXP.js`).
 * @param {any} state
 * @param {{ maxLevel?: number, bonus?: number }} [opts]
 */
export function soulCombatant(state, opts = {}) {
  const real = soulLevel(state);
  let level = real;
  if (typeof opts.maxLevel === 'number' && Number.isFinite(opts.maxLevel)) level = Math.min(level, Math.max(1, Math.floor(opts.maxLevel)));
  // o teto de level do duelo (S1) desliga o piso: o piso e do level real, nao de um level limitado
  const floor = level === real ? sanitizeStatFloor(state?.evoStatFloor) : undefined;
  return combatantAt(level, soulWeights(state), opts.bonus ?? 0, floor);
}
