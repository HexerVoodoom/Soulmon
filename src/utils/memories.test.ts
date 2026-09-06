/**
 * WP4.8 — memórias aos 30 e 90 dias.
 *
 * O app conta o dia e conta a semana, e nunca contou a HISTÓRIA. As duas
 * travas: o cartão é do DIA do marco (não de todo dia depois dele), e ele
 * acontece UMA vez — um "momento" que se repete deixa de ser momento.
 */
import { describe, it, expect } from 'vitest';
import { memoryMarkFor, memoryToShow, markMemoryShown, MEMORY_MARKS } from './memories';

describe('memories — os marcos', () => {
  it('são 30 e 90 — os dois que a pessoa reconhece sem contar', () => {
    // 60 não é marco de ninguém.
    expect([...MEMORY_MARKS]).toEqual([30, 90]);
  });

  it('compara por IGUALDADE, não por "já passou"', () => {
    // Com `>=` o cartão apareceria todo dia depois do trigésimo, e a coisa
    // que fazia dele um momento (ser raro) sumiria na segunda vez.
    expect(memoryMarkFor(30)).toBe(30);
    expect(memoryMarkFor(31)).toBeNull();
    expect(memoryMarkFor(89)).toBeNull();
    expect(memoryMarkFor(90)).toBe(90);
    expect(memoryMarkFor(120)).toBeNull();
  });

  it('sem idade não há memória — nunca uma inventada', () => {
    expect(memoryMarkFor(null)).toBeNull();
  });
});

describe('memories — acontece UMA vez', () => {
  it('não repete um marco já mostrado', () => {
    expect(memoryToShow({ daysWithPet: 30, shown: [] })).toBe(30);
    expect(memoryToShow({ daysWithPet: 30, shown: [30] })).toBeNull();
  });

  it('o marco de 90 continua valendo depois do de 30', () => {
    expect(memoryToShow({ daysWithPet: 90, shown: [30] })).toBe(90);
  });

  it('registrar é idempotente (o updater roda 2×)', () => {
    const um = markMemoryShown([], 30);
    expect(markMemoryShown(um, 30)).toEqual([30]);
    expect(markMemoryShown(undefined, 90)).toEqual([90]);
  });
});
