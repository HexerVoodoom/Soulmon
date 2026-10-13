// @vitest-environment jsdom
/**
 * 6.2 (beta-2) — o instante de retorno da placa "In Dungeon" é função do estado PERSISTIDO: não reinicia ao reabrir, não é contador de
 * tela, é o fim que a MESMA conta determinística de `applyDungeonAway` vai dar, e muda quando o estado muda.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { GameState } from '../contexts/GameStateContext';
import { useDungeonReturn } from './useDungeonReturn';
import { DUNGEON_AWAY_MAX_MS, DUNGEON_FIGHTS_PER_FLOOR, DUNGEON_DAILY_LAYERS, dungeonDayOf, type DungeonAway } from '../utils/dungeonIdle';
import { applyDungeonAway } from '../utils/dungeonAway';
import { soulCombatant } from '../utils/soulXP';

const T0 = Date.UTC(2026, 9, 13, 15, 0, 0);
const away = (over: Partial<DungeonAway> = {}): DungeonAway => {
  const c = soulCombatant({ evolutionStage: 'ultimate' });
  return {
    since: T0, seed: 424242, layer: 1, slot: DUNGEON_FIGHTS_PER_FLOOR, hp: 1, en: 0, ms: false,
    player: { level: c.level, atk: c.atk, def: c.def, spd: c.spd, hp: c.hp, bonus: c.bonus, fam: 'direct', sh: 0, hb: 0, rb: 0, stage: 'ultimate' },
    ...over,
  };
};
const estado = (over: Record<string, unknown> = {}): GameState => ({
  foodInventory: {}, gamePoints: 0, energyPoints: 3, totalXP: 5_000_000, evolutionStage: 'ultimate', dungeonAway: away(), energyClock: { at: T0, carry: 0 },
  hunger: { v: 0, at: T0 }, ...over,
}) as unknown as GameState;

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0 + 10 * 60_000); });
afterEach(() => { vi.useRealTimers(); });

describe('useDungeonReturn', () => {
  it('sem descida em andamento: nada', () => {
    const { result } = renderHook(() => useDungeonReturn(estado({ dungeonAway: undefined })));
    expect(result.current).toEqual({ returnAt: null, msLeft: null });
  });

  it('antes da projeção carregar vale o TETO (since + 8 h); depois, o fim projetado — o mesmo que a conta de volta vai dar', async () => {
    const st = estado();
    const { result } = renderHook(() => useDungeonReturn(st));
    expect(result.current.returnAt).toBe(T0 + DUNGEON_AWAY_MAX_MS);
    const { report } = applyDungeonAway(st, T0 + DUNGEON_AWAY_MAX_MS);
    expect(report!.ended).toBe('energy'); // 3 de energia, sem fome: a descida acaba bem antes das 8 h
    await waitFor(() => expect(result.current.returnAt).toBe(T0 + report!.elapsedMs));
    expect(result.current.returnAt!).toBeLessThan(T0 + DUNGEON_AWAY_MAX_MS);
  });

  it('NÃO reinicia ao reabrir: remontar o hook (navegar/fechar/abrir) com o mesmo estado dá o MESMO instante de retorno, e o tempo restante só diminui', async () => {
    const st = estado({ energyPoints: 12 }); // 10 camadas (limite diário) ≈ 27 min de descida
    const a = renderHook(() => useDungeonReturn(st));
    await waitFor(() => expect(a.result.current.returnAt).toBeLessThan(T0 + DUNGEON_AWAY_MAX_MS));
    const fim = a.result.current.returnAt!;
    const msAntes = a.result.current.msLeft!;
    a.unmount();
    vi.setSystemTime(T0 + 18 * 60_000); // 8 min depois, "reabriu o app"
    const b = renderHook(() => useDungeonReturn(JSON.parse(JSON.stringify(st)) as GameState));
    await waitFor(() => expect(b.result.current.returnAt).toBe(fim));
    expect(b.result.current.msLeft!).toBeLessThanOrEqual(msAntes - 8 * 60_000 + 1);
  });

  it('muda quando o ESTADO muda: mais energia, descida mais longa — e o limite diário a encurta', async () => {
    const pouca = renderHook(() => useDungeonReturn(estado({ energyPoints: 2 })));
    const muita = renderHook(() => useDungeonReturn(estado({ energyPoints: 12 })));
    await waitFor(() => expect(pouca.result.current.returnAt).toBeLessThan(T0 + DUNGEON_AWAY_MAX_MS));
    await waitFor(() => expect(muita.result.current.returnAt!).toBeGreaterThan(pouca.result.current.returnAt!));
    const noLimite = renderHook(() => useDungeonReturn(estado({ energyPoints: 12, dungeonDaily: { day: dungeonDayOf({}, T0), layers: DUNGEON_DAILY_LAYERS } })));
    await waitFor(() => expect(noLimite.result.current.returnAt!).toBeLessThan(muita.result.current.returnAt!));
  });

  it('o tempo restante nunca é negativo', async () => {
    vi.setSystemTime(T0 + 30 * 3_600_000);
    const { result } = renderHook(() => useDungeonReturn(estado()));
    await waitFor(() => expect(result.current.msLeft).toBe(0));
  });
});
