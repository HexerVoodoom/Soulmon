import { describe, it, expect } from 'vitest';
import { grantRefugioEnergy, refugioEnergyTaken, sanitizeRefugioEnergyDay } from './energia';
import { getMaxEnergyForStage } from '../../types/progression';

const base = { energyPoints: 0, evolutionStage: 'rookie', hunger: { v: 100, at: 0 } };
const T = Date.UTC(2026, 10, 2, 15);

describe('energia do Refúgio', () => {
  it('dá metade do máximo e marca o dia', () => {
    const max = getMaxEnergyForStage('rookie');
    const r = grantRefugioEnergy({ ...base, hunger: { v: 100, at: T } }, T);
    expect(r.energyPoints).toBe(Math.round(max * 0.5));
    expect(refugioEnergyTaken(r, T)).toBe(true);
  });
  it('1× por dia: a segunda chamada devolve a mesma referência', () => {
    const a = grantRefugioEnergy({ ...base, hunger: { v: 100, at: T } }, T);
    expect(grantRefugioEnergy(a, T + 60_000)).toBe(a);
  });
  it('no dia seguinte volta a dar; nunca passa do máximo', () => {
    const max = getMaxEnergyForStage('rookie');
    const a = grantRefugioEnergy({ ...base, energyPoints: max - 1, hunger: { v: 100, at: T } }, T);
    expect(a.energyPoints).toBe(max);
    const b = grantRefugioEnergy({ ...a, energyPoints: 0 }, T + 36 * 3600_000);
    expect(b).not.toBe(a);
    expect(b.energyPoints).toBeGreaterThan(0);
  });
  it('lixo no save vira "nunca tomou"', () => {
    expect(sanitizeRefugioEnergyDay('x')).toBeUndefined();
    expect(sanitizeRefugioEnergyDay(5)).toBeUndefined();
    expect(sanitizeRefugioEnergyDay('2026-11-02')).toBe('2026-11-02');
  });
});
