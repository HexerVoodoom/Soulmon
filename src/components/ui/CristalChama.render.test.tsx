// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { CristalChama } from './CristalChama';

afterEach(cleanup);

describe('CristalChama — ornamento de topo reutilizável', () => {
  it('decorativo: sem alt, aria-hidden, não arrastável, arte neutra', () => {
    const { container } = render(<CristalChama />);
    const el = container.querySelector('.sm2-cristal-chama') as HTMLImageElement;
    expect(el.getAttribute('src')).toMatch(/cristal-chama/);
    expect(el.getAttribute('alt')).toBe('');
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('draggable')).toBe('false');
    expect(el.hasAttribute('data-pulsar')).toBe(false);
  });

  it('tamanho e topo viram variáveis em `u`', () => {
    const { container } = render(<CristalChama tamanho={12} topo={-9} className="x" />);
    const el = container.querySelector('.sm2-cristal-chama') as HTMLImageElement;
    expect(el.style.getPropertyValue('--cristal-w')).toBe('12');
    expect(el.style.getPropertyValue('--cristal-top')).toBe('-9');
    expect(el.className).toContain('x');
  });

  it('pulsar liga o brilho (movimento normal)', () => {
    window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia;
    const { container } = render(<CristalChama pulsar />);
    expect(container.querySelector('.sm2-cristal-chama')!.getAttribute('data-pulsar')).toBe('true');
  });

  it('pulsar com movimento reduzido fica parado', () => {
    window.matchMedia = ((q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia;
    const { container } = render(<CristalChama pulsar />);
    expect(container.querySelector('.sm2-cristal-chama')!.hasAttribute('data-pulsar')).toBe(false);
  });
});
