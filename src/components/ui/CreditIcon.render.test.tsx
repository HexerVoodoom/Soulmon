// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { CreditIcon } from './CreditIcon';

beforeEach(() => { installDomGlobals(); });
afterEach(() => cleanup());

describe('CreditIcon (diamante turquesa dos Créditos, 18/11/2026)', () => {
  it('decorativo por padrão: img vazia, aria-hidden, tamanho 20', () => {
    const { container } = render(<CreditIcon />);
    const img = container.querySelector('img[data-credit-icon]')!;
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true');
    expect(img.getAttribute('width')).toBe('20');
    expect(img.getAttribute('src')).toBeTruthy();
  });
  it('com label vira imagem nomeada e respeita o tamanho', () => {
    const { container } = render(<CreditIcon size={24} label="Créditos" />);
    const img = container.querySelector('img[data-credit-icon]')!;
    expect(img.getAttribute('alt')).toBe('Créditos');
    expect(img.getAttribute('aria-hidden')).toBeNull();
    expect(img.getAttribute('height')).toBe('24');
  });
});
