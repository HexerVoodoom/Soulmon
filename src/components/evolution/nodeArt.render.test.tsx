// @vitest-environment jsdom
/**
 * Teste de render do `NodeArt`.
 *
 * Motivo de existir: o cabeçalho do `nodeArt.tsx` sempre prometeu um contrato
 * para quem chama — "(visual, size) → um quadrado de `size`×`size` px,
 * decorativo, com o centro do cristal no centro da caixa" — e esse contrato
 * era só um comentário. Ele acabou de ser exercido de verdade: a arte trocou
 * de SVG para PNG (2026-08-18), e é exatamente numa troca dessas que um
 * contrato escrito só em prosa se perde. `SoulNode` posiciona o anel e o
 * sprite pousado por cima, e `EvolutionPath` liga as linhas do grafo, os dois
 * assumindo a caixa quadrada — se o novo desenho vazar do quadrado ou virar
 * `inline`, os dois quebram longe daqui, e em silêncio.
 *
 * O que fica travado: os quatro estados existem e são DISTINTOS (senão a
 * hierarquia visual que carrega o significado desaparece), a caixa é quadrada
 * do tamanho pedido, e a arte segue decorativa para leitores de tela.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NodeArt, type SoulNodeVisual } from './nodeArt';

const VISUAIS: SoulNodeVisual[] = ['current', 'reached', 'forecast', 'locked'];

describe('NodeArt', () => {
  it('cada estado visual tem arte PRÓPRIA — nenhum reaproveita a do outro', () => {
    const srcs = VISUAIS.map(visual => {
      const { container, unmount } = render(<NodeArt visual={visual} size={44} />);
      const img = container.querySelector('img');
      const src = img?.getAttribute('src') ?? '';
      unmount();
      return src;
    });
    expect(srcs.every(Boolean), 'algum estado ficou sem arte').toBe(true);
    expect(new Set(srcs).size, `estados com arte repetida: ${srcs.join(', ')}`).toBe(VISUAIS.length);
  });

  it('a caixa é um quadrado do tamanho pedido (o anel e o grafo dependem disso)', () => {
    const { container } = render(<NodeArt visual="current" size={44} />);
    const img = container.querySelector('img')!;
    expect(img.getAttribute('width')).toBe('44');
    expect(img.getAttribute('height')).toBe('44');
  });

  it('é decorativa: nada para o leitor de tela anunciar', () => {
    render(<NodeArt visual="reached" size={44} />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('o `tone` do galho tinge sem esconder o facetado da arte', () => {
    // A tintura entra como camada recortada pela silhueta; se um dia virar um
    // preenchimento chapado por cima, o volume do pixel art some e este caso
    // é quem avisa.
    const { container } = render(<NodeArt visual="reached" size={44} tone="#ff8800" />);
    const camada = container.querySelectorAll('span > span')[0] as HTMLElement;
    expect(camada, 'tone não gerou camada de tintura').toBeTruthy();
    expect(camada.style.mixBlendMode).toBe('color');
    expect(Number(camada.style.opacity)).toBeLessThan(1);
  });

  it('sem `tone` não há camada extra — o padrão é a arte crua', () => {
    const { container } = render(<NodeArt visual="reached" size={44} />);
    expect(container.querySelectorAll('span > span').length).toBe(0);
  });
});
