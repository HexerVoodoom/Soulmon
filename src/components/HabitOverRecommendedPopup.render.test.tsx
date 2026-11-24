// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals, renderWithCss } from '../test/renderEnv';
import { HabitOverRecommendedPopup } from './HabitOverRecommendedPopup';

installDomGlobals();
afterEach(cleanup);

const q = (s: string) => document.querySelector(s) as HTMLElement;

describe('HabitOverRecommendedPopup (sugestão de limite)', () => {
  for (const w of [360, 375, 412]) {
    it(`${w}px: bottom sheet, texto com X, 2 botões >= 44, sem X de fechar nem moldura`, () => {
      (window as any).innerWidth = w;
      renderWithCss(<HabitOverRecommendedPopup open language="pt-BR" recommended={6} onCommitAnyway={() => {}} onDecline={() => {}} />);
      expect(getComputedStyle(q('.sm2-escolhedor-veu')).alignItems).toBe('flex-end');
      expect(q('[data-habit-over-text]').textContent).toBe('Neste nível o recomendado são 6 hábitos. Recomendamos que você se comprometa com metas menores e as aumente progressivamente.');
      const botoes = document.querySelectorAll('[data-habit-over]');
      expect(botoes.length).toBe(2);
      for (const b of Array.from(botoes)) expect(parseInt(getComputedStyle(b).minHeight)).toBeGreaterThanOrEqual(44);
      expect(document.querySelector('[data-moldura-modal]')).toBeNull();
      expect(document.querySelector('.sm2-moldura-modal--cristal')).toBeNull();
      expect(q('.sm2-escolhedor').getAttribute('aria-modal')).toBe('true');
    });
  }
  it('EN: texto e rótulos', () => {
    render(<HabitOverRecommendedPopup open language="en-US" recommended={8} onCommitAnyway={() => {}} onDecline={() => {}} />);
    expect(q('[data-habit-over-text]').textContent).toBe('At this level the recommended number is 8 habits. We recommend committing to smaller goals and growing them gradually.');
    expect(q('[data-habit-over="decline"]').textContent).toBe("You're right");
    expect(q('[data-habit-over="commit"]').textContent).toBe('I still want to commit');
  });
  it('PT: rótulos', () => {
    render(<HabitOverRecommendedPopup open language="pt-BR" recommended={6} onCommitAnyway={() => {}} onDecline={() => {}} />);
    expect(q('[data-habit-over="decline"]').textContent).toBe('Você tem razão');
    expect(q('[data-habit-over="commit"]').textContent).toBe('Quero me comprometer mesmo assim');
  });
  it('"mesmo assim" cria; "Você tem razão", Esc e véu NÃO criam', () => {
    const onCommitAnyway = vi.fn();
    const onDecline = vi.fn();
    render(<HabitOverRecommendedPopup open language="pt-BR" recommended={6} onCommitAnyway={onCommitAnyway} onDecline={onDecline} />);
    fireEvent.click(q('[data-habit-over="decline"]'));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(q('[data-modal-backdrop]'));
    expect(onDecline).toHaveBeenCalledTimes(3);
    expect(onCommitAnyway).not.toHaveBeenCalled();
    fireEvent.click(q('[data-habit-over="commit"]'));
    expect(onCommitAnyway).toHaveBeenCalledTimes(1);
    expect(onDecline).toHaveBeenCalledTimes(3);
  });
  it('fechado: não renderiza', () => {
    render(<HabitOverRecommendedPopup open={false} language="pt-BR" recommended={6} onCommitAnyway={() => {}} onDecline={() => {}} />);
    expect(document.querySelector('[data-habit-over-popup]')).toBeNull();
  });
});
