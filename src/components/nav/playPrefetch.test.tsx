// @vitest-environment jsdom
/**
 * J1 (rodada 7): o prefetch dos chunks de jogar baixa UM por tick ocioso, na ordem,
 * cancela limpo e nunca derruba nada quando a rede falha.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { prefetchSequence } from './playPrefetch';

afterEach(() => { vi.useRealTimers(); });

describe('prefetchSequence', () => {
  it('chama os loaders em ordem, um por tick, e sobrevive a um que falha', async () => {
    vi.useFakeTimers();
    const ordem: string[] = [];
    const a = vi.fn(async () => { ordem.push('a'); });
    const b = vi.fn(async () => { ordem.push('b'); throw new Error('offline'); });
    const c = vi.fn(async () => { ordem.push('c'); });
    prefetchSequence([a, b, c]);
    expect(a).not.toHaveBeenCalled(); // nada síncrono no mount
    await vi.advanceTimersByTimeAsync(5000);
    expect(ordem).toEqual(['a', 'b', 'c']);
  });

  it('o cancelamento impede os próximos', async () => {
    vi.useFakeTimers();
    const a = vi.fn(async () => {});
    const b = vi.fn(async () => {});
    const cancel = prefetchSequence([a, b]);
    await vi.advanceTimersByTimeAsync(700);
    cancel();
    await vi.advanceTimersByTimeAsync(5000);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
  });
});
