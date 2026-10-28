/** Tipos do dono único do duelo fantasma (`_duel.js`) para o cliente TS e os testes. */
import type { Combatant, FightEvent, Special } from './_combate.js';

export interface DuelSide {
  combatant: Combatant;
  special: Special;
  /** PR7b: rendimento da torcida (talento `tal-pvp-05`), 1 sem o nó. */
  cheerScale?: number;
  startEnergy?: number;
  dotResist?: number;
  fx: { basica: string | null; especial: string | null; familia?: string | null; elBasica?: string | null; elEspecial?: string | null };
}
export type DuelWinner = 'me' | 'opp' | 'draw';
export interface DuelResult {
  events: FightEvent[];
  winner: DuelWinner;
  hpMe: number;
  hpOpp: number;
  timeMe: number;
  timeOpp: number;
}
export declare const PVP_HP_SCALE: number;
export declare const DUEL_PENDING_MS: number;
export declare const DUEL_TAPS_FULL: number;
export declare const DUEL_TAPS_CAP: number;
export declare const DUEL_CHEER_BUCKETS: number;
export declare const DUEL_DAY_MS: number;
export declare const DUEL_SAVE_MAX_CHARS: number;
export declare const SPECIAL_FAMILY_IDS: string[];
export declare const ESCOLA_FAMILY: Record<string, string>;
export declare function sanitizeTaps(raw: unknown): number[];
export declare function bucketTapTimes(counts: readonly number[]): number[];
export declare function duelCheerEvents(rawTaps: unknown, side?: 0 | 1, scale?: number): { t: number; side: 0 | 1; scale?: number }[];
export declare function maxLevelFor(firstSeen: unknown, now: number): number;
export declare function fichaStageOf(evolutionStage: unknown): string;
export declare function duelSide(save: unknown, opts?: { maxLevel?: number }): DuelSide;
export declare function duelCombatant(save: unknown, opts?: { maxLevel?: number }): Combatant;
export declare function duelSeed(...parts: Array<string | number>): number;
export declare function simulateDuel(args: { me: Pick<DuelSide, 'combatant' | 'special'>; opp: Pick<DuelSide, 'combatant' | 'special'>; seed: number; taps?: unknown }): DuelResult;
export declare const ELEMENTOS_FICHA: ReadonlySet<string>;
