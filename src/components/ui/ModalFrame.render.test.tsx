// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { ModalFrame } from './ModalFrame';
import { CardFrame } from './CardFrame';

beforeEach(() => { installDomGlobals(); });
afterEach(() => cleanup());

describe('ModalFrame', () => {
  it('renderiza conteúdo, placa de título e a informação (prop `info`) opcionais', () => {
    render(<ModalFrame title="Mercado" info={{ label: 'Sobre o Mercado', content: 'texto', language: 'pt-BR' }}><p>corpo</p></ModalFrame>);
    expect(screen.getByRole('heading', { name: 'Mercado' })).toBeTruthy();
    expect(screen.getByText('corpo')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sobre o Mercado' })).toBeTruthy();
  });
  it('sem title não há placa; repassa data-* e className; opacidade vira variável limitada a 0..1', () => {
    const { container } = render(<ModalFrame data-area-sheet="" className="x" fillOpacity={3}>c</ModalFrame>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('sm2-moldura-modal');
    expect(el.className).toContain('x');
    expect(el.hasAttribute('data-area-sheet')).toBe(true);
    expect(el.querySelector('h2')).toBeNull();
    expect(el.style.getPropertyValue('--sm2-moldura-fill-op')).toBe('1');
  });
});

describe('CardFrame', () => {
  it('mostra arte, nome, descrição e recompensa quando dados', () => {
    const { container } = render(<CardFrame art={<img alt="" src="a.png" />} name="Poção" description="Cura leve / Light heal" reward="+10" />);
    expect(screen.getByText('Poção')).toBeTruthy();
    expect(screen.getByText('Cura leve / Light heal')).toBeTruthy();
    expect(screen.getByText('+10')).toBeTruthy();
    expect(container.querySelector('[data-moldura-arte] img')).toBeTruthy();
  });
  it('omite placas ausentes', () => {
    const { container } = render(<CardFrame />);
    expect(container.querySelector('[data-moldura-nome]')).toBeNull();
    expect(container.querySelector('[data-moldura-desc]')).toBeNull();
    expect(container.querySelector('[data-moldura-recompensa]')).toBeNull();
  });
});
