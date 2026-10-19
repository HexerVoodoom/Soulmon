/**
 * Tipos do DONO ÚNICO do ritmo das refeições (`_mealRhythm.js`). ESM puro em
 * `functions/api/` porque cliente, worker de push e rotas de inscrição fazem a
 * mesma conta de horário; a declaração é para o cliente (TS) importar sem `any`.
 */
export type MealKey = 'breakfast' | 'lunch' | 'dinner';
export type MealTimes = Record<MealKey, string>;

export declare const MEAL_KEYS: readonly MealKey[];
export declare const MEAL_STEP_MIN: number;
export declare const MEAL_WINDOW_MIN: number;
export declare const MEAL_MIN_GAP_MIN: number;
export declare const DEFAULT_MEAL_TIMES: MealTimes;
export declare const MEAL_RANGE_MIN: Record<MealKey, [number, number]>;
export declare const PUSH_DAILY_CAP: number;
export declare const MEAL_TICK_CRON: string;

export declare function parseHHMM(hhmm: string): number;
export declare function formatHHMM(minutes: number): string;
export declare function normalizeMealTimes(input: unknown): MealTimes;
export declare function mealMinutes(times: unknown): number[];
export declare function localMinutes(at: Date, tzOffsetMin: number): number;
export declare function inRestArc(minute: number, rest: readonly number[] | null | undefined): boolean;
export declare function mealAtTick(localMin: number, times: unknown): MealKey | null;
export declare function tickOf(localMin: number): number;
export declare function openMealWindow(localMin: number, times: unknown): MealKey | null;
export declare function seededIndex(seed: string, length: number): number;
