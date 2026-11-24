// @vitest-environment jsdom
/** P5/24: categorias em accordion, filtro "Novo", constituintes clicáveis com Voltar. */
import { describe, it, expect, beforeEach } from 'vitest';
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
  it('seção Base tem os 20 base; Special só o neutro', () => {
    renderWithCss(<ElementDex defeated={['fogo', 'agua', 'vapor', 'neutro']} language="en-US" />);
    const sec = (c: string) => [...document.querySelectorAll(`[data-acc-section="dex-${c}"] [data-element-cell]`)].map(e => e.getAttribute('data-element-cell'));
    expect(sec('base').filter(c => c !== 'locked').sort()).toEqual(['agua', 'fogo']);
    expect(sec('base').length).toBe(20);
    expect(sec('special')).toEqual(['neutro']);
  });
});

describe('accordion do Drive (mesmo componente do Bestiário)', () => {
  beforeEach(() => localStorage.clear());
  it('5 categorias abertas por padrão, sem accordion Novo, com aria-expanded/controls/hidden e contagem', () => {
    renderWithCss(<ElementDex defeated={['fogo', 'agua']} language="pt-BR" />);
    const ids = [...document.querySelectorAll('[data-acc-toggle]')].map(e => e.getAttribute('data-acc-toggle'));
    expect(ids).toEqual(['dex-base', 'dex-ii', 'dex-iii', 'dex-iv', 'dex-special']);
    expect(document.querySelector('[data-acc-count="dex-base"]')!.textContent).toBe('2 / 20');
    expect(document.querySelector('[data-acc-toggle="dex-novo"]')).toBeNull();
    const pos = document.querySelector('[data-base-filter]')!.compareDocumentPosition(document.querySelector('[data-element-only-new]')!);
    expect(pos & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const btn = document.querySelector('[data-acc-toggle="dex-base"]') as HTMLButtonElement;
    const corpo = document.getElementById(btn.getAttribute('aria-controls')!)!;
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(corpo.hidden).toBe(false);
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(corpo.hidden).toBe(true);
    expect(JSON.parse(localStorage.getItem('soulmon-drive-fechados-v1')!)).toEqual(['dex-base']);
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
