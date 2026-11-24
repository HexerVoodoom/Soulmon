// @vitest-environment jsdom
/**
 * Teste de render do `NodeArt` — só o ANEL do nó, em CSS (24/11/2026): sem PNG, sem miolo preto; o estado vem de `data-node-art`,
 * a cor do ramo da variável `--sm2-no-cor`, `busy` só marca o estado, a caixa é decorativa.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NodeArt, NODE_GLASS, NODE_SIZE, NODE_SPRITE, type SoulNodeVisual } from './nodeArt';

const VISUAIS: SoulNodeVisual[] = ['current', 'reached', 'forecast', 'locked'];

describe('NodeArt', () => {
  it('cada estado marca o próprio data-node-art e não usa imagem', () => {
    for (const v of VISUAIS) {
      const { container, unmount } = render(<NodeArt visual={v} />);
      expect(container.querySelector(`[data-node-art="${v}"]`)).toBeTruthy();
      expect(container.querySelector('img')).toBeNull();
      unmount();
    }
  });

  it('a cor do ramo entra só quando pedida, pela variável do anel', () => {
    const { container, rerender } = render(<NodeArt visual="reached" />);
    const el = () => container.querySelector('[data-node-art]') as HTMLElement;
    expect(el().style.getPropertyValue('--sm2-no-cor')).toBe('');
    rerender(<NodeArt visual="reached" ringColor="#22aa55" />);
    expect(el().style.getPropertyValue('--sm2-no-cor')).toBe('#22aa55');
  });

  it('`busy` só marca o estado', () => {
    const { container } = render(<NodeArt visual="reached" busy />);
    expect(container.querySelector('[data-node-art]')?.getAttribute('data-busy')).toBe('true');
  });

  it('o anel é contorno fino de 2px sem preenchimento (CSS-fonte) e as medidas do canvas seguem 88 / 80 / 64', () => {
    const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf8');
    const regra = css.match(/\.sm2-evo-no-arte \{[^}]*\}/)?.[0] ?? '';
    expect(regra).toContain('border: 2px solid');
    expect(regra).not.toMatch(/background/);
    expect([NODE_SIZE, NODE_GLASS, NODE_SPRITE]).toEqual([88, 80, 64]);
  });

  it('é decorativa: nada para o leitor de tela anunciar', () => {
    render(<NodeArt visual="reached" />);
    expect(screen.queryByRole('img')).toBeNull();
  });
});
