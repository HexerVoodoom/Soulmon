// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, act, fireEvent } from '@testing-library/react';
import { TypewriterText } from './TypewriterText';

function mockMotion(reduce: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: reduce && q.includes('reduce'), media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => { vi.useFakeTimers(); mockMotion(false); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

const shown = (c: Element) => c.querySelector('[data-typewriter-shown]')!.textContent;
const rest = (c: Element) => c.querySelector('[data-typewriter-rest]')!.textContent;

describe('TypewriterText', () => {
  it('revela um caractere por vez, ~30 ms cada, e reserva o texto inteiro', () => {
    const { container } = render(<TypewriterText text="Olá, tudo bem?" />);
    expect(shown(container)).toBe('');
    expect(rest(container)).toBe('Olá, tudo bem?');
    act(() => { vi.advanceTimersByTime(30 * 3); });
    expect(shown(container)).toBe('Olá');
    expect(shown(container) + rest(container)).toBe('Olá, tudo bem?');
    // a parte ainda não dita fica no fluxo, só invisível (sem reflow)
    expect((container.querySelector('[data-typewriter-rest]') as HTMLElement).style.visibility).toBe('hidden');
  });

  it('dispara onDone uma vez, ao terminar', () => {
    const onDone = vi.fn();
    render(<TypewriterText text="abc" onDone={onDone} />);
    act(() => { vi.advanceTimersByTime(30 * 10); });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('toque completa na hora', () => {
    const onDone = vi.fn();
    const { container } = render(<TypewriterText text="Uma fala longa" onDone={onDone} />);
    fireEvent.click(container.querySelector('[data-typewriter-visual]')!);
    expect(shown(container)).toBe('Uma fala longa');
    expect(rest(container)).toBe('');
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('leitor de tela lê o texto inteiro de um nó oculto; o desenho animado é aria-hidden', () => {
    const { container } = render(<TypewriterText text="Fala completa" />);
    expect(container.querySelector('[data-typewriter-sr]')!.textContent).toBe('Fala completa');
    expect(container.querySelector('[data-typewriter-visual]')!.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[aria-live]')).toBeNull();
  });

  it('prefers-reduced-motion mostra tudo de uma vez', () => {
    mockMotion(true);
    const onDone = vi.fn();
    const { container } = render(<TypewriterText text="Tudo junto" onDone={onDone} />);
    expect(shown(container)).toBe('Tudo junto');
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('trocar o texto recomeça a fala', () => {
    const { container, rerender } = render(<TypewriterText text="primeira" />);
    act(() => { vi.advanceTimersByTime(30 * 20); });
    expect(shown(container)).toBe('primeira');
    rerender(<TypewriterText text="segunda" />);
    expect(shown(container)).toBe('');
    expect(rest(container)).toBe('segunda');
  });
});
