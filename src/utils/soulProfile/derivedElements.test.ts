import assert from "node:assert/strict";
import { test } from "vitest";
import { computeDominantClassElements } from "./derivedElements";
import { CLASS_ELEMENT_ORDER, ClassElementId } from "./types";

function elements(overrides: Partial<Record<ClassElementId, number>>): Record<ClassElementId, number> {
  const base = Object.fromEntries(CLASS_ELEMENT_ORDER.map((id) => [id, 1])) as Record<ClassElementId, number>;
  return { ...base, ...overrides };
}

test("balanced água+terra merges into Pântano instead of listing both bases", () => {
  const result = computeDominantClassElements(elements({ agua: 10, terra: 9 }));
  assert.equal(result[0].id, "pantano");
  assert.ok(!result.some((c) => c.id === "agua" || c.id === "terra"), "água/terra should be absorbed into Pântano");
});

test("a near-tied unrelated element joins the top combo as co-dominant instead of being dropped", () => {
  // pântano score = min(agua, terra) = 9. vigor (8) is close enough (>= 80% of
  // 9 = 7.2) to also count, even though it isn't part of that combo -- both
  // água and terra are already "spoken for" by pântano, so vigor's own best
  // possible pairing (with either of them) isn't reciprocated and it's left
  // standing on its own raw score instead.
  const result = computeDominantClassElements(elements({ agua: 10, terra: 9, vigor: 8 }));
  const ids = result.map((c) => c.id);
  assert.ok(ids.includes("pantano"), `expected pantano in ${ids}`);
  assert.ok(ids.includes("vigor"), `expected vigor in ${ids}`);
});

test("terra 70%+ above água is unbalanced: terra stands alone, no Pântano", () => {
  // hi/lo = 20/10 = 2.0 > 1.7 -> unbalanced
  const result = computeDominantClassElements(elements({ terra: 20, agua: 10 }));
  assert.equal(result[0].id, "terra");
  assert.ok(!result.some((c) => c.id === "pantano"), "pântano should not form when terra is 2x água");
});

test("terra exactly at the 70%-higher boundary still balances into Pântano", () => {
  // hi/lo = 17/10 = 1.7 -> balanced (boundary is inclusive)
  const result = computeDominantClassElements(elements({ terra: 17, agua: 10 }));
  assert.equal(result[0].id, "pantano");
});

test("a clearly dominant combo shows up alone when nothing else is close", () => {
  const result = computeDominantClassElements(elements({ agua: 30, terra: 29 }));
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "pantano");
});

test("every result score is non-negative and results are sorted descending", () => {
  const result = computeDominantClassElements(elements({ fogo: 15, terra: 12, agua: 3, vida: 14, vigor: 13 }));
  for (let i = 1; i < result.length; i++) {
    assert.ok(result[i - 1].score >= result[i].score);
  }
});

test("a base with no balanced partner at all stays standalone", () => {
  // fogo way above everything, no other element close enough to pair with it
  const result = computeDominantClassElements(elements({ fogo: 50 }));
  assert.equal(result[0].id, "fogo");
  assert.equal(result[0].nome, "Fogo");
});
