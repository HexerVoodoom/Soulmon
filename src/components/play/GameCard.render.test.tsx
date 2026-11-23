// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MenteSheet, RefugioSheet, SalaoSheet } from './PlaySheets';
import { GameCard, GameCardGrid, CARD_IDS, cardArt } from './GameCard';

describe('GameCard', () => {
  it('é um botão com o nome e a descrição, e o clique chama onPress', () => {
    const onPress = vi.fn();
    const { getByRole, container } = render(
      <GameCardGrid><GameCard id="eco" title="Eco do Pet" description="Lembrar uma sequência" onPress={onPress} dataAttrs={{ 'data-mente-start': 'eco' }} art={null} /></GameCardGrid>,
    );
    const btn = getByRole('button', { name: /Eco do Pet/ });
    expect(btn.textContent).toContain('Lembrar uma sequência');
    expect(btn.getAttribute('data-mente-start')).toBe('eco');
    fireEvent.click(btn);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(container.querySelector('ul > li[data-game-card="eco"]')).toBeTruthy();
  });

  it('sem arte: placeholder procedural com o ícone do jogo (ou a inicial)', () => {
    const { container, rerender } = render(<GameCard id="x" title="Bolhas" description="d" icon="/i.png" onPress={() => {}} art={null} />);
    expect(container.querySelector('[data-game-card-placeholder] img')!.getAttribute('src')).toBe('/i.png');
    expect(container.querySelector('[data-game-card-art]')).toBeNull();
    rerender(<GameCard id="x" title="Bolhas" description="d" onPress={() => {}} art={null} />);
    expect(container.querySelector('[data-game-card-placeholder]')!.textContent).toBe('B');
  });

  it('com arte: a ilustração entra decorativa (alt vazio) e o placeholder some', () => {
    const { container } = render(<GameCard id="eco" title="Eco" description="d" onPress={() => {}} art="/eco.webp" />);
    const img = container.querySelector('[data-game-card-art]')!;
    expect(img.getAttribute('src')).toBe('/eco.webp');
    expect(img.getAttribute('alt')).toBe('');
    expect(container.querySelector('[data-game-card-placeholder]')).toBeNull();
  });

  it('selos ficam fora do botão; CARD_IDS cobre os três menus e não tem a Colcha', () => {
    const { container } = render(<GameCard id="eco" title="Eco" description="d" onPress={() => {}} art={null} badges={<span>até 30 Bits</span>} />);
    expect(container.querySelector('button [data-game-card-badges]')).toBeNull();
    expect(container.querySelector('[data-game-card-badges]')!.textContent).toBe('até 30 Bits');
    for (const id of ['eco', 'zip', 'selo', 'dino', 'ppt', 'match3', 'barrage', 'respiracao', 'bolhas-calmas', 'chama']) {
      expect(CARD_IDS as readonly string[]).toContain(id);
    }
    expect(CARD_IDS as readonly string[]).not.toContain('patches');
    expect(cardArt('nao-existe')).toBeUndefined();
  });
});

describe('GameCard: nome na placa, ganho no pergaminho', () => {
  it.each([
    ['pt-BR', 'Pedra, papel e tesoura', 'por vitória'],
    ['en', 'Rock, paper, scissors', 'per win'],
  ])('%s: título longo na placa e ganho (uma linha) no pergaminho', (_l, title, ganho) => {
    const { container } = render(
      <GameCard id="ppt" title={title} reward={<>5 {ganho}</>} onPress={() => {}} art={null} />,
    );
    expect(container.querySelector('[data-moldura-nome]')!.textContent).toBe(title);
    expect(container.querySelector('[data-moldura-desc] [data-game-card-ganho]')!.textContent).toBe(`5 ${ganho}`);
    expect(container.querySelector('[data-moldura-desc]')!.textContent).not.toContain(title);
  });
  it('com descrição (Mente/Refúgio): nome na placa, descrição no pergaminho, sem ganho', () => {
    const { container } = render(<GameCard id="eco" title="Eco do Pet" description="Pede: lembrar" onPress={() => {}} art={null} />);
    expect(container.querySelector('[data-moldura-nome]')!.textContent).toBe('Eco do Pet');
    expect(container.querySelector('[data-moldura-desc]')!.textContent).toBe('Pede: lembrar');
    expect(container.querySelector('[data-game-card-ganho]')).toBeNull();
  });
});

