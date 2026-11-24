// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { CreateChoicePopup } from './CreateChoicePopup';
import { CategoryChips } from './CreateModal';
import { categoryIconArt } from '../assets/soulmon/icons/categories';
import { ACTIVITY_CATEGORIES } from '../types/categories';

installDomGlobals();
afterEach(cleanup);

describe('CreateChoicePopup', () => {
  for (const w of [360, 375, 412]) {
    it(`${w}px: 2 opções, sem barra de título, escolhe o tipo certo`, () => {
      (window as any).innerWidth = w;
      const onPick = vi.fn();
      render(<CreateChoicePopup open language="pt-BR" onClose={() => {}} onPick={onPick} />);
      expect(document.querySelectorAll('[data-create-choice]').length).toBe(2);
      expect(document.querySelector('[data-popup-titulo]')).toBeNull();
      expect(document.querySelector('h2')).toBeNull();
      fireEvent.click(document.querySelector('[data-create-choice="task"]')!);
      fireEvent.click(document.querySelector('[data-create-choice="habit"]')!);
      expect(onPick.mock.calls).toEqual([['task'], ['habit']]);
    });
  }
  it('fecha por Esc, fora e ✕; EN; 3ª opção só com onCommit', () => {
    const onClose = vi.fn();
    render(<CreateChoicePopup open language="en-US" onClose={onClose} onPick={() => {}} />);
    expect(document.body.textContent).toContain('Habit');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(document.querySelector('[data-modal-backdrop]')!);
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.click(document.querySelector('[data-create-choice-close]')!);
    expect(onClose).toHaveBeenCalledTimes(3);
    cleanup();
    render(<CreateChoicePopup open language="pt-BR" onClose={() => {}} onPick={() => {}} onCommit={() => {}} />);
    expect(document.querySelectorAll('[data-create-choice]').length).toBe(3);
  });
});

describe('CategoryChips com ícone de categoria', () => {
  it('as 10 categorias mostram a arte (img)', () => {
    render(<CategoryChips category="foco" setCategory={() => {}} isPt />);
    for (const c of ACTIVITY_CATEGORIES) expect(document.querySelector(`[data-cat-icon="${c}"]`), c).not.toBeNull();
    expect(document.querySelector('[data-cat-icon="foco"]')!.getAttribute('alt')).toBeTruthy();
  });
  it('id desconhecido não tem arte (cai no vetor)', () => { expect(categoryIconArt('nao-existe')).toBeUndefined(); });
});
