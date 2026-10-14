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
  it('tudo na mesma lista; a linha mostra SÓ o nome (sem "0 of 3 this week", sem XP, sem frequência)', () => {
    const { container } = mount();
    expect(container.textContent).toContain('Beber água');
    expect(container.textContent).toContain('Pagar conta');
    expect(container.textContent).toContain('Correr');
    expect(container.textContent).not.toMatch(/this week|XP|3×|Every day/);
    expect(container.querySelector('.sm2-ritual-sub')).toBeNull();
  });
  it('a linha não mostra XP nem a etiqueta de esforço ("medium"/"média") — 14/10/2026 supera a prévia de 11/10', () => {
    const { container } = mount();
    expect(container.textContent).not.toMatch(/XP|medium|média/);
  });
  it('linha com etapas (pai): sem barra nem contagem "1/2 steps"; o checkbox `mixed` e os filhos dizem tudo', () => {
    const pai = { id: 'p', name: 'Mudar', completed: false, effort: 2, steps: [{ id: 'a', label: 'a', completed: true }, { id: 'b', label: 'b', completed: false }] } as unknown as Task;
    const { container } = renderWithCss(
      <DailyRituals tasks={[pai]} activities={[]} completedTasks={[]} language="en-US" now={new Date('2026-10-07T12:00:00')}
        expanded={{}} onExpand={noop} onToggleTask={noop} onToggleTaskStep={noop} onEditTask={noop} onPostponeNudge={noop} onEditActivity={noop}
        onToggleActivity={noop} onUpdateStep={noop} onRestoreTask={noop} onCreate={noop} ctaLabel="Add" emptyMessage="empty" variant="home" />,
    );
    expect(container.querySelector('.sm2-ritual [role="progressbar"]')).toBeNull();
    expect(container.querySelector('.sm2-ritual')!.textContent).not.toMatch(/\d\/\d steps/);
    expect(container.querySelector('[aria-checked="mixed"]')).not.toBeNull();
  });
  it('recorrente fora do dia NÃO aparece na Home (vai para o `View all` > Scheduled)', () => {
    const { container } = renderWithCss(
      <DailyRituals tasks={[]} activities={[diario, mensal]} completedTasks={[]}
        habitRhythms={{ a3: { done: ['2026-10-05'], lastCompletedDate: '2026-10-05', totalDone: 1 } } as never}
        language="pt-BR" now={new Date('2026-10-07T12:00:00')}
        expanded={{}} onExpand={noop} onToggleTask={noop} onEditTask={noop} onPostponeNudge={noop} onEditActivity={noop}
        onToggleActivity={noop} onUpdateStep={noop} onRestoreTask={noop} onCreate={noop} ctaLabel="Add" emptyMessage="vazio" variant="home" />,
    );
    expect(container.querySelector('[data-scheduled-sep]')).toBeNull();
    const txt = container.textContent ?? '';
    expect(txt).toContain('Beber água');
    expect(txt).not.toContain('Trocar filtro');
    expect(txt).not.toContain('Programadas');
  });
});

describe('nome do guia', () => {
  it('Mysterious Soulmon / Solmon misterioso', () => {
    expect(tourGuideName('en-US')).toBe('Mysterious Soulmon');
    expect(tourGuideName('pt-BR')).toBe('Solmon misterioso');
  });
});
