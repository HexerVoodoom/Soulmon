// @vitest-environment jsdom
/**
 * REGISTRO §50 — a barra de carregamento única: determinada/indeterminada, reduced-motion,
 * some ao terminar, a11y e sem componentes paralelos.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { LoadingBar, SIMULATED_CEILING, simulatedStep, steppedStep } from './LoadingBar';

installDomGlobals();
const fill = (c: HTMLElement) => parseFloat((c.querySelector('[data-loadbar-fill]') as HTMLElement).style.width);

function mockReduced(on: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: on && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => { vi.useFakeTimers(); mockReduced(false); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('LoadingBar', () => {
  it('determinada: progressbar com aria-valuenow, aria-busy e rótulo PT/EN, sem texto visível', () => {
    const { container, rerender } = render(<LoadingBar progress={0.4} language="pt-BR" />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-busy')).toBe('true');
    expect(bar.getAttribute('aria-label')).toBe('Carregando');
    expect(container.textContent).toBe('');
    expect(fill(container)).toBe(40);
    rerender(<LoadingBar progress={0.75} language="en-US" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-label')).toBe('Loading');
    expect(fill(container)).toBe(75);
  });

  it('indeterminada: sem aria-valuenow, sobe, desacelera e nunca chega a 100%', () => {
    const { container } = render(<LoadingBar />);
    expect(screen.getByRole('progressbar').hasAttribute('aria-valuenow')).toBe(false);
    const a = fill(container);
    act(() => { vi.advanceTimersByTime(1200); });
    const b = fill(container);
    act(() => { vi.advanceTimersByTime(1200); });
    const c = fill(container);
    act(() => { vi.advanceTimersByTime(600000); });
    const z = fill(container);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    expect(c - b).toBeLessThan(b - a); // desacelera
    expect(z).toBeLessThanOrEqual(Math.round(SIMULATED_CEILING * 100));
    expect(z).toBeLessThan(100);
  });

  it('funções puras: assintótico e em passos', () => {
    let v = 0; for (let i = 0; i < 500; i++) v = simulatedStep(v);
    expect(v).toBeLessThan(SIMULATED_CEILING + 1e-9);
    expect(steppedStep(0)).toBe(0.2);
    expect(steppedStep(0.8)).toBe(0.8);
  });

  it('prefers-reduced-motion: preenche em passos de 20%, sem brilho (classe still)', () => {
    mockReduced(true);
    const { container } = render(<LoadingBar />);
    expect(container.querySelector('.sm2-loadbar-still')).not.toBeNull();
    act(() => { vi.advanceTimersByTime(500 * 3); });
    expect(fill(container) % 20).toBe(0);
    act(() => { vi.advanceTimersByTime(600000); });
    expect(fill(container)).toBeLessThanOrEqual(80);
  });

  it('ao terminar: completa a 100%, some e avisa onExited', () => {
    const onExited = vi.fn();
    const { container, rerender } = render(<LoadingBar progress={0.5} onExited={onExited} />);
    rerender(<LoadingBar progress={0.5} done onExited={onExited} />);
    expect(fill(container)).toBe(100);
    expect(screen.getByRole('progressbar').getAttribute('aria-busy')).toBe('false');
    expect(onExited).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(300); });
    expect(onExited).toHaveBeenCalledOnce();
    expect(container.innerHTML).toBe('');
  });

  it('um só componente: CSS e splash usam .sm2-loadbar; a barra antiga e os cristais saíram', async () => {
    const fs = await import(/* @vite-ignore */ 'node:fs');
    const css = fs.readFileSync('src/index.css', 'utf8');
    const html = fs.readFileSync('index.html', 'utf8');
    expect(css).toMatch(/\.sm2-loadbar\s*\{/);
    expect(css).not.toMatch(/sm2-splash-bar|sm2-splash-crystal|sm2-splash-flame|sm2-splash-title/);
    expect(html).toContain('sm2-loadbar');
    expect(html).not.toMatch(/sm2-splash-bar|LOADING DATA/);
    expect(css).toMatch(/\.sm2-loadbar\s*\{[^}]*height:\s*3px/);
    expect(css).toMatch(/var\(--sm2-primary-fill\)/);
  });
});
