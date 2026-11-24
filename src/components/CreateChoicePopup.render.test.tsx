// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals, renderWithCss } from '../test/renderEnv';
import { CreateChoicePopup } from './CreateChoicePopup';
import { CategoryChips } from './CreateModal';
import { categoryIconArt } from '../assets/soulmon/icons/categories';
import { ACTIVITY_CATEGORIES } from '../types/categories';

installDomGlobals();
afterEach(cleanup);

describe('CreateChoicePopup (bottom sheet)', () => {
  for (const w of [360, 375, 412]) {
    it(`${w}px: sheet na base, botões no topo, sem moldura, tipo certo`, () => {
      (window as any).innerWidth = w;
      const onPick = vi.fn();
      renderWithCss(<CreateChoicePopup open language="pt-BR" onClose={() => {}} onPick={onPick} />);
      const veu = document.querySelector('.sm2-escolhedor-veu') as HTMLElement;
      expect(getComputedStyle(veu).alignItems).toBe('flex-end');
      expect(document.querySelector('[data-moldura-modal]')).toBeNull();
      expect(document.querySelector('.sm2-moldura-modal--cristal')).toBeNull();
      const sheet = document.querySelector('.sm2-escolhedor')!;
      const filhos = Array.from(sheet.children);
      expect(filhos[1].getAttribute('data-create-choice')).toBe('task'); // primeiro depois da alça
      expect(document.querySelectorAll('[data-create-choice]').length).toBe(2);
      expect(parseInt(getComputedStyle(document.querySelector('.sm2-escolhedor__op')!).minHeight)).toBeGreaterThanOrEqual(44);
      const op = getComputedStyle(document.querySelector('.sm2-escolhedor__op')!);
      expect(op.textAlign).toBe('center');
      expect(op.justifyContent).toBe('center');
      expect(op.fontSize).toBe('var(--sm2-text-lg)');
      for (const k of ['task', 'habit']) {
        const img = document.querySelector(`[data-escolhedor-icone="${k}"]`)!;
        expect(img.getAttribute('alt')).toBe('');
        expect(img.closest('button')!.getAttribute('aria-label')).toBeTruthy();
      }
      fireEvent.click(document.querySelector('[data-create-choice="task"]')!);
      fireEvent.click(document.querySelector('[data-create-choice="habit"]')!);
      expect(onPick.mock.calls).toEqual([['task'], ['habit']]);
    });
  }
  it('Esc e véu fecham; EN; 3ª opção só com onCommit', () => {
    const onClose = vi.fn();
    render(<CreateChoicePopup open language="en-US" onClose={onClose} onPick={() => {}} />);
    expect(document.body.textContent).toContain('New habit');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(document.querySelector('[data-modal-backdrop]')!);
    expect(onClose).toHaveBeenCalledTimes(2);
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
