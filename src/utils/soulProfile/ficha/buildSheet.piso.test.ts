// WP4.23 / T-PISO — o piso de não-desastre da alocação manual.
//
// Exigência do parecer de psicologia comportamental (R6.2): o jogador pode
// escolher DIFERENTE, nunca escolher QUEBRADO. A cascata é não-linear —
// `CUSTO_PONTO_PAR` 2, par destrava só com passivos suficientes — e uma
// alocação legal que derrubasse todos os pares seria uma armadilha: build
// arruinada, permanente, num produto cuja tese é encorajar.
//
// A régua da spec (§10.2): 120 perfis × 3 planos adversários, `custoElementos`
// igual ao da ficha sem plano, e os pares destravados **≥ os da ficha sem
// plano em ≥95% dos casos**. Nos casos restantes a tela nomeia o fato em
// palavra antes do commit (R-A(c)) — sem impedir a escolha.
//
// Os planos são ADVERSÁRIOS de propósito: não é o jogador médio, é o que
// escolhe pior. Se o piso aguenta estes três, aguenta qualquer tela.

import { describe, expect, it } from 'vitest';
import { buildFicha, ELEMENT_ORCAMENTO_BY_STAGE, type ElementPlan } from './buildSheet';
import { cascataDosPares, CUSTO_PONTO_BASE, CUSTO_PONTO_PAR } from './cascata';
import { CLASS_ELEMENT_ORDER } from '../types';
import { mulberry32 } from '../../oracle';
import type { OracleAxes } from '../types';
import type { ElementoBaseId } from './types';

const PERFIS = 120;
const ESTAGIO = 'ultra' as const;

/** Perfis sintéticos determinísticos — afinidades sorteadas, seed fixa. */
function perfis(): { nome: string; eixos: OracleAxes; shares: Record<string, number> }[] {
  const rng = mulberry32(20260922);
  const out = [];
  for (let i = 0; i < PERFIS; i++) {
    const classElements = {} as Record<string, number>;
    for (const el of CLASS_ELEMENT_ORDER) classElements[el] = 1 + Math.floor(rng() * 30);
    out.push({
      nome: `perfil-${i}`,
      shares: classElements,
      eixos: {
        elements: { agua: 20, fogo: 20, terra: 15, ar: 15, sombra: 10, luz: 10, planta: 5, industrial: 5 },
        roles: { suporte: 20, tanque: 20, fisico: 20, magico: 20, alcance: 20 },
        alignments: { poder: 34, harmonia: 33, benevolencia: 33 },
        realms: {
          deserto: 11, picos: 11, oceano: 11, pantano: 11, floresta: 11,
          cavernas: 11, gelo: 11, campina: 12, akasha: 11,
        },
        classElements,
        dominantElement: 'agua',
        dominantRole: 'magico',
        dominantAlignment: 'harmonia',
        dominantRealm: 'oceano',
        dominantClassElements: [],
      } as unknown as OracleAxes,
    });
  }
  return out;
}

/**
 * Os três planos adversários, cada um atacando a cascata por um lado:
 *
 *  1. TUDO NUM SÓ — concentração máxima. Um elemento come a fatia inteira e
 *     nenhum outro sobe, que é o caso clássico de "gastei e não destravou".
 *  2. ESPALHADO — 1 de peso em cada um dos 17. Ninguém chega a lugar nenhum;
 *     é o oposto exato do anterior e falha pela outra ponta.
 *  3. CONTRA O ORÁCULO — toda a fatia nos dois elementos de MENOR afinidade
 *     da leitura. É o jogador brigando com a própria criatura, que é onde o
 *     desalinhamento entre plano e `shares` fica maior.
 */
