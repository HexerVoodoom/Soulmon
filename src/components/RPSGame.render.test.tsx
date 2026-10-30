// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RPSGame } from './RPSGame';

const base = { evolutionStage: 'rookie', onEarnPoints: () => {}, onExit: () => {} };

describe('RPSGame (rodada 4, N4)', () => {
  it('abre só com Easy e Normal; Easy = sem peças restantes; jogadas por ícone sem texto', () => {
    const { container, unmount } = render(<RPSGame {...base} language="en-US" />);
    expect(screen.getByText('Common')).toBeTruthy();
    expect(screen.getByText('Advanced')).toBeTruthy();
    expect(container.querySelector('[data-rps-hand]')).toBeNull();
    fireEvent.click(screen.getByText('Common'));
    expect(container.querySelector('[data-rps-top]')).not.toBeNull();
    expect(container.querySelectorAll('[data-piece]').length).toBe(0);
    const hands = container.querySelectorAll('[data-rps-hand]');
    expect(hands.length).toBe(3);
    hands.forEach(h => expect((h.textContent ?? '').trim()).toBe(''));
    expect(container.querySelector('audio')).toBeNull();
    unmount();
  });
  it('Normal mostra as 9 peças restantes de cada lado (topo e base)', () => {
    const { container } = render(<RPSGame {...base} language="pt-BR" />);
    fireEvent.click(screen.getByText('Avançado'));
    expect(container.querySelectorAll('[data-piece]').length).toBe(18);
  });
});
