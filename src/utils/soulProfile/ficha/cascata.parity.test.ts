// ---------------------------------------------------------------------------
// PARIDADE da cascata: a réplica mínima (`ficha/cascata.ts`) contra fixtures
// calculados pelo MOTOR REAL do class-system durante o sync
// (`scripts/sync-oracle-data.mjs` roda `calcularCascata` via tsx no clone).
//
// É o antídoto do footgun 9 (regra copiada diverge em silêncio): se o
// class-system mudar divisor/limiar, o próximo `npm run sync:oracle-data`
// regenera os fixtures e este teste acusa a divergência — igual ao
// `desktop/renderer/src/cloudSync.test.ts`.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import { cascataDosPares } from './cascata';
import snapshotJson from './classSystem.data.json';

interface Fixture {
  diretos: Record<string, number>;
  pares: Record<string, { passivos: number; destravado: boolean }>;
}

const FIXTURES = (snapshotJson as unknown as { cascataFixtures: Fixture[] }).cascataFixtures;

describe('paridade com o motor real do class-system', () => {
  it('o snapshot carrega os fixtures (sync rodou com o motor da cascata)', () => {
    expect(Array.isArray(FIXTURES)).toBe(true);
    expect(FIXTURES.length).toBeGreaterThanOrEqual(5);
  });

  it('passivos e destrave batem par a par com o motor real', () => {
    for (const fixture of FIXTURES) {
      const replica = cascataDosPares(fixture.diretos);
      const replicaPorId = new Map(replica.map(c => [c.def.id, c]));
      for (const [id, esperado] of Object.entries(fixture.pares)) {
        const calculado = replicaPorId.get(id);
        expect(calculado, `par ${id} ausente na réplica (diretos: ${JSON.stringify(fixture.diretos)})`).toBeTruthy();
        expect(calculado!.passivos, `passivos de ${id}`).toBe(esperado.passivos);
        expect(calculado!.destravado, `destrave de ${id}`).toBe(esperado.destravado);
      }
      // e a réplica não inventa par que o motor não viu
      for (const c of replica) {
        expect(fixture.pares[c.def.id], `par ${c.def.id} só existe na réplica`).toBeTruthy();
      }
    }
  });
});
