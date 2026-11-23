import { describe, it, expect } from 'vitest';
import { projectileScale, projectileScaleRange, CUT_START } from './projetilEscala';

describe('projectileScale', () => {
  it('comum: cresce ~10% indo ao inimigo, encolhe ~10% vindo dele', () => {
    expect(projectileScale('orb', 'toFoe', 0)).toBe(1);
    expect(projectileScale('orb', 'toFoe', 1)).toBeCloseTo(1.1);
    expect(projectileScale('orb', 'toMe', 0)).toBeCloseTo(1.1);
    expect(projectileScale('orb', 'toMe', 1)).toBe(1);
  });
  it('corte: nasce pequeno e chega no tamanho do melee indo ao inimigo', () => {
    expect(projectileScaleRange('cut', 'toFoe')).toEqual({ from: CUT_START, to: 1 });
    expect(projectileScale('cut', 'toFoe', 0.5)).toBeCloseTo((CUT_START + 1) / 2);
  });
  it('corte: vindo do inimigo também nasce ~0 e cresce até 100%', () => {
    expect(CUT_START).toBeLessThanOrEqual(0.05);
    expect(projectileScaleRange('cut', 'toMe')).toEqual({ from: CUT_START, to: 1 });
  });
  it('limita o progresso e ignora NaN', () => {
    expect(projectileScale('cut', 'toFoe', -3)).toBe(CUT_START);
    expect(projectileScale('cut', 'toFoe', 9)).toBe(1);
    expect(projectileScale('orb', 'toFoe', NaN)).toBe(1);
  });
});
