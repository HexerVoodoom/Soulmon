// @vitest-environment jsdom
/**
 * Dex de elementos (27/10/2026): `defeatedElements` começa VAZIO para todos (sem retroativo), a leitura é tolerante e a hidratação
 * é idempotente (hidratar o que já foi hidratado não muda nada).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

function Espiao() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify(gameState)}</pre>;
}
function montar(): { defeatedElements?: string[] } {
  render(<GameStateProvider><Espiao /></GameStateProvider>);
  const s = JSON.parse(screen.getByTestId('estado').textContent!);
  cleanup();
  return s;
}

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('GameState.defeatedElements na hidratação', () => {
  it('save antigo (sem o campo) começa com a lista vazia, mesmo com bestiário cheio', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ evolutionStage: 'champion', bestiary: ['embrit-rookie'], dungeonKills: 40 }));
    expect(montar().defeatedElements).toEqual([]);
  });

  it('lixo vira lista vazia; valores bons passam, sem repetir', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ evolutionStage: 'rookie', defeatedElements: 'fogo' }));
    expect(montar().defeatedElements).toEqual([]);
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ evolutionStage: 'rookie', defeatedElements: ['fogo', 'fogo', 7, null, 'vapor'] }));
    expect(montar().defeatedElements).toEqual(['fogo', 'vapor']);
  });

  it('idempotente: carregar o que foi gravado devolve o mesmo', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ evolutionStage: 'rookie', defeatedElements: ['fogo', 'lava'] }));
    const a = montar();
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(a));
    expect(montar().defeatedElements).toEqual(a.defeatedElements);
    expect(a.defeatedElements).toEqual(['fogo', 'lava']);
  });
});
