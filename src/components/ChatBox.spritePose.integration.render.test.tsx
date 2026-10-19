// @vitest-environment jsdom
/**
 * INTEGRAÇÃO chat x pose do sprite (release/beta-1, 11/10/2026): as ações
 * `flip_soulmon` / `fly` / `land` vindas do servidor passam pelo writer REAL
 * (`GameStateProvider` → `registerSpritePoseWriter`/`Reader`) e chegam ao
 * `gameState.spritePose` e ao save. Antes do merge o chat usava um stub em
 * memória que nunca tocava o estado — este teste trava a costura.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';

const aiFetch = vi.fn();
vi.mock('../utils/aiClient', () => ({ aiFetch: (...a: unknown[]) => aiFetch(...a) }));
vi.mock('../utils/serverConfig', () => ({
  fetchServerConfig: () => Promise.resolve({ authRequired: false, transcribeAvailable: false }),
  peekServerConfig: () => null,
  resetServerConfigCache: () => {},
}));
const { toast } = vi.hoisted(() => ({ toast: Object.assign(vi.fn(), { warning: vi.fn(), error: vi.fn() }) }));
vi.mock('sonner', () => ({ toast }));

import { ChatBox } from './ChatBox';
import { GameStateProvider, useGameState } from '../contexts/GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

function Sonda() {
  const { gameState } = useGameState();
  return <pre data-testid="pose">{JSON.stringify(gameState.spritePose)}</pre>;
}
const pose = () => JSON.parse(screen.getByTestId('pose').textContent!);

async function mandar(texto: string, actions: unknown[]) {
  aiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ response: 'ok!', actions }), text: async () => '' });
  const campo = screen.getByRole('textbox');
  await act(async () => { fireEvent.focus(campo); });
  await act(async () => { fireEvent.change(campo, { target: { value: texto } }); });
  await act(async () => { fireEvent.keyDown(campo, { key: 'Enter' }); });
  await act(async () => { await Promise.resolve(); });
}

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], lastResetDate: 'Mon Jan 01 2024' }));
  aiFetch.mockReset();
  toast.mockReset();
  render(
    <GameStateProvider>
      <Sonda />
      <ChatBox petName="Bito" mood="idle" evolutionStage="rookie" useAI onSendMessage={() => {}} language="pt-BR" />
    </GameStateProvider>,
  );
});
afterEach(() => { cleanup(); });

describe('chat → applySpritePose → estado real', () => {
  it('flip_soulmon alterna a partir da pose ATUAL (duas vezes volta ao início)', async () => {
    expect(pose()).toEqual({ flipX: false, altitude: 'ground' });
    await mandar('vira', [{ type: 'flip_soulmon' }]);
    await vi.waitFor(() => expect(pose()).toEqual({ flipX: true, altitude: 'ground' }));
    await mandar('vira de novo', [{ type: 'flip_soulmon' }]);
    await vi.waitFor(() => expect(pose()).toEqual({ flipX: false, altitude: 'ground' }));
  });

  it('fly sobe, land pousa, e a pose persiste no save', async () => {
    await mandar('voa', [{ type: 'fly' }]);
    await vi.waitFor(() => expect(pose().altitude).toBe('air'));
    await vi.waitFor(() => {
      const salvo = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE) ?? '{}');
      expect(salvo.spritePose).toEqual({ flipX: false, altitude: 'air' });
    });
    await mandar('pousa', [{ type: 'land' }]);
    await vi.waitFor(() => expect(pose().altitude).toBe('ground'));
  });

  // Regressão nomeada (bug real achado na integração): 2 ações na mesma resposta
  // liam a pose velha — o 2º "Desfazer" revertia também o 1º.
  it('"Desfazer" do toast restaura a pose anterior pelo mesmo writer', async () => {
    await mandar('vira e voa', [{ type: 'flip_soulmon' }, { type: 'fly' }]);
    await vi.waitFor(() => expect(pose()).toEqual({ flipX: true, altitude: 'air' }));
    // último toast = desfazer do `fly` (antes: flipX true, chão)
    const ultimo = toast.mock.calls.at(-1)![1] as { action: { onClick: () => void } };
    act(() => { ultimo.action.onClick(); });
    await vi.waitFor(() => expect(pose()).toEqual({ flipX: true, altitude: 'ground' }));
  });

  it('ação de pose desconhecida/lixo não toca o estado', async () => {
    await mandar('?', [{ type: 'teleport' }, { type: 'FLY' }, 'fly', null, 42]);
    expect(pose()).toEqual({ flipX: false, altitude: 'ground' });
  });
});
