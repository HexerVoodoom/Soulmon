// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShopFlash } from './ShopShelf';

describe('useShopFlash (regressão QA20)', () => {
  it('segunda fala do mesmo item não é apagada pelo timer da primeira', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useShopFlash());
    act(() => result.current.say('a', true, 'um'));
    act(() => { vi.advanceTimersByTime(2000); });
    act(() => result.current.say('a', true, 'dois'));
    act(() => { vi.advanceTimersByTime(700); });
    expect(result.current.flash?.msg).toBe('dois');
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.flash).toBeNull();
    vi.useRealTimers();
  });
});
