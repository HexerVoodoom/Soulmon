/**
 * QA rodada 2 (11/11/2026), R2-C1: a confirmação do ticket extra do Treino roda DEPOIS de o app cobrar os 30 Bits.
 * Antes, uma queda de rede nessa chamada perdia o ticket pago (a reserva vencia em 2 min sem ninguém confirmar).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { confirmSparTicketComRetry } from './community';

vi.mock('./auth', () => ({ authHeaders: async () => ({}) }));
vi.mock('./cloudSave', () => ({ reagirContaExcluida: vi.fn() }));

const resp = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const tickets = { played: 20, extra: 1, capacity: 40, honorLeft: 0, left: 20, canBuy: true };
afterEach(() => vi.unstubAllGlobals());

describe('R2-C1: confirmSparTicketComRetry', () => {
  it('rede cai uma vez na confirmação: repete e devolve o ticket, sempre com phase=confirm', async () => {
    const f = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(resp(200, { tickets }));
    vi.stubGlobal('fetch', f);
    const r = await confirmSparTicketComRetry('a'.repeat(32), { offsetMs: -3 * 3600e3 }, [0, 0]);
    expect(r.tickets).toEqual(tickets);
    expect(f).toHaveBeenCalledTimes(2);
    for (const c of f.mock.calls) expect(JSON.parse(c[1].body)).toMatchObject({ phase: 'confirm', off: -3 * 3600e3 });
  });
  it('recusa decidida pelo servidor (409 no reserve) NÃO é repetida', async () => {
    const f = vi.fn().mockResolvedValue(resp(409, { error: 'no reserve' }));
    vi.stubGlobal('fetch', f);
    await expect(confirmSparTicketComRetry('a'.repeat(32), undefined, [0, 0])).rejects.toThrow();
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('rede cai sempre: desiste depois das tentativas e propaga o erro', async () => {
    const f = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', f);
    await expect(confirmSparTicketComRetry('a'.repeat(32), undefined, [0, 0])).rejects.toThrow();
    expect(f).toHaveBeenCalledTimes(3);
  });
});
