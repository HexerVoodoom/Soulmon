import { describe, it, expect } from 'vitest';
import {
  parseChatAction, parseChatActions, describeAction, renameAction, buildHabit, buildTask, MAX_CHAT_ACTIONS,
  type CreateHabitAction, type CreateTaskAction,
} from './chatActions';
import { weekDaysForSchedule } from '../types/taskModel';
import { buildBehaviorSummary, FEEDBACK_ASK } from './chatBehavior';
import { emptyRhythm, dayKeyOf } from './habitRhythm';

const habito: CreateHabitAction = {
  type: 'create_habit',
  habit: { name: 'Beber água', category: 'Health', schedule: { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] }, time: '09:00' },
};
const tarefa: CreateTaskAction = { type: 'create_task', task: { name: 'Ligar pro médico', category: 'Health', effort: 1 } };

describe('parseChatAction: a última trava antes do save', () => {
  it('aceita ações bem formadas e ignora campo extra', () => {
    expect(parseChatAction(habito)).toEqual(habito);
    expect(parseChatAction({ ...tarefa, tier: 'paid', task: { ...tarefa.task, credits: 9 } })).toEqual(tarefa);
  });

  it('rejeita tipo desconhecido, forma errada e injetada', () => {
    for (const x of [
      { type: 'set_tier', tier: 'paid' }, { type: 'delete_save' }, { type: 'create_habit' },
      { type: 'create_habit', habit: { name: 'x', category: 'Health', schedule: { kind: 'weekdays', days: [8] } } },
      { type: 'create_habit', habit: { name: 'x', category: 'Health', schedule: { kind: 'timesPerWeek', target: 30 } } },
      { type: 'create_task', task: { name: '', category: 'Work' } },
      undefined, 3, 'create_habit',
    ]) expect(parseChatAction(x)).toBeNull();
  });

  it('nome é limpo e cortado em 60', () => {
    const a = parseChatAction({ ...tarefa, task: { ...tarefa.task, name: `  <b>${'x'.repeat(200)}</b>\n` } }) as CreateTaskAction;
    expect(a.task.name.length).toBeLessThanOrEqual(60);
    expect(a.task.name).not.toMatch(/[<>\n]/);
  });

  it('lista: no máximo MAX_CHAT_ACTIONS (500 hábitos viram 2 cartões)', () => {
    const muitas = Array.from({ length: 500 }, (_, i) => ({ ...habito, habit: { ...habito.habit, name: `H${i}` } }));
    expect(parseChatActions(muitas)).toHaveLength(MAX_CHAT_ACTIONS);
    expect(parseChatActions('x')).toEqual([]);
  });
});

describe('cartão e construção', () => {
  it('descreve em PT e EN', () => {
    expect(describeAction(habito, true)).toBe('Criar hábito “Beber água” — todo dia às 09:00?');
    expect(describeAction(habito, false)).toBe('Create habit “Beber água” — every day at 09:00?');
    expect(describeAction(tarefa, true)).toBe('Criar tarefa “Ligar pro médico”?');
  });

  it('Editar renomeia e revalida', () => {
    expect((renameAction(habito, 'Tomar água') as CreateHabitAction).habit.name).toBe('Tomar água');
    expect(renameAction(habito, '   ')).toBeNull();
  });

  it('hábito nasce com weekDays E schedule juntos, e alarme do horário', () => {
    const h = buildHabit(habito, '❤️', weekDaysForSchedule, 'id1');
    expect(h).toMatchObject({ id: 'id1', name: 'Beber água', weekDays: [0, 1, 2, 3, 4, 5, 6], schedule: habito.habit.schedule, alarm: { time: '09:00' } });
    const semana = buildHabit({ ...habito, habit: { ...habito.habit, schedule: { kind: 'timesPerWeek', target: 3 }, time: undefined } }, '❤️', weekDaysForSchedule);
    expect(semana.alarm).toBeUndefined();
  });

  it('tarefa nasce aberta, com esforço e idade', () => {
    const t = buildTask(tarefa, '❤️', new Date('2026-10-11T10:00:00Z'), 't1');
    expect(t).toMatchObject({ id: 't1', completed: false, status: 'open', effort: 1, createdAt: '2026-10-11T10:00:00.000Z' });
  });
});

describe('resumo de comportamento: só números e categorias fixas', () => {
  const now = new Date(2026, 9, 11, 15, 0, 0);
  const estado = {
    activities: [
      { id: 'a1', name: 'SEGREDO-NOME-HABITO', category: 'Health', emoji: 'x', steps: [], weekDays: [0, 1, 2, 3, 4, 5, 6], completedToday: true },
      { id: 'a2', name: 'outro', category: 'Study', emoji: 'x', steps: [], weekDays: [0, 1, 2, 3, 4, 5, 6] },
    ],
    tasks: [{ id: 't', name: 'SEGREDO-NOME-TAREFA', category: 'Work', emoji: 'x', completed: false }],
    completedTasks: [{ id: 'c', name: 'SEGREDO-TAREFA-FEITA', category: 'Work', emoji: 'x', completedAt: new Date(2026, 9, 10, 9).toISOString() }],
    habitRhythms: { a1: { ...emptyRhythm(), done: [dayKeyOf(new Date(2026, 9, 10))] } },
    activityLog: [new Date(2026, 9, 10, 8).toISOString(), new Date(2026, 9, 11, 14).toISOString()],
    moodLog: [{ date: '2026-10-10', mood: 4 as const }],
  };

  it('nenhum texto livre sai: nem nome de hábito, nem de tarefa', () => {
    const s = buildBehaviorSummary(estado as never, now);
    expect(JSON.stringify(s)).not.toContain('SEGREDO');
    expect(s).toMatchObject({ habitsTotal: 2, habitsDoneToday: 1, tasksDone: 1, tasksOpen: 1, activeDays: 2, moodDays: 1, moodAvg: 3 });
    expect(s.byPart).toMatchObject({ morning: 1, afternoon: 1 });
    // todo valor é número inteiro ou mapa de inteiros
    const ok = (v: unknown): boolean => typeof v === 'number' ? Number.isInteger(v) : !!v && typeof v === 'object' && Object.values(v).every(ok);
    expect(Object.values(s).every(ok)).toBe(true);
  });

  it('só dispara com pergunta de progresso', () => {
    for (const q of ['como estou indo?', 'how am I doing', 'me dá um feedback', 'minha semana foi boa?']) expect(FEEDBACK_ASK.test(q)).toBe(true);
    for (const q of ['oi', 'cria um hábito', 'o que é constância?']) expect(FEEDBACK_ASK.test(q)).toBe(false);
  });
});
