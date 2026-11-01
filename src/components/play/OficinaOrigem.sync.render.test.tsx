// @vitest-environment jsdom
/**
 * "Se ele puxou de lá, tem que marcar nos dois" (dono, 01/11/2026). Os dois sentidos, para tarefa, hábito simples e
 * hábito com etapas: o ✓ na Oficina conclui a origem (alvo certo, todas as etapas de uma vez) e a origem concluída
 * fora da Oficina aparece com ✓ na sessão.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { createElement } from 'react';
import { OficinaSheet } from './OficinaSheet';
import { focusCheckTarget, focusTasksFor } from '../../utils/focusOrigin';

const DIA = '2026-11-01';
const DK = new Date(2026, 10, 1).toDateString();
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 1, 10, 0, 0)); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

const habits = [
  { id: 'h1', name: 'Drink water', steps: [] as Array<{ id: string; completed: boolean }> },
  { id: 'h2', name: 'Stretch', steps: [{ id: 's1', completed: true }, { id: 's2', completed: false }, { id: 's3', completed: false }] },
];
const q = (c: HTMLElement, s: string) => c.querySelector(s) as HTMLElement | null;

describe('origem da Oficina (puro)', () => {
  it('o ✓ conclui a origem certa: tarefa, hábito simples, e TODAS as etapas abertas do hábito com etapas numa chamada', () => {
    expect(focusCheckTarget('t1', habits)).toEqual({ kind: 'task', id: 't1' });
    expect(focusCheckTarget('habit:h1', habits)).toEqual({ kind: 'habit', id: 'h1' });
    expect(focusCheckTarget('habit:h2', habits)).toEqual({ kind: 'steps', id: 'h2', stepIds: ['s2', 's3'] });
    expect(focusCheckTarget('habit:sumiu', habits)).toBeNull();
  });

  it('concluído fora da Oficina continua listado como concluído (tarefa sai de tasks e vive em completedTasks)', () => {
    const list = focusTasksFor([], [{ id: 't1', name: 'Report', completedAt: new Date(2026, 10, 1, 9).toISOString() }, { id: 'old', name: 'Old', completedAt: new Date(2026, 9, 30).toISOString() }],
      [{ id: 'h1', name: 'Drink water', steps: [], completedToday: true, lastCompletedDate: DK }, { id: 'h2', name: 'Stretch', steps: [{ id: 's1', completed: true }] }], DK);
    expect(list).toEqual([
      { id: 't1', name: 'Report', completed: true },
      { id: 'habit:h1', name: 'Drink water', kind: 'habit', completed: true },
      { id: 'habit:h2', name: 'Stretch', kind: 'habit', completed: true },
    ]);
  });
});

describe('Oficina × origem (render)', () => {
  const open = [
    { id: 't1', name: 'Report', completed: false },
    { id: 'habit:h1', name: 'Drink water', completed: false, kind: 'habit' as const },
    { id: 'habit:h2', name: 'Stretch', completed: false, kind: 'habit' as const },
  ];
  function planejar(container: HTMLElement) {
    fireEvent.change(q(container, '[data-oficina-plano] input')!, { target: { value: 'Sync' } });
    fireEvent.click(q(container, '[data-oficina-next]')!);
    fireEvent.click(q(container, '[data-focus-environment="forest"]')!);
    fireEvent.click(q(container, '[data-oficina-next]')!);
    for (const id of ['t1', 'habit:h1', 'habit:h2']) fireEvent.click(q(container, `[data-oficina-pick="${id}"]`)!);
    for (let i = 0; i < 10 && !q(container, '[data-oficina-save-session]'); i++) fireEvent.click(q(container, '[data-oficina-next]')!);
    fireEvent.click(q(container, '[data-oficina-save-session]')!);
  }

  it('✓ na Oficina chama a conclusão da origem para tarefa, hábito simples e hábito com etapas', () => {
    const onCompleteTask = vi.fn();
    const { container } = render(createElement(OficinaSheet, { language: 'en-US' as const, todayKey: DIA, tasks: open, onCompleteTask }));
    planejar(container);
    for (const id of ['t1', 'habit:h1', 'habit:h2']) fireEvent.click(q(container, `[data-oficina-check="${id}"]`)!);
    expect(onCompleteTask.mock.calls.map(c => c[0])).toEqual(['t1', 'habit:h1', 'habit:h2']);
  });

  it('origem concluída fora da Oficina: a sessão mostra ✓ sem tocar nela', () => {
    const onCompleteTask = vi.fn();
    const { container, rerender } = render(createElement(OficinaSheet, { language: 'en-US' as const, todayKey: DIA, tasks: open, onCompleteTask }));
    planejar(container);
    for (const id of ['t1', 'habit:h1', 'habit:h2']) expect(q(container, `[data-oficina-check="${id}"]`)!.getAttribute('aria-checked')).toBe('false');
    rerender(createElement(OficinaSheet, { language: 'en-US' as const, todayKey: DIA, tasks: open.map(t => ({ ...t, completed: true })), onCompleteTask }));
    for (const id of ['t1', 'habit:h1', 'habit:h2']) expect(q(container, `[data-oficina-check="${id}"]`)!.getAttribute('aria-checked')).toBe('true');
    expect(onCompleteTask).not.toHaveBeenCalled();
  });
});
