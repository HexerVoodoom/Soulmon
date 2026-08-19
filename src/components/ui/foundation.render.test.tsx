// @vitest-environment jsdom
/**
 * As duas peças da fundação: `Icon` e `Viewport`.
 *
 * O que é travado aqui é o que as ondas seguintes vão consumir sem reler o
 * código: a API pública e as três regras que não podem afrouxar — ícone sem
 * box, `opsz` casado ao tamanho, escala INTEIRA no visor.
 *
 * Monta com `renderWithCss` (o `index.css` real dentro do documento), e não
 * com o `render` cru: metade do valor destes casos está na FRONTEIRA JSX↔CSS
 * (footgun 1). Um `className` que não existe no CSS pré-compilado falha em
 * silêncio, e é justamente esse silêncio que este ambiente quebra.
 */
import { describe, it, expect } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderWithCss, computed } from '../../test/renderEnv';
import { Icon } from './Icon';
import { Viewport } from './Viewport';

const render = renderWithCss;

describe('Icon', () => {
  it('renderiza a ligature e casa `opsz` com o tamanho', () => {
    render(<Icon name="favorite" size={32} />);
    const el = screen.getByText('favorite');
    expect(el.className).toContain('sm2-icon');
    expect(el.style.fontSize).toBe('32px');
    expect(el.style.getPropertyValue('--sm2-icon-opsz')).toBe('32');
  });

  it('clampa `opsz` na faixa 20–48 da fonte', () => {
    // Fora da faixa, `font-variation-settings` inteiro é invalidado em alguns
    // WebViews — o ícone perderia junto o FILL e o wght, não só o opsz.
    render(<Icon name="home" size={64} />);
    expect(screen.getByText('home').style.getPropertyValue('--sm2-icon-opsz')).toBe('48');
    cleanup();
    render(<Icon name="home" size={12} />);
    expect(screen.getByText('home').style.getPropertyValue('--sm2-icon-opsz')).toBe('20');
  });

  it('FILL é o sistema de estado e aceita valor fracionário', () => {
    render(<Icon name="favorite" fill={0.4} />);
    expect(screen.getByText('favorite').style.getPropertyValue('--sm2-icon-fill')).toBe('0.4');
  });

  it('o peso padrão é 500 (é o que casa com o pixel do sprite)', () => {
    render(<Icon name="pets" />);
    expect(screen.getByText('pets').style.getPropertyValue('--sm2-icon-wght')).toBe('500');
  });

  it('sem `label` é decorativo; com `label` vira imagem nomeada', () => {
    const { container } = render(<Icon name="settings" />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    cleanup();
    render(<Icon name="settings" label="Settings" />);
    const nomeado = screen.getByRole('img', { name: 'Settings' });
    expect(nomeado.getAttribute('aria-hidden')).toBeNull();
  });

  it('não deixa o GRAD do tema vazar quando `grade` não é passado', () => {
    // Sem `grade`, o valor tem que vir do CSS (0 no claro, -25 no escuro).
    // Se o componente escrevesse um default inline, o tema perderia o eixo.
    render(<Icon name="star" />);
    expect(screen.getByText('star').style.getPropertyValue('--sm2-icon-grad')).toBe('');
  });

  it('REGRA DO DONO: não desenha moldura, fundo nem borda', () => {
    const { container } = render(<Icon name="star" tone="gold" />);
    const el = container.firstElementChild as HTMLElement;
    for (const p of ['background', 'backgroundColor', 'border', 'boxShadow', 'padding'] as const) {
      expect(el.style[p], `Icon não pode desenhar ${p}`).toBe('');
    }
    expect(el.className).toContain('sm2-icon-gold');
  });

  it('FRONTEIRA JSX↔CSS: as classes do ícone existem mesmo no index.css', () => {
    // Footgun 1: classe ausente do CSS pré-compilado não aplica NADA e não
    // avisa. Aqui a cascata real responde — se `.sm2-icon` sumir do arquivo,
    // estas propriedades voltam vazias.
    const { container } = render(<Icon name="star" tone="primary" />);
    const el = container.firstElementChild as HTMLElement;
    // jsdom resolve a cascata mas NÃO substitui `var()` — o que ele prova é
    // que a regra existe e chegou no elemento, que é a pergunta aqui.
    expect(computed(el, 'font-family')).toBe('var(--sm2-font-icon)');
    expect(computed(el, 'font-variation-settings')).toContain('FILL');
    expect(computed(el, 'color')).toBe('var(--sm2-primary-ink)');
    expect(computed(el, '--sm2-font-icon')).toContain('Material Symbols Rounded');
  });
});

describe('Viewport', () => {
  it('amplia por inteiro e derruba escala fracionária', () => {
    const { container } = render(<Viewport width={64} height={48} scale={3} />);
    const tela = container.querySelector('.sm2-viewport-screen') as HTMLElement;
    expect(tela.style.width).toBe('192px');
    expect(tela.style.height).toBe('144px');
    cleanup();
    // Escala fracionária é a causa nº1 de pixel art borrada: arredonda.
    const frac = render(<Viewport width={32} height={32} scale={2.4 as 2} />);
    const t2 = frac.container.querySelector('.sm2-viewport-screen') as HTMLElement;
    expect(t2.style.width).toBe('64px');
  });

  it('tem bisel, tela e UM único reflexo', () => {
    const { container } = render(<Viewport width={32} height={32} />);
    expect(container.querySelectorAll('.sm2-viewport').length).toBe(1);
    expect(container.querySelectorAll('.sm2-viewport-screen').length).toBe(1);
    expect(container.querySelectorAll('.sm2-viewport-glass').length).toBe(1);
  });

  it('respira por padrão e para quando `breathing` é falso', () => {
    const { container } = render(<Viewport width={32} height={32} />);
    expect(container.firstElementChild?.className).not.toContain('sm2-viewport-still');
    cleanup();
    const parado = render(<Viewport width={32} height={32} breathing={false} />);
    expect(parado.container.firstElementChild?.className).toContain('sm2-viewport-still');
  });

  it('sem `label` é decorativo; com `label` é imagem nomeada', () => {
    const { container } = render(<Viewport width={32} height={32} />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    cleanup();
    render(<Viewport width={32} height={32} label="Your Soulmon" />);
    expect(screen.getByRole('img', { name: 'Your Soulmon' })).toBeTruthy();
  });

  it('renderiza o conteúdo dentro da tela, não fora do bisel', () => {
    const { container } = render(
      <Viewport width={32} height={32}>
        <span data-testid="sprite" />
      </Viewport>,
    );
    const tela = container.querySelector('.sm2-viewport-screen');
    expect(tela?.querySelector('[data-testid="sprite"]')).toBeTruthy();
  });
});
