import { describe, it, expect } from 'vitest';
import { fitHabitCreates, habitOverRecommended, type HabitCapState } from './habitCreate';
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

  it('pagante acima do número do estágio: NÃO é truncado (24/11/2026, o número é só sugestão)', () => {
    const cap = activityCapFor('paid', 6);
    const cheio = estado(cap, 6);

    const a = commit(cheio, ['nova-a'], 'paid');
    const b = commit(a, ['nova-b', 'nova-c'], 'paid');

    expect(a.activities.length).toBe(cap + 1);
    expect(b.activities.length).toBe(cap + 3);
    expect(fitHabitCreates(cheio, ['x', 'y', 'z'], 'paid')).toEqual(['x', 'y', 'z']);
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

describe('habitOverRecommended — a sugestão do estágio (só pagante)', () => {
  it('pagante dentro do número: não pergunta', () => {
    expect(habitOverRecommended(estado(4, 6), ['a'], 'paid')).toBeNull();
    expect(habitOverRecommended(estado(5, 6), ['a'], 'paid')).toBeNull(); // o 6º ainda cabe
  });
  it('pagante passando do número: pergunta com X = o do estágio', () => {
    expect(habitOverRecommended(estado(6, 6), ['a'], 'paid')).toEqual({ recommended: 6 });
    expect(habitOverRecommended(estado(4, 6), ['a', 'b', 'c'], 'paid')).toEqual({ recommended: 6 }); // lote: UMA pergunta
  });
  it('demo nunca pergunta (teto duro, tratado por fitHabitCreates)', () => {
    expect(habitOverRecommended(estado(6, 6), ['a'], 'demo')).toBeNull();
  });
  it('tarefa agendada (dias específicos) não gasta cota: não pergunta', () => {
    const agendada = { id: 't', schedule: { kind: 'weekdays', days: [1, 3] }, weekDays: [1, 3] };
    expect(habitOverRecommended(estado(6, 6), [agendada], 'paid')).toBeNull();
  });
});

describe('cota do modo grátis — só hábito diário conta (dono, 14/10/2026)', () => {
  const diario = { schedule: { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] } };
  const agendada = { schedule: { kind: 'weekdays', days: [1, 3] } };

  it('tarefa agendada existente não ocupa vaga', () => {
    const cap = activityCapFor('demo', 20);
    const s: HabitCapState = {
      activities: [...Array.from({ length: cap - 1 }, () => diario), agendada, agendada, agendada],
      maxActivityCap: 20,
    };
    expect(fitHabitCreates(s, [diario, diario], 'demo')).toEqual([diario]);
  });

  it('tarefa agendada nova entra com a cota cheia; o lote para no primeiro hábito que não cabe', () => {
    const cap = activityCapFor('demo', 20);
    const s: HabitCapState = { activities: Array.from({ length: cap }, () => diario), maxActivityCap: 20 };
    expect(fitHabitCreates(s, [agendada, diario, agendada], 'demo')).toEqual([agendada]);
  });
});
