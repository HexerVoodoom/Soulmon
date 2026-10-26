// ⚔️ The Dungeon and the Nightmare on the Combat v3 core (story PR4, run `combate-v3-01`).
//
// Both are SEQUENCES of 1v1 fights (the `groupFightSteps` with N = 1, proven equal to `fight()` in PR3a),
// with the player's HP and energy carried from one enemy to the next. This module is the only place
// that decides how a fight of the sequence is set up — the screens (`DungeonGame`, `NightmareBattle`) and
// the balance gates (`dungeon.v3.test.ts`, `nightmares.v3.test.ts`) read the SAME functions, so the
// simulation cannot drift from the game:
//
//  · the player is `soulCombatant(state)` (level and branch), its HP reshaped by the craft (`jeitoParaPve`);
//  · the enemy comes from `dungeonFoe` (relative to the player's level);
//  · the automatic defence of the player is the `hitScale` of the ENEMY (0 on a perfect defence, else
//    (1 − acc)/0.3), the craft's counter-attack is the next basic hit after a perfect one;
//  · the ring is the multiplier of the player's cast (× `PVE_FAMILY_POWER.dungeon`), the dodge the multiplier
//    of the enemy's cast.
//
// Pure and deterministic given a seed: the draws come from `defenseRoll` and `mulberry32`, never `Math.random`.
import { autoDefense, defenseRoll } from './autoDefesa';
import { ARENA_SKILL_ODDS, autoDefenseHitScale, familyOfSkill, type ArenaSkill } from './arena';
import { dungeonFoe, type DungeonFoeKnobs } from './dungeonBase';
import { DODGE_REDUCE, RING_MULT, type DodgeGrade, type RingGrade } from './energia';
import { nightmareFoe, nightmareSlots } from './nightmares';
import { jeitoParaPve, JEITO_PADRAO, type JeitoNaMasmorra, type JeitoPve } from './profissaoMasmorra';
import type { Combatant } from './combate/curve';
import type { FightSide } from './combate/fight';
import { groupFightSteps, type GroupEvent, type GroupResult } from './combate/group';
import type { AttrBonus } from './combate/bonus';
import { combatantAt, type StatWeights } from './combate/level';
import { mulberry32 } from './combate/rng';
import { PVE_FAMILY_POWER, specialOf, type SpecialFamily } from './combate/specials';
import type { EscolaId } from './soulProfile/ficha/types';

export type DungeonSkill = ArenaSkill;

export interface DungeonPlayerCfg {
  /** `soulCombatant(state)` (bonus 0). */
  combatant: Combatant;
  family: SpecialFamily;
  /** The craft's way (`jeitoDaProfissao`). Absent = `JEITO_PADRAO`. */
  jeito?: JeitoNaMasmorra;
  /** Knobs of the gates only (the RED of the counter-attack cap and of the skill tables). */
  contraTeto?: number;
  ring?: Readonly<Record<RingGrade, number>>;
  dodge?: Readonly<Record<DodgeGrade, number>>;
  /** `tal-pve-07` (Tarefa B): opening shield, fraction of the player's HP. Absent = 0 (the gates' simulations never set it). */
  startShield?: number;
}

/** The family of the special: the SPECIAL skill's own `familia` (PR9); without it, the default of its school. */
export const dungeonFamily = (skill: { familia?: SpecialFamily; escolaId?: EscolaId } | undefined | null): SpecialFamily => familyOfSkill(skill);

const jeitoOf = (p: DungeonPlayerCfg): JeitoPve => jeitoParaPve(p.jeito ?? JEITO_PADRAO, { contraTeto: p.contraTeto });

/** The player side of the core: HP × the craft, the family's special (single target: there is one foe). */
export function dungeonPlayerSide(p: DungeonPlayerCfg, opening = true): FightSide {
  return {
    combatant: { ...p.combatant, hp: p.combatant.hp * jeitoOf(p).hp },
    special: specialOf(p.family),
    area: 'single',
    startShield: opening ? p.startShield : 0,
  };
}

/** What a scene or a simulation hands to the core for ONE fight of the sequence. */
export interface DungeonFight {
  player: FightSide;
  foes: FightSide[];
  seed: number;
  /** Stateful (the counter-attack): build ONE per fight and give it to a single run of the core. */
  hitScale(who: number, n: number): number;
  castScale(i: { who: number; ring: RingGrade | null; dodge: DodgeGrade | null }): number;
}

/** Core seed of the fight `slot` of the floor `floor` of the run `runSeed`. */
export const dungeonFightSeed = (runSeed: number, floor: number, slot: number): number => (runSeed * 977 + floor * 13 + slot) | 0;

