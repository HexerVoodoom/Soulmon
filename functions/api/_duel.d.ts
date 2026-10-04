/** Tipos do dono único do duelo fantasma (`_duel.js`) para o cliente TS. */
export interface DuelStats { hp: number; atk: number }
export interface DuelEvent {
  actor: 'me' | 'opp';
  dmg: number;
  /** Só do dono da tela: 1 = o golpe foi o ESPECIAL, 0 = normal (legado do timing: a qualidade q). */
  cheer: number | null;
  /** O golpe foi o ESPECIAL (energia cheia) — de qualquer um dos dois lutadores. */
  special: boolean;
  hpMe: number;
  hpOpp: number;
  /** Energia de cada lutador ANTES do golpe (já com o cheer despejado; a que dispara o especial). */
  preMe: number;
  preOpp: number;
  /** Energia (0..DUEL_ENERGY_MAX) de cada lutador DEPOIS do golpe. */
  energyMe: number;
  energyOpp: number;
  /** O medidor de cheer (toques acumulados, 0..DUEL_TAPS_FULL) depois do golpe. */
  meter: number;
}
export interface DuelResult { events: DuelEvent[]; won: boolean; hpMe: number; hpOpp: number }
export declare const DUEL_MAX_TURNS: number;
export declare const DUEL_PENDING_MS: number;
export declare const DUEL_CHEER_STRIKES: number[];
export declare const DUEL_CHEER_WINDOWS: number;
export declare const DUEL_PERFECT_CHEER: number;
export declare const DUEL_CHEER_GAIN: number;
export declare const DUEL_PERFECT_MULT: number;
export declare const TIMING_CHEER_ENABLED: boolean;
export declare const DUEL_TAPS_FULL: number;
export declare const DUEL_TAPS_CAP: number;
export declare const DUEL_ENERGY_MAX: number;
export declare const DUEL_ENERGY_DEALT: number;
export declare const DUEL_ENERGY_TAKEN: number;
export declare const DUEL_ENERGY_CHEER: number;
export declare const DUEL_SPECIAL_MULT: number;
export declare const DUEL_DMG_SPREAD: number;
export declare const DUEL_HP_BASE: number;
export declare const DUEL_HP_PER_STAGE: number;
export declare function sanitizeTaps(raw: unknown): number[];
export declare function cheerDischarges(taps: unknown): boolean[];
export declare function duelStats(profile: { stage?: string; attrs?: Record<string, number> } | null | undefined): DuelStats;
export declare function duelSeed(...parts: Array<string | number>): number;
export declare function sanitizeCheers(raw: unknown): number[];
export declare function cheerMultiplier(q: number): number;
export declare function simulateDuel(args: { me: DuelStats; opp: DuelStats; seed: number; cheers: unknown }): DuelResult;
