// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recarregarUmaVez, ehErroDeChunk, installChunkReloadHandlers, CHAVE_RECARGA_CHUNK } from './recargaPorChunk';

beforeEach(() => sessionStorage.clear());

describe('recargaPorChunk', () => {
  it('recarrega uma vez só por sessão', () => {
    const r = vi.fn();
    expect(recarregarUmaVez(r)).toBe(true);
    expect(recarregarUmaVez(r)).toBe(false);
    expect(r).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(CHAVE_RECARGA_CHUNK)).toBeTruthy();
  });
  it('sem sessionStorage não recarrega (evita laço)', () => {
    const r = vi.fn();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('x'); });
    expect(recarregarUmaVez(r)).toBe(false);
    expect(r).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
  it('reconhece erro de import dinâmico', () => {
    expect(ehErroDeChunk(new Error('Failed to fetch dynamically imported module: /assets/x.js'))).toBe(true);
    expect(ehErroDeChunk(new Error('outro'))).toBe(false);
  });
  it('vite:preloadError dispara o reload uma vez', () => {
    const r = vi.fn();
    installChunkReloadHandlers(window, r);
    window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
    window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
    expect(r).toHaveBeenCalledTimes(1);
  });
});
