import { describe, it, expect } from 'vitest';
import { fitHabitCreates, type HabitCapState } from './habitCreate';
import { activityCapFor } from './monetization';

/**
 * O DOIS-TOQUES da criação de hábito (X-6, instância 3).
 *
 * A aplicação encadeada aqui é o portão rodando duas vezes sobre o estado que
 * ele mesmo produziu — que é o que acontece quando o updater decide sobre o
 * `prev` em vez de sobre a leitura de fora. Sem isso, duas criações no mesmo
 * lote leem a mesma contagem e a lista termina acima de `activityCapFor`.
 */

const estado = (n: number, stageCap = 20): HabitCapState => ({
  activities: Array.from({ length: n }, (_, i) => `h${i}`),
  maxActivityCap: stageCap,
});

/** O portão aplicado ao estado: o que coube já dentro da lista. */
const commit = (s: HabitCapState, novos: string[], tier: 'demo' | 'paid'): HabitCapState => ({
  ...s,
  activities: [...s.activities, ...fitHabitCreates(s, novos, tier)],
});

describe('fitHabitCreates — o teto é reconferido sobre o estado recebido', () => {
  it('demo no limite: duas criações encadeadas não furam activityCapFor', () => {
    const cap = activityCapFor('demo', 20);
    const cheio = estado(cap - 1);

    const a = commit(cheio, ['nova-a'], 'demo');
    const b = commit(a, ['nova-b'], 'demo');

    expect(a.activities.length).toBe(cap);
    expect(b.activities.length).toBe(cap);
    expect(fitHabitCreates(b, ['nova-c'], 'demo')).toEqual([]);
  });

  it('pagante no teto do estágio: mesma trava, número diferente', () => {
    const cap = activityCapFor('paid', 6);
    const cheio = estado(cap - 1, 6);

    const a = commit(cheio, ['nova-a'], 'paid');
    const b = commit(a, ['nova-b'], 'paid');

    expect(a.activities.length).toBe(cap);
    expect(b.activities.length).toBe(cap);
  });

  it('lote do tutorial: corta no teto e devolve só o prefixo que cabe', () => {
    const cap = activityCapFor('demo', 20);
    const cabem = fitHabitCreates(estado(cap - 1), ['a', 'b', 'c'], 'demo');
    expect(cabem).toEqual(['a']);
  });

  it('caminho feliz: com folga, o lote inteiro passa — nenhum teto mudou', () => {
    expect(fitHabitCreates(estado(0, 20), ['a', 'b', 'c'], 'paid')).toEqual(['a', 'b', 'c']);
  });
});
