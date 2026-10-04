// @vitest-environment jsdom
/**
 * QA3 — (1) a esquiva era medida no relógio de PAREDE: pausar ("Sair?") no meio da carga e
 * retomar fazia o gesto cair "depois do impacto" (nota `nada`) apesar de a luta estar dentro da janela;
 * (2) o contra-ataque do bloqueio perfeito agendava um `setTimeout` solto (450 ms) que escrevia
 * `hits` depois de a luta ser reiniciada/desmontada.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { usePveBattle, type PveRules } from './usePveBattle';
import { ENERGY_MAX, dodgeSpec } from '../../utils/energia';
import { PVE_STEP_MS, STAGE_TIMING } from '../../utils/combatFx';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const LEAD = PVE_STEP_MS - STAGE_TIMING.ranged.impact;

function rules(log: string[], counter = false): PveRules {
  let foeHp = 1000;
  return {
    perfect: 0.92, target: () => 0, foes: () => (foeHp > 0 ? [0] : []),
    playerElement: () => 'fogo', foeElement: () => 'agua',
    playerKind: () => 'ranged', foeKind: () => 'ranged',
    playerStrike: () => { foeHp -= 3; return { hits: [{ foe: 0, value: 3 }], victory: false }; },
    foeStrike: (i) => {
      log.push(`F:${i.special ? 'S' : 'n'}:${i.dodge}`);
      return { value: 1, blocked: false, defeat: false, ...(counter ? { counter: { foe: 0, value: 7 } } : {}) };
    },
    onVictory: () => {}, onDefeat: () => {},
  };
}

describe('usePveBattle — esquiva e pausa', () => {
  it('pausar na carga e retomar não estraga a janela da esquiva (relógio de luta, não de parede)', async () => {
    const log: string[] = [];
    const h = renderHook((p: { paused: boolean }) => usePveBattle({ running: true, paused: p.paused, seed: 3, reduced: false, rules: rules(log) }), { initialProps: { paused: false } });
    act(() => h.result.current._setFoeEnergy(0, ENERGY_MAX));
    await advance(LEAD + STAGE_TIMING.ranged.impact + LEAD + 10);
    expect(h.result.current.phase).toBe('dodge');
    const spec = dodgeSpec(3, 0);
    await advance(spec.impactMs - 200);
    h.rerender({ paused: true });
    await advance(8000);
    h.rerender({ paused: false });
    act(() => h.result.current.swipe(1));
    await advance(300);
    expect(log.some(l => l.startsWith('F:S:otimo'))).toBe(true);
  });
});

describe('usePveBattle — contra-ataque não vaza para a luta seguinte', () => {
  it('reset logo depois do contra-ataque: o número tardio não aparece', async () => {
    const log: string[] = [];
    const h = renderHook(() => usePveBattle({ running: true, paused: false, seed: 3, reduced: false, rules: rules(log, true) }));
    // até o revide do inimigo acontecer
    await advance(LEAD + STAGE_TIMING.ranged.impact + LEAD + STAGE_TIMING.ranged.impact + 20);
    expect(log.length).toBeGreaterThan(0);
    act(() => h.result.current.reset({ foes: 1, keepPet: true }));
    expect(h.result.current.hits).toEqual([]);
    await advance(600);
    expect(h.result.current.hits.some(x => x.side === 'foe' && x.value === 7)).toBe(false);
  });
});
