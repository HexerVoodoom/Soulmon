/**
 * SIMULAÇÃO DE 30 DIAS (plano do onboarding velado §11: "antes de ligar a recompensa"):
 * os pontos de tipo da missão da Guilda dos Mercenários dominam os das tarefas normais?
 * Tarefas normais = 1 comida por tarefa (`feedFood`: `CATEGORY_ATTRIBUTES` da categoria, 4 pontos por comida).
 */
import { describe, it, expect } from 'vitest';
import { CATEGORY_ATTRIBUTES, type ActivityCategory, type BranchType } from '../types/attributes';
import { MERC_ORDENS, MERC_TIPO, sortearMerc, pontosMerc, type MercOrdem } from './mercMission';

const CATS = Object.keys(CATEGORY_ATTRIBUTES) as ActivityCategory[];
const TIPOS: BranchType[] = ['power', 'harmony', 'benevolence'];
const DIAS = 30;

function rng(seed: number) { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32; }

function simular(tarefasPorDia: number, ordemFixa: MercOrdem | null, seed: number) {
  const r = rng(seed);
  const normal = { power: 0, harmony: 0, benevolence: 0 };
  const merc = { power: 0, harmony: 0, benevolence: 0 };
  for (let d = 0; d < DIAS; d++) {
    for (let t = 0; t < tarefasPorDia; t++) {
      const a = CATEGORY_ATTRIBUTES[CATS[Math.floor(r() * CATS.length)]];
      normal.power += a.power; normal.harmony += a.harmony; normal.benevolence += a.benevolence;
    }
    const ordem = ordemFixa ?? MERC_ORDENS[Math.floor(r() * 3)];
    const item = sortearMerc(`dia-${d}`, ordem)!;
    merc[MERC_TIPO[ordem]] += pontosMerc(item);
  }
  return { normal, merc };
}

describe('missão da Guilda dos Mercenários x tarefas normais, 30 dias', () => {
  const linhas: string[] = [];
  for (const tarefas of [2, 4, 6]) {
    for (const [nome, fixa] of [['Ordem rotativa', null], ['sempre Rompentes (pior caso)', 'rompente' as MercOrdem]] as const) {
      it(`${tarefas} tarefas/dia, ${nome}`, () => {
        const { normal, merc } = simular(tarefas, fixa, 7 + tarefas);
        const totN = TIPOS.reduce((s, k) => s + normal[k], 0);
        const totM = TIPOS.reduce((s, k) => s + merc[k], 0);
        const pctTotal = (100 * totM) / (totN + totM);
        const pior = Math.max(...TIPOS.map(k => (100 * merc[k]) / (normal[k] + merc[k])));
        linhas.push(`${tarefas} tarefas/dia, ${nome}: normais ${totN} pts, missão ${totM} pts (${pctTotal.toFixed(1)}% do total); pior tipo: ${pior.toFixed(1)}% vem da missão`);
        // A missão nunca passa de ~1/3 do que o jogador ganha, mesmo concentrada num tipo só.
        expect(pctTotal).toBeLessThan(35);
        // Achado: concentrado num tipo só, a missão chega perto de metade dele; o teto abaixo é o limite aceito (ver plano §11).
        if (tarefas >= 4) expect(pior).toBeLessThan(60);
      });
    }
  }
  it('imprime o resultado', () => { console.log('\n' + linhas.join('\n')); expect(linhas.length).toBeGreaterThan(0); });
});
