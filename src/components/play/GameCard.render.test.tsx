// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
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
