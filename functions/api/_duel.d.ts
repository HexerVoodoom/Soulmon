/** Tipos do dono único do duelo fantasma (`_duel.js`) para o cliente TS. */
export interface DuelStats { hp: number; atk: number }
export interface DuelEvent { actor: 'me' | 'opp'; dmg: number; cheer: number | null; hpMe: number; hpOpp: number }
export interface DuelResult { events: DuelEvent[]; won: boolean; hpMe: number; hpOpp: number }
export declare const DUEL_MAX_TURNS: number;
export declare const DUEL_PENDING_MS: number;
export declare const DUEL_CHEER_STRIKES: number[];
export declare const DUEL_PERFECT_CHEER: number;
export declare const DUEL_CHEER_GAIN: number;
export declare const DUEL_PERFECT_MULT: number;
export declare function duelStats(profile: { stage?: string; attrs?: Record<string, number> } | null | undefined): DuelStats;
export declare function duelSeed(...parts: Array<string | number>): number;
export declare function sanitizeCheers(raw: unknown): number[];
export declare function cheerMultiplier(q: number): number;
export declare function simulateDuel(args: { me: DuelStats; opp: DuelStats; seed: number; cheers: unknown }): DuelResult;
