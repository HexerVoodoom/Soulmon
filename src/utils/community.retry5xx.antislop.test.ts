/**
 * Antislop P1 (14/11/2026, REGISTRO §374): o servidor do Treino passou a PROPAGAR a falha de leitura do KV em vez de
 * tratá-la como "chave ausente". Exceção não tratada numa Pages Function vira 500 com corpo NÃO-JSON (página de erro da
 * plataforma). Estes testes travam a premissa do lado do app: esse 500 é "falha de rede" (`isFalhaDeRede`) e os fluxos
 * que rodam DEPOIS de algo já gasto — a confirmação do ticket (depois do débito de 30 Bits) e o envio do resultado (depois
 * da partida gasta no `sparStart`) — repetem com recuo. A recusa decidida (409) segue sem repetição.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { confirmSparTicketComRetry, playSparComRetry, startSpar, isFalhaDeRede } from './community';

vi.mock('./auth', () => ({ authHeaders: async () => ({}) }));
vi.mock('./cloudSave', () => ({ reagirContaExcluida: vi.fn() }));

/** O que a plataforma devolve quando o handler lança (corpo HTML, não JSON). */
const erroDaPlataforma = () => new Response('<!DOCTYPE html><title>Worker threw exception</title>', { status: 500, headers: { 'content-type': 'text/html' } });
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const tickets = { played: 20, extra: 1, capacity: 40, honorLeft: 0, left: 20, canBuy: true };
const ID = 'a'.repeat(32);
afterEach(() => vi.unstubAllGlobals());

describe('500 da plataforma (KV falhou no servidor) é retentado nos fluxos do Treino', () => {
  it('confirmSparTicketComRetry: 500 → repete e concede (os Bits já debitados não se perdem)', async () => {
    const f = vi.fn().mockResolvedValueOnce(erroDaPlataforma()).mockResolvedValueOnce(ok({ tickets }));
    vi.stubGlobal('fetch', f);
    const r = await confirmSparTicketComRetry(ID, { offsetMs: 0 }, [0, 0]);
    expect(r.tickets).toEqual(tickets);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('playSparComRetry: 500 → repete com a MESMA semente e devolve o resultado', async () => {
    const res = { won: true, outcome: 'win', myScore: 80, oppScore: 0, honor: 2, opponent: { name: 'x', petName: 'y', stage: 'rookie' } };
    const f = vi.fn().mockResolvedValueOnce(erroDaPlataforma()).mockResolvedValueOnce(ok(res));
    vi.stubGlobal('fetch', f);
    const r = await playSparComRetry(ID, 'p'.repeat(24), [1, 2], 4242, [0, 0], { offsetMs: 0 });
    expect(r.honor).toBe(2);
    expect(f).toHaveBeenCalledTimes(2);
    for (const c of f.mock.calls) expect(JSON.parse(c[1].body).seed).toBe(4242);
  });

  it('startSpar NÃO repete sozinho (nada foi gasto: o servidor falha antes de gastar) e o erro é de rede', async () => {
    const f = vi.fn().mockResolvedValue(erroDaPlataforma());
    vi.stubGlobal('fetch', f);
    const err = await startSpar(ID, 'p'.repeat(24), { offsetMs: 0 }).catch(e => e);
    expect(isFalhaDeRede(err)).toBe(true);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('premissa: 500 COM corpo JSON `{error}` NÃO seria retentado — por isso o servidor propaga em vez de responder um erro JSON', async () => {
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'storage' }), { status: 500 }));
    vi.stubGlobal('fetch', f);
    await expect(confirmSparTicketComRetry(ID, undefined, [0, 0])).rejects.toThrow('storage');
    expect(f).toHaveBeenCalledTimes(1);
  });
});
