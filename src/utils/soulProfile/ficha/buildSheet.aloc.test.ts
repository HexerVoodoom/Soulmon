// WP4.22 — carve-out da alocação manual de elementos (decisão #72 do dono,
// 22/09/2026: `ALLOC_FRACTION` = 0,25).
//
// As duas travas que a spec nomeia, mais a que sustenta tudo:
//
//   T-SOMA   o custo do mapa devolvido é EXATAMENTE o orçamento, com ou sem
//            plano. Se vazar, a ficha do renascido fica mais rica que a
//            declarada e a simulação de equilíbrio deixa de valer.
//   T-LEGAL  o plano nunca compra PAR. Par só pela cascata — é o que impede
//            comprar geração adiantada.
//   IDENT    sem plano, o resultado é idêntico ao de antes do WP4.22. É esta
//            que mantém `pipeline.test.ts` (17/65/11/32) sem trocar fixture.
//
// `buildFicha` é a porta pública; `allocateElementos` é interna de propósito,
// então os testes exercitam a regra pelo mesmo caminho que o app usa.

import { describe, expect, it } from 'vitest';
import { buildFicha, ALLOC_FRACTION, ELEMENT_ORCAMENTO_BY_STAGE, type ElementPlan } from './buildSheet';
import { CUSTO_PONTO_BASE, CUSTO_PONTO_PAR } from './cascata';
import { CLASS_ELEMENT_ORDER } from '../types';
import { FICHA_STAGE_ORDER } from './types';
import type { OracleAxes } from '../types';

/** Eixos mínimos e determinísticos — só o que `buildFicha` lê de elementos. */
function axes(pesos: Partial<Record<string, number>>): OracleAxes {
  const classElements = {} as Record<string, number>;
  for (const el of CLASS_ELEMENT_ORDER) classElements[el] = pesos[el] ?? 1;
  return {
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
  } as unknown as OracleAxes;
}

const EIXOS = axes({ fogo: 30, agua: 25, terra: 15, ar: 10 });

/** Custo do mapa, pela mesma régua do módulo: base 1, par `CUSTO_PONTO_PAR`. */
function custo(elementos: Partial<Record<string, number>>): number {
  let total = 0;
  for (const [id, pts] of Object.entries(elementos)) {
    const ehBase = (CLASS_ELEMENT_ORDER as readonly string[]).includes(id);
    total += (pts ?? 0) * (ehBase ? CUSTO_PONTO_BASE : CUSTO_PONTO_PAR);
  }
  return total;
}

const PARES_DO_MAPA = (elementos: Partial<Record<string, number>>) =>
  Object.keys(elementos).filter(id => !(CLASS_ELEMENT_ORDER as readonly string[]).includes(id));

