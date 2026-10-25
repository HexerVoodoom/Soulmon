// @vitest-environment jsdom
/** M13: ao escolher a categoria, os 3 valores vêm da regra real (CATEGORY_ATTRIBUTES). */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CategoryChips } from './CreateModal';
import { CATEGORY_ATTRIBUTES, ATTR_LABEL, type ActivityCategory, type BranchType } from '../types/attributes';
import { categoryLabel } from '../types/category-icons';
import { useState } from 'react';

function Harness({ isPt }: { isPt: boolean }) {
  const [c, setC] = useState<ActivityCategory>('Health');
  return <CategoryChips category={c} setCategory={setC} isPt={isPt} />;
}

describe('pontos por categoria no criar', () => {
  for (const isPt of [false, true]) {
    it(`mostra os 3 valores da regra (${isPt ? 'PT' : 'EN'})`, () => {
      vi.clearAllMocks();
      render(<Harness isPt={isPt} />);
      const cat: ActivityCategory = 'Wellness';
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
