/**
 * PR15a — a ficha reage ao comportamento (núcleo puro): tabela galho→elemento calibrada com o snapshot, plano
 * normalizado (invariante a volume, nulo em amostra pequena), `evoluirFicha`, `proximaFamilia` e o simulador
 * N=2000 × 5 políticas que MEDE a taxa real de troca de família. O orçamento da ficha não muda.
 */
import { describe, expect, it, vi } from 'vitest';
import { buildSoulProfile } from '../profile';
import { CITIES } from '../cities';
import { applyRitualAnswers } from '../ritualAnswers';
import { ORACLE_QUESTIONS, mulberry32 } from '../../oracle';
import type { Answers } from '../personality/types';
import type { OracleAxes } from '../types';
import { CLASS_ELEMENT_ORDER } from '../types';
import { nomeSintetico, nascimentoSintetico } from '../perfisSinteticos';
import { buildFicha, CLASS_DATA } from './buildSheet';
import { FICHA_STAGE_ORDER, type FichaStage } from './types';
import { elementosDoStage, escolaDominante, perfilDaFicha } from './skills';
import { familiaDoEspecial } from './nomeEspecial';
import { GALHOS, TETO_TAXA_TROCA, familiasDaJornada, proximaFamilia, type Galho } from './estabilidadeFamilia';
import {
  FAMILIAS_DO_GALHO, GALHO_PARA_ELEMENTO, MIN_AMOSTRA, PESO_COMPORTAMENTO, afinidadeDoSnapshotPorGalho, evoluirFicha,
  fatiasDaJanela, planoDoComportamento, type EstagioAnterior,
} from './comportamento';
import { POLITICAS, medirPoliticas, simularJornada } from './comportamentoSimulacao';

vi.setConfig({ testTimeout: 300_000 });

function eixos(rng: () => number, i: number): { oracle: OracleAxes; nome: string } {
  const cidade = CITIES[Math.floor(rng() * CITIES.length)];
  const nome = `${nomeSintetico(rng)} ${i}`;
  const p = buildSoulProfile({
    fullName: nome, ...nascimentoSintetico(rng), timeUnknown: false,
    placeLabel: `${cidade.name}, ${cidade.region || cidade.country}`,
    latitude: cidade.latitude, longitude: cidade.longitude, timeZone: cidade.timeZone,
  }, {} as Answers);
  const resp: Record<string, string> = {};
  for (const q of ORACLE_QUESTIONS) resp[q.id] = q.options[Math.floor(rng() * q.options.length)].id;
  return { oracle: applyRitualAnswers(p.oracle, resp), nome };
}

const AMOSTRA = (() => {
  const rng = mulberry32(20261007);
  return Array.from({ length: 40 }, (_, i) => eixos(rng, i));
})();

const soma = (o: Record<string, number | undefined>) => Object.values(o).reduce<number>((a, b) => a + (b ?? 0), 0);
const totalFicha = (f: { totals: Record<string, number> }) => soma(f.totals);

describe('GALHO_PARA_ELEMENTO: a tabela calibrada com o snapshot', () => {
  it('cada linha soma 1, só tem ids BASE e os 17 elementos aparecem em alguma linha', () => {
    const base = new Set<string>(CLASS_ELEMENT_ORDER);
    const vistos = new Set<string>();
    for (const g of GALHOS) {
      const linha = GALHO_PARA_ELEMENTO[g];
      expect(soma(linha as Record<string, number>)).toBeCloseTo(1, 9);
      for (const [id, p] of Object.entries(linha)) { expect(base.has(id)).toBe(true); expect(p).toBeGreaterThan(0); vistos.add(id); }
    }
    expect([...vistos].sort()).toEqual([...CLASS_ELEMENT_ORDER].sort());
  });

  it('as famílias de criatura do snapshot são repartidas entre os galhos, cada uma uma vez só', () => {
    const todas = Object.keys(CLASS_DATA.familias).sort();
    const usadas = GALHOS.flatMap(g => FAMILIAS_DO_GALHO[g]).sort();
    expect(usadas).toEqual(todas);
  });

  it('segue a afinidade REAL das criaturas: mesmo elemento no topo e cosseno alto com o snapshot', () => {
    const snap = afinidadeDoSnapshotPorGalho();
    const topo = (m: Record<string, number | undefined>) => Object.entries(m).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0][0];
    for (const g of GALHOS) {
      const tab = GALHO_PARA_ELEMENTO[g] as Record<string, number>;
      expect(topo(tab), g).toBe(topo(snap[g]));
      const ids = new Set([...Object.keys(tab), ...Object.keys(snap[g])]);
      let dot = 0, a = 0, b = 0;
      for (const id of ids) { const x = tab[id] ?? 0, y = snap[g][id] ?? 0; dot += x * y; a += x * x; b += y * y; }
      expect(dot / Math.sqrt(a * b), g).toBeGreaterThanOrEqual(0.8);
    }
  });

  it('os três galhos puxam elementos de topo DISTINTOS (nenhum é o "galho padrão")', () => {
    const tops = GALHOS.map(g => Object.entries(GALHO_PARA_ELEMENTO[g]).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0][0]);
    expect(new Set(tops).size).toBe(3);
  });
});

