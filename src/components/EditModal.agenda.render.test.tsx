// @vitest-environment jsdom
/** QA-12: renomear um hábito sem poder editar os dias não pode zerar a agenda dele. */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { EditModal } from './EditModal';

beforeEach(() => {
  try { localStorage.clear(); } catch { /* jsdom */ }
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => cleanup());

const base = { category: 'Health', emoji: '💪' };

function renomeia(initialData: Record<string, unknown>) {
  const onSave = vi.fn();
  render(<EditModal isOpen onClose={() => {}} onSave={onSave} canEditWeekdays={false}
    initialData={{ ...base, name: 'Correr', ...initialData } as never} language="en-US" />);
  const input = document.querySelector('input[type="text"], input:not([type])') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'Correr mais' } });
  fireEvent.click(Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Save')!);
  return onSave.mock.calls[0][0];
}

describe('EditModal sem edição de dias', () => {
  it('preserva timesPerWeek ao renomear', () => {
    const saved = renomeia({ schedule: { kind: 'timesPerWeek', target: 3 }, weekDays: [0, 1, 2, 3, 4, 5, 6] });
    expect(saved.name).toBe('Correr mais');
    expect(saved.schedule).toEqual({ kind: 'timesPerWeek', target: 3 });
  });
  it('preserva dias específicos ao renomear', () => {
    const saved = renomeia({ schedule: { kind: 'weekdays', days: [1, 3] }, weekDays: [1, 3] });
    expect(saved.schedule).toEqual({ kind: 'weekdays', days: [1, 3] });
    expect(saved.weekDays).toEqual([1, 3]);
  });
});
