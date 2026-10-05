// @vitest-environment jsdom
/**
 * Story PR2, criterio 6 — RETROATIVO: um save anterior ao combate v3 (sem
 * nenhum campo de level/XP) hidrata e ja abre com o level derivado dos fatos
 * que ele tem. Zero campo novo no save: o fuzz2 segue em 103.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from '../contexts/GameStateContext';
import { STORAGE_KEYS } from './storageKeys';
import { soulLevel, soulXP } from './soulXP';
import { levelCapFor } from '../types/progression';
import legado from './soulXP.legacySave.fixture.json';

function Estado() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify(gameState)}</pre>;
}

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('criterio 6 — save antigo abre com o level derivado', () => {
  it('o fixture nao tem campo de level/XP do Soulmon', () => {
    expect(Object.keys(legado).some(k => /soul(XP|Level)|^level$/i.test(k))).toBe(false);
  });

  it('hidrata e o level sai de evolutionStage + perfectDays (champion: 6 + 3 dias = Lv 10)', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(legado));
    render(<GameStateProvider><Estado /></GameStateProvider>);
    const s = JSON.parse(screen.getByTestId('estado').textContent!);
    expect(s.evolutionStage).toBe('champion-harmony');
    expect(soulXP(s)).toBe(600 + 3 * 100);
    expect(soulLevel(s)).toBe(Math.min(10, levelCapFor('champion-harmony')));
    expect(soulLevel(s)).toBe(10);
  });
});
