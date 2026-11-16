// @vitest-environment jsdom
/** beta12 §J, A7: a tag "Tarefa" do check automático — borda arredondada, checkbox marcado, 8 s, anunciada ao leitor de tela, sem bloquear toque. */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { TaskAutoTag, NOTICE_TOAST_MS } from './NoticeToast';

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('TaskAutoTag', () => {
  it('mostra "Tarefa" com o checkbox já marcado e anuncia o nome ao leitor de tela', () => {
    const { container } = render(<TaskAutoTag name="Caminhar" language="pt-BR" onDone={() => {}} />);
    const tag = container.querySelector('[data-task-auto-tag]') as HTMLElement;
    expect(tag.getAttribute('role')).toBe('status');
    expect(tag.getAttribute('aria-label')).toBe('Tarefa concluída automaticamente: Caminhar');
    expect(tag.lastElementChild?.textContent).toBe('Tarefa');
    expect(container.querySelector('[data-task-auto-check]')?.firstElementChild).not.toBeNull(); // o check marcado (CheckMark) já vem desenhado
  });
  it('EN: "Task"', () => {
    const { container } = render(<TaskAutoTag name="Walk" language="en-US" onDone={() => {}} />);
    expect(container.querySelector('[data-task-auto-tag]')?.lastElementChild?.textContent).toBe('Task');
    expect(container.querySelector('[data-task-auto-tag]')?.getAttribute('aria-label')).toBe('Task completed automatically: Walk');
  });
  it('borda arredondada dourada (estilo do NoticeToast) e NÃO bloqueia o toque nos botões de cuidado', () => {
    const { container } = render(<TaskAutoTag name="x" language="pt-BR" onDone={() => {}} />);
    const tag = container.querySelector('[data-task-auto-tag]') as HTMLElement;
    expect(tag.style.border).toContain('var(--sm2-gold-fill)');
    expect(tag.style.borderRadius).toBe('999px');
    expect(tag.style.pointerEvents).toBe('none');
    expect(tag.style.top).toContain('safe-area-inset-top');
  });
  it('some sozinha em 8 s (mesmo tempo dos balões) mesmo com o App re-renderizando', () => {
    vi.useFakeTimers();
    const done = vi.fn();
    const ui = () => <TaskAutoTag name="x" language="pt-BR" onDone={() => done()} />;
    const { rerender } = render(ui());
    expect(NOTICE_TOAST_MS).toBe(8000);
    for (let i = 0; i < 9; i++) { act(() => { vi.advanceTimersByTime(1000); }); rerender(ui()); }
    expect(done).toHaveBeenCalledTimes(1);
  });
  it('não usa animação (respeita prefers-reduced-motion por construção)', () => {
    const { container } = render(<TaskAutoTag name="x" language="pt-BR" onDone={() => {}} />);
    const tag = container.querySelector('[data-task-auto-tag]') as HTMLElement;
    expect(tag.style.animation).toBe('');
    expect(tag.className).toBe('');
  });
});

describe('TaskCreatedToast (REGISTRO §413)', () => {
  it('"Tarefa criada" / "Task created", no topo, sem bloquear toque, some em 8 s', async () => {
    const { TaskCreatedToast } = await import('./NoticeToast');
    vi.useFakeTimers();
    const done = vi.fn();
    const pt = render(<TaskCreatedToast language="pt-BR" onDone={done} />);
    const el = pt.container.querySelector('[data-task-created-toast]') as HTMLElement;
    expect(el.textContent).toBe('Tarefa criada');
    expect(el.style.pointerEvents).toBe('none');
    expect(el.style.top).toContain('safe-area-inset-top');
    act(() => { vi.advanceTimersByTime(NOTICE_TOAST_MS); });
    expect(done).toHaveBeenCalledTimes(1);
    cleanup();
    const en = render(<TaskCreatedToast language="en-US" onDone={() => {}} />);
    expect(en.container.querySelector('[data-task-created-toast]')?.textContent).toBe('Task created');
  });
});
