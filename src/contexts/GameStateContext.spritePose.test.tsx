// @vitest-environment jsdom
/**
 * Contrato de save da POSE do sprite (`spritePose`, 11/10/2026): save antigo entra com o padrão,
 * lixo vira o padrão, o valor válido sobrevive ao load, e `applySpritePose` (único dono de
 * escrita) chega ao estado e ao localStorage pelo caminho canônico.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { applySpritePose } from '../utils/spritePose';

const BASE = { activities: [], tasks: [], lastResetDate: 'Mon Jan 01 2024' };

function Sonda() {
  const { gameState } = useGameState();
  return <pre data-testid="pose">{JSON.stringify(gameState.spritePose)}</pre>;
}
function montar(saved?: Record<string, unknown>) {
  cleanup();
  localStorage.clear();
  if (saved) localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ ...BASE, ...saved }));
  render(<GameStateProvider><Sonda /></GameStateProvider>);
  return () => JSON.parse(screen.getByTestId('pose').textContent!);
}

beforeEach(() => {
  installDomGlobals();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('spritePose no save', () => {
  it('save antigo (sem o campo) entra com o padrão: chão, sem espelho', () => {
    expect(montar({})()).toEqual({ flipX: false, altitude: 'ground' });
  });
  it('lixo vira o padrão', () => {
    expect(montar({ spritePose: { flipX: 'sim', altitude: 'lua' } })()).toEqual({ flipX: false, altitude: 'ground' });
    expect(montar({ spritePose: [1, 2] })()).toEqual({ flipX: false, altitude: 'ground' });
  });
  it('valor válido sobrevive ao load', () => {
    expect(montar({ spritePose: { flipX: true, altitude: 'air' } })()).toEqual({ flipX: true, altitude: 'air' });
  });
  it('applySpritePose escreve no estado, mescla parcial e persiste', async () => {
    const ler = montar({});
    act(() => { applySpritePose({ flipX: true }); });
    expect(ler()).toEqual({ flipX: true, altitude: 'ground' });
    act(() => { applySpritePose({ altitude: 'air' }); });
    expect(ler()).toEqual({ flipX: true, altitude: 'air' });
    await vi.waitFor(() => {
      const salvo = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE) ?? '{}');
      expect(salvo.spritePose).toEqual({ flipX: true, altitude: 'air' });
    });
  });
});
