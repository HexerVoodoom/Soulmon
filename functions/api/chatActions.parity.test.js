import { describe, it, expect } from 'vitest';
import { validateToolCall } from './_chatActions.js';
import { parseChatAction } from '../../src/utils/chatActions';

/**
 * Servidor e cliente validam a MESMA ação. O servidor é a 1ª trava, o cliente a
 * última; se divergirem, ou o cartão nasce quebrado (cliente recusa o que o
 * servidor aceitou) ou o cliente aceita o que o servidor nunca emitiria.
 */
const casos = [
  ['create_habit', { name: 'Beber água', category: 'Health', cadence: 'daily', time: '09:00' }],
  ['create_habit', { name: 'Correr', category: 'Fitness', cadence: 'weekdays', days: [1, 3, 5] }],
  ['create_habit', { name: 'Ler', category: 'Study', cadence: 'times_per_week', times_per_week: 4 }],
  ['create_habit', { name: 'Limpar', category: 'Discipline', cadence: 'every_n_days', every_n_days: 7 }],
  ['create_task', { name: 'Ligar pro médico', category: 'Health', effort: 2, date: '2026-10-12' }],
  ['create_task', { name: 'Pagar luz' }],
  ['flip_soulmon', {}], ['fly', {}], ['land', {}],
];

describe('paridade servidor × cliente', () => {
  it.each(casos)('%s %j: o cliente aceita exatamente o que o servidor emite', (nome, args) => {
    const s = validateToolCall(nome, args);
    expect(s.ok).toBe(true);
    expect(parseChatAction(s.action)).toEqual(s.action);
  });

  it('o cliente recusa o que o servidor nunca emitiria', () => {
    for (const ruim of [
      { type: 'delete_save' },
      { type: 'create_habit', habit: { name: 'x', category: 'Health', schedule: { kind: 'everyNDays', n: 1, from: 'completion' } } },
      { type: 'create_habit', habit: { name: 'x', category: 'Hacker', schedule: { kind: 'weekdays', days: [1] } } },
      { type: 'create_task', task: { name: '<script>', category: 'Work', effort: 1 } && { name: '   ', category: 'Work' } },
      null, 'x', [],
    ]) expect(parseChatAction(ruim)).toBeNull();
  });
});
