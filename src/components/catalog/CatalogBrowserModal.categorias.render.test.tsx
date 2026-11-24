// @vitest-environment jsdom
/** Chips de área do catálogo: arte de categoria, UMA linha, mesma altura (CSS real), 360/375/412. */
import { describe, it, expect, vi } from 'vitest';
import { renderWithCss } from '../../test/renderEnv';
import { CatalogBrowserModal } from './CatalogBrowserModal';
import { LIFE_AREAS } from '../../types/activityCatalog';

describe('catálogo: chips de área', () => {
  for (const w of [360, 375, 412]) {
    it(`${w}px: ícone em cada área, nowrap, altura igual, faixa rola`, () => {
      (window as any).innerWidth = w;
      renderWithCss(<CatalogBrowserModal isOpen language="en-US" onClose={vi.fn()} onAdd={vi.fn()} onCreateFromScratch={vi.fn()} />);
      const faixa = document.querySelector('.sm2-catalogo-areas') as HTMLElement;
      const chips = Array.from(faixa.querySelectorAll('[role="radio"]')) as HTMLElement[];
      expect(chips.length).toBe(LIFE_AREAS.length + 1);
      for (const a of LIFE_AREAS) expect(faixa.querySelector(`[data-cat-icon="${a}"]`), a).not.toBeNull();
      const cs = chips.map(c => getComputedStyle(c));
      expect(new Set(cs.map(s => s.height)).size).toBe(1);
      expect(cs.every(s => s.whiteSpace === 'nowrap')).toBe(true);
      expect(getComputedStyle(faixa).overflowX).toBe('auto');
    });
  }
});
