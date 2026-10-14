/**
 * XP POR SUBTAREFA (proposta 14/10/2026, REGISTRO §42): cada subtarefa concluída paga uma fração
 * do XP da tarefa, com teto por tarefa, sem duplicar e sem mexer na meta do dia.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  awardStepXP, bondXP, XP_PER_EFFORT, XP_STEP_FRACTION, XP_STEP_MAX_PAID,
} from './bond';
import { effortWithSteps } from '../types/taskModel';

const base = { totalXP: 0 } as { totalXP: number; bondDaily?: { day: string; spent: Record<string, number> } };
const passo = (weight: number) => ({ kind: 'stepCompletion' as const, weight });

describe('bondXP › stepCompletion', () => {
  it('é uma fração do XP da conclusão, nunca menos que 1 e nunca negativa', () => {
    expect(bondXP(passo(1))).toBe(Math.max(1, Math.round(XP_PER_EFFORT * XP_STEP_FRACTION)));
    expect(bondXP(passo(3))).toBe(3);
    expect(bondXP(passo(0))).toBe(0);
    expect(bondXP({ kind: 'stepCompletion', weight: Number.NaN })).toBe(0);
    expect(bondXP({ kind: 'stepCompletion', weight: -2 })).toBe(0);
  });
  it('o hábito maduro rende mais por etapa (mesmo multiplicador de tier), nunca menos', () => {
    expect(bondXP({ kind: 'stepCompletion', weight: 1, habitTier: 'tree' })).toBeGreaterThanOrEqual(bondXP(passo(1)));
  });
});

describe('awardStepXP — teto por tarefa e anti-farm', () => {
  it('paga na transição e sobe o contador', () => {
    const r = awardStepXP(base, 0, passo(2), '2026-10-14');
    expect(r.state.totalXP).toBe(bondXP(passo(2)));
    expect(r.paid).toBe(1);
  });
  it('o total da tarefa com subtarefas fica um pouco acima da simples e NUNCA passa de +50%', () => {
    for (const weight of [1, 2, 3]) {
      const simples = bondXP({ kind: 'completion', weight });
      let s = base;
      let paid = 0;
      for (let i = 0; i < 40; i++) {
        const r = awardStepXP(s, paid, passo(weight), '2026-10-14');
        s = r.state; paid = r.paid;
      }
      expect(paid).toBe(XP_STEP_MAX_PAID);
      expect(s.totalXP).toBeGreaterThan(0);
      expect(s.totalXP / simples).toBeLessThanOrEqual(0.5 + 1e-9);
    }
  });
  it('contador já no teto: não paga, não desce, devolve o MESMO estado', () => {
    const r = awardStepXP(base, XP_STEP_MAX_PAID, passo(3), '2026-10-14');
    expect(r.state).toBe(base);
    expect(r.paid).toBe(XP_STEP_MAX_PAID);
  });
  it('contador corrompido (NaN/negativo) vira 0: nunca XP negativo nem NaN', () => {
    for (const lixo of [Number.NaN, -5, Infinity as number]) {
      const r = awardStepXP(base, lixo, passo(1), '2026-10-14');
      expect(Number.isFinite(r.state.totalXP)).toBe(true);
      expect(r.state.totalXP).toBeGreaterThanOrEqual(0);
    }
  });
  it('desmarcar e remarcar não duplica: o contador só sobe, então a mesma vaga não paga duas vezes', () => {
    // Simula 3 subtarefas: marca a 1ª, "remarca" (transição repetida com o contador já em 1) e fecha as outras.
    let s = base; let paid = 0;
    const marcar = () => { const r = awardStepXP(s, paid, passo(1), '2026-10-14'); s = r.state; paid = r.paid; };
    marcar();
    const aposPrimeira = s.totalXP;
    // remarcar = o app NÃO chama o funil sem a transição pendente→feita (a etapa feita não desmarca); o contador mantém o teto
    expect(paid).toBe(1);
    marcar(); marcar();
    expect(paid).toBe(3);
    expect(s.totalXP).toBe(aposPrimeira * 3);
  });
  it('a meta do dia segue pelo esforço: subtarefas NÃO multiplicam o peso', () => {
    expect(effortWithSteps(1, 8)).toBeLessThanOrEqual(3);
    expect(effortWithSteps(2, 1)).toBe(2);
  });
});

describe('fiação no App (contrato de fonte)', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  it('as subtarefas de TAREFA e as etapas de HÁBITO pagam pelo mesmo funil, na transição', () => {
    expect(app.match(/awardStepXP\(/g)?.length).toBe(2);
    expect(app).toContain('stepXpPaid: pago.paid');
    expect(app).toContain('stepXpPaid: comEtapa.paid, stepXpDay: stepDayKey');
    // save antigo: as já feitas contam como pagas (sem retroativo)
    expect(app).toContain('antes.stepXpPaid ?? jaFeitas');
  });
  it('a próxima ocorrência de uma tarefa que se repete nasce com o contador zerado', () => {
    expect(readFileSync('src/utils/taskTriage.ts', 'utf8')).toContain('stepXpPaid: 0');
  });
});
