// @vitest-environment jsdom
/**
 * Segurar (~500 ms) uma tarefa na Home (04/11/2026): pendente → edição;
 * marcada → "Desmarcar / Editar". O segurar não dispara o toque curto, e
 * mexer o dedo (rolar) cancela o segurar.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { screen, fireEvent, cleanup, act, render } from '@testing-library/react';
import { DailyRituals } from './DailyRituals';
import { LONG_PRESS_MS } from '../hooks/useLongPress';
import type { CompletedTask, Task } from '../contexts/GameStateContext';

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const AGORA = new Date(2026, 10, 4, 10, 0, 0);
const noop = () => {};
const pendente = { id: 't1', name: 'Lavar louça', category: 'Personal', emoji: 'x', completed: false, effort: 1 } as unknown as Task;
const feita: CompletedTask = { id: 't9', name: 'Pagar conta', category: 'Work', emoji: 'x', completedAt: AGORA.toISOString() };

function montar() {
  const fns = { onToggleTask: vi.fn(), onEditTask: vi.fn(), onHoldDoneTask: vi.fn() };
  render(
    <DailyRituals
      tasks={[pendente]} activities={[]} completedTasks={[feita]} language="pt-BR" now={AGORA}
      expanded={{}} onExpand={noop} onToggleTaskStep={noop} onPostponeNudge={noop}
      onEditActivity={noop} onToggleActivity={noop} onUpdateStep={noop} onRestoreTask={noop}
      onCreate={noop} ctaLabel="Add" emptyMessage="empty" variant="home"
      {...fns}
    />,
  );
  return fns;
}

const linha = (nome: string) => screen.getByText(nome).closest('[data-long-press]') as HTMLElement;

function segurar(el: HTMLElement, ms = LONG_PRESS_MS + 10) {
  fireEvent.pointerDown(el, { pointerType: 'touch', clientX: 10, clientY: 10, button: 0 });
  act(() => { vi.advanceTimersByTime(ms); });
  fireEvent.pointerUp(el, { pointerType: 'touch', clientX: 10, clientY: 10 });
}

describe('segurar tarefa na Home', () => {
  it('pendente: segurar abre a edição e NÃO marca', () => {
    const f = montar();
    segurar(linha('Lavar louça'));
    fireEvent.click(screen.getByText('Lavar louça'));
    expect(f.onEditTask).toHaveBeenCalledWith('t1');
    expect(f.onToggleTask).not.toHaveBeenCalled();
  });

  it('toque curto continua marcando', () => {
    const f = montar();
    segurar(linha('Lavar louça'), 100);
    fireEvent.click(screen.getByText('Lavar louça'));
    expect(f.onToggleTask).toHaveBeenCalledWith('t1');
    expect(f.onEditTask).not.toHaveBeenCalled();
  });

  it('mexer o dedo (rolar) cancela o segurar', () => {
    const f = montar();
    const el = linha('Lavar louça');
    fireEvent.pointerDown(el, { pointerType: 'touch', clientX: 10, clientY: 10, button: 0 });
    fireEvent.pointerMove(el, { pointerType: 'touch', clientX: 10, clientY: 60 });
    act(() => { vi.advanceTimersByTime(LONG_PRESS_MS + 50); });
    expect(f.onEditTask).not.toHaveBeenCalled();
  });

  it('marcada: segurar abre o menu Desmarcar/Editar com a conclusão certa', () => {
    const f = montar();
    segurar(linha('Pagar conta'));
    expect(f.onHoldDoneTask).toHaveBeenCalledWith({ id: 't9', completedAt: feita.completedAt });
  });

  it('menu de contexto (teclado/botão direito) dispara a mesma ação', () => {
    const f = montar();
    fireEvent.contextMenu(linha('Lavar louça'));
    expect(f.onEditTask).toHaveBeenCalledWith('t1');
  });
});
