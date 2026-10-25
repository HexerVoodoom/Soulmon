/** beta3 F1: a descida aberta pelo foco termina junto com o timer de foco (`until`), ou antes se a energia/HP acabar. */
import { describe, it, expect } from 'vitest';
import type { GameState } from '../contexts/GameStateContext';
import { startFocusDescent } from './focusDescent';
import { applyDungeonAway } from './dungeonAway';
import { sanitizeDungeonAway } from './dungeonIdle';

const T0 = Date.UTC(2026, 9, 25, 15, 0, 0);
const MIN = 60_000;
const estado = (): GameState => ({
  foodInventory: {}, gamePoints: 0, energyPoints: 8, totalXP: 5_000_000, evolutionStage: 'ultimate',
} as unknown as GameState);

describe('descida do foco: o fim projetado é o fim do timer', () => {
  it('`until` é gravado e sobrevive à higienização', () => {
    const next = startFocusDescent(estado(), T0, 7, T0 + 25 * MIN);
    expect(next.dungeonAway?.until).toBe(T0 + 25 * MIN);
    expect(sanitizeDungeonAway(next.dungeonAway)?.until).toBe(T0 + 25 * MIN);
  });
  it('sem fim informado (ou no passado) não grava `until`', () => {
    expect(startFocusDescent(estado(), T0, 7).dungeonAway?.until).toBeUndefined();
    expect(startFocusDescent(estado(), T0, 7, T0 - 1).dungeonAway?.until).toBeUndefined();
  });
  it('passado o fim, o Soulmon volta; nada rende depois do fim e a conta não passa dele', () => {
    const open = startFocusDescent(estado(), T0, 7, T0 + 25 * MIN);
    const noFim = applyDungeonAway(open, T0 + 25 * MIN);
    const tarde = applyDungeonAway(open, T0 + 6 * 60 * MIN);
    expect(noFim.next.dungeonAway).toBeUndefined();
    expect(tarde.next.dungeonAway).toBeUndefined();
    expect(tarde.report?.ended).toBeTruthy();
    expect(tarde.report!.elapsedMs).toBeLessThanOrEqual(25 * MIN);
    expect(tarde.report!.layers).toBe(noFim.report!.layers);
    expect(tarde.report!.bits).toBe(noFim.report!.bits);
  });
  it('antes do fim ainda está descendo', () => {
    const open = startFocusDescent(estado(), T0, 7, T0 + 25 * MIN);
    const meio = applyDungeonAway(open, T0 + 5 * MIN);
    if (!meio.report?.ended) expect(meio.next.dungeonAway?.until).toBe(T0 + 25 * MIN);
  });
});
