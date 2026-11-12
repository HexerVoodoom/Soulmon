// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { FocusTaskDock, type DockTask } from './FocusTaskDock';
import { JourneyScreen } from './JourneyScreen';
import type { ActiveJourney } from '../../utils/focusJourneyApi';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const TASKS: DockTask[] = [
  { id: 'a', name: 'Pagar conta', completed: false },
  { id: 'b', name: 'Mudança', completed: false, steps: [{ id: 's1', label: 'Caixas', completed: false }, { id: 's2', label: 'Chaves', completed: true }] },
  { id: 'c', name: 'Feita', completed: true },
];
const q = (s: string) => document.querySelector(s) as HTMLElement | null;

describe('lista de tarefas na sessão do Foco (§304)', () => {
  it('mostra tarefas e, ao expandir a tarefa, os subtópicos; checkbox chama os handlers da Home', () => {
    const onTask = vi.fn(); const onStep = vi.fn();
    render(<FocusTaskDock language="pt-BR" tasks={TASKS} onToggleTask={onTask} onToggleStep={onStep} top={190} bottom="16px" />);
    expect(document.body.textContent).toContain('Pagar conta');
    expect(q('[data-focus-dock]')!.getAttribute('data-expanded')).toBe('false');
    fireEvent.click(document.querySelector('[aria-label="Marcar tarefa como concluída: Pagar conta"]')!);
    expect(onTask).toHaveBeenCalledWith('a');
    expect(document.body.textContent).not.toContain('Caixas');
    fireEvent.click(document.querySelector('[data-ritual-expand]')!);
    expect(document.body.textContent).toContain('Caixas');
    fireEvent.click(document.querySelector('[aria-label="Marcar etapa como concluída: Caixas"]')!);
    expect(onStep).toHaveBeenCalledWith('b', 's1');
  });
  it('aumenta e minimiza pelo botão da alça; arrastar para cima também aumenta', () => {
    render(<FocusTaskDock language="en-US" tasks={TASKS} onToggleTask={() => {}} onToggleStep={() => {}} top={190} bottom="16px" />);
    const h = q('[data-focus-dock-handle]')!;
    expect(h.getAttribute('aria-label')).toBe('Enlarge the task list');
    fireEvent.click(h);
    expect(q('[data-focus-dock]')!.getAttribute('data-expanded')).toBe('true');
    expect(h.getAttribute('aria-label')).toBe('Minimize the task list');
    fireEvent.click(h);
    expect(q('[data-focus-dock]')!.getAttribute('data-expanded')).toBe('false');
    fireEvent.pointerDown(h, { clientY: 400, pointerId: 1 });
    fireEvent.pointerMove(h, { clientY: 300, pointerId: 1 });
    fireEvent.pointerUp(h, { pointerId: 1 });
    expect(q('[data-focus-dock]')!.getAttribute('data-expanded')).toBe('true');
  });
  it('sem tarefas mostra o vazio', () => {
    render(<FocusTaskDock language="pt-BR" tasks={[]} onToggleTask={() => {}} onToggleStep={() => {}} top={190} bottom="16px" />);
    expect(q('[data-focus-dock-empty]')).not.toBeNull();
  });
});

const ACTIVE = (over: Partial<ActiveJourney> = {}): ActiveJourney => ({ sid: 's1', seed: 7, mode: 'p25', env: 'forest', keys: [], day: '2026-11-11', startAt: Date.now(), pausedMs: 0, pausedAt: null, pauses: 0, ...over } as ActiveJourney);

describe('tela acordada na jornada (§304)', () => {
  const stub = () => {
    const release = vi.fn(async () => {});
    const request = vi.fn(async () => ({ release }));
    vi.stubGlobal('navigator', { ...navigator, wakeLock: { request } });
    return { release, request };
  };
  it('pede o wake lock ao rodar e solta ao pausar', async () => {
    const { release, request } = stub();
    const base = { language: 'pt-BR' as const, delta: 0, lastItems: null, onPause() {}, onResume() {}, onClaim() {}, onEnd() {}, onClose() {} };
    const r = render(<JourneyScreen {...base} active={ACTIVE()} tasks={TASKS} />);
    await vi.waitFor(() => expect(request).toHaveBeenCalledWith('screen'));
    expect(q('[data-journey] [data-focus-dock]')).not.toBeNull();
    r.rerender(<JourneyScreen {...base} active={ACTIVE({ pausedAt: Date.now() })} tasks={TASKS} />);
    await vi.waitFor(() => expect(release).toHaveBeenCalled());
  });
  it('solta ao sair da jornada e não quebra se o pedido for rejeitado', async () => {
    const release = vi.fn(async () => {});
    const request = vi.fn().mockResolvedValueOnce({ release }).mockRejectedValue(new Error('NotAllowed'));
    vi.stubGlobal('navigator', { ...navigator, wakeLock: { request } });
    const base = { language: 'en-US' as const, delta: 0, lastItems: null, onPause() {}, onResume() {}, onClaim() {}, onEnd() {}, onClose() {} };
    const r = render(<JourneyScreen {...base} active={ACTIVE()} />);
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    r.unmount();
    await vi.waitFor(() => expect(release).toHaveBeenCalled());
    const r2 = render(<JourneyScreen {...base} active={ACTIVE()} />);
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(document.querySelector('[data-journey]')).not.toBeNull();
    r2.unmount();
  });
  it('sem wakeLock avisa que o aparelho não segura a tela', () => {
    vi.stubGlobal('navigator', { ...navigator, wakeLock: undefined });
    render(<JourneyScreen language="pt-BR" active={ACTIVE()} delta={0} lastItems={null} onPause={() => {}} onResume={() => {}} onClaim={() => {}} onEnd={() => {}} onClose={() => {}} />);
    expect(document.querySelector('[data-journey-awake-hint]')).not.toBeNull();
  });
});
