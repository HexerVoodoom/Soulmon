// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { PresentationSlot } from './PresentationSlot';

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('QA rodada 2: PresentationSlot watchdog', () => {
  it('re-render do pai (onFail inline, nova identidade a cada render) NÃO reinicia o tempo de segurança de 8 s', () => {
    vi.useFakeTimers();
    const fail = vi.fn();
    const Pendente = (() => { throw new Promise(() => {}); }) as unknown as () => null;
    const ui = () => <PresentationSlot id="dailyReport" onFail={() => fail()}><Pendente /></PresentationSlot>;
    const { rerender } = render(ui());
    // o App re-renderiza com frequência (timers, estado): a cada 1 s um render novo
    for (let i = 0; i < 12; i++) {
      act(() => { vi.advanceTimersByTime(1_000); });
      rerender(ui());
    }
    expect(fail).toHaveBeenCalledTimes(1);
  });
});
