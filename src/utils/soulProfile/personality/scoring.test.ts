import assert from "node:assert/strict";
import { test } from "vitest";
import { items, likertItems, forcedChoiceItems, scenarioItems } from "./questions";
import { scoreProfile, isComplete, computeValidity } from "./scoring";
import { Answers, LikertValue, TRAIT_DIMENSIONS, JUNG_AXES } from "./types";

/** Builds a complete answer set from a per-item decision function. */
function buildAnswers(
  likertFor: (item: (typeof likertItems)[number]) => LikertValue,
  choice: "a" | "b" = "a",
  scenarioOption = "a"
): Answers {
  const answers: Answers = {};
  for (const item of items) {
    if (item.kind === "likert" || item.kind === "frequency") {
      answers[item.id] = { kind: "likert", value: likertFor(item) };
    } else if (item.kind === "forced-choice") {
      answers[item.id] = { kind: "forced-choice", choice };
    } else {
      answers[item.id] = { kind: "scenario", optionId: scenarioOption };
    }
  }
  return answers;
}

test("item bank has exactly one Likert item per trait (no mirror items)", () => {
  // 11/10/2026: the reversed twin that only re-asked each question was cut
  // (owner: "pergunta de confirmação meio redundante"). One facet per trait.
  const byFacet = new Map<string, number>();
  for (const item of likertItems) {
    const key = `${item.dimension}:${item.facet}`;
    byFacet.set(key, (byFacet.get(key) ?? 0) + 1);
  }
  assert.equal(byFacet.size, 6, `expected exactly 6 facets (one per trait), got ${byFacet.size}`);
  for (const [facet, n] of byFacet) assert.equal(n, 1, `${facet} has ${n} items`);
  assert.equal(items.length, 14);
});

test("every trait dimension is covered by at least one facet", () => {
  for (const dim of TRAIT_DIMENSIONS) {
    const facets = new Set(likertItems.filter((i) => i.dimension === dim).map((i) => i.facet));
    assert.ok(facets.size >= 1, `${dim} has no facet`);
  }
});

test("every Jungian axis is covered by at least one forced-choice item", () => {
  for (const axis of JUNG_AXES) {
    const count = forcedChoiceItems.filter((i) => i.dimension === axis).length;
    assert.ok(count >= 1, `axis ${axis} has no items`);
  }
});

