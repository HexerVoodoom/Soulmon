// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { ElementPotionSheet } from './ElementPotionSheet';
import { potionListFor } from '../utils/elementPotion';

beforeEach(() => { installDomGlobals(); });
afterEach(() => cleanup());

const base = { open: true, language: 'pt-BR' as const, onBack: () => {} };

describe('ElementPotionSheet: lista completa', () => {
  it('mostra todas as poções (mesmo sem essência) com TEM/PRECISA por ingrediente', () => {
    render(<ElementPotionSheet {...base} essences={{ fogo: 40 }} unlocked={['fogo']} onCraft={() => {}} />);
    const item = document.querySelector('[data-potion-item="fogo"]')!;
    expect(item.getAttribute('data-can-craft')).toBe('false');
    expect(item.querySelector('[data-ing-essence="fogo"]')!.textContent).toContain('40/100');
    expect((item.querySelector('[data-potion-create]') as HTMLButtonElement).disabled).toBe(true);
  });
  it('quem já consegue criar vem primeiro, destacado e com Criar ativo; confirmar chama onCraft', () => {
    const onCraft = vi.fn();
    render(<ElementPotionSheet {...base} essences={{ agua: 100 }} unlocked={['agua']} onCraft={onCraft} />);
    const first = document.querySelector('[data-potion-item]')!;
    expect(first.getAttribute('data-potion-item')).toBe('agua');
    expect(first.getAttribute('data-can-craft')).toBe('true');
    fireEvent.click(first.querySelector('[data-potion-create]')!);
    // §316c: folha de poção é modal branco, fica com o botão padrão do app (não o CTA do site).
    expect(document.querySelector('[data-potion-confirm]')!.hasAttribute('data-cta-button')).toBe(false);
    expect((document.querySelector('[data-potion-confirm]') as HTMLElement).style.getPropertyValue('--sm2-btn')).toBe('primary');
    fireEvent.click(document.querySelector('[data-potion-confirm]')!);
    expect(onCraft).toHaveBeenCalledWith('agua');
  });
  it('17/11: sem a linha de filtros de status nem painel do Neutro; só os três espaços de elemento', () => {
    render(<ElementPotionSheet {...base} essences={{ agua: 100 }} unlocked={['agua']} onCraft={() => {}} />);
    expect(document.querySelector('[data-potion-filters]')).toBeNull();
    expect(document.querySelector('[data-filter]')).toBeNull();
    expect(document.querySelector('[data-neutro-potion]')).toBeNull();
  });
  it('17/11: a poção do Neutro é uma linha comum, a ÚLTIMA da lista, igual às outras', () => {
    render(<ElementPotionSheet {...base} essences={{ agua: 100 }} unlocked={['agua', 'neutro']} onCraft={() => {}} />);
    for (let i = 0; i < 20 && document.querySelector('[data-potion-more]'); i++) fireEvent.click(document.querySelector('[data-potion-more]')!);
    const itens = [...document.querySelectorAll('[data-potion-options] > li')];
    expect(itens.length).toBeGreaterThan(2);
    const ultimo = itens[itens.length - 1];
    expect(ultimo.getAttribute('data-potion-item')).toBe('neutro');
    expect(ultimo.className).toBe(itens[0].className);
    expect(itens.filter(i => i.querySelector('[data-ing-neutro-essence]'))).toEqual([ultimo]);
  });
  it('composta: lista a poção de cada base e as essências dela', () => {
    const l = potionListFor({ terra: 100, agua: 100, pantano: 50 }, { 'potion:terra': 1, 'potion:agua': 1 }, [], ['pantano']).filter(r => r.potions.length > 0);
    expect(l.length).toBeGreaterThan(0);
    expect(l.every(r => r.potions.length >= 2)).toBe(true);
    const p = l.find(r => r.id === 'pantano');
    if (p) { expect(p.essences[0].need).toBe(50); expect(p.canCraft).toBe(true); }
  });
});

describe('ElementPotionSheet: favoritas', () => {
  it('estrela alterna aria-pressed e leva a poção ao topo; persiste', () => {
    try { localStorage.removeItem('soulmon:potionFavorites'); } catch { /* */ }
    render(<ElementPotionSheet {...base} essences={{}} unlocked={['fogo', 'agua']} onCraft={() => {}} />);
    const ids = () => [...document.querySelectorAll('[data-potion-item]')].map(e => e.getAttribute('data-potion-item'));
    const antes = ids();
    const alvo = antes[antes.length - 1]!;
    const btn = () => document.querySelector(`[data-potion-fav="${alvo}"]`) as HTMLButtonElement;
    expect(btn().getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(btn());
    expect(btn().getAttribute('aria-pressed')).toBe('true');
    expect(ids()[0]).toBe(alvo);
    expect(localStorage.getItem('soulmon:potionFavorites')).toContain(alvo);
  });
});
