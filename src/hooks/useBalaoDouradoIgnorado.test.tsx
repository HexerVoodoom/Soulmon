// @vitest-environment jsdom
/** §383: o balão ignorado some até a PRÓXIMA abertura (Home de novo / app de volta), e no 2º ignorado do dia vira `dispensar`. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBalaoDouradoIgnorado } from './useBalaoDouradoIgnorado';
import { STORAGE_KEYS } from '../utils/storageKeys';

const DIA = '2026-11-15';
beforeEach(() => { localStorage.clear(); });

describe('useBalaoDouradoIgnorado', () => {
  it('1º ignorado: esconde nesta abertura, conta no aparelho, NÃO dispensa', () => {
    const disp = vi.fn();
    const { result } = renderHook(() => useBalaoDouradoIgnorado({ naHome: true, onDispensar: disp }));
    expect(result.current.oculto('rift')).toBe(false);
    act(() => result.current.ignorar('rift', DIA));
    expect(result.current.oculto('rift')).toBe(true);
    expect(result.current.oculto('grove')).toBe(false);
    expect(disp).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.BALAO_DOURADO_IGNORADOS) ?? '{}')).toEqual({ [`balaoDourado:rift:${DIA}`]: 1 });
  });

  it('não reaparece em laço: só volta quando a Home abre de novo', () => {
    const { result, rerender } = renderHook((p: { naHome: boolean }) => useBalaoDouradoIgnorado({ naHome: p.naHome, onDispensar: () => {} }), { initialProps: { naHome: true } });
    act(() => result.current.ignorar('rift', DIA));
    rerender({ naHome: true });
    expect(result.current.oculto('rift')).toBe(true);
    rerender({ naHome: false });
    rerender({ naHome: true });
    expect(result.current.oculto('rift')).toBe(false);
  });

  it('o app voltar ao primeiro plano conta como nova abertura', () => {
    const { result } = renderHook(() => useBalaoDouradoIgnorado({ naHome: true, onDispensar: () => {} }));
    act(() => result.current.ignorar('grove', DIA));
    expect(result.current.oculto('grove')).toBe(true);
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(result.current.oculto('grove')).toBe(false);
  });

  it('2º ignorado do mesmo dia: chama `onDispensar(tipo)` (o registro do save)', () => {
    const disp = vi.fn();
    const { result, rerender } = renderHook((p: { naHome: boolean }) => useBalaoDouradoIgnorado({ naHome: p.naHome, onDispensar: disp }), { initialProps: { naHome: true } });
    act(() => result.current.ignorar('achado', DIA));
    rerender({ naHome: false });
    rerender({ naHome: true });
    act(() => result.current.ignorar('achado', DIA));
    expect(disp).toHaveBeenCalledTimes(1);
    expect(disp).toHaveBeenCalledWith('achado');
  });
});
