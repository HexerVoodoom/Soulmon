// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { BitsIcon } from './BitsIcon';

afterEach(cleanup);

// 04/10/2026: a arte do dono (`assets/icons/bits.png`) chegou — o glob a detecta e ela vale no lugar do
// SVG provisório. O SVG continua no componente como fallback de arquivo ausente.
describe('BitsIcon — a moeda dos Bits (I4)', () => {
  it('com a arte própria desenha o PNG do dono, decorativo, pixelado', () => {
    const { container } = render(<BitsIcon />);
    const el = container.querySelector('[data-bits-kind]') as HTMLImageElement;
    expect(el.getAttribute('data-bits-kind')).toBe('art');
    expect(el.getAttribute('src')).toMatch(/bits/);
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('width')).toBe('20');
    expect(el.style.imageRendering).toBe('pixelated');
  });

  it('com `label` vira imagem nomeada (ícone sozinho, sem o texto Bits ao lado)', () => {
    const { container } = render(<BitsIcon label="Bits" size={32} />);
    const el = container.querySelector('[data-bits-kind]') as HTMLImageElement;
    expect(el.getAttribute('alt')).toBe('Bits');
    expect(el.hasAttribute('aria-hidden')).toBe(false);
    expect(el.getAttribute('width')).toBe('32');
  });
});
