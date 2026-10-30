// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MinigameModeGate } from './MinigameModeGate';
import { difficultyLabel } from '../../utils/minigameDifficulty';

vi.mock('../RankingPanel', () => ({ RankingPanel: ({ game, inline }: { game: string; inline?: boolean }) => <div data-ranking-panel={game} data-inline={inline ? 'yes' : undefined} /> }));

const base = { gameName: 'Corrida com obstáculos', saveId: 's1', onPick: () => {}, onBack: () => {} };

describe('MinigameModeGate (pedido do dono, 30/10/2026)', () => {
  it('rótulos: Comum/Avançado (PT) e Common/Advanced (EN); ids internos 1/2 intactos', () => {
    expect([difficultyLabel(1, true), difficultyLabel(2, true)]).toEqual(['Comum', 'Avançado']);
    expect([difficultyLabel(1, false), difficultyLabel(2, false)]).toEqual(['Common', 'Advanced']);
  });

  it('com dificuldade: o Pipo pergunta, o ranking vem antes, Comum à esquerda e Avançado à direita', () => {
    const onPick = vi.fn();
    const { container } = render(<MinigameModeGate {...base} language="pt-BR" withDifficulty rankings={[{ game: 'dino-1' }, { game: 'dino-2' }]} onPick={onPick} />);
    expect(container.querySelector('[data-area-sheet-npc-line]')!.textContent).toContain('Pipo');
    expect(container.querySelector('[data-area-sheet-npc-line]')!.textContent).toContain('Comum ou no modo Avançado');
    const rank = container.querySelector('[data-minigame-gate-ranking]')!;
    const botoes = [...container.querySelectorAll('[data-gate-pick]')] as HTMLElement[];
    expect(botoes.map(b => b.textContent)).toEqual(['Comum', 'Avançado']);
    expect(rank.compareDocumentPosition(botoes[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Tabela inline (sem botão "ver ranking"), uma por vez, com abas Comum | Avançado (Comum primeiro).
    expect(container.querySelectorAll('[data-ranking-panel]')).toHaveLength(1);
    expect(container.querySelector('[data-ranking-panel]')!.getAttribute('data-ranking-panel')).toBe('dino-1');
    expect(container.querySelector('[data-ranking-panel]')!.getAttribute('data-inline')).toBe('yes');
    const abas = [...container.querySelectorAll('[data-gate-rank-tab]')] as HTMLElement[];
    expect(abas.map(a => a.textContent)).toEqual(['Comum', 'Avançado']);
    fireEvent.click(abas[1]);
    expect(container.querySelector('[data-ranking-panel]')!.getAttribute('data-ranking-panel')).toBe('dino-2');
    fireEvent.click(botoes[1]);
    expect(onPick).toHaveBeenCalledWith(2);
  });

  it('Fusão Elemental: PvE à esquerda, PvP à direita, escolher já devolve o modo', () => {
    const onPick = vi.fn();
    const { container } = render(<MinigameModeGate {...base} gameName="Fusão Elemental" language="pt-BR" withDifficulty={false} pveVsPvp rankings={[{ game: 'match3' }]} onPick={onPick} />);
    const botoes = [...container.querySelectorAll('[data-gate-pick]')] as HTMLElement[];
    expect(botoes.map(b => b.textContent)).toEqual(['PvE', 'PvP']);
    expect(container.querySelectorAll('[data-gate-rank-tab]')).toHaveLength(0);
    fireEvent.click(botoes[0]);
    expect(onPick).toHaveBeenCalledWith(1);
  });

  it('em inglês: Common / Advanced', () => {
    const { container } = render(<MinigameModeGate {...base} language="en-US" withDifficulty rankings={[{ game: 'ppt' }]} />);
    expect([...container.querySelectorAll('[data-gate-pick]')].map(b => b.textContent)).toEqual(['Common', 'Advanced']);
  });

  it('sem dificuldade: um único Jogar; o voltar chama onBack', () => {
    const onPick = vi.fn(); const onBack = vi.fn();
    const { container } = render(<MinigameModeGate {...base} language="pt-BR" withDifficulty={false} rankings={[{ game: 'eco' }]} onPick={onPick} onBack={onBack} />);
    expect(container.querySelectorAll('[data-gate-pick]')).toHaveLength(0);
    const jogar = container.querySelector('[data-gate-play]')!;
    expect(jogar.textContent).toBe('Jogar');
    fireEvent.click(jogar);
    expect(onPick).toHaveBeenCalledWith();
    fireEvent.click(container.querySelector('[data-area-sheet-close]')!);
    expect(onBack).toHaveBeenCalled();
  });
});
