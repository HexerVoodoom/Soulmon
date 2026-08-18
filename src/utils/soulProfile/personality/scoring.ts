// ---------------------------------------------------------------------------
// Pontuação do teste de personalidade — portado de
// `teste-personalidade/src/lib/personality/scoring.ts`.
//
// Todo formato de item é reduzido à MESMA moeda (pontos ganhos sobre pontos
// disponíveis, escala 0-4 por item), pra que Likert, escolha forçada e cenário
// sejam comensuráveis sem um formato dominar em silêncio.
//
// Mudanças em relação à origem (regra "todo texto nasce PT+EN"): o nível do
// traço virou id e os avisos de validade viraram LText.
// ---------------------------------------------------------------------------

import { items, likertItems } from "./questions";
import {
  Answers,
  Dimension,
  JungAxis,
  JungAxisScore,
  JungTypeResult,
  JUNG_AXES,
  LikertItem,
  PersonalityProfile,
  TraitDimension,
  TraitLevel,
  TraitScore,
  TRAIT_DIMENSIONS,
  ValidityIndices,
} from "./types";
import type { LText } from "../../oracle";

const JUNG_POLES: Record<JungAxis, [string, string]> = {
  EI: ["E", "I"],
  SN: ["S", "N"],
  TF: ["T", "F"],
  JP: ["J", "P"],
};

function levelFor(score: number): TraitLevel {
  if (score < 20) return "very-low";
  if (score < 40) return "low";
  if (score < 60) return "moderate";
  if (score < 80) return "high";
  return "very-high";
}

/** Maps a 1-5 Likert response onto 0-4, applying reverse keying. */
function likertValue(raw: number, positive: boolean): number {
  const clamped = Math.min(5, Math.max(1, raw));
  return positive ? clamped - 1 : 5 - clamped;
}

export function isComplete(answers: Answers): boolean {
  return items.every((item) => answers[item.id] !== undefined);
}

export function answeredCount(answers: Answers): number {
  return items.filter((item) => answers[item.id] !== undefined).length;
}

interface Accumulator {
  earned: number;
  max: number;
}

/**
 * Every item format is reduced to the same currency: points earned out of
 * points available, on a 0-4 scale per item. That keeps Likert, forced-choice
 * and scenario items commensurable without one format silently dominating.
 */
export function scoreProfile(answers: Answers): PersonalityProfile {
  const dimAcc = new Map<Dimension, Accumulator>();
  const facetAcc = new Map<string, Accumulator & { dimension: TraitDimension; facet: string }>();

  const addDim = (dim: Dimension, earned: number, max: number) => {
    const acc = dimAcc.get(dim) ?? { earned: 0, max: 0 };
    acc.earned += earned;
    acc.max += max;
    dimAcc.set(dim, acc);
  };

  const addFacet = (dimension: TraitDimension, facet: string, earned: number, max: number) => {
    const key = `${dimension}:${facet}`;
    const acc = facetAcc.get(key) ?? { earned: 0, max: 0, dimension, facet };
    acc.earned += earned;
    acc.max += max;
    facetAcc.set(key, acc);
  };

  const isTrait = (d: Dimension): d is TraitDimension =>
    (TRAIT_DIMENSIONS as Dimension[]).includes(d);

  for (const item of items) {
    const answer = answers[item.id];
    if (answer === undefined) continue;

    if (item.kind === "likert" || item.kind === "frequency") {
      if (answer.kind !== "likert") continue;
      const value = likertValue(answer.value, item.positive);
      addDim(item.dimension, value, 4);
      if (isTrait(item.dimension)) addFacet(item.dimension, item.facet, value, 4);
    } else if (item.kind === "forced-choice") {
      if (answer.kind !== "forced-choice") continue;
      const chosePositive = answer.choice === "a";
      addDim(item.dimension, chosePositive ? 4 : 0, 4);
    } else if (item.kind === "scenario") {
      if (answer.kind !== "scenario") continue;
      const option = item.options.find((o) => o.id === answer.optionId);
      if (!option) continue;
      for (const dim of item.covers) {
        const value = option.weights[dim] ?? 0;
        addDim(dim, value, 4);
        // Scenarios are cross-cutting by design, so they feed the factor score
        // but deliberately do not feed any single facet.
      }
    }
  }

  // ---- Trait scores ----
  const traits = {} as Record<TraitDimension, TraitScore>;
  const traitPoints: Record<string, number> = {};

  for (const dim of TRAIT_DIMENSIONS) {
    const acc = dimAcc.get(dim);
    const score = acc && acc.max > 0 ? Math.round((acc.earned / acc.max) * 100) : 50;
    const facets = Array.from(facetAcc.values())
      .filter((f) => f.dimension === dim)
      .map((f) => ({
        facet: f.facet,
        score: f.max > 0 ? Math.round((f.earned / f.max) * 100) : 50,
      }))
      .sort((a, b) => b.score - a.score);
    traits[dim] = { dimension: dim, score, level: levelFor(score), facets };
    traitPoints[dim] = score;
  }

  // ---- Jungian axes ----
  const axes = {} as Record<JungAxis, JungAxisScore>;
  const weakAxes: JungAxis[] = [];
  let code = "";

  for (const axis of JUNG_AXES) {
    const acc = dimAcc.get(axis);
    const score = acc && acc.max > 0 ? Math.round((acc.earned / acc.max) * 100) : 50;
    const [positivePole, negativePole] = JUNG_POLES[axis];
    const pole = score >= 50 ? positivePole : negativePole;
    const clarity = Math.round(Math.abs(score - 50) * 2);
    code += pole;
    axes[axis] = { axis, score, pole, clarity };
    // The 20-item short form carries each axis with a single forced-choice
    // item, so clarity is always 100 here — there's no partial vote to split.
    // `weakAxes` stays wired up (and threshold kept) for when a longer form
    // adds more than one item per axis; at this length it will always be empty.
    if (clarity < 50) weakAxes.push(axis);
    traitPoints[`jung_${axis}`] = score;
  }

  const jung: JungTypeResult = { code, axes, weakAxes };

  return {
    traits,
    jung,
    validity: computeValidity(answers),
    traitPoints,
    answeredCount: answeredCount(answers),
    totalItems: items.length,
  };
}

