/**
 * Combat v3 — Soulmon level, points and automatic HP (story PR1; contexto §2.7/§2.8).
 *
 * The level defines the TOTAL of points (1 per level, only ATK/DEF/SPD); the
 * branch decides the DISTRIBUTION, bounded by a ceiling (45%) and a floor (15%)
 * per attribute. HP grows by itself with the level and never costs a point.
 * Everything is a pure function of (level, weights): the same level always
 * yields the same stats, so degeneration (level goes down) and recovery are
 * exact by construction.
 */

import { STAGE_LEVEL_CAPS } from '../../types/progression';
import { CURVE_K, type Combatant } from './curve';
import { toAttrBonus, type AttrBonus } from './bonus';

/**
 * Level ceiling per stage (6/13/21/30/40): owned by `types/progression.ts`,
 * derived from `FORM_REQUIREMENTS.cap`. Re-exported for the core.
 */
export { STAGE_LEVEL_CAPS };

export const MAX_LEVEL = STAGE_LEVEL_CAPS[STAGE_LEVEL_CAPS.length - 1];

/** Share ceiling and floor of one attribute over the level's points (§2.8, §2.10). */
export const MAX_SHARE = 0.45;
export const MIN_SHARE = 0.15;

/** HP = HP_BASE · 1.5^stage · (1 + L/HP_LEVEL_DIVISOR). */
export const HP_BASE = 10;
export const HP_LEVEL_DIVISOR = 10;
export const STAGE_FACTOR = 1.5;

export interface StatWeights {
  readonly atk: number;
  readonly def: number;
  readonly spd: number;
}

export interface Points {
  readonly atk: number;
  readonly def: number;
  readonly spd: number;
}

/**
 * The declared sample of builds every balance gate measures (story PR1, V1):
 * the three extremes the caps allow and the balanced one. Tests iterate THIS
 * list; they never keep their own.
 */
export const REFERENCE_BUILDS: Readonly<Record<'atk' | 'def' | 'spd' | 'balanced', StatWeights>> = {
  atk: { atk: 1, def: 0, spd: 0 },
  def: { atk: 0, def: 1, spd: 0 },
  spd: { atk: 0, def: 0, spd: 1 },
  balanced: { atk: 1 / 3, def: 1 / 3, spd: 1 / 3 },
};
export type ReferenceBuild = keyof typeof REFERENCE_BUILDS;
export const REFERENCE_BUILD_NAMES = Object.keys(REFERENCE_BUILDS) as ReferenceBuild[];

/** Clamps any input to an integer level in [1, MAX_LEVEL]. Dirty input never throws. */
export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
}

/** Stage index (0 = rookie … 4 = ultra) of a level. */
export function stageOfLevel(level: number): number {
  const L = clampLevel(level);
  return STAGE_LEVEL_CAPS.findIndex((cap) => L <= cap);
}

/** Lowest level of a stage. */
export function firstLevelOfStage(stage: number): number {
  return stage <= 0 ? 1 : STAGE_LEVEL_CAPS[stage - 1] + 1;
}

/** Base ATK/DEF/SPD of a stage: ceil(1.5^s). */
export function stageBase(stage: number): number {
  return Math.ceil(STAGE_FACTOR ** stage);
}

/** Automatic HP: 10·1.5^s·(1+L/10). */
export function autoHp(level: number): number {
  const L = clampLevel(level);
  return HP_BASE * STAGE_FACTOR ** stageOfLevel(L) * (1 + L / HP_LEVEL_DIVISOR);
}

export interface ShareBounds {
  readonly maxShare: number;
  readonly minShare: number;
}
export const SHARE_BOUNDS: ShareBounds = { maxShare: MAX_SHARE, minShare: MIN_SHARE };

const ORDER = ['atk', 'spd', 'def'] as const;

function cleanWeights(w: StatWeights): StatWeights {
  const c = (x: number) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : 0);
  const atk = c(w.atk), def = c(w.def), spd = c(w.spd);
  const sum = atk + def + spd;
  return sum > 0 ? { atk: atk / sum, def: def / sum, spd: spd / sum } : REFERENCE_BUILDS.balanced;
}

/**
 * Distributes exactly L points over ATK/DEF/SPD.
 * - every attribute starts at its floor floor(minShare·L);
 * - each remaining point goes to the attribute furthest below its weighted
 *   target, never past the ceiling max(ceil(L/3), floor(maxShare·L));
 * - ties break in the fixed order ATK, SPD, DEF (deterministic).
 * Invariant: atk + def + spd === L for every L and every weight.
 */
