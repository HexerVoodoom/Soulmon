// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { Field } from './FormKit';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

/** QA L06-02: no aparelho o teclado cobria o campo e o "Continuar", e a página não se mexia. */
describe('Field — teclado virtual', () => {
  it('ao focar, traz o campo para o meio da área visível depois que o teclado abre', () => {
    const scroll = vi.fn();
    (HTMLElement.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = scroll;
    const { container } = render(<Field aria-label="nome" />);
    fireEvent.focus(container.querySelector('input') as HTMLInputElement);
    expect(scroll).not.toHaveBeenCalled(); // espera o teclado
    vi.advanceTimersByTime(400);
    expect(scroll).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' });
  });

  it('o viewport pede que o layout encolha com o teclado (interactive-widget=resizes-content)', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toMatch(/<meta name="viewport"[^>]*interactive-widget=resizes-content/);
  });
});
