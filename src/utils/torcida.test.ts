import { describe, it, expect } from 'vitest';
import {
  torcidaStrike, torcidaTap, torcidaFill, torcidaCheio,
  TORCIDA_PVE_TAPS_FULL, TORCIDA_TAPS_FULL, TORCIDA_BASE_FRAC, TORCIDA_PVE_SPECIAL_MULT, TIMING_CHEER_ENABLED,
} from './torcida';
import { CHEER } from './combate/specials';

describe('torcida (PvE) — toques enchem o gauge, o pet gasta no especial', () => {
  it('LEGADO: o gauge do PvE antigo segue em 8 e o do duelo/Arena antigo em 16 — a barra de cheer nova (24) é de `energia.ts`; a torcida por timing está desligada', () => {
    expect(TORCIDA_PVE_TAPS_FULL).toBe(8);
    expect(TORCIDA_TAPS_FULL).toBe(16);
    expect(CHEER.tapsFull).toBe(24); // a barra de cheer de agora (energia) é mais lenta que o gauge antigo
    expect(TORCIDA_TAPS_FULL).toBeGreaterThan(TORCIDA_PVE_TAPS_FULL);
    expect(TIMING_CHEER_ENABLED).toBe(false);
  });

  it('as funções aceitam o `full` do duelo: o gauge de 16 só enche no 16º toque', () => {
    let t = 0;
    for (let i = 0; i < TORCIDA_TAPS_FULL - 1; i++) t = torcidaTap(t, TORCIDA_TAPS_FULL);
    expect(torcidaCheio(t, TORCIDA_TAPS_FULL)).toBe(false);
    expect(torcidaFill(t, TORCIDA_TAPS_FULL)).toBeLessThan(1);
    t = torcidaTap(t, TORCIDA_TAPS_FULL);
    expect(torcidaCheio(t, TORCIDA_TAPS_FULL)).toBe(true);
    expect(torcidaTap(t, TORCIDA_TAPS_FULL)).toBe(TORCIDA_TAPS_FULL);
  });

  it('cada toque sobe um e para no cheio', () => {
    let t = 0;
    for (let i = 0; i < TORCIDA_PVE_TAPS_FULL + 5; i++) t = torcidaTap(t);
    expect(t).toBe(TORCIDA_PVE_TAPS_FULL);
    expect(torcidaCheio(t)).toBe(true);
    expect(torcidaCheio(TORCIDA_PVE_TAPS_FULL - 1)).toBe(false);
    expect(torcidaFill(0)).toBe(0);
    expect(torcidaFill(TORCIDA_PVE_TAPS_FULL / 2)).toBe(0.5);
    expect(torcidaFill(999)).toBe(1);
  });

  it('só soma: gauge vazio ou meio dá o golpe-base, nunca menos; o gauge parcial não se perde', () => {
    for (const stats of [{ dmg: 3 }, { dmg: 4 }, { dmg: 5 }, { dmg: 8 }]) {
      const base = Math.max(1, Math.round(stats.dmg * TORCIDA_BASE_FRAC));
      expect(torcidaStrike(stats.dmg, 0).dmg).toBe(base);
      const meio = torcidaStrike(stats.dmg, TORCIDA_PVE_TAPS_FULL - 1);
      expect(meio.dmg).toBe(base);
      expect(meio.special).toBe(false);
      expect(meio.tapsLeft).toBe(TORCIDA_PVE_TAPS_FULL - 1);
    }
  });

  it('gauge cheio: especial maior que o base, e o gauge é gasto', () => {
    const e = torcidaStrike(8, TORCIDA_PVE_TAPS_FULL);
    expect(e.special).toBe(true);
    expect(e.tapsLeft).toBe(0);
    expect(e.dmg).toBe(Math.round(8 * TORCIDA_BASE_FRAC * TORCIDA_PVE_SPECIAL_MULT));
    expect(e.dmg).toBeGreaterThan(torcidaStrike(8, 0).dmg);
  });

  it('a casca do inimigo reduz o golpe e nunca zera', () => {
    expect(torcidaStrike(8, 0, 0.5).dmg).toBeLessThanOrEqual(torcidaStrike(8, 0, 0).dmg);
    expect(torcidaStrike(1, 0, 0.7).dmg).toBe(1);
  });
});