/**
 * One fight: the player against `foe`. `seed` is the fight's (`dungeonFightSeed`); it also seeds the
 * automatic defence (`defenseRoll`). The defence is perfect from `jeito.perfeito`; a perfect one arms the
 * counter-attack, which the next BASIC hit of the player collects.
 */
export function dungeonFight(p: DungeonPlayerCfg, foe: FightSide, seed: number, opening = true): DungeonFight {
  const j = jeitoOf(p);
  const castMult = j.cast * PVE_FAMILY_POWER.dungeon[p.family];
  let pending = 0;
  return {
    player: dungeonPlayerSide(p, opening),
    foes: [foe],
    seed,
    hitScale(who, n) {
      if (who === 0) {
        const c = pending;
        pending = 0;
        return j.basico * (1 + c);
      }
      const acc = autoDefense(defenseRoll(seed, 100000 + who * 1000 + n), { bonus: j.defesaBonus, perfect: j.perfeito }).acc;
      if (acc >= j.perfeito) {
        pending += j.contra;
        return 0;
      }
      return autoDefenseHitScale(acc, j.perfeito) * j.recebido;
    },
    castScale({ who, ring, dodge }) {
      return who === 0
        ? (p.ring ?? RING_MULT)[ring ?? 'ruim'] * castMult
        : (1 - (p.dodge ?? DODGE_REDUCE)[dodge ?? 'nada']) * j.recebido;
    },
  };
}

// ── Simulation (the balance gates' engine) ───────────────────────────────────

const RING_GRADES: readonly RingGrade[] = ['ruim', 'bom', 'otimo'];
const DODGE_GRADES: readonly DodgeGrade[] = ['nada', 'bom', 'otimo'];
const pickOdds = (r: () => number, p: readonly number[]): number => {
  const x = r();
  return x < p[0] ? 0 : x < p[0] + p[1] ? 1 : 2;
};

// ── The AUTOMATIC special (owner, 11/10/2026 — REGISTRO §36) ─────────────────
// Nobody taps the ring or swipes the dodge in the Dungeon any more: the Soulmon charges the special by itself.
// The grade of each cast is a SEEDED draw from the odds of the 'media' skill — the very odds every balance gate
// already simulates (`playSequence` default) — so the measured wall does not move. It depends only on the fight's
// seed and the cast's number: the same on screen at any speed and in the offline replay (`utils/dungeonAway.ts`).

/** The skill the automatic special plays at: the middle of `ARENA_SKILL_ODDS` (what the gates assume). */
export const DUNGEON_AUTO_SKILL: ArenaSkill = 'media';

/** Grade of the pet's `n`-th special (ring) of a fight. Pure: `(fightSeed, n)` → grade. */
export function autoRingGrade(fightSeed: number, n: number): RingGrade {
  return RING_GRADES[pickOdds(mulberry32((fightSeed * 7919 + n * 104729 + 11) | 0), ARENA_SKILL_ODDS[DUNGEON_AUTO_SKILL].ring)];
}

/** Grade of the dodge against the foe's `n`-th special of a fight. Pure. */
export function autoDodgeGrade(fightSeed: number, n: number): DodgeGrade {
  return DODGE_GRADES[pickOdds(mulberry32((fightSeed * 6271 + n * 130363 + 23) | 0), ARENA_SKILL_ODDS[DUNGEON_AUTO_SKILL].dodge)];
}

/* No cheer (torcida) in the Dungeon or the Nightmare (contexto §2.19): the Soulmon goes alone. */

/** One enemy of the sequence: its slot and the floor (dungeon level) it was built for. */
export interface DungeonSlotRef {
  readonly slot: number;
  readonly floor: number;
  /** `true` = o pesadelo (força própria, `nightmareFoe`), não o inimigo da Masmorra. */
  readonly nightmare?: boolean;
}

export interface SequenceConfig {
  /** Player level. */
  level: number;
  build: StatWeights;
  family: SpecialFamily;
  jeito?: JeitoNaMasmorra;
  /** PR12a: o bônus do jogador (já pelo teto de 5%): número = ATK; três canais = ATK/DEF/SPD. */
  bonus?: number | Partial<AttrBonus>;
  /** Tarefa B: `tal-pve-07` (opening shield) and `tal-pve-03` (extra heal between floors). The gates never set them. */
  startShield?: number;
  healBoost?: number;
  /** Knobs of the gates only. */
  knobs?: { foe?: DungeonFoeKnobs; contraTeto?: number; ring?: Readonly<Record<RingGrade, number>>; dodge?: Readonly<Record<DodgeGrade, number>> };
}

