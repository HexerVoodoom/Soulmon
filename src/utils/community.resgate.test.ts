// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./auth', () => ({ authHeaders: async () => ({}) }));
vi.mock('./cloudSave', () => ({ reagirContaExcluida: vi.fn() }));

import { resgatarPresentes } from './community';
import { STORAGE_KEYS } from './storageKeys';
import { lerCreditados, descartarPendentes, confirmarAteVersao } from './giftsCredited';
import { marcarMudancaPendente } from './sessionReset';

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

  it('(a) creditar + adocao da nuvem antes do save: nenhum ack e o gid volta a ser creditavel', async () => {
    fetchMock.mockResolvedValueOnce(resp({ gifts: [g('g1'), g('g2')], ack: true }));
    const r = await resgatarPresentes(ID);
    await r.confirmar();
    expect(fetchMock).toHaveBeenCalledTimes(1); // so o GET: nada de ack na hora
    descartarPendentes(); // 409/D2 trocou o estado pela nuvem (sem o credito)
    fetchMock.mockResolvedValueOnce(resp({ gifts: [g('g1'), g('g2')], ack: true }));
    const r2 = await resgatarPresentes(ID);
    expect(r2.gifts.map(x => x.gid)).toEqual(['g1', 'g2']);
    expect(fetchMock.mock.calls.some(c => String(c[0]).includes('giftsAck'))).toBe(false);
  });

  it('(b) save ok de versao >= aPartirDaVersao: ack com os gids, gravados como confirmados antes', async () => {
    localStorage.setItem(STORAGE_KEYS.SAVE_ID, ID);
    fetchMock.mockResolvedValueOnce(resp({ gifts: [g('g1'), g('g2')], ack: true }));
    const r = await resgatarPresentes(ID);
    await r.confirmar();
    const v = marcarMudancaPendente(); // a mutacao do credito
    fetchMock.mockImplementationOnce(async () => {
      expect(lerCreditados().confirmados).toEqual(['g1', 'g2']);
      return resp({ ok: true, removed: 2 });
    });
    await confirmarAteVersao(v);
    const [url, init] = fetchMock.mock.calls[1];
    expect(String(url)).toContain('action=giftsAck');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ id: ID, gids: ['g1', 'g2'] });
    expect(lerCreditados().pendentes).toEqual([]);
  });

  it('(c) save ok de versao anterior ao credito NAO envia ack', async () => {
    localStorage.setItem(STORAGE_KEYS.SAVE_ID, ID);
    const antiga = marcarMudancaPendente(); // POST em voo, anterior ao credito
    fetchMock.mockResolvedValueOnce(resp({ gifts: [g('g1')], ack: true }));
    const r = await resgatarPresentes(ID);
    await r.confirmar();
    await confirmarAteVersao(antiga);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lerCreditados().pendentes.map(p => p.gid)).toEqual(['g1']);
  });

  it('(d) formato antigo (lista de strings) = confirmados; reaparecido nao recredita e o ack e reenviado', async () => {
    localStorage.setItem(STORAGE_KEYS.GIFTS_CREDITED, JSON.stringify(['g1']));
    expect(lerCreditados()).toEqual({ confirmados: ['g1'], pendentes: [] });
    fetchMock.mockResolvedValueOnce(resp({ gifts: [g('g1')], ack: true }));
    const r = await resgatarPresentes(ID);
    expect(r.gifts).toEqual([]);
    fetchMock.mockResolvedValueOnce(resp({ ok: true }));
    await r.confirmar();
    expect(JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)).toEqual({ id: ID, gids: ['g1'] });
  });

  it('ack falhando na rede nao lanca', async () => {
    localStorage.setItem(STORAGE_KEYS.SAVE_ID, ID);
    fetchMock.mockResolvedValueOnce(resp({ gifts: [g('g1')], ack: true }));
    const r = await resgatarPresentes(ID);
    await r.confirmar();
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(confirmarAteVersao(marcarMudancaPendente())).resolves.toBeUndefined();
    fetchMock.mockResolvedValueOnce(resp({ gifts: [g('g1')], ack: true }));
    expect((await resgatarPresentes(ID)).gifts).toEqual([]);
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
