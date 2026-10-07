// @vitest-environment jsdom
/**
 * O LOAD DO SAVE E A DEMO LOCAL (07/10/2026):
 *  · save antigo com um dos SEIS `demoCharacterId` de antes continua carregando
 *    o mesmo id (e o sprite, em `demoMode.test.ts`);
 *  · os 5 iniciais também sobrevivem ao load; id desconhecido é descartado;
 *  · `demoLocal` só sobrevive como `true` literal;
 *  · a demo grava SÓ no aparelho: o efeito de salvar não chama `fetch` nem gera `saveId`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { LEGACY_PREMADE_IDS, STARTER_IDS } from '../utils/sprites';
import { buildDemoPatch } from '../utils/demoStart';
import { bondLevelFor } from '../utils/bond';

const BASE = { activities: [], tasks: [], lastResetDate: new Date().toDateString() };

let ultimo: { gameState: Record<string, unknown>; setGameState: (f: (p: never) => never) => void } | null = null;
function Sonda() {
  const ctx = useGameState();
  ultimo = ctx as never;
  return <pre data-testid="estado">{JSON.stringify(ctx.gameState)}</pre>;
}
function montar(save: Record<string, unknown>) {
  cleanup();
  localStorage.clear();
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ ...BASE, ...save }));
  render(<GameStateProvider><Sonda /></GameStateProvider>);
  return JSON.parse(screen.getByTestId('estado').textContent!) as Record<string, unknown>;
}

const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
beforeEach(() => { installDomGlobals(); fetchMock.mockClear(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { vi.unstubAllGlobals(); cleanup(); });

describe('hydrate dos `demoCharacterId`', () => {
  for (const id of LEGACY_PREMADE_IDS) {
    it(`save antigo com "${id}" carrega o mesmo id (continua renderizando)`, () => {
      expect(montar({ accountTier: 'demo', demoCharacterId: id }).demoCharacterId).toBe(id);
    });
  }
  for (const id of STARTER_IDS) {
    it(`o inicial "${id}" sobrevive ao load`, () => {
      expect(montar({ accountTier: 'demo', demoCharacterId: id }).demoCharacterId).toBe(id);
    });
  }
  it('id desconhecido é descartado (nunca chega à arte)', () => {
    expect(montar({ demoCharacterId: 'ninguem' }).demoCharacterId).toBeUndefined();
  });
});

describe('hydrate de `demoLocal`', () => {
  it('só `true` literal sobrevive', () => {
    expect(montar({ demoLocal: true }).demoLocal).toBe(true);
    for (const v of ['true', 1, 'sim', {}, [], null, false]) expect(montar({ demoLocal: v }).demoLocal, String(v)).toBeUndefined();
  });

  it('save comum e save antigo não são demo', () => {
    expect(montar({ accountTier: 'demo', demoCharacterId: 'kaelen' }).demoLocal).toBeUndefined();
    expect(montar({}).demoLocal).toBeUndefined();
  });

  it('o save da demo carrega com Vínculo 5 e personagem escolhido', () => {
    const patch = buildDemoPatch('alento', { isPt: false, dayKey: '2026-10-07' })!;
    const s = montar(patch);
    expect(s.demoLocal).toBe(true);
    expect(s.demoCharacterId).toBe('alento');
    expect(bondLevelFor(s.totalXP as number)).toBe(5);
    expect(s.accountTier).toBe('demo');
    expect('bondLevel' in s).toBe(false);
  });
});

describe('o efeito de salvar na demo', () => {
  it('grava no aparelho, NUNCA na nuvem, e não gera `saveId`', async () => {
    vi.useFakeTimers();
    try {
      montar(buildDemoPatch('vida', { isPt: false, dayKey: '2026-10-07' })!);
      await act(async () => { ultimo!.setGameState(p => ({ ...(p as object), gamePoints: 99 }) as never); });
      await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
      expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE)!).gamePoints).toBe(99);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(localStorage.getItem(STORAGE_KEYS.SAVE_ID)).toBeNull();
    } finally { vi.useRealTimers(); }
  });

  it('CONTROLE: o save comum (fora da demo) ainda agenda o POST e gera o `saveId`', async () => {
    vi.useFakeTimers();
    try {
      montar({ accountTier: 'paid' });
      await act(async () => { ultimo!.setGameState(p => ({ ...(p as object), gamePoints: 7 }) as never); });
      await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
      expect(localStorage.getItem(STORAGE_KEYS.SAVE_ID)).toBeTruthy();
      expect(fetchMock).toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
});