export interface SequenceResult {
  /** Fights WON, in order. */
  fightsWon: number;
  /** Duration of each fight played (the last may be a loss). */
  times: number[];
  /** HP fraction at the end. */
  hpLeft: number;
  won: boolean;
}

/**
 * Plays `refs` in order with HP and energy carried; `healAfter(i)` is the heal (fraction of the max HP)
 * applied after the fight `i` was won (floor ends). A draw or a defeat ends the sequence.
 */
export function playSequence(
  cfg: SequenceConfig, refs: readonly DungeonSlotRef[], seed: number, skill: DungeonSkill = 'media',
  healAfter: (i: number) => number = () => 0,
): SequenceResult {
  const p: DungeonPlayerCfg = {
    combatant: combatantAt(cfg.level, cfg.build, cfg.bonus), family: cfg.family, jeito: cfg.jeito,
    contraTeto: cfg.knobs?.contraTeto, ring: cfg.knobs?.ring, dodge: cfg.knobs?.dodge, startShield: cfg.startShield,
  };
  const odds = ARENA_SKILL_ODDS[skill];
  let hp = 1;
  let en = 0;
  const times: number[] = [];
  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    const fseed = dungeonFightSeed(seed, ref.floor, ref.slot);
    const f = dungeonFight(p, ref.nightmare ? nightmareFoe(cfg.level, ref.slot, cfg.knobs?.foe) : dungeonFoe(cfg.level, ref.slot, ref.floor, cfg.knobs?.foe), fseed, ref.slot === 0);
    const rng = mulberry32((seed * 7919 + i) | 0);
    const g = groupFightSteps(f.player, f.foes, { seed: f.seed, startHp: hp, startEnergy: en, hitScale: f.hitScale });
    let step = g.next();
    while (!step.done) {
      const e: GroupEvent = step.value;
      let ans: number | undefined;
      if (e.kind === 'cast') {
        ans = f.castScale(e.who === 0
          ? { who: 0, ring: RING_GRADES[pickOdds(rng, odds.ring)], dodge: null }
          : { who: e.who, ring: null, dodge: DODGE_GRADES[pickOdds(rng, odds.dodge)] });
      }
      step = g.next(ans);
    }
    const res: GroupResult = step.value;
    times.push(res.t);
    if (res.winner !== 'player') return { fightsWon: i, times, hpLeft: res.hpLeft, won: false };
    hp = Math.min(1, res.hpLeft + healAfter(i));
    en = res.energyLeft;
  }
  return { fightsWon: refs.length, times, hpLeft: hp, won: true };
}

/** The ladder of a run: `floors` floors from `startFloor`, the 6 slots each. */
export function ladderRefs(floors: number, startFloor = 1): DungeonSlotRef[] {
  const out: DungeonSlotRef[] = [];
  for (let f = startFloor; f < startFloor + floors; f++) for (let slot = 0; slot < 6; slot++) out.push({ slot, floor: f });
  return out;
}

export interface DungeonRunResult {
  /** Floors fully cleared. */
  floorsCleared: number;
  /** Duration of each fight, by floor (index 0 = the first floor played). */
  timesByFloor: number[][];
  won: boolean;
}

/** A run of the Dungeon: `floors` floors from `startFloor`, healing `jeito.curaAndar` between floors. */
export function simulateDungeonRunV3(
  cfg: SequenceConfig, seed: number, skill: DungeonSkill = 'media', floors = 5, startFloor = 1,
): DungeonRunResult {
  const cura = jeitoParaPve(cfg.jeito ?? JEITO_PADRAO).cura;
  const r = playSequence(cfg, ladderRefs(floors, startFloor), seed, skill, (i) => (i % 6 === 5 ? cura + (cfg.healBoost ?? 0) : 0));
  const timesByFloor: number[][] = [];
  r.times.forEach((t, i) => { (timesByFloor[Math.floor(i / 6)] ??= []).push(t); });
  return { floorsCleared: Math.floor(r.fightsWon / 6), timesByFloor, won: r.won };
}

/**
 * The Nightmare: the slots `top−1..top` of floor 1, ALWAYS (the `max(1, top−1)` of the old floor is gone).
 * `top` is the index of the tier (0..5).
 */
export function nightmareRefs(top: number): DungeonSlotRef[] {
  return nightmareSlots(top).map((slot) => ({ slot, floor: 1, nightmare: true }));
}

