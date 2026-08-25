// ---------------------------------------------------------------------------
// PARIDADE da cascata: a réplica mínima (`ficha/cascata.ts`) contra o MOTOR
// CANÔNICO vendorizado (`vendor/class-system/index.js`, ADR-002 §1).
//
// É o antídoto do footgun 9 (regra copiada diverge em silêncio) — e ele já
// falhou uma vez, do jeito mais silencioso possível:
//
//   Os fixtures viviam em `classSystem.data.json`, gerados pelo
//   `npm run sync:oracle-data` a partir de um CLONE IRMÃO no SHA `1025012c`
//   (branch de trabalho). O vendor está em `fb866455`. SHAs diferentes, nada
//   no repositório dizendo isso, e os 7 casos cobriam só `fogo`/`agua` — que
//   por acaso são os dois elementos SEM sinergia de alvo único. Resultado:
//   o `fb866455` passou a alimentar a cascata com transbordo de sinergia de
//   alvo único, a réplica não modelava, e 21.795 de 79.199 pares divergiam
//   numa varredura de 300 fichas × 5 estágios — com 1253 testes verdes.
//
// O que mudou para isso não voltar:
//   1. Fixture gerado do PRÓPRIO VENDOR (`npm run gen:cascata-fixtures`), com
//      procedência no arquivo. SHA do fixture == SHA do motor, por construção,
//      e há teste abaixo afirmando isso.
//   2. Cobertura que inclui a classe de defeito: 13 dos 19 casos são casos em
//      que o transbordo MUDA o resultado (emissor, receptor, dois emissores no
//      mesmo alvo, transbordo cruzando o limiar de destrave, par que nasce só
//      do transbordo, e o piso onde `floor(pontos*razao)` dá 0).
//   3. Confronto de COMPORTAMENTO contra o motor VIVO, não só contra fixture.
//      Fixture envelhece em silêncio; o motor não.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import {
  cascataDosPares,
  alimentoDasBases,
  SINERGIAS_ALVO_UNICO,
  CUSTO_PONTO_BASE,
  CUSTO_PONTO_PAR,
  DIVISOR_CASCATA_PAR,
  LIMIAR_DESTRAVAMENTO_PAR,
} from './cascata';
import snapshotJson from './classSystem.data.json';
import fixturesJson from './cascata.fixtures.json';
import { DERIVED_ELEMENT_PAIRS } from '../derivedElements';
import { CLASS_ELEMENT_ORDER, type ClassElementId } from '../types';
import type { GeracoesSnapshot } from './types';

interface Fixture {
  diretos: Record<string, number>;
  pares: Record<string, { passivos: number; destravado: boolean }>;
}

const GERACOES = (snapshotJson as unknown as { geracoes: GeracoesSnapshot }).geracoes;
const FIXTURES = fixturesJson as unknown as {
  _procedencia: { repo: string; sha: string; origem: string; geradoPor: string };
  bases: string[];
  sinergiasAlvoUnico: { de: string; para: string; razao: number }[];
  cascataFixtures: Fixture[];
};

// ---------------------------------------------------------------------------
// Diais. Fixture de COMPORTAMENTO já mataria divisor e limiar, mas
// `CUSTO_PONTO_PAR` e `CUSTO_PONTO_BASE` não: são preço de orçamento, não
// entram em cascata nenhuma, e a auditoria mediu que mutar `CUSTO_PONTO_PAR`
// de 2 para 3 mantinha 1253/1253 testes verdes.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Procedência: o buraco por onde o defeito entrou.
// ---------------------------------------------------------------------------
describe('procedência do fixture (o buraco por onde o defeito entrou)', () => {
  it('o vendor declara repo + SHA — sem isso ninguém sabe o que roda', async () => {
    const prov = (await import('../../../../vendor/class-system/_provenance.json')).default as {
      repo: string;
      sha: string;
    };
    expect(prov.repo).toContain('Class-System');
    expect(prov.sha).toMatch(/^[0-9a-f]{40}$/);
  });

  it('o fixture veio do MESMO SHA do vendor — foi a divergência disto que escondeu 21.795 pares', async () => {
    const prov = (await import('../../../../vendor/class-system/_provenance.json')).default as {
      sha: string;
    };
    expect(
      FIXTURES._procedencia.sha,
      'fixture de SHA diferente do motor — rode `npm run gen:cascata-fixtures`',
    ).toBe(prov.sha);
    expect(FIXTURES._procedencia.origem).toBe('vendor/class-system/index.js');
  });
});

