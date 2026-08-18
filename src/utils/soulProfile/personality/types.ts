// ---------------------------------------------------------------------------
// Teste de personalidade — vocabulário.
// Portado de `teste-personalidade/src/lib/personality/types.ts`. Mudanças em
// relação à origem, ambas pela regra "todo texto nasce PT+EN":
//   • `TraitLevel` virou um ID ('very-low'…'very-high') em vez da string em
//     português — o rótulo bilíngue mora em `labels.ts`.
//   • `ValidityIndices.flags` virou LText[].
// ---------------------------------------------------------------------------

import type { LText } from '../../oracle';

/**
 * Trait model: the five factors of the Big Five plus Honesty-Humility, the
 * sixth factor that HEXACO adds and that repeatedly emerges in lexical studies
 * across languages (Ashton & Lee, 2007). Keeping it separate from
 * Agreeableness is what lets the model distinguish "kind" from "principled".
 */
export type TraitDimension =
  | "openness"
  | "conscientiousness"
  | "extraversion"
  | "agreeableness"
  | "neuroticism"
  | "honestyHumility";

export type JungAxis = "EI" | "SN" | "TF" | "JP";

export type Dimension = TraitDimension | JungAxis;

export const TRAIT_DIMENSIONS: TraitDimension[] = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "neuroticism",
  "honestyHumility",
];

export const JUNG_AXES: JungAxis[] = ["EI", "SN", "TF", "JP"];

export type ItemKind = "likert" | "frequency" | "forced-choice" | "scenario";

interface BaseItem {
  id: string;
  kind: ItemKind;
}

/** Agreement item, answered on a 1-5 Likert scale. */
export interface LikertItem extends BaseItem {
  kind: "likert" | "frequency";
  dimension: Dimension;
  facet: string;
  text: LText;
  /** false = reverse-keyed: agreeing lowers the trait score. */
  positive: boolean;
  /** Marks this item as one half of a consistency-check pair. */
  consistencyPair?: string;
}

/** Ipsative item: the respondent picks the option that fits better. */
export interface ForcedChoiceItem extends BaseItem {
  kind: "forced-choice";
  dimension: Dimension;
  facet: string;
  prompt: LText;
  /** Option A scores toward the dimension's positive pole. */
  a: { text: LText };
  /** Option B scores toward the negative pole. */
  b: { text: LText };
}

/** Situational item: one stem, four reactions loading on several traits. */
export interface ScenarioItem extends BaseItem {
  kind: "scenario";
  situation: LText;
  /** Dimensions this scenario contributes points to. */
  covers: Dimension[];
  options: {
    id: string;
    text: LText;
    /** 0-4 contribution per covered dimension. */
    weights: Partial<Record<Dimension, number>>;
  }[];
}

export type Item = LikertItem | ForcedChoiceItem | ScenarioItem;

export type LikertValue = 1 | 2 | 3 | 4 | 5;

/** Answer payloads keyed by item id. */
export type Answer =
  | { kind: "likert"; value: LikertValue }
  | { kind: "forced-choice"; choice: "a" | "b" }
  | { kind: "scenario"; optionId: string };

export type Answers = Record<string, Answer>;

export type TraitLevel = "very-low" | "low" | "moderate" | "high" | "very-high";

export interface TraitScore {
  dimension: TraitDimension;
  /** 0-100 normalized score. */
  score: number;
  level: TraitLevel;
  /** Per-facet breakdown, also 0-100. */
  facets: { facet: string; score: number }[];
}

export interface JungAxisScore {
  axis: JungAxis;
  /** 0-100 toward the first pole (E, S, T, J). */
  score: number;
  pole: string;
  /** How far from the 50/50 midpoint, 0-100. Low = the type letter is weak. */
  clarity: number;
}

export interface JungTypeResult {
  code: string;
  axes: Record<JungAxis, JungAxisScore>;
  /** Letters whose clarity is too low to assert confidently. */
  weakAxes: JungAxis[];
}

/**
 * Response-style indices. These do not measure personality — they measure
 * whether the protocol can be trusted, which is standard practice in
 * self-report inventories.
 */
export interface ValidityIndices {
  /** 0-100. Tendency to agree regardless of item keying. */
  acquiescence: number;
  /** 0-100. Disagreement between items that should have matched. */
  inconsistency: number;
  /** 0-100. Share of answers at the extremes of the scale. */
  extremeResponding: number;
  /** 0-100. Share of answers at the exact midpoint. */
  midpointResponding: number;
  flags: LText[];
  /** False when at least one index is badly out of range. */
  trustworthy: boolean;
}

export interface PersonalityProfile {
  traits: Record<TraitDimension, TraitScore>;
  jung: JungTypeResult;
  validity: ValidityIndices;
  /** Flat 0-100 map — the export contract for the class-system. */
  traitPoints: Record<string, number>;
  answeredCount: number;
  totalItems: number;
}