describe('planoDoComportamento', () => {
  it('abaixo de MIN_AMOSTRA = nulo; no limite, plano', () => {
    expect(planoDoComportamento({ power: 29, harmony: 0, benevolence: 0 })).toBeNull();
    expect(planoDoComportamento({ power: 10, harmony: 10, benevolence: 9 })).toBeNull();
    expect(planoDoComportamento({ power: MIN_AMOSTRA, harmony: 0, benevolence: 0 })).not.toBeNull();
    expect(planoDoComportamento(null)).toBeNull();
    expect(planoDoComportamento({ power: NaN, harmony: -5, benevolence: Infinity })).toBeNull();
  });

  it('invariante a volume: a mesma proporção ×10 dá o mesmo plano; e o plano soma 1 sem id de par', () => {
    const a = planoDoComportamento({ power: 40, harmony: 25, benevolence: 15 })!;
    const b = planoDoComportamento({ power: 400, harmony: 250, benevolence: 150 })!;
    for (const el of CLASS_ELEMENT_ORDER) expect(a[el] ?? 0).toBeCloseTo(b[el] ?? 0, 12);
    expect(soma(a as Record<string, number>)).toBeCloseTo(1, 9);
    for (const id of Object.keys(a)) expect((CLASS_ELEMENT_ORDER as readonly string[]).includes(id)).toBe(true);
  });

  it('só-um-galho puxa a linha daquele galho', () => {
    for (const g of GALHOS) {
      const janela = { power: 0, harmony: 0, benevolence: 0, [({ poder: 'power', harmonia: 'harmony', benevolencia: 'benevolence' } as Record<Galho, string>)[g]]: 100 };
      const plano = planoDoComportamento(janela)!;
      for (const el of CLASS_ELEMENT_ORDER) expect(plano[el] ?? 0).toBeCloseTo(GALHO_PARA_ELEMENTO[g][el] ?? 0, 12);
    }
    expect(fatiasDaJanela({ power: 1, harmony: 1, benevolence: 2 })).toEqual({ poder: 0.25, harmonia: 0.25, benevolencia: 0.5 });
  });

  it('o peso é o decidido pelo dono (35%) e cabe no teto da alocação', () => {
    expect(PESO_COMPORTAMENTO).toBe(0.35);
  });
});

