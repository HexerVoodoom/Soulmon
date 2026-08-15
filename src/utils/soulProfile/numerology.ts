/**
 * Numerologia pitagórica COMPLETA — portada de
 * `teste-personalidade/src/lib/numerology/numerology.ts`.
 *
 * Substitui os 4 números que o `oracle.ts` calculava (caminho de vida,
 * expressão, motivação, impressão) por 8 números + lições cármicas, paixão
 * oculta, 4 desafios, 4 pináculos e dívidas cármicas. Única mudança em relação
 * à origem: os rótulos dos desafios viraram LText (PT+EN).
 *
 * ---
 *
 * Pythagorean numerology.
 *
 * Letter values follow the standard Pythagorean grid (A=1..I=9, J=1..R=9,
 * S=1..Z=8). Portuguese diacritics are folded to their base letter (JOSÉ →
 * JOSE, GONÇALVES → GONCALVES) before valuing, which is the convention used
 * by Brazilian numerology practice.
 */

import type { LText } from '../oracle';

export type MasterNumber = 11 | 22 | 33;
export const MASTER_NUMBERS: MasterNumber[] = [11, 22, 33];
export const KARMIC_DEBT_NUMBERS = [13, 14, 16, 19];

const PYTHAGOREAN: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};

const HARD_VOWELS = new Set(["A", "E", "I", "O", "U"]);

/** Strips diacritics and non-letters, uppercasing the result. */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Y is treated as a vowel only when it carries the vowel sound itself — that
 * is, when it is not adjacent to another vowel (SYLVIA → Y is a vowel;
 * MAYARA → Y sits next to A and acts as a consonant).
 */
function isVowel(letters: string, index: number): boolean {
  const ch = letters[index];
  if (HARD_VOWELS.has(ch)) return true;
  if (ch !== "Y") return false;
  const prev = letters[index - 1];
  const next = letters[index + 1];
  const prevIsVowel = prev !== undefined && HARD_VOWELS.has(prev);
  const nextIsVowel = next !== undefined && HARD_VOWELS.has(next);
  return !prevIsVowel && !nextIsVowel;
}

/** Reduces to a single digit, preserving master numbers 11/22/33. */
export function reduce(n: number, preserveMaster = true): number {
  let value = Math.abs(n);
  while (value > 9) {
    if (preserveMaster && MASTER_NUMBERS.includes(value as MasterNumber)) return value;
    value = String(value)
      .split("")
      .reduce((acc, d) => acc + Number(d), 0);
  }
  return value;
}

export interface NumberResult {
  value: number;
  /** Sum before the final reduction — used to surface karmic debt. */
  rawTotal: number;
  isMaster: boolean;
  karmicDebt: number | null;
}

function result(rawTotal: number, preserveMaster = true): NumberResult {
  const value = reduce(rawTotal, preserveMaster);
  return {
    value,
    rawTotal,
    isMaster: MASTER_NUMBERS.includes(value as MasterNumber),
    karmicDebt: KARMIC_DEBT_NUMBERS.includes(rawTotal) ? rawTotal : null,
  };
}

function sumLetters(letters: string, filter: (i: number) => boolean): number {
  let total = 0;
  for (let i = 0; i < letters.length; i++) {
    const ch = letters[i];
    if (ch === " " || !PYTHAGOREAN[ch]) continue;
    if (filter(i)) total += PYTHAGOREAN[ch];
  }
  return total;
}

export interface NumerologyMap {
  normalizedName: string;
  /** Caminho de vida — from the full birth date. The core number. */
  lifePath: NumberResult;
  /** Expressão/Destino — every letter of the full birth name. */
  expression: NumberResult;
  /** Motivação/Impulso da alma — the vowels. */
  soulUrge: NumberResult;
  /** Personalidade — the consonants. */
  personality: NumberResult;
  /** Dia natalício — the birth day itself. */
  birthday: NumberResult;
  /** Maturidade — life path + expression, the later-life synthesis. */
  maturity: NumberResult;
  /** Equilíbrio — the initials, what you lean on under stress. */
  balance: NumberResult;
  /** Ano pessoal for the reference year. */
  personalYear: NumberResult;
  personalYearReference: number;
  /** Digits absent from the name — the lessons to learn. */
  karmicLessons: number[];
  /** The most repeated digit in the name — the innate drive. */
  hiddenPassion: number[];
  /** Frequency of each digit 1-9 across the name. */
  digitFrequency: Record<number, number>;
  challenges: { index: number; value: number; label: LText }[];
  pinnacles: { index: number; value: number; startAge: number; endAge: number | null }[];
  /** Every karmic debt found anywhere in the map. */
  karmicDebts: number[];
}

