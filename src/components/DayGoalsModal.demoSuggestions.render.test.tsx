// @vitest-environment jsdom
/** Demo: "Plan my day" abre com sugestões do catálogo (com ícone); fora da demo, igual a antes. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DayGoalsModal } from './DayGoalsModal';
import { demoDaySuggestions } from '../utils/demoDaySuggestions';

afterEach(cleanup);

describe('DayGoalsModal — sugestões da demo', () => {
  it('demo: abre com >=3 sugestões com ícone, desmarcadas; aceitar cria só o marcado', () => {
    const suggestions = demoDaySuggestions({ soulGoal: '', activities: [] });
    expect(suggestions.length).toBeGreaterThanOrEqual(3);
    const accept = vi.fn(() => ['novo-1']);
    const onConfirm = vi.fn();
    const { container } = renderWithCss(
      <DayGoalsModal candidates={[]} suggestions={suggestions} onAcceptSuggestions={accept} language="en-US" onConfirm={onConfirm} onClose={vi.fn()} />,
    );
    expect(container.querySelectorAll('[data-day-suggestion]').length).toBe(suggestions.length);
    expect(container.querySelectorAll('[data-day-suggestion-icon]').length).toBe(suggestions.length);
    const caixas = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(caixas.every(c => !c.checked)).toBe(true);
    expect(accept).not.toHaveBeenCalled();
    fireEvent.click(caixas[0]);
    fireEvent.click(container.querySelector('[data-day-goals-confirm]')!);
    expect(accept).toHaveBeenCalledWith([suggestions[0]]);
    expect(onConfirm).toHaveBeenCalledWith(['novo-1'], []);
  });

  it('foco do jogador manda: soulGoal "Sleep" prioriza a área sono', () => {
    const s = demoDaySuggestions({ soulGoal: 'Sleep', activities: [] });
    expect(s[0].area).toBe('sono');
  });

  it('fora da demo (sem sugestões): igual a antes', () => {
    const { container } = renderWithCss(
      <DayGoalsModal candidates={[{ id: 'h1', name: 'Water', kind: 'habit' }]} language="en-US" onConfirm={vi.fn()} onClose={vi.fn()} />,
    );
    expect(container.querySelector('[data-day-suggestion]')).toBeNull();
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
  });
});