describe('evoluirFicha', () => {
  const J = { power: 120, harmony: 30, benevolence: 30 };
  const jornada = (oracle: OracleAxes, nome: string, janela: typeof J | null) => {
    const saidas = [] as ReturnType<typeof evoluirFicha>[];
    let anterior: EstagioAnterior | null = null;
    for (const stage of FICHA_STAGE_ORDER) {
      const r = evoluirFicha({ anterior, janela, oracle, nome, seedKey: nome, stage });
      saidas.push(r);
      anterior = { stage, ficha: r.ficha, familia: r.familia, perfil: r.perfil };
    }
    return saidas;
  };

  it('sem anterior (rookie): é a ficha de hoje, plano nulo — mesmo com janela cheia', () => {
    for (const { oracle, nome } of AMOSTRA.slice(0, 15)) {
      const r = evoluirFicha({ anterior: null, janela: J, oracle, nome, seedKey: nome, stage: 'rookie' });
      expect(r.plano).toBeNull();
      expect(r.ficha).toEqual(buildFicha(nome, oracle, 'rookie', nome));
      expect(r.trocouFamilia).toBe(false);
    }
  });

  it('janela abaixo de MIN_AMOSTRA = a ficha de hoje em todos os estágios', () => {
    for (const { oracle, nome } of AMOSTRA.slice(0, 10)) {
      const pequena = { power: 5, harmony: 5, benevolence: 5 };
      const j = jornada(oracle, nome, pequena);
      FICHA_STAGE_ORDER.forEach((st, i) => expect(j[i].ficha).toEqual(buildFicha(nome, oracle, st, nome)));
    }
  });

  it('idempotente: mesma entrada duas vezes = saída deep-equal', () => {
    const { oracle, nome } = AMOSTRA[3];
    expect(jornada(oracle, nome, J)).toEqual(jornada(oracle, nome, J));
  });

  it('escalar a janela ×10 (mesmas proporções) = mesma ficha, mesmo perfil, mesma família', () => {
    for (const { oracle, nome } of AMOSTRA.slice(0, 10)) {
      const a = jornada(oracle, nome, J);
      const b = jornada(oracle, nome, { power: 1200, harmony: 300, benevolence: 300 });
      a.forEach((x, i) => { expect(x.ficha).toEqual(b[i].ficha); expect(x.familia).toBe(b[i].familia); });
    }
  });

  it('o ORÇAMENTO total da ficha não muda: com ou sem comportamento, em todo estágio, para qualquer janela', () => {
    const janelas = [J, { power: 0, harmony: 200, benevolence: 0 }, { power: 3, harmony: 3, benevolence: 300 }, { power: 500, harmony: 500, benevolence: 500 }];
    for (const { oracle, nome } of AMOSTRA) {
      for (const janela of janelas) {
        const j = jornada(oracle, nome, janela);
        FICHA_STAGE_ORDER.forEach((st, i) => {
          const base = buildFicha(nome, oracle, st, nome);
          expect(j[i].ficha.totals.escolas).toBe(base.totals.escolas);
          expect(j[i].ficha.totals.recursos).toBe(base.totals.recursos);
          expect(j[i].ficha.totals.talentos).toBe(base.totals.talentos);
          expect(j[i].ficha.totals.profissoes).toBe(base.totals.profissoes);
          expect(j[i].ficha.totals.elementos).toBe(base.totals.elementos);
          expect(totalFicha(j[i].ficha)).toBe(totalFicha(base));
          expect(j[i].ficha.escolas).toEqual(base.escolas);
        });
      }
    }
  });

  it('o plano nunca carrega id de par e o comportamento DE FATO inclina o elemento (não é decorativo)', () => {
    let inclinou = 0, total = 0;
    for (const { oracle, nome } of AMOSTRA) {
      const j = jornada(oracle, nome, { power: 300, harmony: 0, benevolence: 0 });
      for (const r of j.slice(1)) {
        total++;
        for (const id of Object.keys(r.plano ?? {})) expect((CLASS_ELEMENT_ORDER as readonly string[]).includes(id)).toBe(true);
        expect(r.ficha.elementos.fogo ?? 0).toBeGreaterThan(0);
      }
      FICHA_STAGE_ORDER.slice(1).forEach((st, i) => {
        const base = buildFicha(nome, oracle, st, nome);
        if ((j[i + 1].ficha.elementos.fogo ?? 0) > (base.elementos.fogo ?? 0)) inclinou++;
      });
    }
    expect(inclinou / total).toBeGreaterThan(0.9);
  });

  it('a skill sai recalculada pela ficha nova e a família é uma das 7', () => {
    const { oracle, nome } = AMOSTRA[0];
    const j = jornada(oracle, nome, J);
    j.forEach(r => { expect(r.skills.especial.familia).toBe(r.familia); expect(r.skills.especial.lex).toBeTruthy(); });
  });
});

