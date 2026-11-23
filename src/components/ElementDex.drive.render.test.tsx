// @vitest-environment jsdom
/** P5/24: categorias, filtro "Novo", constituintes clicáveis com Voltar. */
import { describe, it, expect } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { ElementDex } from './ElementDex';
import { elementoCategoria } from '../utils/elementoCategoria';
import { ELEMENTOS_CURADOS } from '../utils/elementosCurados';

const cells = () => [...document.querySelectorAll('[data-element-cell]')].map(e => e.getAttribute('data-element-cell'));
const click = (sel: string) => fireEvent.click(document.querySelector(sel)!);

describe('categorias', () => {
  it('classifica por nº de componentes', () => {
    expect(elementoCategoria('fogo')).toBe('base');
    expect(elementoCategoria('vapor')).toBe('ii');
    expect(elementoCategoria('neutro')).toBe('special');
    for (const c of ELEMENTOS_CURADOS) expect(elementoCategoria(c.id)).toBe(c.componentes.length >= 4 ? 'iv' : c.componentes.length === 3 ? 'iii' : 'ii');
  });
  it('chip Base mostra só os 20 base; Special só o neutro', () => {
    renderWithCss(<ElementDex defeated={['fogo', 'agua', 'vapor', 'neutro']} language="en-US" />);
    click('[data-element-cat="base"]');
    expect(cells().filter(c => c !== 'locked').sort()).toEqual(['agua', 'fogo']);
    expect(document.querySelectorAll('[data-element-cell]').length).toBe(20);
    click('[data-element-cat="special"]');
    expect(cells()).toEqual(['neutro']);
  });
});

describe('filtro Novo', () => {
  it('só os destrancados com selo', () => {
    renderWithCss(<ElementDex defeated={['fogo', 'agua']} language="pt-BR" isNew={new Set(['agua'])} />);
    click('[data-element-only-new] input');
    expect(cells()).toEqual(['agua']);
  });
});

describe('constituintes clicáveis', () => {
  it('abre o componente destrancado, Voltar volta um nível, trancado segue "?"', () => {
    renderWithCss(<ElementDex defeated={['fogo', 'vapor']} language="en-US" />);
    click('[data-element-cell="vapor"]');
    expect(document.querySelector('[data-element-detail="vapor"]')).toBeTruthy();
    expect(document.querySelector('[data-open="0"]')).toBeTruthy();
    click('[data-dex-ref-open="fogo"]');
    expect(document.querySelector('[data-element-detail="fogo"]')).toBeTruthy();
    click('[data-element-back]');
    expect(document.querySelector('[data-element-detail="vapor"]')).toBeTruthy();
    expect(document.querySelector('[data-element-back]')).toBeNull();
  });
});
