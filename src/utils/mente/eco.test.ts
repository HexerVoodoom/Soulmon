import { describe, it, expect } from 'vitest';
import {
  checkTap, ecoBits, expectedAt, growSequence, nextStone, playbackIntervalMs, seededRng, startSequence,
  ECO_MAX_BITS, ECO_MIN_INTERVAL_MS, ECO_START_LENGTH, type Stone,
} from './eco';

describe('Eco — sequência', () => {
  it('começa com 3 pedras válidas e é determinística pela semente', () => {
    const a = startSequence(seededRng(42));
    const b = startSequence(seededRng(42));
    expect(a).toHaveLength(ECO_START_LENGTH);
    expect(a).toEqual(b);
    for (const s of a) expect([0, 1, 2, 3]).toContain(s);
  });

  it('crescer acrescenta UMA pedra no fim e não mexe no que já veio', () => {
    const rng = seededRng(7);
    const s = startSequence(rng);
    const g = growSequence(s, rng);
    expect(g).toHaveLength(s.length + 1);
    expect(g.slice(0, s.length)).toEqual(s);
  });

  it('nextStone aperta rng fora da faixa para dentro de 0..3', () => {
    expect(nextStone(() => 0)).toBe(0);
    expect(nextStone(() => 0.99)).toBe(3);
    expect(nextStone(() => 1)).toBe(3);
    expect(nextStone(() => -1)).toBe(0);
  });
});

describe('Eco — conferência do toque', () => {
  const seq: Stone[] = [0, 1, 2];
  it('na ordem: continue, continue, complete', () => {
    expect(checkTap(seq, [], 0, false)).toBe('continue');
    expect(checkTap(seq, [0], 1, false)).toBe('continue');
    expect(checkTap(seq, [0, 1], 2, false)).toBe('complete');
  });
  it('fora da ordem = miss', () => {
    expect(checkTap(seq, [], 1, false)).toBe('miss');
    expect(checkTap(seq, [0, 1, 2], 0, false)).toBe('miss');
  });
  it('eco reverso: de trás para frente', () => {
    expect(expectedAt(seq, 0, true)).toBe(2);
    expect(checkTap(seq, [], 2, true)).toBe('continue');
    expect(checkTap(seq, [2], 1, true)).toBe('continue');
    expect(checkTap(seq, [2, 1], 0, true)).toBe('complete');
    expect(checkTap(seq, [], 0, true)).toBe('miss');
  });
});

describe('Eco — ritmo e Bits', () => {
  it('acelera com o tamanho, nunca abaixo do piso', () => {
    expect(playbackIntervalMs(4)).toBeLessThan(playbackIntervalMs(3));
    expect(playbackIntervalMs(100)).toBe(ECO_MIN_INTERVAL_MS);
  });
  it('ecoBits = max(0, longest − 3), teto 10', () => {
    expect(ecoBits(0)).toBe(0);
    expect(ecoBits(3)).toBe(0);
    expect(ecoBits(4)).toBe(1);
    expect(ecoBits(13)).toBe(10);
    expect(ecoBits(50)).toBe(ECO_MAX_BITS);
    expect(ecoBits(NaN)).toBe(0);
  });
});
