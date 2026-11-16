// @vitest-environment jsdom
/** REGISTRO §413: o modalzinho da meta de passos ao adotar o hábito de caminhar — 3 mil, 5 mil, 7 mil ou 10 mil. */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { StepGoalModal } from './StepGoalModal';

afterEach(cleanup);

describe('StepGoalModal', () => {
  it('oferece exatamente 3 mil, 5 mil, 7 mil e 10 mil; a meta atual vem marcada', () => {
    const { container } = render(<StepGoalModal language="pt-BR" currentGoal={7000} onPick={() => {}} onClose={() => {}} />);
    const valores = Array.from(container.querySelectorAll('[data-step-goal]')).map(b => Number(b.getAttribute('data-step-goal')));
    expect(valores).toEqual([3000, 5000, 7000, 10000]);
    expect(container.querySelector('[data-step-goal="7000"]')!.getAttribute('aria-pressed')).toBe('true');
  });
  it('escolher grava a meta; EN também funciona', () => {
    const onPick = vi.fn();
    const { container } = render(<StepGoalModal language="en-US" currentGoal={7000} onPick={onPick} onClose={() => {}} />);
    expect(container.textContent).toContain('How many steps a day?');
    fireEvent.click(container.querySelector('[data-step-goal="10000"]') as HTMLButtonElement);
    expect(onPick).toHaveBeenCalledWith(10000);
  });
});
