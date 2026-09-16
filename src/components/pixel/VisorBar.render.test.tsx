// @vitest-environment jsdom
/**
 * `VisorBar` desenha a 1× e é o `scale` do Viewport que a leva a 2×/3×
 * (canvas Sistema SIS-05, R7). O que este arquivo trava:
 *
 *  1. A MOLDURA É RECORTADA AO `max` (canvas Home, D-H2 / X4): largura =
 *     cap 6 + 7·max + cap 6, segmento i em `left = 6 + 7·i`. Uma fórmula
 *     só — é a do README, do rodapé do `Main` e do CSS do canvas. Com a
 *     moldura fixa de 96, HP 3/3 lia como "⅓ cheio" (medidor vazio acusando).
 *  2. TODA medida é múltipla inteira da arte (segmento 6×6, meio = 3, caps de
 *     6, altura 8) — uma barra a 1× dentro de um vidro a 2× estaria numa grade
 *     de pixel diferente da do sprite.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { VisorBar, visorBarWidth } from './VisorBar';

function bar(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-visor-bar]') as HTMLElement;
}
function segs(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('[data-visor-seg]')) as HTMLElement[];
}

describe('VisorBar — moldura ao max (D-H2), 1× por scale', () => {
  it('a fórmula: cap 6 + 7·max + cap 6', () => {
    expect(visorBarWidth(3)).toBe(33);
    expect(visorBarWidth(4)).toBe(40);
    expect(visorBarWidth(6)).toBe(54);
  });

  it('sem `scale`, HP 3 mede 33×8 — a moldura cresce com o max, nunca é 96 fixa', () => {
    const { container } = render(<VisorBar value={2} max={3} label="HP" />);
    const b = bar(container);
    expect(b.style.width).toBe('33px');
    expect(b.style.height).toBe('8px');
    expect(b.getAttribute('data-scale')).toBe('1');
  });

  it('HP 3/3 preenche a moldura inteira (o último segmento encosta no cap direito)', () => {
    const { container } = render(<VisorBar value={3} max={3} label="HP" />);
    const s3 = segs(container);
    expect(s3).toHaveLength(3);
    // último segmento: left 6 + 7·2 = 20, largura 6 → termina em 26; cap direito começa em 27.
    expect(s3[2].style.left).toBe('20px');
    expect(parseFloat(s3[2].style.left) + 6).toBeLessThanOrEqual(visorBarWidth(3) - 6);
  });

  it('scale 2: EN 4 = 80×16, segmentos 12×12 em 12 + 14·i', () => {
    const { container } = render(<VisorBar value={2} max={4} scale={2} label="EN" />);
    const b = bar(container);
    expect(b.style.width).toBe('80px');
    expect(b.style.height).toBe('16px');
    const s2 = segs(container);
    expect(s2).toHaveLength(2);
    expect(s2[0].style.width).toBe('12px');
    expect(s2[0].style.height).toBe('12px');
    expect(s2[0].style.left).toBe('12px');   // (6 + 0×7) × 2
    expect(s2[1].style.left).toBe('26px');   // (6 + 1×7) × 2
  });

  it('a moldura é fatiada da arte do kit: trilho à esquerda + cap direito (transição até a arte em grade)', () => {
    const { container } = render(<VisorBar value={1} max={5} scale={2} label="HP" />);
    const b = bar(container);
    const capL = b.querySelector('[data-visor-cap="l"]') as HTMLElement;
    const capR = b.querySelector('[data-visor-cap="r"]') as HTMLElement;
    // esquerda: a arte ancorada em 0 0 até `w − cap`; direita: o cap de 6 (12 a 2×)
    expect(capL.style.left).toBe('0px');
    expect(capL.style.right).toBe('12px');
    expect(capL.style.backgroundPosition).toBe('0px 0px');
    expect(capR.style.width).toBe('12px');
    expect(capR.style.backgroundPosition).toBe('100% 0px');
    for (const el of [capL, capR]) expect(el.style.backgroundImage).toMatch(/bar-frame/);
  });

  it('meio coração a 2× = segmento de 6px (3 lógicos)', () => {
    const { container } = render(<VisorBar value={1.5} max={3} scale={2} label="HP" />);
    const s2 = segs(container);
    expect(s2).toHaveLength(2);
    expect(s2[1].style.width).toBe('6px');
  });

  it('escala fracionária é arredondada — nunca meio pixel', () => {
    const { container } = render(<VisorBar value={1} max={3} scale={2.4} label="HP" />);
    expect(bar(container).style.width).toBe('66px');
  });

  it('valor 0 e 0,5: moldura inteira, segmentos vazios (a leitura é o segmento, E5)', () => {
    const zero = render(<VisorBar value={0} max={3} label="HP" />);
    expect(segs(zero.container)).toHaveLength(0);
    expect(bar(zero.container).style.width).toBe('33px');
    zero.unmount();
    const meio = render(<VisorBar value={0.5} max={3} label="HP" />);
    expect(segs(meio.container)).toHaveLength(1);
    expect(segs(meio.container)[0].style.width).toBe('3px');
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
