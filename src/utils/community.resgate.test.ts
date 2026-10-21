// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./auth', () => ({ authHeaders: async () => ({}) }));
vi.mock('./cloudSave', () => ({ reagirContaExcluida: vi.fn() }));

import { resgatarPresentes } from './community';
import { STORAGE_KEYS } from './storageKeys';

const ID = 'a'.repeat(32);
const g = (gid: string) => ({ from: 'Ana', bits: 20, at: 1, gid });
let fetchMock: ReturnType<typeof vi.fn>;
const resp = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => { localStorage.clear(); fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe('resgatarPresentes (L03-01)', () => {
  it('pede claim=1&ack=1 e filtra os gids ja creditados', async () => {
    localStorage.setItem(STORAGE_KEYS.GIFTS_CREDITED, JSON.stringify(['g1']));
    fetchMock.mockResolvedValueOnce(resp({ gifts: [g('g1'), g('g2')], ack: true }));
    const r = await resgatarPresentes(ID);
    expect(String(fetchMock.mock.calls[0][0])).toContain('claim=1');
    expect(String(fetchMock.mock.calls[0][0])).toContain('ack=1');
    expect(r.gifts.map(x => x.gid)).toEqual(['g2']);
  });

  it('confirmar grava TODOS os gids antes de postar o ack', async () => {
    fetchMock.mockResolvedValueOnce(resp({ gifts: [g('g1'), g('g2')], ack: true }));
    const r = await resgatarPresentes(ID);
    fetchMock.mockImplementationOnce(async () => {
      expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.GIFTS_CREDITED)!)).toEqual(['g1', 'g2']);
      return resp({ ok: true, removed: 2 });
    });
    await r.confirmar();
    const [url, init] = fetchMock.mock.calls[1];
    expect(String(url)).toContain('action=giftsAck');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ id: ID, gids: ['g1', 'g2'] });
  });

  it('ack falhando na rede nao lanca e o conjunto local evita recredito', async () => {
    fetchMock.mockResolvedValueOnce(resp({ gifts: [g('g1')], ack: true }));
    const r = await resgatarPresentes(ID);
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(r.confirmar()).resolves.toBeUndefined();
    fetchMock.mockResolvedValueOnce(resp({ gifts: [g('g1')], ack: true }));
    const r2 = await resgatarPresentes(ID);
    expect(r2.gifts).toEqual([]);
  });

  it('servidor sem `ack` (antigo): entrega tudo e confirmar nao posta', async () => {
    fetchMock.mockResolvedValueOnce(resp({ gifts: [g('g1')] }));
    const r = await resgatarPresentes(ID);
    expect(r.gifts).toHaveLength(1);
    await r.confirmar();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(STORAGE_KEYS.GIFTS_CREDITED)).toBeNull();
  });
});
