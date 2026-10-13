// @vitest-environment jsdom
/**
 * 13.3 (beta-2) — persistência e integridade dos campos novos da frente B: `hunger`, `energyClock`, `dungeonDaily`, `checkIns`.
 *
 * Régua do `hydrateSave`: save bom faz ida e volta idêntica; save ANTIGO (sem os campos) abre sem eles e sem lançar; lixo é saneado
 * (nunca NaN, nunca negativo, nunca dívida retroativa); e a regra que usa o campo lê o MESMO dado que a UI mostra (estado visual = estado real).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState, type GameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { energyStatus, settleEnergy, eat, HUNGER_PER_FOOD, UNIT_POINTS } from '../utils/hunger';
import { spendLayer, layersToday, DUNGEON_DAILY_LAYERS } from '../utils/dungeonIdle';
import { claimCheckIn, claimedToday } from '../utils/checkIns';

const BASE = { activities: [], tasks: [], lastResetDate: new Date().toDateString() };
let ctxRef: { gameState: GameState; setGameState: (f: (p: GameState) => GameState) => void } | null = null;
function Sonda() {
  const c = useGameState();
  ctxRef = c as never;
  return <pre data-testid="estado">{JSON.stringify(c.gameState)}</pre>;
}
function montar(): GameState {
  cleanup();
  render(<GameStateProvider><Sonda /></GameStateProvider>);
  return JSON.parse(screen.getByTestId('estado').textContent!) as GameState;
}
const salvar = (extra: Record<string, unknown>) => {
  localStorage.clear();
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ ...BASE, ...extra }));
};

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('hydrateSave dos campos novos', () => {
  const bom = {
    hunger: { v: 42.5, at: 1_790_000_000_000 },
    energyClock: { at: 1_790_000_100_000, carry: 12345 },
    dungeonDaily: { day: '2026-10-13', layers: 4 },
    checkIns: { day: '2026-10-13', claimed: ['morning', 'night'] },
  };
  it('save bom: ida e volta idêntica (nada reescrito, nada perdido)', () => {
    salvar(bom);
    const s = montar();
    expect(s.hunger).toEqual(bom.hunger);
    expect(s.energyClock).toEqual(bom.energyClock);
    expect(s.dungeonDaily).toEqual(bom.dungeonDaily);
    expect(s.checkIns).toEqual(bom.checkIns);
  });
  it('save ANTIGO (sem os campos): abre, e a ausência significa fome cheia / relógio novo / nenhuma camada / nenhuma janela', () => {
    salvar({ energyPoints: 3, evolutionStage: 'rookie' });
    const s = montar();
    expect(s.hunger).toBeUndefined();
    expect(s.dungeonDaily).toBeUndefined();
    expect(s.checkIns).toBeUndefined();
    const agora = Date.now();
    // sem registro a fome é cheia (sem dívida retroativa) e o relógio da energia nasce na primeira leitura
    expect(energyStatus(s, agora).hunger).toBe(100);
    expect(settleEnergy(s, agora).energyPoints).toBe(3);
    expect(layersToday(s, agora)).toBe(0);
    expect(claimedToday(s, agora)).toEqual([]);
  });
  it('lixo: nunca NaN, nunca negativo, nunca estoura o relógio; campo ruim some em vez de derrubar o load', () => {
    salvar({
      hunger: { v: 'cheio', at: 5 },
      energyClock: { at: 'agora', carry: -1 },
      dungeonDaily: { day: 'hoje', layers: 3 },
      checkIns: { day: 7, claimed: 'morning' },
    });
    const s = montar();
    expect(s.hunger).toBeUndefined();
    expect(s.energyClock).toBeUndefined();
    expect(s.dungeonDaily).toBeUndefined();
    expect(s.checkIns).toBeUndefined();
    salvar({ hunger: { v: 1e12, at: -9 }, energyClock: { at: 10, carry: 1e40 }, dungeonDaily: { day: '2026-10-13', layers: 1e9 }, checkIns: { day: '2026-10-13', claimed: ['night', 'x', 'night'] } });
    const t = montar();
    expect(t.hunger).toEqual({ v: 100, at: 0 });
    expect(t.energyClock!.carry).toBeLessThan(UNIT_POINTS);
    expect(t.dungeonDaily).toEqual({ day: '2026-10-13', layers: 999 });
    expect(t.checkIns).toEqual({ day: '2026-10-13', claimed: ['night'] });
  });
});

describe('o estado vivo persiste e a UI lê o mesmo dado que a regra (fechar e reabrir o app)', () => {
  it('comer → gastar camada → check-in → "fechar o app" (localStorage) → reabrir: fome, relógio, contador e janela voltam iguais, e nada é repago', async () => {
    const T = Date.UTC(2026, 9, 13, 15, 0, 0);
    salvar({ energyPoints: 6, evolutionStage: 'mega', hunger: { v: 10, at: T }, energyClock: { at: T, carry: 0 }, totalXP: 0 });
    montar();
    await act(async () => {
      ctxRef!.setGameState(prev => spendLayer(eat(prev, T, HUNGER_PER_FOOD), T));
    });
    await act(async () => {
      ctxRef!.setGameState(prev => claimCheckIn(prev, new Date(2026, 9, 13, 21, 0).getTime()).state);
    });
    const antes = ctxRef!.gameState;
    expect(antes.energyPoints).toBe(5);
    expect(layersToday(antes, T)).toBe(1);
    // "fecha o app": o provider já gravou no localStorage; reabre do zero
    const gravado = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE)!);
    expect(gravado.dungeonDaily.layers).toBe(1);
    const depois = montar();
    expect(depois.hunger).toEqual(antes.hunger);
    expect(depois.energyClock).toEqual(antes.energyClock);
    expect(depois.dungeonDaily).toEqual(antes.dungeonDaily);
    expect(depois.checkIns).toEqual(antes.checkIns);
    expect(depois.energyPoints).toBe(antes.energyPoints);
    // reabrir não repaga: a janela segue resgatada e a camada segue contada
    await act(async () => {
      ctxRef!.setGameState(prev => claimCheckIn(prev, new Date(2026, 9, 13, 21, 5).getTime()).state);
    });
    expect(ctxRef!.gameState.totalXP).toBe(antes.totalXP);
    expect(layersToday(ctxRef!.gameState, T)).toBe(1);
    expect(DUNGEON_DAILY_LAYERS).toBeGreaterThan(1);
  });
});
