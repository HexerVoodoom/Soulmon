import { describe, it, expect } from 'vitest';
import { BREATH_PATTERNS, BREATH_DURATIONS_MIN, phaseAt, cycleMs, fillLevel, sessionMs } from './respiracao';

const calma = BREATH_PATTERNS.find(p => p.id === 'calma')!;
const quadrada = BREATH_PATTERNS.find(p => p.id === 'quadrada')!;

describe('respiração — phaseAt', () => {
  it('calma: 4 s entra, sem pausa, 6 s sai', () => {
    expect(cycleMs(calma)).toBe(10_000);
    expect(phaseAt(calma, 0)).toEqual({ phase: 'inhale', progress: 0, cycle: 0 });
    expect(phaseAt(calma, 2000)).toEqual({ phase: 'inhale', progress: 0.5, cycle: 0 });
    expect(phaseAt(calma, 4000).phase).toBe('exhale');
    expect(phaseAt(calma, 7000)).toEqual({ phase: 'exhale', progress: 0.5, cycle: 0 });
    expect(phaseAt(calma, 10_000)).toEqual({ phase: 'inhale', progress: 0, cycle: 1 });
  });

  it('quadrada: as quatro fases de 4 s, em ordem', () => {
    expect(cycleMs(quadrada)).toBe(16_000);
    expect([1000, 5000, 9000, 13_000].map(t => phaseAt(quadrada, t).phase)).toEqual(['inhale', 'hold', 'exhale', 'holdOut']);
    expect(phaseAt(quadrada, 33_000)).toMatchObject({ phase: 'inhale', cycle: 2 });
  });

  it('tempo negativo ou inválido não quebra', () => {
    expect(phaseAt(calma, -5)).toEqual({ phase: 'inhale', progress: 0, cycle: 0 });
    expect(phaseAt(calma, Number.NaN)).toEqual({ phase: 'inhale', progress: 0, cycle: 0 });
  });

  it('a bolha enche na entrada e esvazia na saída', () => {
    expect(fillLevel('inhale', 0.5)).toBe(0.5);
    expect(fillLevel('hold', 0.3)).toBe(1);
    expect(fillLevel('exhale', 0.25)).toBe(0.75);
    expect(fillLevel('holdOut', 0.9)).toBe(0);
  });

  it('a sessão termina num ciclo inteiro, nunca antes do pedido', () => {
    expect(BREATH_DURATIONS_MIN).toEqual([1, 2, 3]);
    expect(sessionMs(calma, 1)).toBe(60_000);
    expect(sessionMs(quadrada, 1)).toBe(64_000);
    for (const m of BREATH_DURATIONS_MIN) for (const p of BREATH_PATTERNS) {
      expect(sessionMs(p, m)).toBeGreaterThanOrEqual(m * 60_000);
      expect(sessionMs(p, m) % cycleMs(p)).toBe(0);
    }
  });
});
