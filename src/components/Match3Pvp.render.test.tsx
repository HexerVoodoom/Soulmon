// @vitest-environment jsdom
/**
 * ELEMENTAL FUSION — as DUAS opções ao entrar (Aventura / PVP, REGISTRO §472): o seletor, a Aventura de 4 inimigos, o PVP 1 contra 1 com o
 * oponente da rota `opponents` (só Soulmon e level, nunca nome), 6 elementos básicos fixos e o jogador simulado de reserva sem rede.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';

const getOpponents = vi.fn();
vi.mock('../utils/community', async () => {
  const real = await vi.importActual<typeof import('../utils/community')>('../utils/community');
  return { ...real, getOpponents: (...a: unknown[]) => getOpponents(...a) };
});

import { Match3Game } from './Match3Game';
import { M3_TILE_ELEMENTS } from '../utils/match3';

const SEED = 31337;
beforeEach(() => {
  localStorage.clear(); vi.useFakeTimers(); getOpponents.mockReset();
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 900 });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const montar = (over: { language?: 'pt-BR' | 'en-US'; rankSaveId?: string; level?: number } = {}) => renderWithCss(
  <Match3Game language={over.language ?? 'en-US'} evolutionStage="rookie" petElement="fogo" rankSaveId={over.rankSaveId} playerLevel={over.level ?? 10} onEarnPoints={() => {}} onExit={() => {}} seed={SEED} />,
);
const settle = async () => { await act(async () => { await vi.advanceTimersByTimeAsync(50); }); };
const kinds = () => Array.from(document.querySelectorAll('[data-m3-cell]')).map(el => Number(el.getAttribute('data-m3-kind')));
const modo = (m: string) => document.querySelector(`[data-m3-mode="${m}"]`) as HTMLElement;

describe('Elemental Fusion — a entrada com duas opções', () => {
  it('com a conta, mostra Aventura e PVP (EN/PT) e o nome novo', () => {
    montar({ rankSaveId: 'abc' });
    expect(screen.getByText('Elemental Fusion')).toBeTruthy();
    expect(modo('adventure')).toBeTruthy();
    expect(modo('pvp')).toBeTruthy();
    expect(document.querySelector('[data-m3-board]')).toBeNull();
    expect(screen.getByText('Face the rift team (4 Soulmon) with mixed elements.')).toBeTruthy();
    cleanup();
    montar({ rankSaveId: 'abc', language: 'pt-BR' });
    expect(screen.getByText('Enfrente o time da fenda (4 Soulmon) com elementos misturados.')).toBeTruthy();
  });

  it('sem conta (testes, desafio) abre a Aventura direto, como antes', () => {
    montar();
    expect(document.querySelector('[data-m3-modes]')).toBeNull();
    expect(document.querySelector('[data-m3-board]')).toBeTruthy();
  });

  it('Aventura: 4 inimigos e os 6 elementos misturados da semente', () => {
    montar({ rankSaveId: 'abc' });
    fireEvent.click(modo('adventure'));
    expect(document.querySelectorAll('[data-m3-enemy]').length).toBe(4);
    expect(document.querySelector('[data-m3-board]')!.getAttribute('data-m3-elements')!.split(',')).toHaveLength(6);
    expect(Math.max(...kinds())).toBeLessThan(M3_TILE_ELEMENTS.length);
    expect(getOpponents).not.toHaveBeenCalled();
  });

  it('PVP: usa a rota do Torneio, pareia pelo level, mostra só Soulmon e level, 1 inimigo e os 6 elementos básicos fixos', async () => {
    getOpponents.mockResolvedValue({
      opponents: [
        { id: 'p1', name: 'Fulano Real', petName: 'Zeca', stage: 'rookie', duel: { level: 3 } },
        { id: 'p2', name: 'Sicrana Real', petName: 'Bianca', stage: 'champion', duel: { level: 11 } },
        { id: 'p3', name: 'Beltrano Real', petName: 'Leonardo', stage: 'rookie', duel: { level: 25 } },
      ],
      matchesLeft: 5,
    });
    montar({ rankSaveId: 'abc', level: 10 });
    fireEvent.click(modo('pvp'));
    expect(document.querySelector('[data-m3-pvp-searching]')).toBeTruthy();
    await settle();
    expect(getOpponents).toHaveBeenCalledWith('abc');
    const enemies = document.querySelectorAll('[data-m3-enemy]');
    expect(enemies.length).toBe(1);
    expect(enemies[0].getAttribute('data-m3-pvp-level')).toBe('11');
    expect(document.body.innerHTML).not.toMatch(/Fulano|Sicrana|Beltrano|Zeca|Bianca|Leonardo/);
    expect(document.querySelector('[data-m3-board]')!.getAttribute('data-m3-elements')).toBe(M3_TILE_ELEMENTS.join(','));
    expect(Math.max(...kinds())).toBeLessThan(6);
  });

  it('PVP sem rede: cai no jogador simulado de reserva, sem travar', async () => {
    getOpponents.mockRejectedValue(new Error('offline'));
    montar({ rankSaveId: 'abc' });
    fireEvent.click(modo('pvp'));
    await settle();
    expect(document.querySelectorAll('[data-m3-enemy]').length).toBe(1);
    expect(document.querySelector('[data-m3-enemy="1"]')!.getAttribute('data-m3-pvp-level')).toBe('10');
  });

  it('PVP com a rede pendurada: o tempo limite abre o jogador simulado', async () => {
    getOpponents.mockReturnValue(new Promise(() => {}));
    montar({ rankSaveId: 'abc' });
    fireEvent.click(modo('pvp'));
    await act(async () => { await vi.advanceTimersByTimeAsync(6100); });
    expect(document.querySelectorAll('[data-m3-enemy]').length).toBe(1);
  });

  it('PVP com a lista vazia: jogador simulado de reserva, sem recorde gravado', async () => {
    getOpponents.mockResolvedValue({ opponents: [], matchesLeft: 1 });
    montar({ rankSaveId: 'abc' });
    fireEvent.click(modo('pvp'));
    await settle();
    expect(document.querySelector('[data-m3-enemy]')).toBeTruthy();
    expect(localStorage.length).toBe(0);
  });

  it('os ícones de elemento do Soulmon (jogador e oponente) ficam maiores que os 18/14 px de antes', () => {
    montar({ rankSaveId: 'abc' });
    fireEvent.click(modo('adventure'));
    const jogador = document.querySelector('[data-m3-player-element]') as HTMLImageElement;
    const inimigo = document.querySelector('[data-m3-enemy-element-icon]') as HTMLImageElement;
    expect(jogador.width).toBeGreaterThan(18);
    expect(inimigo.width).toBeGreaterThan(14);
  });

  it('BOSS no PVP: a partida é só contra o boss, sem buscar adversário', async () => {
    renderWithCss(<Match3Game language="en-US" evolutionStage="rookie" rankSaveId="abc" initialMode="pvp" playerLevel={10} onEarnPoints={() => {}} onExit={() => {}} seed={74} />);
    await settle();
    expect(getOpponents).not.toHaveBeenCalled();
    expect(document.querySelector('[data-m3-pvp-searching]')).toBeNull();
    expect(document.querySelector('[data-m3-pvp-level]')).toBeNull();
    expect(document.querySelectorAll('[data-m3-enemy]').length).toBe(1);
  });
});
