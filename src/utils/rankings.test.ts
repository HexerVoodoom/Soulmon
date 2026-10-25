import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('./auth', () => ({ authHeaders: async () => ({ Authorization: 'Bearer t' }) }));
import { submitScore, fetchRanking } from './rankings';

afterEach(() => vi.unstubAllGlobals());

const board = { game: 'dino', period: 'weekly', periodKey: '2026-W43', top: [], me: null };

describe('cliente de ranking', () => {
  it('submitScore envia POST com token, jogo, período e score inteiro', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ ok: true, improved: true, best: 7, ...board }), { status: 200 }));
    vi.stubGlobal('fetch', f);
    const r = await submitScore('dino', 'player-aaaaaaaa', 7.9);
    expect(r.best).toBe(7);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/rankings');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer t');
    expect(JSON.parse(init.body as string)).toEqual({ id: 'player-aaaaaaaa', game: 'dino', period: 'weekly', score: 7 });
  });
  it('fetchRanking faz GET com a query e o token', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ ok: true, ...board }), { status: 200 }));
    vi.stubGlobal('fetch', f);
    await fetchRanking('eco', 'player-aaaaaaaa', 'monthly', 5);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('game=eco');
    expect(url).toContain('period=monthly');
    expect(url).toContain('top=5');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer t');
  });
  it('erro do servidor vira exceção com a mensagem', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'unknown game' }), { status: 400 })));
    await expect(fetchRanking('dino', 'player-aaaaaaaa')).rejects.toThrow('unknown game');
  });
  it('corpo ilegível é falha', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>', { status: 200 })));
    await expect(fetchRanking('dino', 'player-aaaaaaaa')).rejects.toThrow();
  });
});
