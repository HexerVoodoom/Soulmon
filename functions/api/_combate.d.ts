/** Tipos do espelho do núcleo de combate v3 no servidor (`_combate.js`; travado por `combate.parity.test.js`). */
export interface Combatant { level: number; atk: number; def: number; spd: number; hp: number; bonus: number }
export type SpecialFamily = 'direct' | 'dot' | 'heal' | 'shield' | 'atkBuff' | 'defDebuff' | 'spdBuff';
export interface Special { family: SpecialFamily; power: number }
export interface StatWeights { atk: number; def: number; spd: number }
export interface FightSide { combatant: Combatant; special: Special | null }
export interface CheerEvent { t: number; side: 0 | 1; scale?: number }
export interface VarianceConfig { rho: number; sigma: number; floor: number }
export interface FightOptions {
  seed: number;
  hpScale?: number;
  variance?: VarianceConfig | null;
  windowLevel?: number;
  phases?: number[];
  unitH0?: number | null;
  startHp?: number[];
  startEnergy?: number[];
  hitScale?: (who: 0 | 1, n: number) => number;
  cheer?: CheerEvent[];
  stopAtFirstKo?: boolean;
}
export type FightWinner = 'A' | 'B' | 'draw';
export interface FightResult {
  timeA: number; timeB: number; castsA: number; castsB: number; winner: FightWinner;
  hpA: number; hpB: number; energyA: number; energyB: number;
}
export interface FightEvent {
  kind: 'attack' | 'cast' | 'tick' | 'ko';
  t: number;
  side: 0 | 1;
  frac: number;
  hp: [number, number];
  energy: [number, number];
}
export declare function mulberry32(seed: number): () => number;
export declare function sideSeed(seed: number, side: 1 | 2): number;
export declare const PHASE_SALT: number;
export declare const VARIANCE: VarianceConfig;
export declare const CURVE_K: number;
export declare const BASE_ATTACKS_PER_WINDOW: number;
export declare function hitsToKnockOut(attacker: Pick<Combatant, 'atk' | 'bonus'>, defender: Pick<Combatant, 'hp' | 'def'>): number;
export declare function attacksPerWindow(spd: number): number;
export declare const STAGE_LEVEL_CAPS: number[];
export declare const MAX_LEVEL: number;
export declare const MAX_SHARE: number;
export declare const MIN_SHARE: number;
export declare const HP_BASE: number;
export declare const HP_LEVEL_DIVISOR: number;
export declare const STAGE_FACTOR: number;
export declare const REFERENCE_BUILDS: Record<'atk' | 'def' | 'spd' | 'balanced', StatWeights>;
export declare function clampLevel(level: number): number;
export declare function stageOfLevel(level: number): number;
export declare function firstLevelOfStage(stage: number): number;
export declare function stageBase(stage: number): number;
export declare function autoHp(level: number): number;
export declare function distributePoints(level: number, weights: StatWeights): StatWeights;
export declare function combatantAt(level: number, weights: StatWeights, bonus?: number | Partial<AttrBonus>): Combatant;
export declare const COMBAT_BONUS_CAP: number;
export declare function combinedBonus(sources: { talent?: number; equipment?: number; commerce?: number; rebirth?: number }): number;
export interface AttrBonus { atk: number; def: number; spd: number }
export declare function combinedAttrBonus(sources: { talent?: Partial<AttrBonus>; equipment?: Partial<AttrBonus>; commerce?: Partial<AttrBonus>; rebirth?: Partial<AttrBonus> }): AttrBonus;
export declare function toAttrBonus(b: number | Partial<AttrBonus> | undefined): AttrBonus;
export declare const SPECIAL_BUDGET_HITS: number;
export declare const SPECIAL_FAMILIES: SpecialFamily[];
export declare const SPECIAL_POWER: Record<SpecialFamily, number>;
export declare function specialOf(family: unknown): Special;
export declare const ENERGY: { perDealt: number; perReceived: number; perSecond: number };
export declare const ENERGY_TRIGGER: number;
export declare const CHEER: { tapsFull: number; tapsCapPerBucket: number; bucketSeconds: number; energyPerDischarge: number; pvpEnergyPerDischarge: number };
export declare const CHEER_SCALE_MAX: number;
export declare function cleanCheerScale(x: unknown): number;
export declare function cheerEvents(taps: readonly number[], side: 0 | 1, scale?: number): CheerEvent[];
export declare const MIRROR_SECONDS: number;
export declare const HIT_UNIT_H0: number;
export declare const PVP_HP_SCALE: number;
export declare const EPS: number;
export declare const DRAW_EPS: number;
export declare function windowSeconds(level: number): number;
export declare function hitUnit(level: number, h0?: number): number;
export declare function fightSteps(a: FightSide, b: FightSide, opts: FightOptions): Generator<FightEvent, FightResult, number | undefined>;
export declare function fight(a: FightSide, b: FightSide, opts: FightOptions): FightResult;
export declare function soulWeights(state: unknown): StatWeights;
export declare function soulCombatant(state: unknown, opts?: { maxLevel?: number; bonus?: number | Partial<AttrBonus> }): Combatant;
