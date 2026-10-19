import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchServerConfig, peekServerConfig, resetServerConfigCache } from './serverConfig';

beforeEach(() => { resetServerConfigCache(); vi.unstubAllGlobals(); });

describe('peekServerConfig', () => {
  it('sem busca devolve null e não toca a rede', () => {
    const f = vi.fn(); vi.stubGlobal('fetch', f);
    expect(peekServerConfig()).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
  it('depois da busca devolve a resposta resolvida, sem nova requisição', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ transcribeAvailable: true }), { status: 200 }));
    vi.stubGlobal('fetch', f);
    await fetchServerConfig();
    expect(peekServerConfig()?.transcribeAvailable).toBe(true);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('falha de rede resolve tudo desligado', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('x'))));
    await fetchServerConfig();
    expect(peekServerConfig()?.transcribeAvailable).toBe(false);
  });
});