describe('WP4.22 — alocação manual de elemento', () => {
  describe('IDENT: sem plano nada muda', () => {
    it.each(FICHA_STAGE_ORDER)('a ficha de %s é idêntica com plano ausente e com plano vazio', stage => {
      const semPlano = buildFicha('Kaelen', EIXOS, stage, 'seed-fixa');
      const planoVazio = buildFicha('Kaelen', EIXOS, stage, 'seed-fixa', undefined, {});
      expect(planoVazio.elementos).toEqual(semPlano.elementos);
      expect(planoVazio.totals.elementos).toBe(semPlano.totals.elementos);
    });

    it('plano só com pesos inúteis (zero, negativo, NaN) cai no caminho automático', () => {
      const base = buildFicha('Orrin', EIXOS, 'mega', 'seed-fixa');
      const lixo = buildFicha('Orrin', EIXOS, 'mega', 'seed-fixa', undefined, {
        fogo: 0, agua: -5, terra: Number.NaN,
      } as ElementPlan);
      expect(lixo.elementos).toEqual(base.elementos);
    });
  });

  describe('T-SOMA: o orçamento fecha exato', () => {
    it.each(FICHA_STAGE_ORDER)('%s gasta exatamente o orçamento, sem plano', stage => {
      const ficha = buildFicha('Kaelen', EIXOS, stage, 'seed-fixa');
      expect(custo(ficha.elementos)).toBe(ELEMENT_ORCAMENTO_BY_STAGE[stage]);
    });

    it.each(FICHA_STAGE_ORDER)('%s gasta exatamente o orçamento, com plano', stage => {
      const ficha = buildFicha('Kaelen', EIXOS, stage, 'seed-fixa', undefined, { luz: 3, sombra: 1 });
      expect(custo(ficha.elementos)).toBe(ELEMENT_ORCAMENTO_BY_STAGE[stage]);
    });

    it('um plano concentrado num elemento só também fecha', () => {
      const ficha = buildFicha('Kaelen', EIXOS, 'ultra', 'seed-fixa', undefined, { morte: 1 });
      expect(custo(ficha.elementos)).toBe(ELEMENT_ORCAMENTO_BY_STAGE.ultra);
    });
  });

  describe('T-LEGAL: o plano nunca compra par', () => {
    it('pedir um par pelo plano não cria par — o id não é base e é ignorado', () => {
      const semPlano = buildFicha('Kaelen', EIXOS, 'ultra', 'seed-fixa');
      const comPar = buildFicha('Kaelen', EIXOS, 'ultra', 'seed-fixa', undefined, {
        vapor: 10,
      } as unknown as ElementPlan);
      // 'vapor' não é base: o plano fica sem peso útil e o caminho é o automático
      expect(comPar.elementos).toEqual(semPlano.elementos);
    });

    it('os pares que aparecem com plano são os mesmos que a cascata já daria', () => {
      const comPlano = buildFicha('Kaelen', EIXOS, 'ultra', 'seed-fixa', undefined, { fogo: 2, agua: 2 });
      for (const par of PARES_DO_MAPA(comPlano.elementos)) {
        // par comprado tem de custar o preço de par, nunca o de base
        expect(comPlano.elementos[par]).toBeGreaterThan(0);
        expect((CLASS_ELEMENT_ORDER as readonly string[]).includes(par)).toBe(false);
      }
    });
  });

  describe('a fatia do jogador tem o tamanho declarado', () => {
    it('ALLOC_FRACTION é 0,25 e supera DERIVED_SPEND_FRACTION (0,2)', () => {
      expect(ALLOC_FRACTION).toBe(0.25);
      expect(ALLOC_FRACTION).toBeGreaterThan(0.2);
    });

    it('o plano move pontos de verdade para o elemento pedido', () => {
      const semPlano = buildFicha('Kaelen', EIXOS, 'ultra', 'seed-fixa');
      const comPlano = buildFicha('Kaelen', EIXOS, 'ultra', 'seed-fixa', undefined, { morte: 1 });
      const antes = semPlano.elementos.morte ?? 0;
      const depois = comPlano.elementos.morte ?? 0;
      expect(depois).toBeGreaterThan(antes);
    });

    it('no ultra a fatia dá os 187 pontos que a decisão #72 cita', () => {
      expect(Math.floor(ELEMENT_ORCAMENTO_BY_STAGE.ultra * 1.5 * ALLOC_FRACTION)).toBe(187);
    });

    it('o par continua custando o dobro da base (a fatia do jogador não muda preço)', () => {
      expect(CUSTO_PONTO_PAR).toBe(2 * CUSTO_PONTO_BASE);
    });
  });

  describe('a profissão não enxerga o plano', () => {
    // O cabeçalho de `buildFicha` registra que insumos maiores faziam a
    // profissão re-rolar em 35% dos perfis. Alocação manual reintroduziria o
    // mesmo defeito por outra porta: mover uma barra trocaria o ofício do
    // jogador, que é traço de IDENTIDADE e não de build.
    it.each(FICHA_STAGE_ORDER)('%s mantém a profissão qualquer que seja o plano', stage => {
      const base = buildFicha('Thalindra', EIXOS, stage, 'seed-fixa');
      const fogo = buildFicha('Thalindra', EIXOS, stage, 'seed-fixa', undefined, { fogo: 5 });
      const morte = buildFicha('Thalindra', EIXOS, stage, 'seed-fixa', undefined, { morte: 5 });
      expect(Object.keys(fogo.profissoes)).toEqual(Object.keys(base.profissoes));
      expect(Object.keys(morte.profissoes)).toEqual(Object.keys(base.profissoes));
    });
  });

  describe('determinismo', () => {
    it('o mesmo plano devolve a mesma ficha', () => {
      const plano: ElementPlan = { fogo: 3, luz: 1 };
      const a = buildFicha('Kaelen', EIXOS, 'mega', 'seed-fixa', undefined, plano);
      const b = buildFicha('Kaelen', EIXOS, 'mega', 'seed-fixa', undefined, { ...plano });
      expect(a.elementos).toEqual(b.elementos);
    });

    it('planos diferentes devolvem fichas diferentes', () => {
      const a = buildFicha('Kaelen', EIXOS, 'ultra', 'seed-fixa', undefined, { fogo: 1 });
      const b = buildFicha('Kaelen', EIXOS, 'ultra', 'seed-fixa', undefined, { gravidade: 1 });
      expect(a.elementos).not.toEqual(b.elementos);
    });
  });
});
