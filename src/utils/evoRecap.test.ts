import { describe, it, expect } from 'vitest';
import { buildEvoRecap, parseEvoRecapSnapshot, serializeEvoRecapSnapshot } from './evoRecap';

const rep = (o: object = {}) => ({ date: '2026-10-29', gaugeGain: 3, evolutionPoints: 15, ...o });
const base = { evolutionStage: 'rookie' }; // meta 30

describe('buildEvoRecap', () => {
  it('antes = depois - ganho; % e falta sobre a meta do estágio', () => {
    const r = buildEvoRecap({ report: rep(), ...base })!;
    expect(r.before).toBe(12);
    expect(r.beforePct).toBe(40);
    expect(r.afterPct).toBe(50);
    expect(r.deltaPct).toBe(10);
    expect(r.left).toBe(15);
    expect(r.full).toBe(false);
  });
  it('barra cheia', () => {
    const r = buildEvoRecap({ report: rep({ evolutionPoints: 30 }), ...base })!;
    expect(r.full).toBe(true);
    expect(r.left).toBe(0);
  });
  it('sem progresso, estágio final, dado incoerente: sem modal', () => {
    expect(buildEvoRecap({ report: rep({ gaugeGain: 0 }), ...base })).toBeNull();
    expect(buildEvoRecap({ report: rep(), evolutionStage: 'ultra' })).toBeNull();
    expect(buildEvoRecap({ report: rep({ gaugeGain: 9, evolutionPoints: 2 }), ...base })).toBeNull();
    expect(buildEvoRecap({ report: null, ...base })).toBeNull();
  });
  it('delta nunca arredonda para 0 quando houve ganho', () => {
    const r = buildEvoRecap({ report: rep({ gaugeGain: 1, evolutionPoints: 60 }), evolutionStage: 'ultimate' })!;
    expect(r.deltaPct).toBeGreaterThanOrEqual(1);
  });
  it('snapshot: ida e volta; mesmo dia = já visto (não repete); lixo = null', () => {
    const r = buildEvoRecap({ report: rep(), ...base })!;
    const seen = parseEvoRecapSnapshot(serializeEvoRecapSnapshot(r));
    expect(seen).toEqual({ date: '2026-10-29', before: 12, after: 15 });
    expect(buildEvoRecap({ report: rep(), ...base, seen })).toBeNull();
    expect(buildEvoRecap({ report: rep({ date: '2026-10-30' }), ...base, seen })).not.toBeNull();
    expect(parseEvoRecapSnapshot('{x')).toBeNull();
    expect(parseEvoRecapSnapshot(null)).toBeNull();
  });
});
