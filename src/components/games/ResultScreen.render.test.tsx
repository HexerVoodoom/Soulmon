// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { ResultScreen, RESULT_FINAL_STEP, formatResultTime, type ResultScreenProps } from './ResultScreen';

function reducedMotion(on: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: on && q.includes('prefers-reduced-motion'), media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const base = (over: Partial<ResultScreenProps> = {}): ResultScreenProps => ({
  language: 'en-US', outcome: 'win', gameName: 'Test game', title: 'Arena cleared', line: 'He is on his feet.',
  hero: { label: 'Score', value: 1234 }, petSrc: 'pet.png', onPlayAgain: () => {}, onHome: () => {}, homeLabel: 'Back to Home',
  ledger: [{ key: 'bits', kind: 'bits', value: 12 }], ...over,
});

const step = () => Number(document.querySelector('[data-result-screen]')!.getAttribute('data-result-step'));

beforeEach(() => { vi.useFakeTimers(); reducedMotion(false); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('ResultScreen', () => {
  it('cada desfecho põe o pet no humor certo (win/record = alegre, calm, tired)', () => {
    for (const [o, mood] of [['win', 'happy'], ['record', 'happy'], ['calm', 'calm'], ['tired', 'tired']] as const) {
      const { unmount } = render(<ResultScreen {...base({ outcome: o, recordNote: 'New best' })} />);
      expect(document.querySelector('[data-result-screen]')!.getAttribute('data-result-outcome')).toBe(o);
      expect(document.querySelector('[data-result-pet]')!.getAttribute('data-result-pet')).toBe(mood);
      unmount();
    }
  });

  it('a região viva (role=status) existe VAZIA na montagem e recebe o resumo depois', () => {
    render(<ResultScreen {...base()} />);
    const live = document.querySelector('[role="status"][data-result-live]')!;
    expect(live).toBeTruthy();
    expect(live.textContent).toBe('');
    act(() => { vi.advanceTimersByTime(160); });
    expect(live.textContent).toMatch(/Arena cleared/);
    expect(live.textContent).toMatch(/Score: 1234/);
    expect(live.textContent).toMatch(/12 Bits/);
  });

  it('revela em degraus (~2,6 s) e o valor final do herói já está no DOM desde o começo', () => {
    render(<ResultScreen {...base({ outcome: 'record', recordNote: 'New best, was 900' })} />);
    expect(step()).toBe(0);
    expect(document.querySelector('[data-result-final]')!.textContent).toBe('1234');
    act(() => { vi.advanceTimersByTime(1200); });
    expect(step()).toBeGreaterThanOrEqual(2);
    act(() => { vi.advanceTimersByTime(1500); });
    expect(step()).toBe(RESULT_FINAL_STEP);
  });

  it('o dock está ativo desde 0 ms (jogar de novo funciona no meio da animação)', () => {
    const again = vi.fn();
    render(<ResultScreen {...base({ onPlayAgain: again })} />);
    fireEvent.click(document.querySelector('[data-result-again]')!);
    expect(again).toHaveBeenCalledTimes(1);
    expect(step()).toBe(0);
  });

  it('um toque fora dos botões pula para o estado final; um toque num botão NÃO pula', () => {
    render(<ResultScreen {...base()} />);
    fireEvent.click(document.querySelector('[data-result-home]')!);
    expect(step()).toBe(0);
    fireEvent.click(document.querySelector('[data-result-screen]')!);
    expect(step()).toBe(RESULT_FINAL_STEP);
  });

  it('prefers-reduced-motion: estado final no primeiro quadro, sem animação marcada', () => {
    reducedMotion(true);
    render(<ResultScreen {...base({ outcome: 'record', recordNote: 'New best' })} />);
    expect(step()).toBe(RESULT_FINAL_STEP);
    expect(document.querySelector('.sm-result-visor--live')).toBeNull();
  });

  it('recorde: a célula "Best" some e o selo aparece; sem recorde a célula fica e não há selo', () => {
    const strip = [{ key: 'best', label: 'Best', value: 900, hideOnRecord: true }, { key: 'tier', label: 'Tier', value: 'Gold' }];
    const { unmount } = render(<ResultScreen {...base({ outcome: 'record', recordNote: 'New best, was 900', strip })} />);
    expect(document.querySelector('[data-result-strip-cell="best"]')).toBeNull();
    expect(document.querySelector('[data-result-strip-cell="tier"]')).not.toBeNull();
    expect(document.querySelector('[data-result-record]')!.textContent).toBe('New best, was 900');
    unmount();
    render(<ResultScreen {...base({ outcome: 'win', recordNote: 'New best', strip })} />);
    expect(document.querySelector('[data-result-strip-cell="best"]')).not.toBeNull();
    expect(document.querySelector('[data-result-record]')).toBeNull();
  });

  it('livro: uma moeda por linha; Bits 0 vira a linha neutra; Honra em serifa dourada', () => {
    const { unmount } = render(<ResultScreen {...base({ ledger: [{ key: 'b', kind: 'bits', value: 0 }], emptyLedgerLine: 'A light round, no Bits this time.' })} />);
    expect(document.querySelector('[data-result-row]')).toBeNull();
    expect(document.querySelector('[data-result-empty]')!.textContent).toMatch(/no Bits/);
    unmount();
    render(<ResultScreen {...base({ ledger: [{ key: 'b', kind: 'bits', value: 5 }, { key: 'h', kind: 'honor', value: 3 }] })} />);
    expect(document.querySelectorAll('[data-result-row]').length).toBe(2);
    expect(document.querySelector('[data-bits-amount]')).not.toBeNull();
    expect(document.querySelector('[data-result-honor]')!.textContent).toBe('+3');
  });

  it('a11y: foco inicial no título, sem seta de voltar, só os dois botões do dock, dialog quando pedido', () => {
    render(<ResultScreen {...base({ mode: 'dialog' })} />);
    expect(document.activeElement).toBe(document.querySelector('[data-result-title]'));
    expect(document.querySelectorAll('button').length).toBe(2);
    const root = document.querySelector('[data-result-screen]')!;
    expect(root.getAttribute('role')).toBe('dialog');
    expect(root.getAttribute('aria-modal')).toBe('true');
    expect(document.querySelector('[data-result-hero]')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('Escape chama onDismiss no modo dialog', () => {
    const d = vi.fn();
    render(<ResultScreen {...base({ mode: 'dialog', onDismiss: d })} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(d).toHaveBeenCalled();
  });

  it('7+ dígitos: herói cai para o token de 24 px; sem herói o bloco some', () => {
    const { unmount } = render(<ResultScreen {...base({ hero: { label: 'Score', value: 1234567 } })} />);
    expect((document.querySelector('[data-result-hero-value]') as HTMLElement).style.fontSize).toBe('var(--sm2-text-xl)');
    unmount();
    render(<ResultScreen {...base({ hero: undefined })} />);
    expect(document.querySelector('[data-result-hero]')).toBeNull();
  });

  it('formatResultTime: m:ss.d', () => {
    expect(formatResultTime(42_130)).toBe('0:42.1');
    expect(formatResultTime(75_900)).toBe('1:15.9');
  });
});
