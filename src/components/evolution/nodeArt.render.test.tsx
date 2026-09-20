// @vitest-environment jsdom
/**
 * Teste de render do `NodeArt` — o anel do nó em SVG por token (H1 a).
 *
 * Motivo de existir: o cabeçalho do `nodeArt.tsx` sempre prometeu um contrato
 * para quem chama — "(visual) → um quadrado NODE_SIZE², decorativo, com o
 * centro do anel no centro da caixa" — e esse contrato já foi exercido duas
 * vezes (SVG → PNG em 18/08/2026, PNG → SVG em 20/09/2026). `SoulNode`
 * posiciona o vidro circular por cima assumindo a caixa quadrada e o anel
 * concêntrico; se o desenho vazar do quadrado ou o anel sair do centro, o
 * vidro deixa de ser concêntrico longe daqui, e em silêncio.
 *
 * O que fica travado: os quatro estados são DISTINTOS (senão a hierarquia
 * visual que carrega o significado desaparece — canvas D-E3: halo / tracejado
 * / cinza / ciano-escuro), todo anel é TOKEN (nenhum literal de cor), o traço
 * é 3 (a fronteira do controle, WCAG 1.4.11), a caixa é 88² e a arte segue
 * decorativa para leitores de tela.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NodeArt, NODE_GLASS, NODE_SIZE, NODE_SPRITE, type SoulNodeVisual } from './nodeArt';

const VISUAIS: SoulNodeVisual[] = ['current', 'reached', 'forecast', 'locked'];

const assinatura = (visual: SoulNodeVisual, busy = false) => {
  const { container, unmount } = render(<NodeArt visual={visual} busy={busy} />);
  const ring = container.querySelector('[data-node-ring]') as SVGCircleElement;
  const halo = container.querySelector('[data-node-halo]');
  const out = {
    stroke: ring.getAttribute('stroke'),
    dash: ring.getAttribute('stroke-dasharray'),
    width: ring.getAttribute('stroke-width'),
    halo: Boolean(halo),
  };
  unmount();
  return out;
};

describe('NodeArt', () => {
  it('cada estado visual tem assinatura PRÓPRIA — nenhum reaproveita a do outro', () => {
    const chaves = VISUAIS.map(v => {
      const a = assinatura(v);
      return `${a.stroke}|${a.dash ?? ''}|${a.halo}`;
    });
    expect(new Set(chaves).size, `estados com anel repetido: ${chaves.join(' · ')}`).toBe(VISUAIS.length);
  });

  it('todo anel é token, traço 3 (a fronteira do controle)', () => {
    for (const v of VISUAIS) {
      const a = assinatura(v);
      expect(a.stroke, v).toMatch(/^var\(--sm2-/);
      expect(a.width, v).toBe('3');
    }
  });

  it('só o ATUAL tem halo; só o PREVISTO é tracejado por estado', () => {
    expect(assinatura('current').halo).toBe(true);
    expect(VISUAIS.filter(v => assinatura(v).halo)).toEqual(['current']);
    expect(VISUAIS.filter(v => assinatura(v).dash)).toEqual(['forecast']);
  });

  it('`busy` (o Oráculo desenhando) traceja sem trocar o tom do estado', () => {
    const parado = assinatura('reached');
    const ocupado = assinatura('reached', true);
    expect(ocupado.stroke).toBe(parado.stroke);
    expect(ocupado.dash).toBe('6 5');
  });

  it('a caixa é 88², o anel é concêntrico e as três medidas do canvas batem (88 / 80 / 64)', () => {
    const { container } = render(<NodeArt visual="current" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe(String(NODE_SIZE));
    expect(svg.getAttribute('height')).toBe(String(NODE_SIZE));
    const ring = container.querySelector('[data-node-ring]')!;
    expect(ring.getAttribute('cx')).toBe(String(NODE_SIZE / 2));
    expect(ring.getAttribute('cy')).toBe(String(NODE_SIZE / 2));
    expect([NODE_SIZE, NODE_GLASS, NODE_SPRITE]).toEqual([88, 80, 64]);
  });

  it('é decorativa: nada para o leitor de tela anunciar', () => {
    render(<NodeArt visual="reached" />);
    expect(screen.queryByRole('img')).toBeNull();
  });
});
