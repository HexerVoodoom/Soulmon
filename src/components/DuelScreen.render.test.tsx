// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { DuelScreen, cheerQuality } from './DuelScreen';
import { duelStats } from '../../functions/api/_duel.js';

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('DuelScreen', () => {
  it('a qualidade da torcida é 1 no alvo e 0 fora da janela', () => {
    expect(cheerQuality(0)).toBe(1);
    expect(cheerQuality(1000)).toBe(0);
  });

  it('luta sozinha, pede torcida e entrega as 3 torcidas ao fim (sem tocar = 0)', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    const s = duelStats({ stage: 'rookie' });
    render(<DuelScreen me={s} opp={s} seed={123} petSprite="" oppSprite="" petName="Pet" oppName="Rival" isPt onDone={onDone} onClose={() => {}} />);
    const btn = screen.getByRole('button', { name: 'Torcer' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    let sawCheer = false;
    for (let i = 0; i < 80 && !onDone.mock.calls.length; i++) {
      act(() => { vi.advanceTimersByTime(300); });
      if (!btn.disabled && !sawCheer) { sawCheer = true; fireEvent.click(btn); }
    }
    expect(sawCheer).toBe(true);
    expect(onDone).toHaveBeenCalledTimes(1);
    const cheers = onDone.mock.calls[0][0];
    expect(cheers).toHaveLength(3);
    cheers.forEach((q: number) => { expect(q).toBeGreaterThanOrEqual(0); expect(q).toBeLessThanOrEqual(1); });
  });
});
