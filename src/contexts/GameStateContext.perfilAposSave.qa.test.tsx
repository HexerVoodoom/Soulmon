// @vitest-environment jsdom
/**
 * QA rodada 2 (01-seguranca §1.3 / 04-dados §0): o perfil público só sobe
 * DEPOIS do cloud save confirmado.
 *
 * Antes, `cloudSaveComRetry` e `pushProfile` saíam do MESMO timer, em
 * paralelo. Depois de uma exclusão de conta, o segundo aparelho tomava 410 no
 * save (e o cliente limpava tudo) — mas o `pushProfile` já tinha regravado
 * `profile:<saveId>` + `pid:<pid>` no servidor. A promessa "apaga o seu perfil
 * público" valia por 3 segundos.
 *
 * Aqui: save ok → perfil sobe; save recusado (qualquer classe, inclusive 410)
 * → perfil NÃO sobe. Mais o 410 vindo de `/api/community` (`call` em
 * `utils/community.ts`): dispara a mesma `reagirContaExcluida`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

const { perfis, saveResultado, saves, reagiu } = vi.hoisted(() => ({
  perfis: [] as Array<Record<string, unknown>>,
  saveResultado: { atual: { ok: true } as Record<string, unknown> },
  saves: [] as number[],
  reagiu: { n: 0 },
}));

vi.mock('../utils/cloudSave', () => ({
  cloudSave: () => Promise.resolve({ ok: true }),
  cloudSaveComRetry: () => {
    saves.push(Date.now());
    return Promise.resolve(saveResultado.atual);
  },
  reagirContaExcluida: () => { reagiu.n += 1; return Promise.resolve(); },
  emailToSaveId: async () => 'x',
  adoptCloudSave: async () => false,
}));
vi.mock('../utils/community', () => ({
  pushProfile: (p: Record<string, unknown>) => {
    perfis.push({ ...p, em: Date.now() });
    return Promise.resolve({ ok: true });
  },
}));
vi.mock('sonner', () => ({
  toast: { warning: () => {}, error: () => {}, success: () => {}, info: () => {} },
}));

function Espiao() {
  const { setGameState } = useGameState();
  return <button onClick={() => setGameState(s => ({ ...s, gamePoints: (s.gamePoints ?? 0) + 1 }))}>mais</button>;
}

function abrirComSave(save: unknown) {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(save));
  render(<GameStateProvider><Espiao /></GameStateProvider>);
}

const COM_PVP_LIGADO = {
  activities: [], tasks: [], pvpEnabled: true, totalXP: 4000,
  soulmonMeta: { baseName: 'Fagulha' },
};

async function gestoEEspera() {
  act(() => { screen.getByText('mais').click(); });
  await act(async () => { vi.advanceTimersByTime(3000); await Promise.resolve(); });
  await act(async () => { for (let i = 0; i < 4; i++) await Promise.resolve(); });
}

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  perfis.length = 0;
  saves.length = 0;
  reagiu.n = 0;
  saveResultado.atual = { ok: true };
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('pushProfile só depois do save confirmado', () => {
  it('save ok → o perfil sobe, e só depois do save resolver', async () => {
    vi.useFakeTimers();
    try {
      abrirComSave(COM_PVP_LIGADO);
      await gestoEEspera();
      expect(saves).toHaveLength(1);
      expect(perfis).toHaveLength(1);
      expect(perfis[0].pvpEnabled).toBe(true);
    } finally { vi.useRealTimers(); }
  });

  it('save recusado com 410 (`deleted`) → NENHUM perfil sobe, e a reação de conta excluída dispara', async () => {
    vi.useFakeTimers();
    try {
      saveResultado.atual = { ok: false, kind: 'deleted', status: 410, retentavel: false, avisaJogador: true };
      abrirComSave(COM_PVP_LIGADO);
      await gestoEEspera();
      expect(saves).toHaveLength(1);
      expect(perfis).toHaveLength(0);
      expect(reagiu.n).toBe(1);
    } finally { vi.useRealTimers(); }
  });

  it('save recusado por qualquer outra classe (5xx) → o perfil também não sobe', async () => {
    vi.useFakeTimers();
    try {
      saveResultado.atual = { ok: false, kind: 'server', status: 503, retentavel: true, avisaJogador: false };
      abrirComSave(COM_PVP_LIGADO);
      await gestoEEspera();
      expect(perfis).toHaveLength(0);
      expect(reagiu.n).toBe(0);
    } finally { vi.useRealTimers(); }
  });

  it('abaixo do Vínculo 5, save ok não publica perfil (o gate continua)', async () => {
    vi.useFakeTimers();
    try {
      abrirComSave({ ...COM_PVP_LIGADO, totalXP: 0 });
      await gestoEEspera();
      expect(saves).toHaveLength(1);
      expect(perfis).toHaveLength(0);
    } finally { vi.useRealTimers(); }
  });
});