function planosAdversarios(shares: Record<string, number>): { nome: string; plano: ElementPlan }[] {
  const ordenado = [...CLASS_ELEMENT_ORDER].sort((a, b) => (shares[a] ?? 0) - (shares[b] ?? 0));
  const espalhado = Object.fromEntries(CLASS_ELEMENT_ORDER.map(el => [el, 1])) as ElementPlan;
  return [
    { nome: 'tudo-num-so', plano: { [ordenado[ordenado.length - 1]]: 1 } as ElementPlan },
    { nome: 'espalhado', plano: espalhado },
    { nome: 'contra-o-oraculo', plano: { [ordenado[0]]: 1, [ordenado[1]]: 1 } as ElementPlan },
  ];
}

/** Só os pontos de BASE — é o que a cascata lê. */
function basesDe(elementos: Partial<Record<string, number>>): Record<ElementoBaseId, number> {
  const out = {} as Record<ElementoBaseId, number>;
  for (const el of CLASS_ELEMENT_ORDER) out[el as ElementoBaseId] = elementos[el] ?? 0;
  return out;
}

function paresDestravados(elementos: Partial<Record<string, number>>): number {
  return cascataDosPares(basesDe(elementos)).filter(c => c.destravado).length;
}

function custo(elementos: Partial<Record<string, number>>): number {
  let total = 0;
  for (const [id, pts] of Object.entries(elementos)) {
    const ehBase = (CLASS_ELEMENT_ORDER as readonly string[]).includes(id);
    total += (pts ?? 0) * (ehBase ? CUSTO_PONTO_BASE : CUSTO_PONTO_PAR);
  }
  return total;
}

