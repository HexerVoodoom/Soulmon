/**
 * Combat v3 — os tipos públicos do simulador 1v1 (`fight.ts` os reexporta; quem importa de `./fight` não muda nada).
 * Separados para `fight.ts` ficar abaixo de 500 linhas (catraca anti-slop).
 */
import type { Combatant } from './curve';
import type { VarianceConfig } from './rng';
import type { Special } from './specials';

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
  /** Hexsmith H2: golpes que ainda doem menos em quem tem `defBuff` (`nGuard`) e golpes que quem tem `atkDebuff` ainda dá mais fracos (`nWeak`). */
  readonly nGuard?: number;
  readonly nWeak?: number;
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
