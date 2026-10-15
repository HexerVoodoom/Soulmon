// @vitest-environment jsdom
/**
 * REGISTRO §64 — a lista de Hoje só mostra o que a pessoa reafirmou; o não marcado some, o concluído sempre aparece e o
 * convite discreto abre o modal.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DailyRituals } from './DailyRituals';
import { dayPlanView } from '../utils/dayPlan';
import type { Activity, Task } from '../contexts/GameStateContext';

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) });
});
afterEach(cleanup);

const TERCA = new Date(2026, 9, 13, 10, 0, 0);
const noop = () => {};
const base = { category: 'health', emoji: 'x', steps: [] as never[] };
const todos = [0, 1, 2, 3, 4, 5, 6];
const agua = { ...base, id: 'a1', name: 'Beber água', weekDays: todos, schedule: { kind: 'weekdays', days: todos } } as unknown as Activity;
const alongar = { ...base, id: 'a2', name: 'Alongar', weekDays: todos, schedule: { kind: 'weekdays', days: todos } } as unknown as Activity;
const conta = { id: 't1', name: 'Pagar conta', category: 'work', completed: false, effort: 1 } as unknown as Task;
const ISO = '2026-10-13';

function mount(dayPlan?: Parameters<typeof DailyRituals>[0]['dayPlan'], over: Partial<Parameters<typeof DailyRituals>[0]> = {}) {
  return renderWithCss(
    <DailyRituals
      tasks={[conta]} activities={[agua, alongar]} completedTasks={[]} language="pt-BR" now={TERCA}
      expanded={{}} onExpand={noop} onToggleTask={noop} onEditTask={noop} onPostponeNudge={noop} onEditActivity={noop}
      onToggleActivity={noop} onUpdateStep={noop} onRestoreTask={noop} onCreate={noop}
      ctaLabel="Add" emptyMessage="vazio" variant="home" goal={3} dayPlan={dayPlan} {...over}
    />,
  );
}

describe('Hoje com o dia reafirmado', () => {
  it('sem plano (ou tudo marcado): aparece tudo, sem convite', () => {
    mount({ view: dayPlanView(undefined, ISO, true), invite: false });
    for (const n of ['Beber água', 'Alongar', 'Pagar conta']) expect(screen.getByText(n)).toBeTruthy();
    expect(document.querySelector('[data-day-plan-invite]')).toBeNull();
  });

  it('só o marcado aparece; o que ficou de fora some da lista (e não entra na contagem)', () => {
    const view = dayPlanView({ day: ISO, offered: ['a1', 'a2', 't1'], picked: ['a2'], confirmed: true }, ISO, true);
    mount({ view, invite: false });
    expect(screen.getByText('Alongar')).toBeTruthy();
    expect(screen.queryByText('Beber água')).toBeNull();
    expect(screen.queryByText('Pagar conta')).toBeNull();
  });

  it('dia sem reafirmação (plano de outro dia): lista vazia + convite discreto que abre o modal', () => {
    const onInvite = vi.fn();
    const view = dayPlanView({ day: '2026-10-12', offered: [], picked: [], confirmed: true }, ISO, true);
    mount({ view, invite: true, onInvite });
    expect(screen.queryByText('Beber água')).toBeNull();
    const convite = screen.getByRole('button', { name: 'Montar o meu dia' });
    fireEvent.click(convite);
    expect(onInvite).toHaveBeenCalledTimes(1);
  });

  it('o concluído hoje sempre aparece, mesmo fora do marcado', () => {
    const feita = { ...agua, completedToday: true, lastCompletedDate: TERCA.toDateString() } as unknown as Activity;
    const view = dayPlanView({ day: ISO, offered: ['a1'], picked: [], confirmed: true }, ISO, true);
    mount({ view, invite: false }, { activities: [feita, alongar] });
    expect(screen.getByText('Beber água')).toBeTruthy();
  });
});
