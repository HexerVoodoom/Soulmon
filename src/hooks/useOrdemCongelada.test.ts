// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useOrdemCongelada } from './useOrdemCongelada';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

/** QA L06-07: o item recém-concluído fica ~2 s onde estava, para o toque seguinte no mesmo ponto acertar o item certo. */
describe('useOrdemCongelada', () => {
  it('o que já estava concluído na 1ª pintura nunca congela', () => {
    const { result } = renderHook(() => useOrdemCongelada(['t:1']));
    expect(result.current.size).toBe(0);
  });

  it('um item que acaba de ser concluído congela por 2 s e depois solta', () => {
    const { result, rerender } = renderHook(({ ids }) => useOrdemCongelada(ids), { initialProps: { ids: [] as string[] } });
    expect(result.current.size).toBe(0);
    rerender({ ids: ['t:2'] });
    expect(result.current.has('t:2')).toBe(true);
    act(() => { vi.advanceTimersByTime(1900); });
    expect(result.current.has('t:2')).toBe(true);
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current.has('t:2')).toBe(false);
  });

  it('conclusões em sequência congelam cada uma pelo seu próprio prazo', () => {
    const { result, rerender } = renderHook(({ ids }) => useOrdemCongelada(ids), { initialProps: { ids: [] as string[] } });
    rerender({ ids: ['t:1'] });
    act(() => { vi.advanceTimersByTime(1000); });
    rerender({ ids: ['t:1', 'h:9'] });
    expect([...result.current].sort()).toEqual(['h:9', 't:1']);
    act(() => { vi.advanceTimersByTime(1100); });
    expect([...result.current]).toEqual(['h:9']); // t:1 já soltou, h:9 ainda não
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.size).toBe(0);
  });
});
