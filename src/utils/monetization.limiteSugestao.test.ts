import { describe, it, expect } from 'vitest';
import { habitCreateDecision, canCreateActivity, DEMO_ACTIVITY_TOTAL_CAP } from './monetization';

/**
 * LIMITE DE HÁBITOS COMO SUGESTÃO (dono, 24/11/2026, opção A): só o demo tem teto duro; o pagante é PERGUNTADO ao passar do
 * número do estágio; tarefa nunca é limitada.
 */
describe('habitCreateDecision', () => {
  const stageCap = 8;
  it('demo bloqueia no teto duro (min(estágio, total do demo))', () => {
    expect(habitCreateDecision({ tier: 'demo', kind: 'habit', habitCount: DEMO_ACTIVITY_TOTAL_CAP - 1, stageCap })).toBe('ok');
    expect(habitCreateDecision({ tier: 'demo', kind: 'habit', habitCount: DEMO_ACTIVITY_TOTAL_CAP, stageCap })).toBe('bloqueado-demo');
    expect(canCreateActivity({ tier: 'demo', kind: 'habit', habitCount: DEMO_ACTIVITY_TOTAL_CAP, stageCap })).toBe(false);
  });
  it('pago dentro do número: ok', () => {
    expect(habitCreateDecision({ tier: 'paid', kind: 'habit', habitCount: stageCap - 1, stageCap })).toBe('ok');
  });
  it('pago acima do número: pergunta (recomendado-excedido) e o portão NÃO recusa', () => {
    expect(habitCreateDecision({ tier: 'paid', kind: 'habit', habitCount: stageCap, stageCap })).toBe('recomendado-excedido');
    expect(habitCreateDecision({ tier: 'paid', kind: 'habit', habitCount: stageCap - 1, stageCap, adding: 3 })).toBe('recomendado-excedido');
    expect(canCreateActivity({ tier: 'paid', kind: 'habit', habitCount: 99, stageCap })).toBe(true);
  });
  it('tarefa nunca é limitada, em nenhum tier', () => {
    for (const tier of ['demo', 'paid'] as const) {
      expect(habitCreateDecision({ tier, kind: 'task', habitCount: 99, stageCap })).toBe('ok');
      expect(canCreateActivity({ tier, kind: 'task', habitCount: 99, stageCap })).toBe(true);
    }
  });
});
