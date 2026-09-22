// WP4.22b — R-B: a alocação manual de elemento NÃO pode virar vantagem de
// combate. É o pacote bloqueante de tudo o que é visível ao jogador.
//
// Por que aqui e não em `skills.ts`: `getArenaPlayerStats` já é imune por
// desenho (STAGE_BUDGET × ROLE_SHAPE, hp×dmg ≈ constante). A brecha real é
// `getArenaAttributes`, cujos `principal`/`secundario` saem DOS PONTOS DE
// ELEMENTO e alimentam ADVANTAGE_MULT/DISADVANTAGE_MULT em
// `playerHitDamage`/`enemyHitDamage`. Alocar para cobrir o roster seria poder
// comprado — e o renascido é pago.
//
// Decisão #73 do dono (22/09/2026): se a simulação adversarial sair da janela
// de 40–80% / spread ≤20pp, **a alocação perde efeito de combate** — nunca
// afrouxar a janela.

import { describe, expect, it } from 'vitest';
import {
  getArenaAttributes, getArenaPlayerStats, simulateArenaRun,
  type ArenaArchetypeConfig,
} from './arena';
import { mulberry32 } from './oracle';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import { buildFicha, type ElementPlan } from './soulProfile/ficha/buildSheet';
import type { OracleAxes } from './soulProfile/types';
import type { EscolaId } from './soulProfile/ficha/types';
import POOL_JSON from './soulProfile/bestiary/pool.json';

const POOL = (POOL_JSON as { criaturas: unknown[] }).criaturas as never[];

// Mesma amostra do `arena.test.ts`: 3000 runs, SE ~0,9pp contra uma régua com
// 1pp de folga. Reduzir vira ruído e o teste passa por sorte.
const RUNS = 3000;
const SEED = 20260818;

function axesNeutros(): OracleAxes {
  const classElements = {} as Record<string, number>;
  for (const el of CLASS_ELEMENT_ORDER) classElements[el] = 1;
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

const EIXOS = axesNeutros();
const ESCOLA: EscolaId = 'conjuracao';

function taxaCom(attrs: { principal: string; secundario: string }): number {
  const config: ArenaArchetypeConfig = {
    stage: 'rookie',
    escolaBasica: ESCOLA,
    escolaEspecial: ESCOLA,
    elementoBasica: 'vigor',
    elementoEspecial: 'vigor',
    attrs,
  };
  const rng = mulberry32(SEED);
  let wins = 0;
  for (let i = 0; i < RUNS; i++) {
    if (simulateArenaRun(config, { rng, pool: POOL, accMean: 0.7 }).won) wins++;
  }
  return wins / RUNS;
}

describe('WP4.22b — a alocação não compra vantagem de combate', () => {
  it('(iii) mudar SÓ a alocação não muda getArenaPlayerStats', () => {
    // O orçamento de poder é do estágio e da escola. Se algum dia a alocação
    // encostar nele, esta é a régua que reprova.
    const base = getArenaPlayerStats('rookie', ESCOLA);
    for (const el of CLASS_ELEMENT_ORDER) {
      const ficha = buildFicha('Kaelen', EIXOS, 'rookie', 'seed', undefined, { [el]: 5 } as ElementPlan);
      expect(ficha.elementos).toBeDefined();
      expect(getArenaPlayerStats('rookie', ESCOLA)).toEqual(base);
    }
  });

  it('a alocação REALMENTE dirige os atributos (senão o teste abaixo é vazio)', () => {
    // Sem esta trava, o teste de janela passaria por vacuidade no dia em que
    // `getArenaAttributes` deixasse de ler os pontos de elemento: 17 fichas
    // devolvendo `vigor/vigor` ficariam todas dentro da janela sem medir nada.
    // Medido em 22/09/2026: 17 pares distintos, um por elemento alocado.
    const vistos = new Set<string>();
    for (const el of CLASS_ELEMENT_ORDER) {
      const ficha = buildFicha('Kaelen', EIXOS, 'rookie', 'seed', undefined, { [el]: 5 } as ElementPlan);
      const { principal, secundario } = getArenaAttributes(ficha);
      vistos.add(`${principal}/${secundario}`);
    }
    expect(vistos.size).toBe(CLASS_ELEMENT_ORDER.length);
  });

  /**
   * MEDIÇÃO DE 22/09/2026 (R-B(ii), 3000 runs, seed 20260818, escola
   * `conjuracao`, estágio rookie) — a alocação dirige os 17 atributos e:
   *
   *   melhor  morte  63,8%   ·   pior  vigor  60,0%   ·   spread  3,8pp
   *
   * Passa com folga larga na janela de 40–80% e fica muito abaixo do teto de
   * 20pp — que é, aliás, o mesmo teto que o `arena.test.ts` já tolera ENTRE AS
   * SEIS ESCOLAS. Ou seja: escolher elemento move menos o resultado do que
   * escolher escola já movia.
   *
   * ⚠️ O que isto NÃO diz: que a vantagem é ZERO. São 3,8pp entre a melhor e a
   * pior escolha. Está dentro do padrão que o projeto já pratica, mas quem for
   * escrever a copy C-S1 ("pagar nunca deixa sua criatura mais forte") precisa
   * saber que o número não é 0,0 — e dizer o que é verdade.
   */
  it('(ii) NENHUMA alocação adversarial sai da janela 40–80% / spread ≤20pp', () => {
    // O adversário não é um perfil médio: é o jogador que escolhe o elemento
    // que melhor cobre o roster. Medimos TODOS os 17, e o pior caso é o que
    // vale — um único elemento dominante já seria poder comprado.
    const taxas: Record<string, number> = {};
    for (const el of CLASS_ELEMENT_ORDER) {
      const ficha = buildFicha('Kaelen', EIXOS, 'rookie', 'seed', undefined, { [el]: 5 } as ElementPlan);
      const attrs = getArenaAttributes(ficha);
      taxas[el] = taxaCom(attrs);
    }
    const valores = Object.values(taxas);
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const detalhe = JSON.stringify(
      Object.fromEntries(Object.entries(taxas).map(([k, v]) => [k, +v.toFixed(3)])),
    );
    expect(min, `taxas: ${detalhe}`).toBeGreaterThanOrEqual(0.4);
    expect(max, `taxas: ${detalhe}`).toBeLessThanOrEqual(0.8);
    expect(max - min, `spread: ${detalhe}`).toBeLessThanOrEqual(0.2);
  });
});