describe('proximaFamilia', () => {
  const p = (elementos: Record<string, number>, galhos?: Partial<Record<Galho, number>>) => ({ elementos, galhos });
  const base = { escola: 'conjuracao' as const, elementoId: 'fogo', seedKey: 'k', stage: 'champion' };

  it('sem anterior = o sorteio da seed (como o estágio 1 da jornada)', () => {
    expect(proximaFamilia(null, null, p({ fogo: 3 }), base)).toEqual({ familia: familiaDoEspecial(base), trocou: false });
  });

  it('é exatamente um passo de familiasDaJornada (sem recalcular a jornada inteira)', () => {
    const stages = FICHA_STAGE_ORDER;
    const perfis = [p({ fogo: 8, agua: 1 }), p({ fogo: 8, agua: 1 }), p({ fogo: 1, agua: 8 }), p({ fogo: 1, agua: 8 }), p({ terra: 9 })];
    const escolas = stages.map(() => 'conjuracao' as const);
    const els = stages.map(() => 'fogo');
    const j = familiasDaJornada({ seedKey: 'k', escolas, elementosEspecial: els, perfis, stages });
    for (let i = 1; i < stages.length; i++) {
      const passo = proximaFamilia(j[i - 1].familia, perfis[i - 1], perfis[i], { escola: 'conjuracao', elementoId: 'fogo', seedKey: 'k', stage: stages[i] });
      expect(passo).toEqual(j[i]);
    }
  });
});

describe('medição: N=2000 jornadas × 5 políticas — taxa real de troca de família', () => {
  const N = 2000;
  it('a troca é RARA no agregado, nula para quem mantém o foco, e o que o comportamento muda é o elemento', () => {
    const rng = mulberry32(20261008);
    const oraculos: OracleAxes[] = [], nomes: string[] = [];
    for (let i = 0; i < N; i++) { const e = eixos(rng, i); oraculos.push(e.oracle); nomes.push(e.nome); }
    const m = medirPoliticas(oraculos, nomes, (i, pol) => mulberry32(((i + 1) * 2654435761) ^ pol.length ^ pol.charCodeAt(0)));
    const evolucoes = m.reduce((a, x) => a + x.evolucoes, 0);
    const trocas = m.reduce((a, x) => a + x.trocas, 0);
    const agregada = trocas / evolucoes;
    console.info(`[PR15a] N=${N} x ${POLITICAS.length} politicas, ${evolucoes} evolucoes: troca agregada = ${(agregada * 100).toFixed(2)}% (${trocas}) | alvo <= ${TETO_TAXA_TROCA * 100}%`);
    for (const x of m) console.info(`[PR15a] ${x.politica.padEnd(16)} troca=${(x.taxaTroca * 100).toFixed(2)}% (${x.trocas}/${x.evolucoes}) elemento-dominante-muda-pelo-comportamento=${(x.elementoMudouPeloComportamento * 100).toFixed(1)}% familia-difere-da-base=${(x.familiaDifereDaBase * 100).toFixed(1)}% trocas/jornada=${x.trocasPorJornada.join('/')}`);
    expect(agregada).toBeLessThanOrEqual(TETO_TAXA_TROCA);
    for (const x of m.filter(y => y.politica.startsWith('so-') || y.politica === 'uniforme')) expect(x.taxaTroca, x.politica).toBeLessThanOrEqual(0.05);
    // o comportamento move o elemento (é o que o jogador vê), mas manter o foco NÃO troca a família
    for (const x of m.filter(y => y.politica.startsWith('so-'))) expect(x.elementoMudouPeloComportamento, x.politica).toBeGreaterThan(0.2);
    // as 7 famílias seguem todas presentes sob qualquer política
    for (const x of m) expect(Object.keys(x.familias).length, x.politica).toBe(7);
  });

  it('a jornada sem comportamento (linha de base) é a jornada de hoje: nada de plano, ficha == buildFicha', () => {
    const { oracle, nome } = AMOSTRA[7];
    const base = simularJornada({ oracle, nome, seedKey: nome, politica: 'so-poder', comportamento: false, janelaRng: mulberry32(1) });
    base.forEach((s, i) => expect(s.ficha).toEqual(buildFicha(nome, oracle, FICHA_STAGE_ORDER[i] as FichaStage, nome)));
  });
});

// o par exposto de escola/elementos continua o mesmo que o simulador usa
describe('contrato com skills.ts', () => {
  it('elementosDoStage/perfilDaFicha/escolaDominante são exportados e coerentes', () => {
    const { oracle, nome } = AMOSTRA[1];
    const f = buildFicha(nome, oracle, 'champion', nome);
    expect(elementosDoStage(f).elEspecial).toBeTruthy();
    expect(Object.keys(perfilDaFicha(f).elementos).length).toBeGreaterThan(0);
    expect(escolaDominante(f)).toBeTruthy();
  });
});
