// @vitest-environment jsdom
/**
 * QA20 L2 — a agenda do cocô e o "visto" são idempotentes: o updater não sorteia
 * de novo uma agenda que já existe nem repete um índice em `poopEventsShown`.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useCareSystem } from './useCareSystem';

afterEach(() => { cleanup(); vi.useRealTimers(); });

const base = (over: Record<string, unknown> = {}) => ({
  lastResetDate: new Date().toDateString(),
  poopEventsScheduled: [] as number[],
  poopEventsCompleted: [] as number[],
  poopEventsShown: [] as number[],
  evolutionStage: 'rookie',
  maxHealthPoints: 4,
  energyPoints: 4,
  ...over,
});

describe('useCareSystem — updaters idempotentes', () => {
  it('agenda: se o estado já ganhou agenda antes do commit, o updater devolve `prev`', () => {
    const updaters: ((p: any) => any)[] = [];
    renderHook(() => useCareSystem({
      gameState: base(), careEvent: null, setCareEvent: () => {}, setMessageTrigger: () => {},
      setGameState: fn => { updaters.push(fn); }, language: 'pt-BR', isSleeping: false,
    }));
    expect(updaters.length).toBeGreaterThan(0);
    const jaAgendado = base({ poopEventsScheduled: [1, 2] });
    expect(updaters[0](jaAgendado)).toBe(jaAgendado);
    const vazio = base();
    expect(updaters[0](vazio).poopEventsScheduled).toHaveLength(2);
  });

  it('visto: o índice já em `poopEventsShown` não entra de novo', () => {
    vi.useFakeTimers();
    const updaters: ((p: any) => any)[] = [];
    const gs = base({ poopEventsScheduled: [Date.now() - 1000, Date.now() + 9e7] });
    renderHook(() => useCareSystem({
      gameState: gs, careEvent: null, setCareEvent: () => {}, setMessageTrigger: () => {},
      setGameState: fn => { updaters.push(fn); }, language: 'pt-BR', isSleeping: false,
    }));
    vi.advanceTimersByTime(10_000);
    expect(updaters).toHaveLength(1);
    const visto = { ...gs, poopEventsShown: [0] };
    expect(updaters[0](visto)).toBe(visto);
    expect(updaters[0](gs).poopEventsShown).toEqual([0]);
  });
});
