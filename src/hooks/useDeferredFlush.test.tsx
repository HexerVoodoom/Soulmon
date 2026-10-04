// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeferredFlush } from './useDeferredFlush';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('useDeferredFlush', () => {
  it('roda uma vez, no prazo', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDeferredFlush(3000));
    act(() => { result.current(fn); });
    act(() => { vi.advanceTimersByTime(2999); });
    expect(fn).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(2); });
    expect(fn).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(10_000); window.dispatchEvent(new Event('pagehide')); });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('pagehide antes do prazo roda na hora (e só uma vez)', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDeferredFlush(3000));
    act(() => { result.current(fn); });
    act(() => { window.dispatchEvent(new Event('pagehide')); });
    expect(fn).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('aba escondida roda o pendente; aba visível não', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDeferredFlush(3000));
    act(() => { result.current(fn); });
    const set = (v: 'visible' | 'hidden') => Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v });
    set('visible');
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(fn).not.toHaveBeenCalled();
    set('hidden');
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(fn).toHaveBeenCalledTimes(1);
    set('visible');
  });

  it('desmontar com pendente roda o pendente', () => {
    const fn = vi.fn();
    const { result, unmount } = renderHook(() => useDeferredFlush(3000));
    act(() => { result.current(fn); });
    unmount();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
