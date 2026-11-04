import { describe, it, expect } from 'vitest';
import { forgeReadySlots, lotIndicators, talentPointsFree } from './lotIndicators';
import { xpForLevel } from './bond';

const base = {
  totalXP: xpForLevel(6),
  equipment: { owned: ['eq-nucleo-t1'], equipped: { nucleo: 'eq-nucleo-t1' }, fragments: 0 },
  forge: { v: 2, levels: { 'eq-nucleo-t1': 1 }, picks: {} },
};
const bq = (materials: Record<string, number>) => ({ day: 'Mon Oct 05 2026', visited: [], claimed: [], materials });

describe('lotIndicators', () => {
  it('sem save, nenhum indicador', () => {
    expect(lotIndicators(undefined)).toEqual({});
    expect(forgeReadySlots(null).size).toBe(0);
  });
  it('Soulsmith acende só com peça possuída E materiais; sem material apaga', () => {
    expect(forgeReadySlots({ ...base, buildingQuests: bq({}) } as never).size).toBe(0);
    const pronto = forgeReadySlots({ ...base, buildingQuests: bq({ ore: 3 }) } as never);
    expect([...pronto]).toEqual(['nucleo']);
    expect(lotIndicators({ ...base, buildingQuests: bq({ ore: 3 }) } as never)['forja.ferreiro']).toBe('forge');
  });
  it('peça não possuída nunca acende', () => {
    expect(forgeReadySlots({ totalXP: xpForLevel(6), buildingQuests: bq({ ore: 9 }) } as never).size).toBe(0);
  });
  it('talentos: 1 ponto por Vínculo, acende com ponto livre', () => {
    expect(talentPointsFree({ totalXP: xpForLevel(6) })).toBeGreaterThan(0);
    expect(lotIndicators({ totalXP: xpForLevel(6) })['laboratorio.stats']).toBe('talent');
    expect(talentPointsFree({ totalXP: xpForLevel(6) })).toBe(6);
  });
});