// ---------------------------------------------------------------------------
// A tabela de sinergia é DADO do class-system, não regra escrita no Soulmon.
// ---------------------------------------------------------------------------
describe('transbordo de sinergia de alvo único', () => {
  it('a tabela do fixture é exatamente o filtro `para.length === 1` do motor vivo', async () => {
    const engine = await import('class-system');
    const doMotor = engine.SINERGIAS.filter(s => s.para.length === 1).map(s => ({
      de: s.de as string,
      para: s.para[0] as string,
      razao: s.razao,
    }));
    expect(SINERGIAS_ALVO_UNICO).toEqual(doMotor);
    expect(SINERGIAS_ALVO_UNICO.length).toBeGreaterThan(0);
  });

  it('sinergia de LEQUE fica de fora — replicá-la inflaria a ficha inteira', async () => {
    const engine = await import('class-system');
    const leque = engine.SINERGIAS.filter(s => s.para.length > 1);
    expect(leque.length, 'o motor não tem mais sinergia de leque? confirme a réplica').toBeGreaterThan(0);
    for (const s of leque) {
      expect(SINERGIAS_ALVO_UNICO.some(u => u.de === s.de && s.para.includes(u.para) && u.razao === s.razao)).toBe(false);
    }
  });

  it('`alimentoDasBases` soma emissores diferentes no mesmo alvo e trunca para baixo', () => {
    // terra→vigor (0.05) + marcial→vigor (0.1): 60*0.05=3, 40*0.1=4 → +7
    const a = alimentoDasBases({ terra: 60, marcial: 40, vigor: 41 });
    expect(a.vigor).toBe(48);
    // piso: 9 * 0.1 = 0.9 → floor 0, nada transborda
    expect(alimentoDasBases({ luz: 9, vida: 5 }).vida).toBe(5);
  });

  it('o transbordo é calculado sobre os DIRETOS, nunca em cadeia sobre o alimento já transbordado', () => {
    // marcial→vigor→vida: se houvesse segunda passada, `vida` receberia o
    // transbordo do vigor JÁ inflado pelo marcial e a ficha se amplificaria.
    const a = alimentoDasBases({ marcial: 100, vigor: 100, vida: 0 });
    expect(a.vigor).toBe(110); // 100 + floor(100*0.1)
    expect(a.vida).toBe(10);   // floor(100*0.1) do vigor DIRETO, não dos 110
  });
});

// ---------------------------------------------------------------------------
// Comportamento: réplica x fixture, e réplica x MOTOR VIVO.
// ---------------------------------------------------------------------------
const PAIR_IDS = new Set(DERIVED_ELEMENT_PAIRS.map(d => d.id));

function paresDoMotor(
  c: { passivos: ReadonlyMap<string, number>; destravados: ReadonlySet<string> },
): Map<string, { passivos: number; destravado: boolean }> {
  const out = new Map<string, { passivos: number; destravado: boolean }>();
  for (const [id, p] of c.passivos) {
    if (p > 0 && PAIR_IDS.has(id)) out.set(id, { passivos: p, destravado: c.destravados.has(id) });
  }
  return out;
}

