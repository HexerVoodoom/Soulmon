// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { NoticeToast, NOTICE_TOAST_MS } from './NoticeToast';
import { UnlockToast, UNLOCK_TOAST_MS } from './UnlockToast';

afterEach(() => { cleanup(); vi.useRealTimers(); });

// O App passa `onDone={() => set...(null)}` (identidade nova a cada render) e re-renderiza com frequência.
describe('QA rodada 2: balões não bloqueantes somem sozinhos mesmo com o App re-renderizando', () => {
  it('NoticeToast: re-render a cada 1 s NÃO reinicia os 8 s', () => {
    vi.useFakeTimers();
    const done = vi.fn();
    const ui = () => <NoticeToast noticeKey="refeicao" language="pt-BR" onOpen={() => {}} onDone={() => done()} />;
    const { rerender } = render(ui());
    for (let i = 0; i < Math.ceil(NOTICE_TOAST_MS / 1000) + 1; i++) { act(() => { vi.advanceTimersByTime(1000); }); rerender(ui()); }
    expect(done).toHaveBeenCalledTimes(1);
  });
  it('UnlockToast: re-render a cada 1 s NÃO reinicia os 6 s', () => {
    vi.useFakeTimers();
    const done = vi.fn();
    const ui = () => <UnlockToast ids={['jogos.salao']} language="pt-BR" onDone={() => done()} />;
    const { rerender } = render(ui());
    for (let i = 0; i < Math.ceil(UNLOCK_TOAST_MS / 1000) + 1; i++) { act(() => { vi.advanceTimersByTime(1000); }); rerender(ui()); }
    expect(done).toHaveBeenCalledTimes(1);
  });
});