export function simulateNightmareV3(cfg: SequenceConfig, top: number, seed: number, skill: DungeonSkill = 'media'): SequenceResult {
  return playSequence(cfg, nightmareRefs(top), seed, skill);
}

// ── The NIGHTMARE fight (owner, 15/10/2026 — REGISTRO §65) ───────────────────
// The win is the plain HP verdict (nightmare at 0 = extinguished; Soulmon at 0 = it faded). The difficulty is that the
// nightmare is a SHADOW: the Soulmon's basic blows only graze it (`basic`), its specials hit full only when the ring is
// hit (`ring*`), and the CHEER (each discharge the core collects) wards off the nightmare's blows (`guardPerCheer`, up to
// `guardMax`). Without the cheer and the specials the Soulmon falls first; with both it wins with room to spare.
export interface NightmareKnobs {
  /** Multiplier of the Soulmon's BASIC blows against the nightmare. */
  basic: number;
  /** Multiplier of the special by ring grade (replaces `RING_MULT` in this fight). */
  ring: Readonly<Record<RingGrade, number>>;
  /** Fraction of the nightmare's damage warded off per collected cheer discharge, and the cap. */
  guardPerCheer: number;
  guardMax: number;
}

export const NIGHTMARE_KNOBS: NightmareKnobs = {
  basic: 0.4,
  // 20/10/2026 (dono): "basta soltar o especial" — errar o anel (`ruim`) já vale como o acerto parcial.
  ring: { ruim: 1.6, bom: 1.6, otimo: 2 },
  guardPerCheer: 0.24,
  guardMax: 0.72,
};

/** One fight of the Nightmare: `dungeonFight` + the shadow rules above. `cheers()` = discharges collected so far. */
export function nightmareFight(p: DungeonPlayerCfg, foe: FightSide, seed: number, cheers: () => number, k: NightmareKnobs = NIGHTMARE_KNOBS): DungeonFight {
  const f = dungeonFight({ ...p, ring: k.ring }, foe, seed, true);
  return {
    ...f,
    hitScale(who, n) {
      const s = f.hitScale(who, n);
      return who === 0 ? s * k.basic : s * (1 - Math.min(k.guardMax, k.guardPerCheer * cheers()));
    },
  };
}

/** The player's behaviour in a simulated Nightmare. */
export interface NightmareScenario {
  /** Seconds of fight between two cheer discharges (24 taps); `null` = never cheers. */
  cheerEvery: number | null;
  /** Grade of every special's ring. */
  ring: RingGrade;
}
/** 24 taps at the 16-per-3-s cap take 4.5 s; a comfortable tapper takes 6. */
export const CHEER_EVERY_S = 6;
export const SCENARIO_FULL: NightmareScenario = { cheerEvery: CHEER_EVERY_S, ring: 'bom' };
export const SCENARIO_NONE: NightmareScenario = { cheerEvery: null, ring: 'ruim' };

/** Plays the Nightmare of the tier `top` for a scenario; the foe is `nightmareFoe`. Deterministic by `seed`. */
export function simulateNightmareScenario(cfg: SequenceConfig, top: number, seed: number, sc: NightmareScenario, k: NightmareKnobs = NIGHTMARE_KNOBS): { won: boolean; hpLeft: number; t: number } {
  const p: DungeonPlayerCfg = { combatant: combatantAt(cfg.level, cfg.build, cfg.bonus), family: cfg.family, jeito: cfg.jeito };
  let drained = 0;
  let lastT = 0;
  const f = nightmareFight(p, nightmareFoe(cfg.level, top, cfg.knobs?.foe), dungeonFightSeed(seed, 1, top), () => drained, k);
  const g = groupFightSteps(f.player, f.foes, {
    seed: f.seed, startHp: 1, startEnergy: 0, hitScale: f.hitScale,
    cheerDrain: () => {
      if (sc.cheerEvery === null) return 0;
      const due = Math.floor(lastT / sc.cheerEvery);
      const n = Math.max(0, due - drained);
      drained += n;
      return n;
    },
  });
  let step = g.next();
  while (!step.done) {
    const e: GroupEvent = step.value;
    lastT = e.t;
    step = g.next(e.kind === 'cast'
      ? f.castScale(e.who === 0 ? { who: 0, ring: sc.ring, dodge: null } : { who: e.who, ring: null, dodge: autoDodgeGrade(f.seed, 0) })
      : undefined);
  }
  const r = step.value;
  return { won: r.winner === 'player', hpLeft: r.hpLeft, t: r.t };
}
