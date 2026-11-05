// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { CornerLink } from './CornerLink';

afterEach(cleanup);

describe('CornerLink', () => {
  it('o Mapa da Home é maior e cresce para a esquerda, sem mudar o alvo de toque', () => {
    const { container } = render(<CornerLink icon="mapa" side="right" label="Mapa" onClick={() => {}} />);
    const box = container.querySelector('[data-corner-link]') as HTMLElement;
    const icon = container.querySelector('[data-corner-map-icon]') as HTMLElement;
    expect(box.style.width).toBe('56px');
    expect(icon.style.transform).toBe('scale(1.375)');
    expect(icon.style.transformOrigin).toBe('right center');
  });
  it('a casinha do Mapa segue igual', () => {
    const { container } = render(<CornerLink icon="home" side="left" label="Home" onClick={() => {}} />);
    expect(container.querySelector('[data-corner-map-icon]')).toBeNull();
  });
});
