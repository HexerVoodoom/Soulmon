// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { decideSwipe, useSwipeNav } from './useSwipeNav';

const ev = (x: number, y: number, target: unknown = document.body) => ({ clientX: x, clientY: y, pointerId: 1, target }) as never;
function setup(hasPrev = true, hasNext = true) {
  const onPrev = vi.fn(), onNext = vi.fn();
  const { result } = renderHook(() => useSwipeNav({ onPrev, onNext, hasPrev, hasNext }));
  const swipe = (dx: number, dy = 0, target?: unknown) => { result.current.onPointerDown(ev(100, 100, target)); result.current.onPointerUp(ev(100 + dx, 100 + dy)); };
  return { onPrev, onNext, swipe };
}

describe('decideSwipe', () => {
  it('limiares: >40px e |dx| > |dy|*1.5', () => {
    expect(decideSwipe(-41, 0)).toBe('next');
    expect(decideSwipe(41, 0)).toBe('prev');
    expect(decideSwipe(-40, 0)).toBeNull();
    expect(decideSwipe(-60, 40)).toBeNull();
    expect(decideSwipe(-60, 39)).toBe('next');
    expect(decideSwipe(0, 120)).toBeNull();
  });
});

describe('useSwipeNav', () => {
  it('esquerda = próximo, direita = anterior', () => {
    const h = setup(); h.swipe(-80); h.swipe(80);
    expect(h.onNext).toHaveBeenCalledTimes(1); expect(h.onPrev).toHaveBeenCalledTimes(1);
  });
  it('rolagem vertical não dispara', () => {
    const h = setup(); h.swipe(10, 150);
    expect(h.onNext).not.toHaveBeenCalled(); expect(h.onPrev).not.toHaveBeenCalled();
  });
  it('extremos não disparam', () => {
    const a = setup(false, true); a.swipe(80);
    const b = setup(true, false); b.swipe(-80);
    expect(a.onPrev).not.toHaveBeenCalled(); expect(b.onNext).not.toHaveBeenCalled();
  });
  it('gesto que começa em controle interativo é ignorado', () => {
    const btn = document.createElement('button'); document.body.appendChild(btn);
    const h = setup(); h.swipe(-80, 0, btn);
    expect(h.onNext).not.toHaveBeenCalled();
  });
});
