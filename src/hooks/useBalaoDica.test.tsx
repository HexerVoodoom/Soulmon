// @vitest-environment jsdom
/** §333: a agenda da dica dourada (aparece, grava a aparição, sai sozinha, não empilha) e o registro no aparelho. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDicaDourada, useDicaVistas } from './useBalaoDica';
import { DICA_DOURADA_VISIVEL_MS, DICA_COOLDOWN_MS, type DicaVistas } from '../utils/balaoDica';
import { STORAGE_KEYS } from '../utils/storageKeys';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(Date.UTC(2026, 10, 13, 15)); localStorage.clear(); });
afterEach(() => { vi.useRealTimers(); });

describe('useDicaDourada', () => {
  it('aparece, grava a aparição UMA vez e sai sozinha depois da janela; no cooldown não volta', () => {
    const onMostrar = vi.fn();
    let vistas: DicaVistas = {};
    const { result, rerender } = renderHook(({ v }) => useDicaDourada({ presentes: { relaxar: true }, vistas: v, bloqueado: false, onMostrar }), { initialProps: { v: vistas } });
    expect(result.current.ativa).toBe('relaxar');
    expect(onMostrar).toHaveBeenCalledTimes(1);
    expect(onMostrar).toHaveBeenCalledWith('relaxar');
    vistas = { relaxar: Date.now() };
    rerender({ v: vistas });
    act(() => { vi.advanceTimersByTime(DICA_DOURADA_VISIVEL_MS); });
    rerender({ v: vistas });
    expect(result.current.ativa).toBeNull();
    expect(onMostrar).toHaveBeenCalledTimes(1);
    // passado o cooldown, volta
    act(() => { vi.advanceTimersByTime(DICA_COOLDOWN_MS.relaxar); });
    rerender({ v: { ...vistas } });
    expect(result.current.ativa).toBe('relaxar');
  });
  it('nunca empilha: bloqueado (balão de evento na vez, ou fora da Home) não mostra nem grava', () => {
    const onMostrar = vi.fn();
    const { result } = renderHook(() => useDicaDourada({ presentes: { lilia: true }, vistas: {}, bloqueado: true, onMostrar }));
    expect(result.current.ativa).toBeNull();
    expect(onMostrar).not.toHaveBeenCalled();
  });
  it('a condição acabou (ex.: tomou a energia): a dica sai do visor na hora', () => {
    const { result, rerender } = renderHook(({ ok }) => useDicaDourada({ presentes: { relaxar: ok }, vistas: {}, bloqueado: false, onMostrar: () => {} }), { initialProps: { ok: true } });
    expect(result.current.ativa).toBe('relaxar');
    rerender({ ok: false });
    expect(result.current.ativa).toBeNull();
  });
  it('dica comum nunca vira dourada', () => {
    const { result } = renderHook(() => useDicaDourada({ presentes: { fome: true, cochilo: true }, vistas: {}, bloqueado: false, onMostrar: () => {} }));
    expect(result.current.ativa).toBeNull();
  });
});

describe('useDicaVistas', () => {
  it('grava no aparelho e relê com leitura tolerante', () => {
    const { result } = renderHook(() => useDicaVistas());
    act(() => { result.current[1]('fome'); });
    expect(result.current[0].fome).toBe(Date.now());
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.BALAO_DICAS_VISTAS) ?? '{}')).toEqual({ fome: Date.now() });
    localStorage.setItem(STORAGE_KEYS.BALAO_DICAS_VISTAS, '{"lixo":1,"cochilo":"x"}');
    const { result: r2 } = renderHook(() => useDicaVistas());
    expect(r2.current[0]).toEqual({});
  });
});