export function computeNumerology(fullName: string, birthDate: string, referenceYear: number): NumerologyMap {
  const normalized = normalizeName(fullName);
  const letters = normalized;

  const [year, month, day] = birthDate.split("-").map(Number);

  // --- Life path: reduce each date component, then sum. ---
  const mR = reduce(month);
  const dR = reduce(day);
  const yR = reduce(year);
  const lifePathRaw = mR + dR + yR;
  const lifePath = result(lifePathRaw);

  // --- Name-derived numbers. ---
  const expressionRaw = sumLetters(letters, () => true);
  const soulUrgeRaw = sumLetters(letters, (i) => isVowel(letters, i));
  const personalityRaw = sumLetters(letters, (i) => !isVowel(letters, i));

  const expression = result(expressionRaw);
  const soulUrge = result(soulUrgeRaw);
  const personality = result(personalityRaw);

  const initialsRaw = normalized
    .split(" ")
    .filter(Boolean)
    .reduce((acc, word) => acc + (PYTHAGOREAN[word[0]] ?? 0), 0);
  const balance = result(initialsRaw);

  const birthday = result(day);
  const maturity = result(lifePath.value + expression.value);

  // --- Personal year: birth month + birth day + reference year. ---
  const personalYear = result(reduce(month) + reduce(day) + reduce(referenceYear));

  // --- Digit frequency across the name. ---
  const digitFrequency: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  for (const ch of letters) {
    const v = PYTHAGOREAN[ch];
    if (v) digitFrequency[v] += 1;
  }
  const karmicLessons = Object.entries(digitFrequency)
    .filter(([, count]) => count === 0)
    .map(([digit]) => Number(digit));
  const maxFrequency = Math.max(...Object.values(digitFrequency));
  const hiddenPassion =
    maxFrequency === 0
      ? []
      : Object.entries(digitFrequency)
          .filter(([, count]) => count === maxFrequency)
          .map(([digit]) => Number(digit));

  // --- Challenges: absolute differences, never preserving master numbers. ---
  const m1 = reduce(month, false);
  const d1 = reduce(day, false);
  const y1 = reduce(year, false);
  const c1 = Math.abs(m1 - d1);
  const c2 = Math.abs(d1 - y1);
  const c3 = Math.abs(c1 - c2);
  const c4 = Math.abs(m1 - y1);
  const challenges = [
    { index: 1, value: c1, label: { pt: "Primeiro desafio (juventude)", en: "First challenge (youth)" } },
    { index: 2, value: c2, label: { pt: "Segundo desafio (maturidade)", en: "Second challenge (maturity)" } },
    { index: 3, value: c3, label: { pt: "Desafio principal (toda a vida)", en: "Main challenge (whole life)" } },
    { index: 4, value: c4, label: { pt: "Quarto desafio (últimos anos)", en: "Fourth challenge (later years)" } },
  ];

  // --- Pinnacles: sums, with master numbers preserved. ---
  const p1 = reduce(d1 + m1);
  const p2 = reduce(d1 + y1);
  const p3 = reduce(reduce(p1, false) + reduce(p2, false));
  const p4 = reduce(m1 + y1);
  const firstEnd = 36 - reduce(lifePath.value, false);
  const pinnacles = [
    { index: 1, value: p1, startAge: 0, endAge: firstEnd },
    { index: 2, value: p2, startAge: firstEnd + 1, endAge: firstEnd + 9 },
    { index: 3, value: p3, startAge: firstEnd + 10, endAge: firstEnd + 18 },
    { index: 4, value: p4, startAge: firstEnd + 19, endAge: null },
  ];

  const karmicDebts = Array.from(
    new Set(
      [lifePath, expression, soulUrge, personality, birthday]
        .map((r) => r.karmicDebt)
        .filter((d): d is number => d !== null)
    )
  ).sort((a, b) => a - b);

  return {
    normalizedName: normalized,
    lifePath,
    expression,
    soulUrge,
    personality,
    birthday,
    maturity,
    balance,
    personalYear,
    personalYearReference: referenceYear,
    karmicLessons,
    hiddenPassion,
    digitFrequency,
    challenges,
    pinnacles,
    karmicDebts,
  };
}