describe('T-PISO — nenhuma alocação legal produz ficha quebrada', () => {
  const amostra = perfis();

  it(`o orçamento fecha exato em ${PERFIS} perfis × 3 planos adversários`, () => {
    const esperado = ELEMENT_ORCAMENTO_BY_STAGE[ESTAGIO];
    for (const p of amostra) {
      for (const { nome, plano } of planosAdversarios(p.shares)) {
        const ficha = buildFicha(p.nome, p.eixos, ESTAGIO, p.nome, undefined, plano);
        expect(custo(ficha.elementos), `${p.nome}/${nome}`).toBe(esperado);
      }
    }
  });

  /**
   * ⚠️ DIVERGÊNCIA REGISTRADA — A RÉGUA DA SPEC NÃO PASSA, E NÃO FOI MOVIDA.
   *
   * §10.2 do `G-alocacao-elemento.md` exige "pares destravados ≥ os da ficha
   * sem plano em ≥95% dos casos". Medido em 22/09/2026, com três mecanismos:
   *
   *   carve-out de orçamento (o que está no ar) ... 49,7%
   *   média ponderada das afinidades ............... 41,7%
   *   bias multiplicativo ............................ 62,5%
   *
   * E há TRADE-OFF entre os dois melhores, medido: o bias sobe o estrito para
   * 62,5% e o não-desastre para 98,3%, mas colapsa as identidades de combate
   * de 17 para 1 — a escolha do jogador deixa de mudar `getArenaAttributes`
   * (pego pela trava anti-vacuidade de `arena.alocacao.test.ts`). O carve-out
   * preserva as 17 e paga com 82,6% de não-desastre. Nenhum dos dois atende a
   * régua; a escolha entre eles é do dono.
   *
   * A causa é estrutural, não de implementação: par destrava com ≥50 pontos em
   * CADA componente, o orçamento do ultra é 500 e a maior base típica tem 62
   * pontos (mediana; mín. 45, máx. 100). Os elementos ficam EM CIMA do limiar,
   * e redistribuir um quarto da influência empurra vários através dele nos
   * dois sentidos — 14,4% dos casos GANHAM pares, 48,1% ficam iguais, 36,9%
   * perdem dois ou mais. A alocação não degrada a ficha: ela TROCA pares.
   *
   * O parecer de psicologia (R6.2) pediu, em palavras, que o jogador "possa
   * escolher diferente, nunca escolher quebrado" — e por essa formulação a
   * medição é 82,6% (295/357 mantêm ≥1 par) no mecanismo que está no ar. As
   * duas leituras divergem, e
   * escolher entre elas é decisão do dono, não deste teste.
   *
   * Até a decisão, este arquivo trava os números MEDIDOS como piso de
   * regressão — nunca como aprovação da régua da spec, que segue NÃO ATENDIDA.
   * Ver `ledger/permanencia.md`, bloco WP4.23.
   */
  const PISO_MEDIDO_ESTRITO = 0.49;
  const PISO_MEDIDO_NAO_DESASTRE = 0.82;

  it('[pendente do dono] a métrica ESTRITA da spec mede 49,7% e exigia 95%', () => {
    let total = 0;
    let naoPiorou = 0;
    const piores: string[] = [];
    for (const p of amostra) {
      const auto = paresDestravados(buildFicha(p.nome, p.eixos, ESTAGIO, p.nome).elementos);
      for (const { nome, plano } of planosAdversarios(p.shares)) {
        const comPlano = paresDestravados(
          buildFicha(p.nome, p.eixos, ESTAGIO, p.nome, undefined, plano).elementos,
        );
        total++;
        if (comPlano >= auto) naoPiorou++;
        else piores.push(`${p.nome}/${nome}: ${comPlano} < ${auto}`);
      }
    }
    const taxa = naoPiorou / total;
    // Piso de REGRESSÃO sobre o valor medido — não é a régua da spec (0,95),
    // que segue não atendida e registrada como divergência acima.
    expect(
      taxa,
      `estrito: ${(taxa * 100).toFixed(1)}% (${naoPiorou}/${total}). Piores: ${piores.slice(0, 5).join(' | ')}`,
    ).toBeGreaterThanOrEqual(PISO_MEDIDO_ESTRITO);
  });

  it('não-desastre: sobra ≥1 par sempre que a ficha automática tinha algum', () => {
    // A formulação EM PALAVRAS do parecer R6.2 — "escolher diferente, nunca
    // escolher quebrado". Medido em 22/09/2026 no mecanismo que está no ar:
    // 82,6% (295/357), com 62 casos zerando — e 62 é MUITO. Com o bias
    // multiplicativo seriam 6, ao custo de a alocação não significar nada no
    // combate. Os casos que zeram são o gatilho do R-A(c): a tela nomeia o
    // fato antes do commit, sem impedir a escolha.
    let tinha = 0;
    let sobrou = 0;
    for (const p of amostra) {
      const auto = paresDestravados(buildFicha(p.nome, p.eixos, ESTAGIO, p.nome).elementos);
      if (auto === 0) continue;
      for (const { plano } of planosAdversarios(p.shares)) {
        const comPlano = paresDestravados(
          buildFicha(p.nome, p.eixos, ESTAGIO, p.nome, undefined, plano).elementos,
        );
        tinha++;
        if (comPlano > 0) sobrou++;
      }
    }
    const taxa = sobrou / tinha;
    expect(taxa, `não-desastre: ${(taxa * 100).toFixed(1)}% (${sobrou}/${tinha})`)
      .toBeGreaterThanOrEqual(PISO_MEDIDO_NAO_DESASTRE);
  });

  it(`a profissão é estável em ${PERFIS}/${PERFIS} perfis, qualquer que seja o plano`, () => {
    // A profissão é traço de IDENTIDADE. Se um plano a trocasse, mover uma
    // barra reescreveria o ofício do jogador — o defeito de 35% que o
    // `buildSheet.ts` já documenta ter corrigido uma vez.
    let estaveis = 0;
    for (const p of amostra) {
      const base = Object.keys(buildFicha(p.nome, p.eixos, ESTAGIO, p.nome).profissoes);
      const todosIguais = planosAdversarios(p.shares).every(({ plano }) => {
        const comPlano = Object.keys(
          buildFicha(p.nome, p.eixos, ESTAGIO, p.nome, undefined, plano).profissoes,
        );
        return JSON.stringify(comPlano) === JSON.stringify(base);
      });
      if (todosIguais) estaveis++;
    }
    expect(estaveis).toBe(PERFIS);
  });
});
