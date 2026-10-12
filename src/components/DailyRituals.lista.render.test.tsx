// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DailyRituals } from './DailyRituals';
import type { Activity, Task } from '../contexts/GameStateContext';
import { tourGuideName } from '../utils/welcomeTour';

const noop = () => {};
const diario = { id: 'a1', name: 'Beber água', category: 'health', emoji: '💧', steps: [], weekDays: [0, 1, 2, 3, 4, 5, 6], schedule: { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] } } as unknown as Activity;
const semanal = { id: 'a2', name: 'Correr', category: 'health', emoji: '🏃', steps: [], weekDays: [0, 1, 2, 3, 4, 5, 6], schedule: { kind: 'timesPerWeek', target: 3 } } as unknown as Activity;
const tarefa = { id: 't1', name: 'Pagar conta', category: 'work', completed: false, effort: 2 } as unknown as Task;

function mount() {
  return renderWithCss(
    <DailyRituals tasks={[tarefa]} activities={[diario, semanal]} completedTasks={[]} language="en-US" now={new Date('2026-10-07T12:00:00')}
      expanded={{}} onExpand={noop} onToggleTask={noop} onEditTask={noop} onPostponeNudge={noop} onEditActivity={noop}
      onToggleActivity={noop} onUpdateStep={noop} onRestoreTask={noop} onCreate={noop} ctaLabel="Add" emptyMessage="empty" variant="home" />,
  );
}

const mensal = { id: 'a3', name: 'Trocar filtro', category: 'home', emoji: 'x', steps: [], weekDays: [0, 1, 2, 3, 4, 5, 6], schedule: { kind: 'everyNDays', n: 30, from: 'schedule' } } as unknown as Activity;

describe('Lista única (sem abas)', () => {
  it('não há abas Hoje/Weekly nem chip duplicado', () => {
    const { container, queryByRole } = mount();
    expect(queryByRole('tab')).toBeNull();
    expect(container.querySelector('[data-home-tabs]')).toBeNull();
    expect(container.querySelector('[data-week-chip]')).toBeNull();
    expect(container.textContent).not.toContain('This check is for today');
    expect(container.textContent).not.toContain('per week');
  });
  it('tudo na mesma lista; semanal reduzido a "0 of 3 this week" + XP base', () => {
    const { container } = mount();
    expect(container.textContent).toContain('Beber água');
    expect(container.textContent).toContain('Pagar conta');
    expect(container.textContent).toContain('Correr');
    expect(container.textContent).toContain('0 of 3 this week · +10 base XP');
    expect(container.textContent).not.toContain('3×');
  });
  it('mostra o XP ANTES de concluir (tarefa esforço 2 = +20; hábito = +10)', () => {
    const { container } = mount();
    expect(container.textContent).toContain('+20 base XP');
    expect(container.textContent).toContain('+10 base XP');
  });
  it('recorrente fora do dia vai para "Programadas", abaixo da linha separadora', () => {
    const { container } = renderWithCss(
      <DailyRituals tasks={[]} activities={[diario, mensal]} completedTasks={[]}
        habitRhythms={{ a3: { done: ['2026-10-05'], lastCompletedDate: '2026-10-05', totalDone: 1 } } as never}
        language="pt-BR" now={new Date('2026-10-07T12:00:00')}
        expanded={{}} onExpand={noop} onToggleTask={noop} onEditTask={noop} onPostponeNudge={noop} onEditActivity={noop}
        onToggleActivity={noop} onUpdateStep={noop} onRestoreTask={noop} onCreate={noop} ctaLabel="Add" emptyMessage="vazio" variant="home" />,
    );
    const sep = container.querySelector('[data-scheduled-sep]') as HTMLElement;
    expect(sep).not.toBeNull();
    expect(sep.textContent).toBe('Programadas');
    const txt = container.textContent ?? '';
    expect(txt.indexOf('Beber água')).toBeLessThan(txt.indexOf('Programadas'));
    expect(txt.indexOf('Programadas')).toBeLessThan(txt.indexOf('Trocar filtro'));
  });
});

describe('nome do guia', () => {
  it('Mysterious Soulmon / Solmon misterioso', () => {
    expect(tourGuideName('en-US')).toBe('Mysterious Soulmon');
    expect(tourGuideName('pt-BR')).toBe('Solmon misterioso');
  });
});
