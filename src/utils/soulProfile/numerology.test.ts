import assert from "node:assert/strict";
import { test } from "vitest";
import { computeNumerology, normalizeName, reduce } from "./numerology";

test("normalizeName folds Portuguese diacritics", () => {
  assert.equal(normalizeName("José Gonçalves"), "JOSE GONCALVES");
  assert.equal(normalizeName("  Ana   Maria  "), "ANA MARIA");
  assert.equal(normalizeName("Antônio d'Ávila-Souza"), "ANTONIO D AVILA SOUZA");
});

test("reduce preserves master numbers unless told otherwise", () => {
  assert.equal(reduce(29), 11); // 2+9 = 11, a master number
  assert.equal(reduce(29, false), 2); // 11 -> 1+1 = 2
  assert.equal(reduce(4), 4);
  assert.equal(reduce(1999), 1); // 28 -> 10 -> 1
  assert.equal(reduce(22), 22);
  assert.equal(reduce(22, false), 4);
});

test("life path is computed by reducing each date component then summing", () => {
  // 1990-11-25: month 11 (master, kept), day 25 -> 7, year 1990 -> 19 -> 10 -> 1.
  // 11 + 7 + 1 = 19 -> 10 -> 1, and 19 is a karmic debt total.
  const map = computeNumerology("Ana Silva", "1990-11-25", 2026);
  assert.equal(map.lifePath.rawTotal, 19);
  assert.equal(map.lifePath.value, 1);
  assert.equal(map.lifePath.karmicDebt, 19);
});

test("expression, soul urge and personality partition the same letters", () => {
  // "ANA" -> A=1, N=5, A=1. Expression 7; vowels A,A = 2; consonant N = 5.
  const map = computeNumerology("Ana", "2000-01-01", 2026);
  assert.equal(map.expression.rawTotal, 7);
  assert.equal(map.soulUrge.rawTotal, 2);
  assert.equal(map.personality.rawTotal, 5);
  assert.equal(map.soulUrge.rawTotal + map.personality.rawTotal, map.expression.rawTotal);
});

test("vowel and consonant totals always sum to the expression total", () => {
  for (const name of ["Maria da Silva Santos", "Yuri Yamada", "Sylvia Prado", "Zezé"]) {
    const map = computeNumerology(name, "1988-04-12", 2026);
    assert.equal(
      map.soulUrge.rawTotal + map.personality.rawTotal,
      map.expression.rawTotal,
      `partition broken for ${name}`
    );
  }
});

test("Y counts as a vowel only when it is not adjacent to another vowel", () => {
  // SYLVIA: the Y sits between S and L, so it carries the vowel sound (7).
  const sylvia = computeNumerology("Sylvia", "2000-01-01", 2026);
  // Vowels: Y=7, I=9, A=1 -> 17
  assert.equal(sylvia.soulUrge.rawTotal, 17);

  // MAYA: the Y is flanked by A on both sides, so it acts as a consonant.
  const maya = computeNumerology("Maya", "2000-01-01", 2026);
  // Vowels: A=1, A=1 -> 2; consonants: M=4, Y=7 -> 11
  assert.equal(maya.soulUrge.rawTotal, 2);
  assert.equal(maya.personality.rawTotal, 11);
});

test("birthday, maturity and balance numbers", () => {
  const map = computeNumerology("Ana Silva", "1990-11-25", 2026);
  assert.equal(map.birthday.value, reduce(25));
  assert.equal(map.maturity.value, reduce(map.lifePath.value + map.expression.value));
  // Initials A (1) + S (1) = 2
  assert.equal(map.balance.rawTotal, 2);
});

test("karmic lessons list digits missing from the name", () => {
  // "ANA" only contains values 1 and 5, so 2,3,4,6,7,8,9 are all lessons.
  const map = computeNumerology("Ana", "2000-01-01", 2026);
  assert.deepEqual(map.karmicLessons, [2, 3, 4, 6, 7, 8, 9]);
  // A appears twice (value 1), N once (value 5) -> hidden passion is 1.
  assert.deepEqual(map.hiddenPassion, [1]);
});

test("challenges are absolute differences and never master numbers", () => {
  const map = computeNumerology("Ana Silva", "1990-11-25", 2026);
  // month 11 -> 2, day 25 -> 7, year 1990 -> 1
  const [c1, c2, c3, c4] = map.challenges.map((c) => c.value);
  assert.equal(c1, Math.abs(2 - 7));
  assert.equal(c2, Math.abs(7 - 1));
  assert.equal(c3, Math.abs(c1 - c2));
  assert.equal(c4, Math.abs(2 - 1));
  for (const c of map.challenges) {
    assert.ok(c.value >= 0 && c.value <= 8, `challenge out of range: ${c.value}`);
  }
});

test("pinnacles cover life in contiguous periods ending open-ended", () => {
  const map = computeNumerology("Ana Silva", "1990-11-25", 2026);
  assert.equal(map.pinnacles.length, 4);
  assert.equal(map.pinnacles[0].startAge, 0);
  for (let i = 0; i < 3; i++) {
    assert.equal(map.pinnacles[i + 1].startAge, map.pinnacles[i].endAge! + 1);
  }
  assert.equal(map.pinnacles[3].endAge, null);
});

test("personal year changes with the reference year", () => {
  const a = computeNumerology("Ana Silva", "1990-11-25", 2026);
  const b = computeNumerology("Ana Silva", "1990-11-25", 2027);
  assert.notEqual(a.personalYear.value, b.personalYear.value);
  // month 11 -> 11 (master kept), day 25 -> 7, year 2026 -> 10 -> 1 => 19 -> 1
  assert.equal(a.personalYear.rawTotal, 11 + 7 + 1);
});

test("every core number lands in a valid numerological range", () => {
  const valid = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);
  for (const name of ["João Pedro Alves", "Beatriz Nogueira Lima", "Zé"]) {
    const map = computeNumerology(name, "1975-08-30", 2026);
    for (const key of ["lifePath", "expression", "soulUrge", "personality", "birthday", "maturity"] as const) {
      assert.ok(valid.has(map[key].value), `${name} ${key} = ${map[key].value}`);
    }
  }
});

test("an empty name degrades without throwing", () => {
  const map = computeNumerology("", "1990-11-25", 2026);
  assert.equal(map.expression.value, 0);
  assert.equal(map.hiddenPassion.length, 0);
  assert.equal(map.karmicLessons.length, 9);
});
