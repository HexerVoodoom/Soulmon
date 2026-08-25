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

// ---------------------------------------------------------------------------
// PARIDADE VIVA — só possível depois do vendor (ADR-002 §1).
//
// Até aqui a única referência era `cascataFixtures`, gerado pelo motor real no
// momento do `npm run sync:oracle-data`. Isso tem um buraco estrutural: o
// fixture envelhece em silêncio. O snapshot em uso foi gerado no SHA
// `1025012c` (`classSystem.data.json → _provenance`), de uma branch de
// trabalho — e o vendor está em `fb866455` (`vendor/class-system/
// _provenance.json`). São SHAs diferentes.
//
// Com o artefato compilado DENTRO do repo, o motor canônico está disponível em
// teste sem rede e sem credencial. Isto NÃO é tautologia: a réplica
// (`cascata.ts`) é código escrito à mão no Soulmon; o vendor é o binário do
// class-system. São dois autores diferentes do mesmo número — que é
// exatamente o que o footgun 9 pede que se confronte.
//
// O bloco abaixo confronta os DIAIS contra o motor vivo. O confronto de
// COMPORTAMENTO (passivos par a par sobre fichas arbitrárias) está
// deliberadamente FORA daqui: ele acusa divergência real hoje (35 de 538
// pares numa varredura de 300 fichas), porque o `fb866455` do class-system
// introduziu transbordo de sinergia de alvo único na cascata e a réplica não
// modela isso. Corrigir a réplica muda a distribuição de pontos da ficha e a
// cobertura travada por simulação — é decisão de produto, não de vendor.
// Ver o achado no run `soulmon-02`.
// ---------------------------------------------------------------------------
describe('diais batem com o MOTOR VIVO vendorizado (não com o fixture velho)', () => {
  it('divisor, limiar e custo por aridade vêm do próprio class-system', async () => {
    const engine = await import('class-system');
    expect(DIVISOR_CASCATA_PAR).toBe(engine.DIVISOR_CASCATA[2]);
    expect(LIMIAR_DESTRAVAMENTO_PAR).toBe(engine.LIMIAR_DESTRAVAMENTO[2]);
    expect(CUSTO_PONTO_BASE).toBe(engine.CUSTO_PONTO_ALOCACAO[1]);
    expect(CUSTO_PONTO_PAR).toBe(engine.CUSTO_PONTO_ALOCACAO[2]);
  });

  it('o vendor declara procedência (repo + SHA) — sem isso ninguém sabe o que roda', async () => {
    const prov = (await import('../../../../vendor/class-system/_provenance.json')).default as {
      repo: string;
      sha: string;
    };
    expect(prov.repo).toContain('Class-System');
    expect(prov.sha).toMatch(/^[0-9a-f]{40}$/);
  });
});
