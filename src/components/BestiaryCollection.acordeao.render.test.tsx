// @vitest-environment jsdom
/** Drive em accordion (18/11/2026): níveis recolhíveis com memória e categoria Boss sempre por último. */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BestiaryCollection } from './BestiaryCollection';
import { ENEMY_ROSTER } from '../utils/enemyRoster';
import { BOSS_ROSTER } from '../data/bossRoster';

const KEY = 'soulmon-drive-fechados-v1';
const primeiroMega = ENEMY_ROSTER.find(e => e.stage === 'mega')!;

describe('BestiaryCollection — accordion e Boss', () => {
  beforeEach(() => localStorage.clear());

  it('padrão: todos abertos; botão alterna aria-expanded, hidden e aria-controls', () => {
    const { container } = render(<BestiaryCollection seen={[]} language="pt-BR" />);
    const btn = container.querySelector('[data-acc-toggle="rookie"]') as HTMLButtonElement;
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    const corpo = document.getElementById(btn.getAttribute('aria-controls')!)!;
    expect(corpo.hidden).toBe(false);
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(corpo.hidden).toBe(true);
    fireEvent.click(btn);
    expect(corpo.hidden).toBe(false);
  });

  it('contagem vistos/total continua no cabeçalho recolhido', () => {
    const { container } = render(<BestiaryCollection seen={[primeiroMega.key]} language="pt-BR" />);
    const total = ENEMY_ROSTER.filter(e => e.stage === 'mega').length;
    const cont = () => container.querySelector('[data-acc-count="mega"]')!.textContent;
    expect(cont()).toBe(`1 / ${total}`);
    fireEvent.click(container.querySelector('[data-acc-toggle="mega"]')!);
    expect(cont()).toBe(`1 / ${total}`);
  });

  it('persiste fechados no localStorage e restaura na montagem', () => {
    const a = render(<BestiaryCollection seen={[]} />);
    fireEvent.click(a.container.querySelector('[data-acc-toggle="champion"]')!);
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(['champion']);
    a.unmount();
    const b = render(<BestiaryCollection seen={[]} />);
    expect(b.container.querySelector('[data-acc-toggle="champion"]')!.getAttribute('aria-expanded')).toBe('false');
    expect(b.container.querySelector('[data-acc-toggle="rookie"]')!.getAttribute('aria-expanded')).toBe('true');
  });

  it('sem localStorage (lança) ainda renderiza e alterna', () => {
    const orig = Storage.prototype.getItem;
    const origSet = Storage.prototype.setItem;
    Storage.prototype.getItem = () => { throw new Error('x'); };
    Storage.prototype.setItem = () => { throw new Error('x'); };
    try {
      const { container } = render(<BestiaryCollection seen={[]} />);
      const btn = container.querySelector('[data-acc-toggle="rookie"]')!;
      expect(btn.getAttribute('aria-expanded')).toBe('true');
      fireEvent.click(btn);
      expect(btn.getAttribute('aria-expanded')).toBe('false');
    } finally { Storage.prototype.getItem = orig; Storage.prototype.setItem = origSet; }
  });

  it('Boss é a última seção; sem registro de visto, todos em silhueta (???)', () => {
    const { container } = render(<BestiaryCollection seen={[]} language="pt-BR" />);
    const secoes = [...container.querySelectorAll('[data-bestiary-stage]')].map(e => e.getAttribute('data-bestiary-stage'));
    expect(secoes[secoes.length - 1]).toBe('boss');
    const cels = container.querySelectorAll('[data-boss-cell]');
    expect(cels).toHaveLength(BOSS_ROSTER.length);
    expect([...cels].every(c => c.getAttribute('data-seen') === '0' && c.textContent === '???')).toBe(true);
    expect(container.querySelector('[data-acc-count="boss"]')!.textContent).toBe(`0 / ${BOSS_ROSTER.length}`);
  });

  it('boss visto mostra o nome e conta', () => {
    const b = BOSS_ROSTER[0];
    const { container } = render(<BestiaryCollection seen={[]} language="pt-BR" bossesSeen={[b.id]} />);
    expect(container.querySelector(`[data-boss-cell="${b.id}"]`)!.textContent).toBe(b.namePt);
    expect(container.querySelector('[data-acc-count="boss"]')!.textContent).toBe(`1 / ${BOSS_ROSTER.length}`);
  });

  it('a11y: botão do cabeçalho tem nome e está dentro de h3', () => {
    render(<BestiaryCollection seen={[]} language="pt-BR" />);
    const btn = screen.getAllByRole('button', { name: /Boss/ })[0];
    expect(btn.closest('h3')).not.toBeNull();
  });
});

describe('BestiaryCollection — detalhe em popup central (padrão Drive)', () => {
  it('abre popup com título inline (aria-labelledby), ✕ e Esc fecham, sem placa nem nome no corpo', () => {
    const e = ENEMY_ROSTER[0];
    const { container } = render(<BestiaryCollection seen={[e.key]} language="pt-BR" />);
    fireEvent.click(container.querySelector(`[data-bestiary-open="${e.key}"]`)!);
    const dlg = document.querySelector('[role="dialog"]') as HTMLElement;
    const h = dlg.querySelector('[data-popup-titulo]') as HTMLElement;
    expect(dlg.getAttribute('aria-labelledby')).toBe(h.id);
    expect(h.textContent).toBe(e.name);
    expect(dlg.querySelector(`[data-bestiary-detail="${e.key}"]`)!.textContent).not.toContain(e.name);
    fireEvent.click(dlg.querySelector('.sm2-popup-fechar')!);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    fireEvent.click(container.querySelector(`[data-bestiary-open="${e.key}"]`)!);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
