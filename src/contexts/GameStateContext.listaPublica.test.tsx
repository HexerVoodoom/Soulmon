// @vitest-environment jsdom
/**
 * TORC-5 — o opt-out da lista pública do Torneio mora no save (`hideFromPublicList`).
 *
 * Padrão: APARECER (campo ausente = false). Só o booleano `true` esconde — lixo
 * no localStorage não pode tirar ninguém da lista nem, pior, deixar a pessoa
 * achando que saiu. E o perfil publicado SEMPRE leva `publicHidden`, porque é
 * assim que o servidor retira/devolve o registro público na hora da troca.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

const { perfis } = vi.hoisted(() => ({ perfis: [] as Array<Record<string, unknown>> }));

vi.mock('../utils/cloudSave', () => ({
  cloudSave: () => Promise.resolve({ ok: true }),
  cloudSaveComRetry: () => Promise.resolve({ ok: true }),
  emailToSaveId: async () => 'x',
  adoptCloudSave: async () => false,
}));
vi.mock('../utils/community', () => ({
  pushProfile: (p: Record<string, unknown>) => { perfis.push(p); return Promise.resolve({ ok: true }); },
}));
vi.mock('sonner', () => ({
  toast: { warning: () => {}, error: () => {}, success: () => {}, info: () => {} },
}));

function Espiao() {
  const { gameState, setGameState } = useGameState();
  return (
    <>
      <pre data-testid="estado">{JSON.stringify(gameState)}</pre>
      <button onClick={() => setGameState(s => ({ ...s, gamePoints: (s.gamePoints ?? 0) + 1 }))}>mais</button>
    </>
  );
}

function abrirComSave(save: unknown) {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(save));
  render(<GameStateProvider><Espiao /></GameStateProvider>);
}
const estado = () => JSON.parse(screen.getByTestId('estado').textContent!);
const BASE = { activities: [], tasks: [], pvpEnabled: true, totalXP: 4000, soulmonMeta: { baseName: 'Fagulha' } };

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  perfis.length = 0;
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('hideFromPublicList — sanitização no load', () => {
  it('save antigo (sem o campo): false, ou seja, APARECE', () => {
    abrirComSave(BASE);
    expect(estado().hideFromPublicList).toBe(false);
  });

  it.each(['true', 'false', 1, 0, {}, [], null])('lixo %j vira false', lixo => {
    abrirComSave({ ...BASE, hideFromPublicList: lixo });
    expect(estado().hideFromPublicList).toBe(false);
  });

  it('true literal é preservado', () => {
    abrirComSave({ ...BASE, hideFromPublicList: true });
    expect(estado().hideFromPublicList).toBe(true);
  });
});

describe('hideFromPublicList — o que sobe para o servidor', () => {
  async function gesto() {
    act(() => { screen.getByText('mais').click(); });
    await act(async () => { vi.advanceTimersByTime(3000); await Promise.resolve(); });
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  }

  it('escondido: o perfil leva publicHidden=true', async () => {
    vi.useFakeTimers();
    try {
      abrirComSave({ ...BASE, hideFromPublicList: true });
      await gesto();
      expect(perfis.at(-1)?.publicHidden).toBe(true);
    } finally { vi.useRealTimers(); }
  });

  it('padrão: o perfil leva publicHidden=false (explícito, para o servidor poder devolver o registro)', async () => {
    vi.useFakeTimers();
    try {
      abrirComSave(BASE);
      await gesto();
      expect(perfis.at(-1)?.publicHidden).toBe(false);
    } finally { vi.useRealTimers(); }
  });
});
