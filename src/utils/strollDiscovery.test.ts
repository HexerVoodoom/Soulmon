import { describe, it, expect } from 'vitest';
import { strollDiscoveryOf } from './strollDiscovery';
import { ENEMY_ROSTER, RAVEN_ENTRY } from './enemyRoster';

describe('a descoberta do Passeio (05/11/2026)', () => {
  it('sempre devolve um Soulmon que o jogador ainda não viu', () => {
    const vistos = ENEMY_ROSTER.slice(0, 40).map(e => e.key);
    for (let d = 1; d <= 60; d++) {
      const e = strollDiscoveryOf(vistos, `2026-11-${d}`);
      expect(e).not.toBeNull();
      expect(vistos).not.toContain(e!.key);
    }
  });
  it('é determinístico por dia e por Drive: reabrir não re-sorteia', () => {
    const vistos = ENEMY_ROSTER.slice(0, 10).map(e => e.key);
    expect(strollDiscoveryOf(vistos, 'Wed Nov 04 2026')?.key).toBe(strollDiscoveryOf([...vistos], 'Wed Nov 04 2026')?.key);
  });
  it('dias diferentes variam a escolha', () => {
    const keys = new Set(Array.from({ length: 30 }, (_, i) => strollDiscoveryOf([], `dia-${i}`)!.key));
    expect(keys.size).toBeGreaterThan(5);
  });
  it('o Corvinho segue ~1/1000: raro de verdade num Drive vazio', () => {
    let corvos = 0;
    const N = 20000;
    for (let i = 0; i < N; i++) if (strollDiscoveryOf([], `d${i}`)!.key === RAVEN_ENTRY.key) corvos++;
    expect(corvos).toBeLessThan(N * 0.003);
  });
  it('se o Corvinho é o ÚNICO que falta, a garantia vence e ele vem', () => {
    const vistos = ENEMY_ROSTER.filter(e => e.key !== RAVEN_ENTRY.key).map(e => e.key);
    expect(strollDiscoveryOf(vistos, 'qualquer')?.key).toBe(RAVEN_ENTRY.key);
  });
  it('Drive completo: null (a cena segue sem a descoberta)', () => {
    expect(strollDiscoveryOf(ENEMY_ROSTER.map(e => e.key), 'x')).toBeNull();
  });
  it('Corvinho já visto nunca volta', () => {
    for (let i = 0; i < 300; i++) expect(strollDiscoveryOf([RAVEN_ENTRY.key], `d${i}`)!.key).not.toBe(RAVEN_ENTRY.key);
  });
});
