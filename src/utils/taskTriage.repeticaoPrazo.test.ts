import { describe, expect, it } from 'vitest';
import { deadlineAt, nextOccurrence } from './taskTriage';

/** QA L02-04: a repetição legada herdava o prazo antigo e a ocorrência nascia vencida. */
describe('nextOccurrence — o prazo acompanha a repetição', () => {
  const agora = new Date(2026, 9, 20, 12, 0); // 20/out/2026
  const base = { id: 'task-1', completed: true, repeatEveryDays: 30 } as const;

  it('prazo igual ao dia da conclusão: a nova ocorrência vence no dia em que acorda, não antes', () => {
    const prox = nextOccurrence({ ...base, deadline: { date: '2026-10-20', time: '18:00' } } as never, agora) as { wakeOn: string; deadline: { date: string; time: string } };
    expect(prox.wakeOn).toBe('2026-11-19');
    expect(prox.deadline).toEqual({ date: '2026-11-19', time: '18:00' });
    expect(deadlineAt(prox as never)!.getTime()).toBeGreaterThan(new Date(2026, 10, 19, 0, 0).getTime());
  });

  it('prazo com folga (3 dias depois da conclusão): mantém a folga', () => {
    const prox = nextOccurrence({ ...base, deadline: { date: '2026-10-23', time: '09:00' } } as never, agora) as { deadline: { date: string } };
    expect(prox.deadline.date).toBe('2026-11-22');
  });

  it('prazo já vencido na conclusão: vira o dia em que acorda (nunca nasce vencida)', () => {
    const prox = nextOccurrence({ ...base, deadline: { date: '2026-10-01', time: '10:00' } } as never, agora) as { deadline: { date: string } };
    expect(prox.deadline.date).toBe('2026-11-19');
  });

  it('sem prazo: continua sem prazo', () => {
    const prox = nextOccurrence({ ...base } as never, agora) as { deadline?: unknown };
    expect(prox.deadline).toBeUndefined();
  });
});
