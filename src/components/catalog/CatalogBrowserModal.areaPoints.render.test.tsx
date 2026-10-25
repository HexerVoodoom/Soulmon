// @vitest-environment jsdom
/** M13b: filtro de ÁREA mostra os 3 valores da regra real (categoria dominante da área). */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { CatalogBrowserModal, dominantCategoryOfArea } from './CatalogBrowserModal';
import { CATEGORY_ATTRIBUTES, type BranchType } from '../../types/attributes';
import { LIFE_AREA_LABEL } from '../../types/activityCatalog';

describe('pontos por área do catálogo', () => {
  it('Sleep mostra os valores de CATEGORY_ATTRIBUTES da categoria dominante', () => {
    renderWithCss(<CatalogBrowserModal isOpen language="en-US" onClose={vi.fn()} onAdd={vi.fn()} onCreateFromScratch={vi.fn()} />);
    expect(screen.queryByTestId('area-points')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: LIFE_AREA_LABEL.sono.en }));
    const box = screen.getByTestId('area-points');
    const dom = dominantCategoryOfArea('sono')!;
    for (const a of ['power', 'harmony', 'benevolence'] as BranchType[]) {
      expect(box.querySelector(`[data-attr="${a}"]`)!.textContent).toContain(`+${CATEGORY_ATTRIBUTES[dom][a]}`);
    }
  });
});