describe('paridade com o motor real do class-system', () => {
  it('o fixture carrega casos, e a maioria exercita o transbordo', () => {
    expect(Array.isArray(FIXTURES.cascataFixtures)).toBe(true);
    expect(FIXTURES.cascataFixtures.length).toBeGreaterThanOrEqual(15);
    // A cobertura antiga tinha 7 casos e NENHUM deles mudava com o transbordo
    // (só fogo/agua). Este teste é a lápide disso.
    const mudam = FIXTURES.cascataFixtures.filter(f => {
      const cru = new Map(
        cascataDosPares(f.diretos as Partial<Record<ClassElementId, number>>).map(c => [c.def.id, c]),
      );
      return Object.entries(f.pares).some(([id, e]) => {
        const r = cru.get(id);
        const semTransbordo = Math.min(
          ...DERIVED_ELEMENT_PAIRS.find(d => d.id === id)!.componentes.map(
            comp => Math.floor((f.diretos[comp] ?? 0) / DIVISOR_CASCATA_PAR),
          ),
        );
        return r !== undefined && semTransbordo !== e.passivos;
      });
    });
    expect(mudam.length, 'nenhum caso exercita o transbordo — a cobertura não pega o defeito de fb866455').toBeGreaterThanOrEqual(10);
  });

  it('passivos e destrave batem par a par com o fixture', () => {
    for (const fixture of FIXTURES.cascataFixtures) {
      const replica = cascataDosPares(fixture.diretos as Partial<Record<ClassElementId, number>>);
      const replicaPorId = new Map(replica.map(c => [c.def.id, c]));
      for (const [id, esperado] of Object.entries(fixture.pares)) {
        const calculado = replicaPorId.get(id);
        expect(calculado, `par ${id} ausente na réplica (diretos: ${JSON.stringify(fixture.diretos)})`).toBeTruthy();
        expect(calculado!.passivos, `passivos de ${id}`).toBe(esperado.passivos);
        expect(calculado!.destravado, `destrave de ${id}`).toBe(esperado.destravado);
      }
      for (const c of replica) {
        expect(fixture.pares[c.def.id], `par ${c.def.id} só existe na réplica`).toBeTruthy();
      }
    }
  });

  it('passivos e destrave batem par a par com o MOTOR VIVO nos casos do fixture', async () => {
    const engine = await import('class-system');
    for (const fixture of FIXTURES.cascataFixtures) {
      const rep = new Map(
        cascataDosPares(fixture.diretos as Partial<Record<ClassElementId, number>>).map(c => [c.def.id, c]),
      );
      const mot = paresDoMotor(engine.calcularCascata(fixture.diretos));
      const ids = new Set([...rep.keys(), ...mot.keys()]);
      for (const id of ids) {
        const m = mot.get(id);
        const r = rep.get(id);
        expect(m, `par ${id} só na réplica (${JSON.stringify(fixture.diretos)})`).toBeTruthy();
        expect(r, `par ${id} só no motor (${JSON.stringify(fixture.diretos)})`).toBeTruthy();
        expect(r!.passivos, `passivos de ${id} em ${JSON.stringify(fixture.diretos)}`).toBe(m!.passivos);
        expect(r!.destravado, `destrave de ${id} em ${JSON.stringify(fixture.diretos)}`).toBe(m!.destravado);
      }
    }
  });

  // Varredura determinística: fixture cobre casos ESCOLHIDOS, esta cobre
  // distribuições que ninguém escolheu. É a versão barata (240 fichas
  // sintéticas) da varredura de 300 fichas reais × 5 estágios que achou o
  // defeito; roda em ~1s porque não passa pela astronomia.
  it('varredura determinística: 0 divergências contra o motor vivo', async () => {
    const engine = await import('class-system');
    let semente = 20260825;
    const rnd = () => {
      semente = (semente * 1103515245 + 12345) & 0x7fffffff;
      return semente / 0x7fffffff;
    };
    const divergentes: string[] = [];
    let pares = 0;
    for (let i = 0; i < 240; i++) {
      const orcamento = [30, 60, 120, 300, 500][i % 5];
      const expoente = 1 + (i % 5) * 0.45;
      const pesos = CLASS_ELEMENT_ORDER.map(() => Math.pow(rnd(), expoente));
      const soma = pesos.reduce((a, b) => a + b, 0);
      const bases: Partial<Record<ClassElementId, number>> = {};
      CLASS_ELEMENT_ORDER.forEach((id, k) => {
        const pts = Math.floor((pesos[k] / soma) * orcamento);
        if (pts > 0) bases[id] = pts;
      });
      const rep = new Map(cascataDosPares(bases).map(c => [c.def.id, c]));
      const mot = paresDoMotor(engine.calcularCascata(bases as Record<string, number>));
      for (const id of new Set([...rep.keys(), ...mot.keys()])) {
        pares++;
        const m = mot.get(id);
        const r = rep.get(id);
        if (!m || !r || m.passivos !== r.passivos || m.destravado !== r.destravado) {
          divergentes.push(`${id} @ ${JSON.stringify(bases)}: motor=${JSON.stringify(m)} replica=${JSON.stringify(r)}`);
        }
      }
    }
    expect(pares, 'a varredura não gerou par nenhum — o gerador quebrou').toBeGreaterThan(1000);
    expect(divergentes.slice(0, 5), `${divergentes.length}/${pares} pares divergentes`).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// PARIDADE VIVA dos diais — o motor canônico está no repo, sem rede e sem
// credencial. Não é tautologia: a réplica é código escrito à mão no Soulmon,
// o vendor é o binário do class-system.
// ---------------------------------------------------------------------------
describe('diais batem com o MOTOR VIVO vendorizado (não com o fixture velho)', () => {
  it('divisor, limiar e custo por aridade vêm do próprio class-system', async () => {
    const engine = await import('class-system');
    expect(DIVISOR_CASCATA_PAR).toBe(engine.DIVISOR_CASCATA[2]);
    expect(LIMIAR_DESTRAVAMENTO_PAR).toBe(engine.LIMIAR_DESTRAVAMENTO[2]);
    expect(CUSTO_PONTO_BASE).toBe(engine.CUSTO_PONTO_ALOCACAO[1]);
    expect(CUSTO_PONTO_PAR).toBe(engine.CUSTO_PONTO_ALOCACAO[2]);
  });
});
