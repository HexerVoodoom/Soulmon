// @vitest-environment jsdom
/**
 * I3 (02/10/2026) — `GameHeader`: o ✕ só mora à DIREITA quando fechar ENCERRA
 * uma atividade em andamento; ocioso (lobby/resultado/erro) ele vai para o
 * canto superior ESQUERDO, acima do título; sair que PERDE progresso pede
 * confirmação e pausa a partida.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { GameHeader, gameExitConfirm } from './GameKit';

describe('GameHeader — voltar/fechar', () => {
  it('ocioso: ✕ à ESQUERDA, antes do título, e fecha direto', () => {
    const onClose = vi.fn();
    renderWithCss(<GameHeader title="Jogo" closeLabel="Sair" onClose={onClose} />);
    const x = screen.getByRole('button', { name: 'Sair' });
    expect(x.hasAttribute('data-game-close-start')).toBe(true);
    expect(x.compareDocumentPosition(screen.getByText('Jogo')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(x);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('atividade: ✕ à DIREITA, sem confirmação quando nada se perde', () => {
    const onClose = vi.fn();
    renderWithCss(<GameHeader title="Jogo" closeLabel="Sair" onClose={onClose} activity />);
    const x = screen.getByRole('button', { name: 'Sair' });
    expect(x.hasAttribute('data-game-close-end')).toBe(true);
    fireEvent.click(x);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('exitConfirm: o ✕ abre o diálogo e pausa; "Continuar" retoma; "Sair" encerra', () => {
    const onClose = vi.fn();
    const onPauseChange = vi.fn();
    const { container } = renderWithCss(
      <GameHeader title="Jogo" closeLabel="Sair" onClose={onClose} exitConfirm={gameExitConfirm(true)} onPauseChange={onPauseChange} />,
    );
    fireEvent.click(container.querySelector('[data-game-close-end]')!);
    expect(onClose).not.toHaveBeenCalled();
    expect(onPauseChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('dialog')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(onPauseChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(container.querySelector('[data-game-close-end]')!);
    fireEvent.click(document.querySelector('[data-game-confirm-leave]')!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('com `onBack` ocioso: só a seta de voltar (sem ✕ à esquerda)', () => {
    const onBack = vi.fn();
    renderWithCss(<GameHeader title="Jogo" closeLabel="Sair" onClose={() => {}} onBack={onBack} backLabel="Voltar" />);
    expect(screen.queryByRole('button', { name: 'Sair' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
