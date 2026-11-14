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
    expect(document.querySelector('[data-potion-confirm]')!.className).toContain('sm2-kit-btn-primary');
    fireEvent.click(document.querySelector('[data-potion-confirm]')!);
    expect(onCraft).toHaveBeenCalledWith('agua');
  });
  it('filtro "Posso criar" esconde o resto', () => {
    render(<ElementPotionSheet {...base} essences={{ agua: 100 }} unlocked={['agua']} onCraft={() => {}} />);
    fireEvent.click(document.querySelector('[data-filter="can"]')!);
    expect(document.querySelectorAll('[data-potion-item]')).toHaveLength(1);
  });
  it('composta: lista a poção de cada base e as essências dela', () => {
    const l = potionListFor({ terra: 100, agua: 100, pantano: 50 }, { 'potion:terra': 1, 'potion:agua': 1 }, [], 'composite', ['pantano']);
    expect(l.length).toBeGreaterThan(0);
    expect(l.every(r => r.potions.length >= 2)).toBe(true);
    const p = l.find(r => r.id === 'pantano');
    if (p) { expect(p.essences[0].need).toBe(50); expect(p.canCraft).toBe(true); }
  });
});
