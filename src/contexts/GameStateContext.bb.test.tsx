// @vitest-environment jsdom
/** Forma BB (Onboarding Velado, D3): o save em `bb` hidrata com HP 6 e sem mudar de estágio. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

function Espiao() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify(gameState)}</pre>;
}
const montar = () => {
  render(<GameStateProvider><Espiao /></GameStateProvider>);
  return JSON.parse(screen.getByTestId('estado').textContent!);
};

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('hydrateSave com a forma BB', () => {
  it('`bb` com HP 6 volta como `bb`, HP 6 / máx 6', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ evolutionStage: 'bb', healthPoints: 6, perfectDays: 0 }));
    const s = montar();
    expect(s.evolutionStage).toBe('bb');
    expect(s.maxHealthPoints).toBe(6);
    expect(s.healthPoints).toBe(6);
  });
  it('variante torta (`BB`) é normalizada para `bb`', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ evolutionStage: 'BB', healthPoints: 4 }));
    expect(montar().evolutionStage).toBe('bb');
  });
  it('save sem BB segue como sempre (rookie, máx 3)', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ evolutionStage: 'rookie', healthPoints: 3 }));
    const s = montar();
    expect(s.evolutionStage).toBe('rookie');
    expect(s.maxHealthPoints).toBe(3);
  });
});
