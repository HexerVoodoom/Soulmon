// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DinoGame } from './DinoGame';

describe('DinoGame (rodada 4, N3)', () => {
  it('ao entrar: fechar + Easy e Normal, sem Start/Jump/seletor de nível, em EN e PT', () => {
    const props = { evolutionStage: 'rookie', onEarnPoints: () => {}, onScore: () => {}, onExit: () => {} };
    const { container, unmount } = render(<DinoGame {...props} language="en-US" />);
    expect(container.querySelector('[data-game-close-start]')).not.toBeNull();
    expect(container.querySelector('[data-dino-start="1"]')?.textContent).toBe('Easy');
    expect(container.querySelector('[data-dino-start="2"]')?.textContent).toBe('Normal');
    expect(screen.queryByText('Start')).toBeNull();
    expect(screen.queryByText('Jump')).toBeNull();
    unmount();
    const r = render(<DinoGame {...props} language="pt-BR" />);
    expect(r.container.querySelector('[data-dino-start="2"]')?.textContent).toBe('Normal');
  });
});
