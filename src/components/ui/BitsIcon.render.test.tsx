// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { BitsIcon } from './BitsIcon';

afterEach(cleanup);

describe('BitsIcon — a moeda dos Bits (I4)', () => {
  it('sem arte própria desenha o SVG pixel provisório, decorativo, em tokens de cor', () => {
    const { container } = render(<BitsIcon />);
    const el = container.querySelector('[data-bits-kind]') as Element;
    expect(el).not.toBeNull();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('width')).toBe('20');
    expect(el.getAttribute('shape-rendering')).toBe('crispEdges');
    const fills = new Set(Array.from(el.querySelectorAll('rect')).map(r => r.getAttribute('fill')));
    for (const f of fills) expect(f).toMatch(/^var\(--sm2-/);
  });

  it('com `label` vira imagem nomeada (ícone sozinho, sem o texto Bits ao lado)', () => {
    const { container } = render(<BitsIcon label="Bits" size={32} />);
    const el = container.querySelector('[data-bits-kind]') as Element;
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Bits');
    expect(el.getAttribute('width')).toBe('32');
  });
});
