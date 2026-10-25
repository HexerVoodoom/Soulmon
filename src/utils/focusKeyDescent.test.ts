/** beta3 F1 — a chave do "Prepare to Focus" e a descida de background do timer de foco. */
import { describe, it, expect } from 'vitest';
import type { GameState } from '../contexts/GameStateContext';
import { grantFocusKey, hasFocusKey, sanitizeFocusKeyDay } from './focusKey';
import { focusDescentRefusal, startFocusDescent } from './focusDescent';
import { DUNGEON_ENERGY_PER_LAYER, soulmonNaMasmorra } from './dungeonIdle';
import { applyDungeonAway } from './dungeonAway';

const T0 = Date.UTC(2026, 9, 25, 15, 0, 0);
const DIA = 24 * 3_600_000;
const gs = (over: Record<string, unknown> = {}) => ({
  foodInventory: {}, gamePoints: 0, energyPoints: 12, totalXP: 5_000_000, evolutionStage: 'mega',
  energyClock: { at: T0, carry: 0 }, ...over,
}) as unknown as GameState;

describe('a chave do foco', () => {
  it('lixo vira undefined', () => {
    for (const x of [null, 1, 'x', '25/10/2026', {}]) expect(sanitizeFocusKeyDay(x)).toBeUndefined();
    expect(sanitizeFocusKeyDay('2026-10-25')).toBe('2026-10-25');
  });
  it('sem chave não libera; com chave libera naquele dia e fecha no dia seguinte', () => {
    const s = gs();
    expect(hasFocusKey(s, T0)).toBe(false);
    const k = grantFocusKey(s, T0);
    expect(hasFocusKey(k, T0)).toBe(true);
    expect(hasFocusKey(k, T0 + DIA)).toBe(false);
  });
  it('idempotente: dar de novo devolve a mesma referência', () => {
    const k = grantFocusKey(gs(), T0);
    expect(grantFocusKey(k, T0)).toBe(k);
  });
});

describe('a descida do foco', () => {
  it('abre o registro `dungeonAway` e cobra 1 energia', () => {
    const s = gs();
    expect(focusDescentRefusal(s, T0)).toBeUndefined();
    const n = startFocusDescent(s, T0, 7);
    expect(soulmonNaMasmorra(n)).toBe(true);
    expect(n.energyPoints).toBe(12 - DUNGEON_ENERGY_PER_LAYER);
    expect(n.dungeonAway!.since).toBe(T0);
  });
  it('recusa (mesma referência) sem energia, sem HP ou com o Soulmon já na masmorra', () => {
    const semEnergia = gs({ energyPoints: 0, hunger: { v: 0, at: T0 } });
    expect(focusDescentRefusal(semEnergia, T0)).toBe('no-energy');
    expect(startFocusDescent(semEnergia, T0)).toBe(semEnergia);
    const semHp = gs({ dungeonHp: { frac: 0, at: T0 } });
    expect(focusDescentRefusal(semHp, T0)).toBe('no-hp');
    const na = startFocusDescent(gs(), T0, 7);
    expect(focusDescentRefusal(na, T0)).toBe('busy');
    expect(startFocusDescent(na, T0)).toBe(na);
  });
  it('o registro é jogável pela conta de quem ficou fora', () => {
    const n = startFocusDescent(gs(), T0, 7);
    const { report } = applyDungeonAway(n, T0 + 2 * 3_600_000);
    expect(report).toBeTruthy();
    expect(report!.elapsedMs).toBeGreaterThan(0);
  });
});
