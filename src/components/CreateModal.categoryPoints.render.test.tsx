// @vitest-environment jsdom
/** M13: ao escolher a categoria, os 3 valores vêm da regra real (CATEGORY_ATTRIBUTES). */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CategoryChips } from './CreateModal';
import { CATEGORY_ATTRIBUTES, ATTR_LABEL, type ActivityCategory, type BranchType } from '../types/attributes';
import { categoryLabel } from '../types/category-icons';
import { useState } from 'react';

function Harness({ isPt }: { isPt: boolean }) {
  const [c, setC] = useState<ActivityCategory>('corpo');
  return <CategoryChips category={c} setCategory={setC} isPt={isPt} />;
}

describe('caixa de atributos: zero cinza, positivo em negrito, +2 em destaque', () => {
  it('corpo (2/1/0): Poder destacado, Harmonia em negrito, Benevolência cinza', () => {
    render(<Harness isPt={false} />);
    const box = screen.getByTestId('category-points');
    const power = box.querySelector('[data-attr="power"]') as HTMLElement;
    const harmony = box.querySelector('[data-attr="harmony"]') as HTMLElement;
    const benev = box.querySelector('[data-attr="benevolence"]') as HTMLElement;
    expect(power.dataset.points).toBe('high');
    expect(power.style.fontWeight).toBe('700');
    expect(power.style.boxShadow).not.toBe('');
    expect(harmony.dataset.points).toBe('low');
    expect(harmony.style.fontWeight).toBe('700');
    expect(harmony.style.boxShadow).toBe('');
    expect(benev.dataset.points).toBe('zero');
    expect(benev.style.color).toBe('var(--sm2-muted)');
    expect(benev.style.fontWeight).toBe('400');
    cleanup();
  });
});

describe('pontos por categoria no criar', () => {
  for (const isPt of [false, true]) {
    it(`mostra os 3 valores da regra (${isPt ? 'PT' : 'EN'})`, () => {
      vi.clearAllMocks();
      render(<Harness isPt={isPt} />);
      const cat: ActivityCategory = 'mente';
      fireEvent.click(screen.getByText(categoryLabel(cat, isPt)));
      const box = screen.getByTestId('category-points');
      for (const a of ['power', 'harmony', 'benevolence'] as BranchType[]) {
        const row = box.querySelector(`[data-attr="${a}"]`)!;
        expect(row.textContent).toContain(isPt ? ATTR_LABEL[a].pt : ATTR_LABEL[a].en);
        expect(row.textContent).toContain(`+${CATEGORY_ATTRIBUTES[cat][a]}`);
      }
      cleanup();
    });
  }
});
