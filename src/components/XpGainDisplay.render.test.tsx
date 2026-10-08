// @vitest-environment jsdom
/**
 * O display "+N EXP": aparece com o delta real de `totalXP`, coalesce, e NÃO
 * aparece no 1º render (hidratação), em delta zero/negativo, em salto de
 * adoção/migração (> teto) nem na demo.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { XpGainDisplay } from './XpGainDisplay';
import { xpGainBetween, XP_GAIN_DISPLAY_CAP, XP_DISPLAY_TOTAL_MS } from '../utils/xpGain';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const display = () => document.querySelector('[data-xp-gain]');

describe('xpGainBetween', () => {
  it('só devolve deltas positivos dentro do teto', () => {
    expect(xpGainBetween(100, 110)).toBe(10);
    expect(xpGainBetween(undefined, 110)).toBe(0);
    expect(xpGainBetween(100, 100)).toBe(0);
    expect(xpGainBetween(100, 90)).toBe(0);
    expect(xpGainBetween(0, XP_GAIN_DISPLAY_CAP + 1)).toBe(0);
    expect(xpGainBetween(0, XP_GAIN_DISPLAY_CAP)).toBe(XP_GAIN_DISPLAY_CAP);
    expect(xpGainBetween(100, 110, true)).toBe(0);
    expect(xpGainBetween(NaN, 5)).toBe(0);
  });
});

describe('XpGainDisplay', () => {
  it('não mostra nada no primeiro render (hidratação)', () => {
    render(<XpGainDisplay totalXP={5000} language="en-US" />);
    advance(3000);
    expect(display()).toBeNull();
  });

  it('mostra o ganho real, com aria-live, e some após ~1,7 s', () => {
    const { rerender } = render(<XpGainDisplay totalXP={100} language="en-US" />);
    rerender(<XpGainDisplay totalXP={110} language="en-US" />);
    advance(450);
    expect(display()?.textContent).toBe('+10 EXP');
    const region = screen.getByRole('status');
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.textContent).toContain('Gained 10 XP');
    advance(XP_DISPLAY_TOTAL_MS + 50);
    expect(display()).toBeNull();
  });

  it('PT-BR lê "Ganhou N XP"', () => {
    const { rerender } = render(<XpGainDisplay totalXP={0} language="pt-BR" />);
    rerender(<XpGainDisplay totalXP={30} language="pt-BR" />);
    advance(450);
    expect(screen.getByRole('status').textContent).toContain('Ganhou 30 XP');
  });

  it('coalesce ganhos dentro da janela em UM display', () => {
    const { rerender } = render(<XpGainDisplay totalXP={0} language="en-US" />);
    rerender(<XpGainDisplay totalXP={10} language="en-US" />);
    advance(100);
    rerender(<XpGainDisplay totalXP={25} language="en-US" />);
    advance(400);
    expect(document.querySelectorAll('[data-xp-gain]').length).toBe(1);
    expect(display()?.textContent).toBe('+25 EXP');
  });

  it('ganho durante a exibição entra na fila, um de cada vez', () => {
    const { rerender } = render(<XpGainDisplay totalXP={0} language="en-US" />);
    rerender(<XpGainDisplay totalXP={10} language="en-US" />);
    advance(450);
    rerender(<XpGainDisplay totalXP={25} language="en-US" />);
    advance(500);
    expect(display()?.textContent).toBe('+10 EXP');
    advance(XP_DISPLAY_TOTAL_MS);
    expect(display()?.textContent).toBe('+15 EXP');
  });

  it('não mostra delta zero, salto de adoção nem demo', () => {
    const { rerender } = render(<XpGainDisplay totalXP={100} language="en-US" />);
    rerender(<XpGainDisplay totalXP={100} language="en-US" />);
    rerender(<XpGainDisplay totalXP={100 + XP_GAIN_DISPLAY_CAP + 1} language="en-US" />);
    advance(1000);
    expect(display()).toBeNull();
    const d = render(<XpGainDisplay totalXP={0} language="en-US" demo />);
    d.rerender(<XpGainDisplay totalXP={10} language="en-US" demo />);
    advance(1000);
    expect(display()).toBeNull();
  });
});

describe('XpGainDisplay — CSS', () => {
  const css = readFileSync('src/index.css', 'utf8');
  it('é transform/opacity, sem captura de toque, e reduced-motion tira só o deslize', () => {
    expect(css).toMatch(/\.sm-xp-gain\s*\{[^}]*pointer-events:\s*none/);
    expect(css).toMatch(/\.sm-xp-gain\s*\{[^}]*z-index:\s*90/);
    const sentinel = css.indexOf('SENTINELA-MOVIMENTO-REDUZIDO-CANONICO');
    expect(css.slice(sentinel)).toMatch(/\.sm-xp-gain\s*\{[^}]*sm-xp-gain-still/);
    const still = css.match(/@keyframes sm-xp-gain-still\s*\{[\s\S]*?\n\}/)![0];
    expect(still).not.toContain('transform');
  });
});
