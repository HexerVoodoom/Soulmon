// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useOfertaPendente } from './useOfertaPendente';
import { useOcioso } from './useOcioso';
import { STORAGE_KEYS } from '../utils/storageKeys';

afterEach(() => { cleanup(); localStorage.clear(); vi.useRealTimers(); });

describe('useOfertaPendente', () => {
  it('segura a oferta enquanto ocupado, mostra ao ficar ocioso, grava o visto UMA vez e não some se o ócio cair', () => {
    const visto = vi.fn();
    const { result, rerender } = renderHook(({ fila, ocioso }) => useOfertaPendente(fila, ocioso, visto), { initialProps: { fila: ['fogo'], ocioso: false } });
    expect(result.current).toBeNull();
    expect(visto).not.toHaveBeenCalled();
    rerender({ fila: ['fogo'], ocioso: true });
    expect(result.current).toBe('fogo');
    expect(visto).toHaveBeenCalledTimes(1);
    rerender({ fila: ['fogo'], ocioso: false });
    expect(result.current).toBe('fogo');
    expect(visto).toHaveBeenCalledTimes(1);
  });
  it('dispensar a primeira não mostra a segunda até o ócio voltar', () => {
    const { result, rerender } = renderHook(({ fila, ocioso }) => useOfertaPendente(fila, ocioso), { initialProps: { fila: ['fogo', 'agua'], ocioso: true } });
    expect(result.current).toBe('fogo');
    rerender({ fila: ['agua'], ocioso: false });
    expect(result.current).toBeNull();
    rerender({ fila: ['agua'], ocioso: true });
    expect(result.current).toBe('agua');
  });
  it('o mesmo elemento enfileirado de novo depois de dispensado respeita o gate', () => {
    const { result, rerender } = renderHook(({ fila, ocioso }) => useOfertaPendente(fila, ocioso), { initialProps: { fila: ['fogo'], ocioso: true } });
    expect(result.current).toBe('fogo');
    rerender({ fila: [] as string[], ocioso: true });
    rerender({ fila: ['fogo'], ocioso: false });
    expect(result.current).toBeNull();
  });
});

describe('useOcioso', () => {
  it('view de atividade, masmorra e foco rodando seguram; o foco é relido do aparelho enquanto há algo esperando', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook((p: { view: string; naMasmorra: boolean }) => useOcioso({ ...p, esperando: true }), { initialProps: { view: 'home', naMasmorra: false } });
    expect(result.current.ocioso).toBe(true);
    rerender({ view: 'area:arena', naMasmorra: false });
    expect(result.current.motivo).toBe('area');
    rerender({ view: 'home', naMasmorra: true });
    expect(result.current.motivo).toBe('masmorra');
    rerender({ view: 'home', naMasmorra: false });
    expect(result.current.ocioso).toBe(true);
    localStorage.setItem(STORAGE_KEYS.FOCO_TIMER, JSON.stringify({ mode: 'p25', phase: 'focus', status: 'running', totalMs: 1500000, endAt: Date.now() + 600000 }));
    act(() => { vi.advanceTimersByTime(2100); });
    expect(result.current.motivo).toBe('foco');
    localStorage.removeItem(STORAGE_KEYS.FOCO_TIMER);
    act(() => { vi.advanceTimersByTime(2100); });
    expect(result.current.ocioso).toBe(true);
  });
});
