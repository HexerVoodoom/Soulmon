// @vitest-environment jsdom
/**
 * L2 (rodada 6) — `GameHeader`: o voltar é SEMPRE o círculo à ESQUERDA (nunca
 * ✕/"Fechar", nunca à direita), em qualquer estado (ocioso ou atividade); o título
 * vai para a DIREITA; sair que PERDE progresso pede confirmação e pausa a partida.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { GameHeader, gameExitConfirm } from './GameKit';

describe('GameHeader — voltar (círculo à esquerda)', () => {
  it('ocioso: círculo à ESQUERDA, antes do título, e sai direto', () => {
    const onClose = vi.fn();
    renderWithCss(<GameHeader title="Jogo" closeLabel="Sair" onClose={onClose} />);
    const x = screen.getByRole('button', { name: 'Sair' });
    expect(x.hasAttribute('data-game-close-start')).toBe(true);
    expect(x.hasAttribute('data-back-circle')).toBe(true);
    expect(x.compareDocumentPosition(screen.getByText('Jogo')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(x);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('rótulo "Fechar"/"Close" nunca vira o nome do voltar: cai em Voltar/Back', () => {
    renderWithCss(<GameHeader title="Jogo" closeLabel="Close" onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
  });

  it('atividade: continua à ESQUERDA (nada de ✕ à direita), sem confirmação quando nada se perde', () => {
    const onClose = vi.fn();
    const { container } = renderWithCss(<GameHeader title="Jogo" closeLabel="Sair" onClose={onClose} activity />);
    expect(container.querySelector('[data-game-close-end]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('exitConfirm: o voltar abre o diálogo e pausa; "Continuar" retoma; "Sair" encerra', () => {
    const onClose = vi.fn();
    const onPauseChange = vi.fn();
    const { container } = renderWithCss(
      <GameHeader title="Jogo" closeLabel="Sair" onClose={onClose} exitConfirm={gameExitConfirm(true)} onPauseChange={onPauseChange} />,
    );
    fireEvent.click(container.querySelector('[data-game-close-start]')!);
    expect(onClose).not.toHaveBeenCalled();
    expect(onPauseChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('dialog')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(onPauseChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(container.querySelector('[data-game-close-start]')!);
    fireEvent.click(document.querySelector('[data-game-confirm-leave]')!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('com `onBack`: o círculo volta uma tela de dentro do jogo', () => {
    const onBack = vi.fn();
    renderWithCss(<GameHeader title="Jogo" closeLabel="Sair" onClose={() => {}} onBack={onBack} backLabel="Voltar" />);
    expect(screen.queryByRole('button', { name: 'Sair' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
