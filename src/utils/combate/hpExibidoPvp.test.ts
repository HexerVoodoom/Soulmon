import { describe, expect, it } from 'vitest';
import { hpExibidoPvp, hpPoints, PVP_HP_SCALE } from './fight';

describe('hpExibidoPvp (§252: o duelo mostra o HP base da Arena)', () => {
  it('é o mesmo número da Arena, não o inflado por PVP_HP_SCALE', () => {
    for (const hp of [1, 7.3, 40, 123.4, 999]) {
      expect(hpExibidoPvp(hp)).toBe(hpPoints(hp));
      if (hp >= 40) expect(hpExibidoPvp(hp)).toBeLessThan(hpPoints(hp * PVP_HP_SCALE));
    }
  });
  it('o motor não muda: a escala do PvP segue 1.7', () => {
    expect(PVP_HP_SCALE).toBe(1.7);
  });
});
