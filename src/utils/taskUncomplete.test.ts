import { describe, it, expect } from 'vitest';
import { uncompleteTask, uncompleteBlock, type TaskCompletionReceipt, type UncompleteState } from './taskUncomplete';
import { playerDayKey } from './playerDay';

const AGORA = new Date(2026, 10, 4, 10, 0, 0);
const DIA = playerDayKey(AGORA, undefined);
const AT = AGORA.toISOString();
const MACA = 'apple';
const MACA_P = 'apple★';

function estado(over: Partial<TaskCompletionReceipt> = {}, s: Partial<UncompleteState> = {}): UncompleteState & { extra: number } {
  const receipt: TaskCompletionReceipt = {
    food: { [MACA]: 2 }, xp: 10, day: DIA, mission: 'haunted-done', week: 'W1', nextId: 'r~1',
    task: { id: 't1', completed: true, steps: [{ id: 'a', label: 'a', completed: true }, { id: 'b', label: 'b', completed: true }] },
    ...over,
  };
  return {
    extra: 7,
    tasks: [{ id: 'r~1' }, { id: 'outra' }],
    completedTasks: [{ id: 't1', name: 'X', category: 'Health', completedAt: AT, receipt }],
    foodInventory: { [MACA]: 3 },
    activityStats: { 'task-X-Health': { completionCount: 4 } },
    totalXP: 100,
    weeklyMissions: { week: 'W1', counts: { 'haunted-done': 2 }, claimed: [] },
    ...s,
  };
}

describe('desmarcar tarefa concluída: estorno', () => {
  it('estorna comida, XP, missão, estatística e devolve a tarefa', () => {
    const n = uncompleteTask(estado(), 't1', AT, AGORA);
    expect(n.foodInventory[MACA]).toBe(1);
    expect(n.totalXP).toBe(90);
    expect(n.weeklyMissions!.counts['haunted-done']).toBe(1);
    expect(n.activityStats['task-X-Health'].completionCount).toBe(3);
    expect(n.completedTasks).toHaveLength(0);
    expect(n.tasks.map(t => t.id)).toEqual(['t1', 'outra']); // a próxima ocorrência sai
    const t = n.tasks[0] as TaskCompletionReceipt['task'];
    expect(t.completed).toBe(false);
    expect(t.steps!.map(x => x.completed)).toEqual([true, false]);
    expect(n.extra).toBe(7);
  });

  it('estorna a premium e o teto dela', () => {
    const s = estado({ premium: MACA_P, premiumDay: '2026-11-04', premiumWeek: '2026-11-02' }, {
      foodInventory: { [MACA]: 2, [MACA_P]: 1 },
      premiumFood: { day: '2026-11-04', dropped: 1, used: 0, week: '2026-11-02', weekDropped: 2 },
    });
    const n = uncompleteTask(s, 't1', AT, AGORA);
    expect(n.foodInventory[MACA_P]).toBe(0);
    expect(n.premiumFood).toMatchObject({ dropped: 0, weekDropped: 1 });
  });
});

describe('desmarcar: bloqueios', () => {
  it('comida já usada → bloqueia e não muda nada', () => {
    const s = estado({}, { foodInventory: { [MACA]: 1 } });
    expect(uncompleteBlock(s, 't1', AT, AGORA)).toBe('used');
    expect(uncompleteTask(s, 't1', AT, AGORA)).toBe(s);
  });
  it('premium já usada → bloqueia', () => {
    expect(uncompleteBlock(estado({ premium: MACA_P }, { foodInventory: { [MACA]: 5 } }), 't1', AT, AGORA)).toBe('used');
  });
  it('missão já resgatada → bloqueia', () => {
    const s = estado({}, { weeklyMissions: { week: 'W1', counts: { 'haunted-done': 3 }, claimed: ['haunted-done'] } });
    expect(uncompleteBlock(s, 't1', AT, AGORA)).toBe('claimed');
  });
  it('outro dia → bloqueia', () => {
    expect(uncompleteBlock(estado({ day: '2000-01-01' }), 't1', AT, AGORA)).toBe('old');
  });
  it('entrada antiga sem recibo → bloqueia', () => {
    const s = estado();
    s.completedTasks[0] = { ...s.completedTasks[0], receipt: undefined };
    expect(uncompleteBlock(s, 't1', AT, AGORA)).toBe('legacy');
  });
});

describe('sem farm', () => {
  it('desmarcar duas vezes estorna uma vez só', () => {
    const a = uncompleteTask(estado(), 't1', AT, AGORA);
    expect(uncompleteTask(a, 't1', AT, AGORA)).toBe(a);
  });
  it('marcar → desmarcar (5×) → marcar rende o mesmo que marcar uma vez', () => {
    // Conclusão simulada: o que o recibo registra (+2 comida, +10 XP, +1 missão).
    const conclui = (st: UncompleteState, at: string): UncompleteState => ({
      ...st,
      tasks: st.tasks.filter(t => t.id !== 't1').concat({ id: 'r~1' }),
      foodInventory: { ...st.foodInventory, [MACA]: (st.foodInventory[MACA] ?? 0) + 2 },
      totalXP: (st.totalXP ?? 0) + 10,
      weeklyMissions: { ...st.weeklyMissions!, counts: { 'haunted-done': (st.weeklyMissions!.counts['haunted-done'] ?? 0) + 1 } },
      completedTasks: [...st.completedTasks, { id: 't1', name: 'X', category: 'Health', completedAt: at,
        receipt: { food: { [MACA]: 2 }, xp: 10, day: DIA, mission: 'haunted-done', week: 'W1', nextId: 'r~1', task: { id: 't1' } } }],
    });
    const zero: UncompleteState = { tasks: [{ id: 't1' }], completedTasks: [], foodInventory: {}, activityStats: {}, totalXP: 0, weeklyMissions: { week: 'W1', counts: {}, claimed: [] } };
    const uma = conclui(zero, AT);
    let ciclo = zero;
    for (let i = 0; i < 5; i++) ciclo = uncompleteTask(conclui(ciclo, `${AT}#${i}`), 't1', `${AT}#${i}`, AGORA);
    ciclo = conclui(ciclo, AT);
    expect(ciclo.foodInventory).toEqual(uma.foodInventory);
    expect(ciclo.totalXP).toBe(uma.totalXP);
    expect(ciclo.weeklyMissions).toEqual(uma.weeklyMissions);
    expect(ciclo.tasks).toEqual(uma.tasks);
  });
});
