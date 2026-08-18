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
import {
  cascataDosPares,
  CUSTO_PONTO_BASE,
  CUSTO_PONTO_PAR,
  DIVISOR_CASCATA_PAR,
  LIMIAR_DESTRAVAMENTO_PAR,
} from './cascata';
import snapshotJson from './classSystem.data.json';
import type { GeracoesSnapshot } from './types';

interface Fixture {
  diretos: Record<string, number>;
  pares: Record<string, { passivos: number; destravado: boolean }>;
}

const SNAPSHOT = snapshotJson as unknown as {
  cascataFixtures: Fixture[];
  geracoes: GeracoesSnapshot;
};
const FIXTURES = SNAPSHOT.cascataFixtures;
const GERACOES = SNAPSHOT.geracoes;

// Os fixtures acima cobrem o COMPORTAMENTO (passivos/destrave), então divisor
// e limiar já morriam se divergissem. `CUSTO_PONTO_PAR` e `CUSTO_PONTO_BASE`
// não: são preço de orçamento, não entram em cascata nenhuma, e a auditoria
// mediu que mutar `CUSTO_PONTO_PAR` de 2 para 3 mantinha 1253/1253 testes
// verdes — a divergência silenciosa do footgun 9. Por isso os QUATRO diais são
// afirmados contra o `geracoes` do snapshot, que o sync copia do
// `taxonomy.json` do class-system.
describe('diais da alocação geracional espelham o class-system', () => {
  it('o snapshot traz o bloco `geracoes` (sync rodou com o taxonomy.json v2)', () => {
    expect(GERACOES, 'snapshot sem `geracoes` — rode `npm run sync:oracle-data`').toBeTruthy();
    expect(typeof GERACOES.divisorCascata['2']).toBe('number');
    expect(typeof GERACOES.limiarDestravamento['2']).toBe('number');
    expect(typeof GERACOES.custoPontoAlocacao['1']).toBe('number');
    expect(typeof GERACOES.custoPontoAlocacao['2']).toBe('number');
  });

  it('divisor da cascata do par bate', () => {
    expect(DIVISOR_CASCATA_PAR).toBe(GERACOES.divisorCascata['2']);
  });

  it('limiar de destravamento do par bate', () => {
    expect(LIMIAR_DESTRAVAMENTO_PAR).toBe(GERACOES.limiarDestravamento['2']);
  });

  it('custo do ponto BASE bate (aridade 1)', () => {
    expect(CUSTO_PONTO_BASE).toBe(GERACOES.custoPontoAlocacao['1']);
  });

  it('custo do ponto direto no PAR bate (aridade 2) — o dial que sobrevivia às mutações', () => {
    expect(CUSTO_PONTO_PAR).toBe(GERACOES.custoPontoAlocacao['2']);
  });
});

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