test("item ids are unique", () => {
  const ids = items.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("interleaving never leaves a long run of the same format", () => {
  let run = 1;
  for (let i = 1; i < items.length; i++) {
    const same =
      items[i].kind === items[i - 1].kind ||
      (["likert", "frequency"].includes(items[i].kind) &&
        ["likert", "frequency"].includes(items[i - 1].kind));
    run = same ? run + 1 : 1;
    assert.ok(run <= 3, `run of ${run} same-format items ending at index ${i}`);
  }
});

test("scenario weights stay inside the 0-4 scale and cover declared dimensions", () => {
  for (const scenario of scenarioItems) {
    assert.ok(scenario.options.length >= 3);
    for (const option of scenario.options) {
      for (const dim of scenario.covers) {
        const w = option.weights[dim];
        assert.ok(w !== undefined, `${scenario.id}/${option.id} misses ${dim}`);
        assert.ok(w >= 0 && w <= 4, `${scenario.id}/${option.id} ${dim} = ${w}`);
      }
    }
    // A scenario that never varies on a dimension carries no information.
    for (const dim of scenario.covers) {
      const values = scenario.options.map((o) => o.weights[dim]);
      assert.ok(new Set(values).size > 1, `${scenario.id} is flat on ${dim}`);
    }
  }
});

test("scores stay inside the scale for an all-agree protocol", () => {
  // Without reversed items acquiescence can no longer be separated from
  // content, so this only checks the scale holds.
  const profile = scoreProfile(buildAnswers(() => 5));
  for (const dim of TRAIT_DIMENSIONS) {
    const score = profile.traits[dim].score;
    assert.ok(score >= 0 && score <= 100, `${dim} = ${score}`);
  }
});

test("keyed-consistent answering drives facets to their extremes", () => {
  // Facet scores come only from Likert items, so answering in the direction of
  // each item's keying must pin every facet at the ceiling, then the floor.
  const high = scoreProfile(buildAnswers((item) => (item.positive ? 5 : 1)));
  for (const dim of TRAIT_DIMENSIONS) {
    for (const facet of high.traits[dim].facets) {
      assert.equal(facet.score, 100, `${dim}.${facet.facet} = ${facet.score}`);
    }
  }

  const low = scoreProfile(buildAnswers((item) => (item.positive ? 1 : 5)));
  for (const dim of TRAIT_DIMENSIONS) {
    for (const facet of low.traits[dim].facets) {
      assert.equal(facet.score, 0, `${dim}.${facet.facet} = ${facet.score}`);
    }
  }
});

test("trait scores separate widely between keyed-high and keyed-low protocols", () => {
  // Scenarios also feed the factor scores and deliberately pull in their own
  // direction, so factor scores are not expected to pin at 0/100. Holding the
  // scenario answer constant between the two protocols isolates what this
  // test actually checks: that the Likert + forced-choice channel alone
  // drives a clear separation (>= 20 points; was 30 with the 2-item facets), regardless of which scenario option was picked.
  const high = scoreProfile(buildAnswers((item) => (item.positive ? 5 : 1), "a", "a"));
  const low = scoreProfile(buildAnswers((item) => (item.positive ? 1 : 5), "b", "a"));
  for (const dim of TRAIT_DIMENSIONS) {
    const gap = high.traits[dim].score - low.traits[dim].score;
    assert.ok(gap >= 20, `${dim} separated by only ${gap} points`);
  }
});

test("all scores stay within 0-100", () => {
  for (const value of [1, 2, 3, 4, 5] as LikertValue[]) {
    const profile = scoreProfile(buildAnswers(() => value));
    for (const dim of TRAIT_DIMENSIONS) {
      const t = profile.traits[dim];
      assert.ok(t.score >= 0 && t.score <= 100, `${dim} = ${t.score}`);
      for (const f of t.facets) {
        assert.ok(f.score >= 0 && f.score <= 100, `${dim}.${f.facet} = ${f.score}`);
      }
    }
    for (const axis of JUNG_AXES) {
      const a = profile.jung.axes[axis];
      assert.ok(a.score >= 0 && a.score <= 100);
      assert.ok(a.clarity >= 0 && a.clarity <= 100);
    }
  }
});

test("forced choices drive the Jungian code", () => {
  const allA = scoreProfile(buildAnswers(() => 3, "a"));
  assert.equal(allA.jung.code, "ESTJ");
  assert.deepEqual(allA.jung.weakAxes, []);

  const allB = scoreProfile(buildAnswers(() => 3, "b"));
  assert.equal(allB.jung.code, "INFP");
});

test("with one forced-choice item per axis, clarity is always maximal", () => {
  // The short form has exactly one item per Jungian axis, so there is no
  // partial vote to split — every axis is either a clean A or a clean B,
  // never a 50/50 read. `weakAxes` is therefore always empty at this length;
  // that's a known limitation of the short form, not a bug.
  const allA = scoreProfile(buildAnswers(() => 3, "a"));
  const allB = scoreProfile(buildAnswers(() => 3, "b"));
  for (const axis of JUNG_AXES) {
    assert.equal(allA.jung.axes[axis].clarity, 100);
    assert.equal(allB.jung.axes[axis].clarity, 100);
  }
  assert.deepEqual(allB.jung.weakAxes, []);
});

test("validity does not judge acquiescence without reversed items", () => {
  const v = computeValidity(buildAnswers(() => 5));
  assert.equal(v.trustworthy, true);
  assert.equal(v.inconsistency, 0);
  assert.ok(!v.flags.some((f) => f.en.includes("acquiescence")));
});

test("validity flags a straight-liner on the midpoint", () => {
  const v = computeValidity(buildAnswers(() => 3));
  assert.equal(v.midpointResponding, 100);
  assert.equal(v.trustworthy, false);
});

test("validity accepts a coherent protocol", () => {
  const v = computeValidity(buildAnswers((item) => (item.positive ? 4 : 2)));
  assert.equal(v.inconsistency, 0);
  assert.equal(v.trustworthy, true);
  assert.deepEqual(v.flags, []);
});

test("partial answers are scored without throwing and report progress", () => {
  const answers: Answers = {};
  const first = items.slice(0, 5);
  for (const item of first) {
    if (item.kind === "likert" || item.kind === "frequency") {
      answers[item.id] = { kind: "likert", value: 4 };
    } else if (item.kind === "forced-choice") {
      answers[item.id] = { kind: "forced-choice", choice: "a" };
    } else {
      answers[item.id] = { kind: "scenario", optionId: "a" };
    }
  }
  assert.equal(isComplete(answers), false);
  const profile = scoreProfile(answers);
  assert.equal(profile.answeredCount, 5);
  assert.equal(profile.totalItems, items.length);
  for (const dim of TRAIT_DIMENSIONS) {
    assert.ok(Number.isFinite(profile.traits[dim].score));
  }
});

test("an empty protocol returns neutral scores rather than NaN", () => {
  const profile = scoreProfile({});
  for (const dim of TRAIT_DIMENSIONS) {
    assert.equal(profile.traits[dim].score, 50);
  }
  assert.equal(profile.answeredCount, 0);
});

test("mismatched answer kinds are ignored instead of corrupting scores", () => {
  const answers: Answers = {};
  for (const item of items) {
    // Deliberately send the wrong payload shape for every item.
    answers[item.id] = { kind: "scenario", optionId: "nope" };
  }
  const profile = scoreProfile(answers);
  for (const dim of TRAIT_DIMENSIONS) {
    assert.equal(profile.traits[dim].score, 50);
  }
});

test("traitPoints exposes every trait and Jungian axis", () => {
  const profile = scoreProfile(buildAnswers(() => 4));
  for (const dim of TRAIT_DIMENSIONS) {
    assert.ok(dim in profile.traitPoints);
  }
  for (const axis of JUNG_AXES) {
    assert.ok(`jung_${axis}` in profile.traitPoints);
  }
});

// Regra do app (CLAUDE.md): todo texto de UI nasce nos dois idiomas. O banco
// de itens é a maior superfície de texto do oráculo — uma pergunta que chegue
// só em português para quem escolheu inglês é o bug que este teste trava.
test("todo item do teste existe em PT e EN", () => {
  const check = (t: { pt: string; en: string }, where: string) => {
    assert.ok(t?.pt?.trim(), `${where}: falta PT`);
    assert.ok(t?.en?.trim(), `${where}: falta EN`);
    assert.notEqual(t.pt, t.en, `${where}: PT e EN idênticos (não traduzido)`);
  };
  for (const item of items) {
    if (item.kind === "likert" || item.kind === "frequency") {
      check(item.text, item.id);
    } else if (item.kind === "forced-choice") {
      check(item.prompt, item.id);
      check(item.a.text, `${item.id}.a`);
      check(item.b.text, `${item.id}.b`);
    } else if (item.kind === "scenario") {
      check(item.situation, item.id);
      for (const o of item.options) check(o.text, `${item.id}.${o.id}`);
    }
  }
});
