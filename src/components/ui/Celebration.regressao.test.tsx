// @vitest-environment jsdom
/** QA-20: re-render do pai com `onDone` novo não pode reiniciar o timer da celebração. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { Celebration } from './Celebration';

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Celebration', () => {
  it('termina em 1300ms mesmo com o pai re-renderizando', () => {
    vi.useFakeTimers();
    const done = vi.fn();
    const { rerender } = render(<Celebration onDone={() => done()} />);
    for (let i = 0; i < 6; i++) {
      act(() => { vi.advanceTimersByTime(300); });
      rerender(<Celebration onDone={() => done()} />);
    }
    expect(done).toHaveBeenCalledTimes(1);
  });
});