export function distributePoints(level: number, weights: StatWeights, bounds: ShareBounds = SHARE_BOUNDS): Points {
  const L = clampLevel(level);
  const w = cleanWeights(weights);
  const cap = Math.max(Math.ceil(L / 3), Math.floor(bounds.maxShare * L));
  const floor = Math.min(Math.floor(bounds.minShare * L), Math.floor(L / 3));
  const p = { atk: floor, def: floor, spd: floor };
  for (let n = 3 * floor + 1; n <= L; n++) {
    let best: (typeof ORDER)[number] | null = null;
    let bestNeed = -Infinity;
    for (const a of ORDER) {
      if (p[a] >= cap) continue;
      const need = w[a] * n - p[a];
      if (need > bestNeed + 1e-9) {
        best = a;
        bestNeed = need;
      }
    }
    // 3·cap ≥ L always, so some attribute is below its cap.
    p[best as (typeof ORDER)[number]]++;
  }
  return p;
}

/**
 * Full combatant at a level for a branch. `bonus` must already be capped (see `bonus.ts`): a number is the ATK channel
 * (damage dealt, `Combatant.bonus`, kept as is); the three-channel form (PR7b, PvP) folds DEF and SPD into the stat
 * itself, EXACTLY: the curve and the rhythm are linear in (1 + stat/K), so (1 + def'/K) = (1 + def/K)(1 + b) makes the
 * foe need (1 + b) times more hits, and the same on SPD makes the attacks (1 + b) times more frequent. The engine does not change.
 */
export function combatantAt(level: number, weights: StatWeights, bonus: number | Partial<AttrBonus> = 0, bounds: ShareBounds = SHARE_BOUNDS, floor?: StatFloor): Combatant {
  const L = clampLevel(level);
  const b = stageBase(stageOfLevel(L));
  const p = distributePoints(L, weights, bounds);
  // "Evoluir nunca reduz" (REGISTRO §229): o piso (do estágio certo) entra ANTES do bônus de PvP, que dobra em cima do valor final.
  const f = floor && floor.s === stageOfLevel(L) ? floor : undefined;
  const atk = Math.max(b + p.atk, f?.atk ?? 0), def0 = Math.max(b + p.def, f?.def ?? 0), spd0 = Math.max(b + p.spd, f?.spd ?? 0);
  if (typeof bonus === 'number') return { level: L, atk, def: def0, spd: spd0, hp: autoHp(L), bonus };
  const ab = toAttrBonus(bonus);
  const fold = (v: number, x: number) => (x > 0 ? CURVE_K * ((1 + v / CURVE_K) * (1 + x) - 1) : v);
  return { level: L, atk, def: fold(def0, ab.def), spd: fold(spd0, ab.spd), hp: autoHp(L), bonus: ab.atk };
}

/**
 * PISO DE ATRIBUTO DA EVOLUÇÃO (REGISTRO §229). Ao evoluir, os pontos de alinhamento zeram (§209) e a distribuição volta ao
 * equilíbrio; nos 1–2 últimos levels de Ultimate e Mega isso tirava 1 ponto de Defesa/Velocidade (nunca de Ataque).
 * `s` = índice do estágio em que o piso vale; fora dele o piso é inerte (queda e re-evolução o reescrevem, nunca o somam).
 */
export interface StatFloor {
  readonly s: number;
  readonly atk: number;
  readonly def: number;
  readonly spd: number;
}

/** O maior valor que UM atributo pode ter no estágio `s` (base + teto de pontos no último level): o teto legítimo de um piso gravado no estágio seguinte. */
export function statMaxOfStage(s: number): number {
  const L = STAGE_LEVEL_CAPS[s];
  return stageBase(s) + Math.max(Math.ceil(L / 3), Math.floor(MAX_SHARE * L));
}

/** Lê um piso do save (lixo → `undefined`). Inteiros; `s` em 1..4; cada valor limitado a `statMaxOfStage(s - 1)`, então um save adulterado nunca passa do que um jogador legítimo teria. */
export function sanitizeStatFloor(v: unknown): StatFloor | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;
  const s = o.s;
  if (typeof s !== 'number' || !Number.isInteger(s) || s < 1 || s >= STAGE_LEVEL_CAPS.length) return undefined;
  const max = statMaxOfStage(s - 1);
  const c = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? Math.min(max, Math.max(0, Math.floor(x))) : 0);
  return { s, atk: c(o.atk), def: c(o.def), spd: c(o.spd) };
}

/** Levels sampled by the ruler: first, middle and last of every stage (15 levels). */
export const RULER_LEVELS: readonly number[] = [
  ...new Set(
    STAGE_LEVEL_CAPS.flatMap((cap, s) => {
      const lo = firstLevelOfStage(s);
      return [lo, Math.round((lo + cap) / 2), cap];
    }),
  ),
];
