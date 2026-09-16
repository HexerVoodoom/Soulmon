// @vitest-environment jsdom
/**
 * O CONTRATO DO VISOR, travado por teste em vez de por convenção.
 *
 * O `Viewport` existe por UMA razão: a tela mede `width * scale` device px, com
 * `scale` INTEIRO. Escala fracionária é a causa nº 1 de pixel art borrada, e
 * `image-rendering: pixelated` não salva meio pixel — ele troca o borrão por
 * linhas de espessura desigual.
 *
 * Só que a regra era mantida por ORDEM DE PROPRIEDADE dentro de um objeto:
 * `style={{ width: w*s, height: h*s, ...screenStyle }}`. Com o spread depois,
 * qualquer chamador que passasse `width`/`height` em `screenStyle` apagava a
 * regra inteira sem erro, sem aviso e sem type error — foi exatamente o bug
 * corrigido no ciclo passado no `CompanionHUD` (`width:'100%'` +
 * `height:var(--sm-petstage-h)`).
 *
 * Este arquivo é o guard: o caso hostil abaixo é o bug real, escrito de
 * propósito. Se alguém reinverter a ordem, ele cai aqui em vez de cair na tela
 * de um jogador.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Viewport } from './Viewport';

function screenOf(container: HTMLElement): HTMLElement {
  const el = container.querySelector('.sm2-viewport-screen');
  if (!el) throw new Error('a tela do visor não renderizou');
  return el as HTMLElement;
}

describe('Viewport — a medida da tela é do componente, não do chamador', () => {
  it('a tela mede width*scale × height*scale', () => {
    const { container } = render(<Viewport width={64} height={48} scale={2} />);
    const tela = screenOf(container);
    expect(tela.style.width).toBe('128px');
    expect(tela.style.height).toBe('96px');
  });

  it('scale 3 também é inteiro e derivado', () => {
    const { container } = render(<Viewport width={40} height={30} scale={3} />);
    const tela = screenOf(container);
    expect(tela.style.width).toBe('120px');
    expect(tela.style.height).toBe('90px');
  });

  it('BUG REAL: `screenStyle` com width/height NÃO derruba a escala inteira', () => {
    const { container } = render(
      <Viewport
        width={64}
        height={48}
        scale={2}
        // Exatamente o que o CompanionHUD passava e que anulava o contrato.
        screenStyle={{ width: '100%', height: 'var(--sm-petstage-h)' }}
      />,
    );
    const tela = screenOf(container);
    expect(tela.style.width, 'o chamador venceu a escala inteira').toBe('128px');
    expect(tela.style.height, 'o chamador venceu a escala inteira').toBe('96px');
  });

  it('`screenStyle` continua decorando o que NÃO é medida', () => {
    const { container } = render(
      <Viewport width={32} height={32} scale={2} screenStyle={{ background: 'rgb(1, 2, 3)' }} />,
    );
    const tela = screenOf(container);
    expect(tela.style.background).toContain('rgb(1, 2, 3)');
    expect(tela.style.width).toBe('64px');
  });

  it('escala não-inteira passada à força é arredondada (nunca fracionária)', () => {
    // `as any`: o tipo já proíbe: este caso cobre o JSX destipado / JS puro.
    const { container } = render(<Viewport width={50} height={50} scale={2.5 as unknown as 2} />);
    const tela = screenOf(container);
    const px = parseFloat(tela.style.width);
    expect(Number.isInteger(px / 50), `escala fracionária vazou: ${tela.style.width}`).toBe(true);
  });

  /**
   * X2 do canvas Sistema (SIS-05): a moldura 9-slice é overlay DENTRO do
   * vidro, sob o reflexo. Fora do `.screen` ela vira PNG pixel na superfície
   * do aparelho — exatamente o que o crítico reprovou no artboard.
   */
  it('`frame` desenha a moldura DENTRO da tela, antes do reflexo, e sem eventos', () => {
    const { container } = render(<Viewport width={64} height={48} scale={2} frame />);
    const tela = screenOf(container);
    const moldura = tela.querySelector('.sm2-viewport-frame') as HTMLElement | null;
    expect(moldura, 'a moldura não está dentro de .sm2-viewport-screen').not.toBeNull();
    expect(moldura!.getAttribute('aria-hidden')).toBe('true');
    expect(moldura!.style.borderImageSource).toMatch(/^url\(/);
    expect(moldura!.style.borderWidth).toBe('24px');
    // sob o reflexo: o vidro é o ÚLTIMO filho, a moldura vem antes
    const filhos = Array.from(tela.children);
    expect(filhos.indexOf(moldura!)).toBeLessThan(filhos.indexOf(tela.querySelector('.sm2-viewport-glass')!));
  });

  it('sem `frame` não há moldura (padrão = nunca na Home)', () => {
    const { container } = render(<Viewport width={64} height={48} scale={2} />);
    expect(screenOf(container).querySelector('.sm2-viewport-frame')).toBeNull();
  });
});
