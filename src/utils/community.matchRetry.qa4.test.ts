import { describe, it, expect, vi, afterEach } from 'vitest';
import { playMatchComRetry, isFalhaDeRede } from './community';

vi.mock('./auth', () => ({ authHeaders: async () => ({}) }));
vi.mock('./cloudSave', () => ({ reagirContaExcluida: vi.fn() }));

const ok = { won: true, draw: false, matchesLeft: 4, points: 10 };
const resp = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
afterEach(() => vi.unstubAllGlobals());

describe('QA-4: playMatchComRetry', () => {
  it('rede cai uma vez: tenta de novo, manda a MESMA semente e devolve o resultado', async () => {
    const f = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(resp(200, ok));
    vi.stubGlobal('fetch', f);
    const r = await playMatchComRetry('a'.repeat(32), 'p1', [1, 2], 777, [0, 0]);
    expect(r.won).toBe(true);
    expect(f).toHaveBeenCalledTimes(2);
    for (const c of f.mock.calls) expect(JSON.parse(c[1].body).seed).toBe(777);
  });
  it('rede cai sempre: desiste depois das tentativas e propaga o erro (a tela oferece "tentar de novo")', async () => {
    const f = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', f);
    await expect(playMatchComRetry('a'.repeat(32), 'p1', [], 1, [0, 0])).rejects.toThrow();
    expect(f).toHaveBeenCalledTimes(3);
  });
  it('erro decidido pelo servidor (404/429) NÃO é repetido', async () => {
    const f = vi.fn().mockResolvedValue(resp(404, { error: 'opponent unavailable', cancelled: true }));
    vi.stubGlobal('fetch', f);
    await expect(playMatchComRetry('a'.repeat(32), 'p1', [], 1, [0, 0])).rejects.toThrow('opponent unavailable');
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('classifica falha de transporte', () => {
    expect(isFalhaDeRede(new TypeError('x'))).toBe(true);
    expect(isFalhaDeRede(new Error('request failed (502)'))).toBe(true);
    expect(isFalhaDeRede(new Error('daily limit'))).toBe(false);
  });
});
