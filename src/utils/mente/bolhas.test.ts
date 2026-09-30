import { describe, it, expect } from 'vitest';
import {
  bolhasBits, bubbleProgress, hasEscaped, initialStaircase, recordOutcome, spawnBubble, timeLeftMs,
  BOLHAS_CALMA_RISE_MS, BOLHAS_FOCO_DURATION_MS, BOLHAS_MAX_BITS, BOLHAS_MAX_INTERVAL_MS,
  BOLHAS_MIN_INTERVAL_MS, BOLHAS_START_INTERVAL_MS, BOLHAS_WISP_RATIO, STAIRCASE_WINDOW,
} from './bolhas';
import { seededRng } from './eco';

describe('Bolhas — nascimento', () => {
  it('foco: ~20–25% de fiapos numa amostra grande', () => {
    const rng = seededRng(3);
    let wisps = 0;
    const N = 4000;
    for (let i = 0; i < N; i++) if (spawnBubble(i, rng, 'foco', 0, 900).kind === 'wisp') wisps++;
    expect(BOLHAS_WISP_RATIO).toBeGreaterThanOrEqual(0.2);
    expect(BOLHAS_WISP_RATIO).toBeLessThanOrEqual(0.25);
    expect(wisps / N).toBeGreaterThan(0.18);
    expect(wisps / N).toBeLessThan(0.27);
  });
  it('calma: nunca fiapo, e sobe devagar', () => {
    const rng = seededRng(9);
    for (let i = 0; i < 500; i++) {
      const b = spawnBubble(i, rng, 'calma', 0, 900);
      expect(b.kind).toBe('dream');
      expect(b.riseMs).toBe(BOLHAS_CALMA_RISE_MS);
    }
  });
  it('sobe e escapa quando o progresso chega a 1', () => {
    const b = spawnBubble(1, () => 0.5, 'foco', 1000, 900);
    expect(bubbleProgress(b, 1000)).toBe(0);
    expect(hasEscaped(b, 1000 + b.riseMs - 1)).toBe(false);
    expect(hasEscaped(b, 1000 + b.riseMs)).toBe(true);
  });
});

describe('Bolhas — escada rumo a ~85%', () => {
  it('não mexe antes de amostra mínima', () => {
    let s = initialStaircase();
    for (let i = 0; i < 3; i++) s = recordOutcome(s, true);
    expect(s.intervalMs).toBe(BOLHAS_START_INTERVAL_MS);
  });
  it('acerto > 90% acelera; < 75% desacelera; respeita piso e teto', () => {
    let fast = initialStaircase();
    for (let i = 0; i < 12; i++) fast = recordOutcome(fast, true);
    expect(fast.intervalMs).toBeLessThan(BOLHAS_START_INTERVAL_MS);
    for (let i = 0; i < 200; i++) fast = recordOutcome(fast, true);
    expect(fast.intervalMs).toBe(BOLHAS_MIN_INTERVAL_MS);

    let slow = initialStaircase();
    for (let i = 0; i < 12; i++) slow = recordOutcome(slow, false);
    expect(slow.intervalMs).toBeGreaterThan(BOLHAS_START_INTERVAL_MS);
    for (let i = 0; i < 200; i++) slow = recordOutcome(slow, false);
    expect(slow.intervalMs).toBe(BOLHAS_MAX_INTERVAL_MS);
  });
  it('na faixa 75–90% fica parado; a janela desliza e não passa de 10', () => {
    const s0 = { intervalMs: 900, recent: [false, true, true, true, true, true, true, true, false, true] };
    const s1 = recordOutcome(s0, true); // sai o 1º false → 9/10 = 90%, não é > 90%
    expect(s1.recent).toHaveLength(STAIRCASE_WINDOW);
    expect(s1.intervalMs).toBe(900);
  });
});

describe('Bolhas — tempo e Bits', () => {
  it('60 s, nunca negativo', () => {
    expect(timeLeftMs(0, 0)).toBe(BOLHAS_FOCO_DURATION_MS);
    expect(timeLeftMs(0, 70_000)).toBe(0);
  });
  it('bolhasBits = floor(score/6), teto 8 (balanço de 30/09/2026)', () => {
    expect(bolhasBits(0)).toBe(0);
    expect(bolhasBits(5)).toBe(0);
    expect(bolhasBits(6)).toBe(1);
    expect(bolhasBits(39)).toBe(6);
    expect(bolhasBits(500)).toBe(BOLHAS_MAX_BITS);
    expect(bolhasBits(-3)).toBe(0);
  });
});