describe('GameCard: recompensa no pergaminho, descrição acessível, contraste', () => {
  it('com recompensa E descrição: a recompensa ocupa o pergaminho e a descrição sai da vista (aria-describedby)', () => {
    const { container } = render(<GameCard id="eco" title="Eco do Pet" reward={<>até 10</>} hint="Pede: lembrar" onPress={() => {}} art={null} />);
    expect(container.querySelector('[data-moldura-desc] [data-game-card-ganho]')!.textContent).toBe('até 10');
    expect(container.querySelector('[data-moldura-desc]')!.textContent).not.toContain('Pede');
    const btn = container.querySelector('button')!;
    const alvo = container.querySelector('[data-game-card-hint]')!;
    expect(btn.getAttribute('aria-describedby')).toBe(alvo.id);
    expect(alvo.textContent).toBe('Pede: lembrar');
  });
  it('nome curto marca data-nome-curto (fonte maior); longo fica em 2 linhas', () => {
    const { container, rerender } = render(<GameCard id="x" title="Chama" onPress={() => {}} art={null} />);
    expect(container.querySelector('[data-game-card-nome]')!.hasAttribute('data-nome-curto')).toBe(true);
    rerender(<GameCard id="x" title="Corrida com obstáculos" onPress={() => {}} art={null} />);
    expect(container.querySelector('[data-game-card-nome]')!.hasAttribute('data-nome-curto')).toBe(false);
  });
  it('sem selos o rodapé da carta nem ocupa espaço (CSS :empty)', () => {
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toMatch(/\.sm-game-card__badges:empty\s*\{\s*display:\s*none/);
  });
  it('tinta do ganho: token escuro fixo nos dois temas, ≥7:1 sobre o pergaminho (mediana e pior 5% medidos no asset)', () => {
    const css = readFileSync('src/index.css', 'utf8');
    const tintas = [...css.matchAll(/--sm2-pergaminho-ink:\s*(#[0-9A-Fa-f]{6})/g)].map(m => m[1]);
    expect(tintas.length).toBe(2);
    const lum = (rgb: number[]) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]); };
    for (const t of tintas) {
      const ink = lum([1, 3, 5].map(i => parseInt(t.slice(i, i + 2), 16)));
      for (const bg of [[212, 174, 114], [197, 155, 94]]) expect((lum(bg) + 0.05) / (ink + 0.05)).toBeGreaterThanOrEqual(7);
    }
    expect(css).toMatch(/\.sm-game-card__ganho,\s*\.sm-game-card__ganho \*\s*\{[^}]*var\(--sm2-pergaminho-ink\)/);
  });
});

describe('prédios: todo card mostra a recompensa real no pergaminho', () => {
  it.each(['pt-BR', 'en-US'] as const)('Mente (%s): "até N Bits" de cada jogo, descrição só acessível', (lang) => {
    const { container } = render(<MenteSheet language={lang} onStart={() => {}} />);
    const cards = [...container.querySelectorAll('[data-game-card]')];
    expect(cards.length).toBe(3);
    for (const c of cards) {
      const g = c.querySelector('[data-moldura-desc] [data-game-card-ganho]')!;
      expect(g.textContent).toMatch(/\d/);
      expect(g.textContent).toMatch(lang === 'pt-BR' ? /até/ : /up to/);
      expect(c.querySelector('[data-game-card-hint]')!.textContent).toMatch(lang === 'pt-BR' ? /Pede:/ : /Asks:/);
      expect(c.querySelector('[data-game-card-badges]')).toBeNull();
    }
  });
  it('Salão: ganho no pergaminho em todos os 4 cards, sem ticket', () => {
    const { container } = render(<SalaoSheet language="pt-BR" onStart={() => {}} />);
    expect(container.querySelectorAll('[data-moldura-desc] [data-game-card-ganho]').length).toBe(4);
    expect(container.querySelector('[data-ticket-cost]')).toBeNull();
  });
  it('Refúgio: não paga nada, então o pergaminho segue com a duração (nada inventado)', () => {
    const { container } = render(<RefugioSheet language="en-US" onStart={() => {}} />);
    expect(container.querySelectorAll('[data-game-card-ganho]').length).toBe(0);
    expect([...container.querySelectorAll('[data-moldura-desc]')].map(e => e.textContent)).toEqual(['1 to 3 minutes', 'No timer, no score', '3, 5 or 10 minutes']);
  });
});
