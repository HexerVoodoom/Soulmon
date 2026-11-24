// @vitest-environment jsdom
/**
 * Teste de render do `NodeArt` — a moldura do nó em PNG (arte A do dono, 4 estados, 24/11/2026).
 *
 * Contrato para quem chama (o `SoulNode` posiciona o vidro de 80 por cima): um quadrado `NODE_SIZE²`, decorativo, com a abertura
 * concêntrica. Travado aqui: os quatro estados usam 4 PNGs DISTINTOS, só o `ringColor` ganha a camada de matiz, `busy` só marca o
 * estado, a caixa é 88² e a arte segue invisível para o leitor de tela.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NodeArt, NODE_GLASS, NODE_SIZE, NODE_SPRITE, type SoulNodeVisual } from './nodeArt';

const VISUAIS: SoulNodeVisual[] = ['current', 'reached', 'forecast', 'locked'];

const srcDe = (visual: SoulNodeVisual) => {
  const { container, unmount } = render(<NodeArt visual={visual} />);
  const src = (container.querySelector('[data-node-frame]') as HTMLImageElement).getAttribute('src');
  unmount();
  return src;
};

describe('NodeArt', () => {
  it('cada estado visual usa um PNG PRÓPRIO (normal/atual/alcançado/bloqueado)', () => {
    const srcs = VISUAIS.map(srcDe);
    expect(new Set(srcs).size).toBe(VISUAIS.length);
    expect(srcDe('current')).toMatch(/evo-no-A-atual/);
    expect(srcDe('reached')).toMatch(/evo-no-A-alcancado/);
    expect(srcDe('forecast')).toMatch(/evo-no-A-normal/);
    expect(srcDe('locked')).toMatch(/evo-no-A-bloqueado/);
  });

  it('a cor do ramo entra só quando pedida, como camada de matiz sobre a mesma máscara', () => {
    const { container, rerender } = render(<NodeArt visual="reached" />);
    expect(container.querySelector('[data-node-tint]')).toBeNull();
    rerender(<NodeArt visual="reached" ringColor="#22aa55" />);
    const t = container.querySelector('[data-node-tint]') as HTMLElement;
    expect(t).toBeTruthy();
    expect(t.style.background).toBeTruthy();
  });

  it('`busy` marca o estado sem trocar o PNG', () => {
    const { container } = render(<NodeArt visual="reached" busy />);
    expect(container.querySelector('[data-node-art]')?.getAttribute('data-busy')).toBe('true');
    expect((container.querySelector('[data-node-frame]') as HTMLImageElement).getAttribute('src')).toBe(srcDe('reached'));
  });

  it('a caixa é 88² e as três medidas do canvas batem (88 / 80 / 64)', () => {
    const { container } = render(<NodeArt visual="current" />);
    const img = container.querySelector('[data-node-frame]')!;
    expect(img.getAttribute('width')).toBe(String(NODE_SIZE));
    expect(img.getAttribute('height')).toBe(String(NODE_SIZE));
    expect([NODE_SIZE, NODE_GLASS, NODE_SPRITE]).toEqual([88, 80, 64]);
  });

  it('é decorativa: nada para o leitor de tela anunciar', () => {
    render(<NodeArt visual="reached" />);
    expect(screen.queryByRole('img')).toBeNull();
  });
});
