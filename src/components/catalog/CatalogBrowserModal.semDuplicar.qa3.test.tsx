// @vitest-environment jsdom
// QA3 REGRESSAO: item do catálogo que JÁ está na lista continuava com "Adicionar" e criava uma 2ª cópia.
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { CatalogBrowserModal } from './CatalogBrowserModal';
import { ACTIVITY_CATALOG } from '../../data/activityCatalog';

describe('CatalogBrowserModal sem duplicar', () => {
  it('item já na lista não oferece "Adicionar" e não chama onAdd', () => {
    const onAdd = vi.fn();
    const todos = ACTIVITY_CATALOG.filter(i => !i.optInOnly);
    renderWithCss(
      <CatalogBrowserModal isOpen language="pt-BR" onClose={vi.fn()} onAdd={onAdd} onCreateFromScratch={vi.fn()}
        existingActivities={[{ catalogId: todos[0].id }]} />,
    );
    const antes = screen.getAllByRole('button', { name: /^adicionar$/i }).length;
    const adicionado = screen.getAllByRole('button', { name: /adicionado/i });
    expect(adicionado.length).toBeGreaterThan(0);
    fireEvent.click(adicionado[0]);
    expect(onAdd).not.toHaveBeenCalled();
    expect(antes).toBeGreaterThan(0);
  });
});
