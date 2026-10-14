// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent, act } from '@testing-library/react';
import { UnlockToast, unlockToastText, UNLOCK_TOAST_MS } from './UnlockToast';
import { pickPresentation } from '../utils/presentationQueue';

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('balão "prédio desbloqueado"', () => {
  it('um prédio: "<Prédio> desbloqueado em <local>" (PT) / "unlocked in" (EN)', () => {
    expect(unlockToastText(['mercado.ferreiro'], 'pt-BR')).toBe('Soulsmith desbloqueado em Mercado');
    expect(unlockToastText(['mercado.ferreiro'], 'en-US')).toBe('Soulsmith unlocked in Market');
  });
  it('vários do mesmo level-up viram UM balão', () => {
    const t = unlockToastText(['mercado.decoracao', 'mercado.ferreiro'], 'en-US');
    expect(t).toMatch(/^2 new places on the Map: /);
    expect(unlockToastText([], 'en-US')).toBe('');
  });
  it('não é modal (sem dialog), some sozinho e ao toque', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    const { container } = render(<UnlockToast ids={['mercado.ferreiro']} language="en-US" onDone={onDone} />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    act(() => { vi.advanceTimersByTime(UNLOCK_TOAST_MS + 10); });
    expect(onDone).toHaveBeenCalledTimes(1);
    fireEvent.click(container.querySelector('[data-unlock-toast]')!);
    expect(onDone).toHaveBeenCalledTimes(2);
  });
  it('item leve e NÃO sticky: um modal pronto o substitui, e ele só aparece sem modal pendente', () => {
    expect(pickPresentation({ unlockToast: true })).toBe('unlockToast');
    expect(pickPresentation({ unlockToast: true, checkIn: true }, 'unlockToast')).toBe('checkIn');
    expect(pickPresentation({ unlockToast: true, dream: true })).toBe('dream');
  });
});
