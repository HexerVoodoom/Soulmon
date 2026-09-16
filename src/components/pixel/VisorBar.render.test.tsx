// @vitest-environment jsdom
/**
 * `VisorBar` desenha a 1× e é o `scale` do Viewport que a leva a 2×/3×
 * (canvas Sistema SIS-05, R7). O que este arquivo trava: TODA medida é
 * múltipla inteira da arte (96×8, segmento 6×6, meio = 3) — uma barra a 1×
 * dentro de um vidro a 2× estaria numa grade de pixel diferente da do sprite.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { VisorBar } from './VisorBar';

function bar(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-visor-bar]') as HTMLElement;
}

describe('VisorBar — 1× por scale', () => {
  it('sem `scale` continua 96×8 (compatível com quem já chamava)', () => {
    const { container } = render(<VisorBar value={2} max={4} label="HP" />);
    const b = bar(container);
    expect(b.style.width).toBe('96px');
    expect(b.style.height).toBe('8px');
    expect(b.getAttribute('data-scale')).toBe('1');
  });

  it('scale 2: caixa 192×16 e cada segmento 12×12, no passo lógico × 2', () => {
    const { container } = render(<VisorBar value={2} max={4} scale={2} label="HP" />);
    const b = bar(container);
    expect(b.style.width).toBe('192px');
    expect(b.style.height).toBe('16px');
    expect(b.style.backgroundSize).toBe('192px 16px');
    const segs = Array.from(b.querySelectorAll('span')) as HTMLElement[];
    expect(segs).toHaveLength(2);
    expect(segs[0].style.width).toBe('12px');
    expect(segs[0].style.height).toBe('12px');
    expect(segs[0].style.left).toBe('8px');   // (4 + 0×6) × 2
    expect(segs[1].style.left).toBe('20px');  // (4 + 1×6) × 2
  });

  it('meio coração a 2× = segmento de 6px (3 lógicos)', () => {
    const { container } = render(<VisorBar value={1.5} max={3} scale={2} label="HP" />);
    const segs = Array.from(bar(container).querySelectorAll('span')) as HTMLElement[];
    expect(segs).toHaveLength(2);
    expect(segs[1].style.width).toBe('6px');
  });

  it('escala fracionária é arredondada — nunca meio pixel', () => {
    const { container } = render(<VisorBar value={1} max={3} scale={2.4} label="HP" />);
    expect(bar(container).style.width).toBe('192px');
  });

  it('é progressbar com os valores reais', () => {
    const { container } = render(<VisorBar value={2.5} max={4} scale={3} label="Hearts" />);
    const b = bar(container);
    expect(b.getAttribute('role')).toBe('progressbar');
    expect(b.getAttribute('aria-valuenow')).toBe('2.5');
    expect(b.getAttribute('aria-valuemax')).toBe('4');
    expect(b.getAttribute('aria-label')).toBe('Hearts');
  });
});