/**
 * Response-style checks. None of these say anything about personality; they say
 * whether the answers can be read as a personality result at all.
 */
export function computeValidity(answers: Answers): ValidityIndices {
  const responded: { item: LikertItem; raw: number }[] = [];
  for (const item of likertItems) {
    const answer = answers[item.id];
    if (answer?.kind === "likert") responded.push({ item, raw: answer.value });
  }

  const flags: LText[] = [];
  if (responded.length === 0) {
    return {
      acquiescence: 50,
      inconsistency: 0,
      extremeResponding: 0,
      midpointResponding: 0,
      flags: [],
      trustworthy: true,
    };
  }

  // Acquiescence: raw agreement ignoring keying. Because the bank is
  // keying-balanced, an honest protocol lands near 50.
  const meanRaw = responded.reduce((sum, r) => sum + r.raw, 0) / responded.length;
  const acquiescence = Math.round(((meanRaw - 1) / 4) * 100);

  // Extreme and midpoint responding.
  const extremes = responded.filter((r) => r.raw === 1 || r.raw === 5).length;
  const midpoints = responded.filter((r) => r.raw === 3).length;
  const extremeResponding = Math.round((extremes / responded.length) * 100);
  const midpointResponding = Math.round((midpoints / responded.length) * 100);

  // Inconsistency: paired items should agree once reverse-keying is applied.
  const pairs = new Map<string, number[]>();
  for (const { item, raw } of responded) {
    if (!item.consistencyPair) continue;
    const keyed = likertValue(raw, item.positive); // 0-4, same direction
    const list = pairs.get(item.consistencyPair) ?? [];
    list.push(keyed);
    pairs.set(item.consistencyPair, list);
  }
  let inconsistency = 0;
  const complete = Array.from(pairs.values()).filter((v) => v.length === 2);
  if (complete.length > 0) {
    const meanGap =
      complete.reduce((sum, [a, b]) => sum + Math.abs(a - b), 0) / complete.length;
    inconsistency = Math.round((meanGap / 4) * 100);
  }

  if (acquiescence >= 75)
    flags.push({
      pt: "Tendência forte a concordar com quase tudo (viés de aquiescência).",
      en: "Strong tendency to agree with almost everything (acquiescence bias).",
    });
  if (acquiescence <= 25)
    flags.push({
      pt: "Tendência forte a discordar de quase tudo.",
      en: "Strong tendency to disagree with almost everything.",
    });
  if (inconsistency >= 50)
    flags.push({
      pt: "Respostas contraditórias entre itens que medem a mesma coisa — o resultado pode não refletir você.",
      en: "Contradictory answers between items measuring the same thing — the result may not reflect you.",
    });
  if (extremeResponding >= 80)
    flags.push({
      pt: "Quase todas as respostas nos extremos da escala.",
      en: "Almost every answer at the ends of the scale.",
    });
  if (midpointResponding >= 60)
    flags.push({
      pt: "Quase todas as respostas no meio da escala — o perfil fica pouco discriminado.",
      en: "Almost every answer at the midpoint — the profile ends up poorly discriminated.",
    });

  const trustworthy = inconsistency < 50 && acquiescence > 25 && acquiescence < 75 && midpointResponding < 60;

  return {
    acquiescence,
    inconsistency,
    extremeResponding,
    midpointResponding,
    flags,
    trustworthy,
  };
}
