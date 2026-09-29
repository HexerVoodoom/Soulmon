// @vitest-environment jsdom
/**
 * A marca do corvinho (`soulmonMeta.creature`) no load: só o literal `'corvo'`
 * sobrevive ao `hydrateSave`; qualquer outro valor vindo da nuvem é descartado.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { isCorvo } from '../utils/corvoPet';

vi.mock('../utils/cloudSave', () => ({
  cloudSave: () => Promise.resolve({ ok: true }),
  cloudSaveComRetry: () => Promise.resolve({ ok: true }),
  emailToSaveId: async () => 'x',
  adoptCloudSave: async () => false,
}));
vi.mock('../utils/community', () => ({ pushProfile: () => Promise.resolve() }));

function Espiao() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify(gameState)}</pre>;
}
function abrir(meta: unknown) {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ soulmonMeta: meta }));
  render(<GameStateProvider><Espiao /></GameStateProvider>);
  return JSON.parse(screen.getByTestId('estado').textContent!);
}

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida'))));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('hydrateSave › soulmonMeta.creature', () => {
  it("'corvo' sobrevive", () => {
    expect(isCorvo(abrir({ baseName: 'Corvinho', creature: 'corvo' }))).toBe(true);
  });
  it.each([['CORVO'], [1], [{ x: 1 }], ['kaelen']])('%j é descartado', (v) => {
    const s = abrir({ baseName: 'x', creature: v });
    expect(isCorvo(s)).toBe(false);
    expect(s.soulmonMeta.creature).toBeUndefined();
  });
});
