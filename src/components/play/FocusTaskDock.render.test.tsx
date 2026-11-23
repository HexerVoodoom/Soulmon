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
const hasCheck = (root: ParentNode) => { const i = [...root.querySelectorAll('.sm2-icon')].find(e => e.textContent === 'check'); return !!i && !!i.querySelector('svg path'); };

describe('box da tarefa na sessão do Foco (§304, reduzido em §312)', () => {
  it('mostra SÓ a tarefa escolhida, sem cabeçalho nem etiqueta "Em foco"', () => {
    render(<FocusTaskDock language="pt-BR" tasks={TASKS} focusId="a" onToggleTask={() => {}} onToggleStep={() => {}} top={190} bottom="16px" />);
    const t = document.body.textContent ?? '';
    expect(t).toContain('Pagar conta');
    expect(t).not.toContain('Mudança'); expect(t).not.toContain('Feita');
    expect(t).not.toContain('Tarefas'); expect(t).not.toContain('Em foco');
    expect(q('[data-focus-dock-chosen]')).toBeNull();
    expect(q('[data-focus-dock-handle]')).toBeNull();
  });
  it('mostra os subtópicos da escolhida; marcar chama os handlers da Home', () => {
    const onTask = vi.fn(); const onStep = vi.fn();
    render(<FocusTaskDock language="en-US" tasks={TASKS} focusId="b" onToggleTask={onTask} onToggleStep={onStep} top={190} bottom="16px" />);
    expect(document.body.textContent).toContain('Caixas');
    expect(document.body.textContent).not.toContain('Pagar conta');
    expect(document.body.textContent).not.toContain('In focus'); expect(document.body.textContent).not.toContain('Tasks');
    fireEvent.click(document.querySelector('[aria-label="Mark step as completed: Caixas"]')!);
    expect(onStep).toHaveBeenCalledWith('b', 's1');
  });
  it('tarefa simples: o checkbox chama onToggleTask', () => {
    const onTask = vi.fn();
    render(<FocusTaskDock language="pt-BR" tasks={TASKS} focusId="a" onToggleTask={onTask} onToggleStep={() => {}} top={190} bottom="16px" />);
    fireEvent.click(document.querySelector('[aria-label="Marcar tarefa como concluída: Pagar conta"]')!);
    expect(onTask).toHaveBeenCalledWith('a');
  });
  it('o check (✓) aparece nos marcados: tarefa concluída e subtópico feito', () => {
    const { unmount } = render(<FocusTaskDock language="pt-BR" tasks={TASKS} focusId="c" onToggleTask={() => {}} onToggleStep={() => {}} top={190} bottom="16px" />);
    expect(hasCheck(document.body)).toBe(true);
    unmount();
    render(<FocusTaskDock language="pt-BR" tasks={TASKS} focusId="b" onToggleTask={() => {}} onToggleStep={() => {}} top={190} bottom="16px" />);
    const feito = document.querySelector('[aria-label="Etapa concluída: Chaves"]') as HTMLElement;
    expect(hasCheck(feito)).toBe(true);
    const vazio = document.querySelector('[aria-label="Marcar etapa como concluída: Caixas"]') as HTMLElement;
    expect(hasCheck(vazio)).toBe(false);
  });
  it('a alça só aparece quando os subtópicos não cabem; aumenta, minimiza e arrastar para cima aumenta', () => {
    const many: DockTask[] = [{ id: 'm', name: 'Grande', completed: false, steps: Array.from({ length: 12 }, (_, i) => ({ id: `s${i}`, label: `Passo ${i}`, completed: false })) }];
    const sh = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(600);
    const ch = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(150);
    render(<FocusTaskDock language="en-US" tasks={many} focusId="m" onToggleTask={() => {}} onToggleStep={() => {}} top={190} bottom="16px" />);
    const h = q('[data-focus-dock-handle]')!;
    expect(h.getAttribute('aria-label')).toBe('Enlarge the task');
    fireEvent.click(h);
    expect(q('[data-focus-dock]')!.getAttribute('data-expanded')).toBe('true');
    expect(h.getAttribute('aria-label')).toBe('Minimize the task');
    fireEvent.click(h);
    expect(q('[data-focus-dock]')!.getAttribute('data-expanded')).toBe('false');
    fireEvent.pointerDown(h, { clientY: 400, pointerId: 1 });
    fireEvent.pointerMove(h, { clientY: 300, pointerId: 1 });
    fireEvent.pointerUp(h, { pointerId: 1 });
    expect(q('[data-focus-dock]')!.getAttribute('data-expanded')).toBe('true');
    sh.mockRestore(); ch.mockRestore();
  });
  it('sem tarefa escolhida mostra o vazio', () => {
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
