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

describe('Home em abas', () => {
  it('Today mostra o diário e a tarefa; Weekly só o que é por semana', () => {
    const { container, getByRole } = mount();
    expect(container.textContent).toContain('Beber água');
    expect(container.textContent).toContain('Pagar conta');
    expect(container.textContent).not.toContain('Correr');
    fireEvent.click(getByRole('tab', { name: 'Weekly' }));
    expect(container.textContent).toContain('Correr');
    expect(container.textContent).not.toContain('Beber água');
    expect(container.textContent).not.toContain('Pagar conta');
  });
  it('mostra o XP ANTES de concluir (tarefa esforço 2 = +20; hábito = +10)', () => {
    const { container } = mount();
    expect(container.textContent).toContain('+20 base XP');
    expect(container.textContent).toContain('+10 base XP');
  });
});

describe('nome do guia', () => {
  it('Mysterious Soulmon / Solmon misterioso', () => {
    expect(tourGuideName('en-US')).toBe('Mysterious Soulmon');
    expect(tourGuideName('pt-BR')).toBe('Solmon misterioso');
  });
});
