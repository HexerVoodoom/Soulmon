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
import { ARENA_SKILL_ODDS, autoDefenseHitScale, familyOfEscola, type ArenaSkill } from './arena';
import { dungeonFoe, type DungeonFoeKnobs } from './dungeon';
import { DODGE_REDUCE, RING_MULT, type DodgeGrade, type RingGrade } from './energia';
import { nightmareSlots } from './nightmares';
import { jeitoParaPve, JEITO_PADRAO, type JeitoNaMasmorra, type JeitoPve } from './profissaoMasmorra';
import type { Combatant } from './combate/curve';
import type { FightSide } from './combate/fight';
import { groupFightSteps, type GroupEvent, type GroupResult } from './combate/group';
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
}

/** The family of the special by the school of the SPECIAL skill (provisional until PR9, like the Arena). */
export const dungeonFamily = (escola: EscolaId | undefined): SpecialFamily => familyOfEscola(escola);

const jeitoOf = (p: DungeonPlayerCfg): JeitoPve => jeitoParaPve(p.jeito ?? JEITO_PADRAO, { contraTeto: p.contraTeto });

/** The player side of the core: HP × the craft, the family's special (single target: there is one foe). */
export function dungeonPlayerSide(p: DungeonPlayerCfg): FightSide {
  return {
    combatant: { ...p.combatant, hp: p.combatant.hp * jeitoOf(p).hp },
    special: specialOf(p.family),
    area: 'single',
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
export function dungeonFight(p: DungeonPlayerCfg, foe: FightSide, seed: number): DungeonFight {
  const j = jeitoOf(p);
  const castMult = j.cast * PVE_FAMILY_POWER.dungeon[p.family];
  let pending = 0;
  return {
    player: dungeonPlayerSide(p),
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

/* No cheer (torcida) in the Dungeon or the Nightmare (contexto §2.19): the Soulmon goes alone. */

/** One enemy of the sequence: its slot and the floor (dungeon level) it was built for. */
export interface DungeonSlotRef {
  readonly slot: number;
  readonly floor: number;
}

export interface SequenceConfig {
  /** Player level. */
  level: number;
  build: StatWeights;
  family: SpecialFamily;
  jeito?: JeitoNaMasmorra;
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
    combatant: combatantAt(cfg.level, cfg.build), family: cfg.family, jeito: cfg.jeito,
    contraTeto: cfg.knobs?.contraTeto, ring: cfg.knobs?.ring, dodge: cfg.knobs?.dodge,
  };
  const odds = ARENA_SKILL_ODDS[skill];
  let hp = 1;
  let en = 0;
  const times: number[] = [];
  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    const fseed = dungeonFightSeed(seed, ref.floor, ref.slot);
    const f = dungeonFight(p, dungeonFoe(cfg.level, ref.slot, ref.floor, cfg.knobs?.foe), fseed);
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
  const r = playSequence(cfg, ladderRefs(floors, startFloor), seed, skill, (i) => (i % 6 === 5 ? cura : 0));
  const timesByFloor: number[][] = [];
  r.times.forEach((t, i) => { (timesByFloor[Math.floor(i / 6)] ??= []).push(t); });
  return { floorsCleared: Math.floor(r.fightsWon / 6), timesByFloor, won: r.won };
}

/**
 * The Nightmare: the slots `top−1..top` of floor 1, ALWAYS (the `max(1, top−1)` of the old floor is gone).
 * `top` is the index of the tier (0..5).
 */
export function nightmareRefs(top: number): DungeonSlotRef[] {
  return nightmareSlots(top).map((slot) => ({ slot, floor: 1 }));
}

export function simulateNightmareV3(cfg: SequenceConfig, top: number, seed: number, skill: DungeonSkill = 'media'): SequenceResult {
  return playSequence(cfg, nightmareRefs(top), seed, skill);
}
