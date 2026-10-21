import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cloudSave, lerRevisao, gravarRevisao, __resetRetryBudgets } from './cloudSave';

// Servidor simulado: guarda `rev` e o último state; POST com baseRevision divergente = 409.
const ID = 'a'.repeat(32);
const memoria = new Map<string, string>();
let srv: { rev: number; state: unknown };
let bases: Array<number | undefined> = [];
let plano: Array<'normal' | 'aplica-e-perde' | 'segura'> = [];
let liberar: Array<() => void> = [];

beforeEach(() => {
  memoria.clear(); bases = []; plano = []; liberar = [];
  srv = { rev: 3, state: null };
  __resetRetryBudgets();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => memoria.get(k) ?? null,
    setItem: (k: string, v: string) => { memoria.set(k, v); },
    removeItem: (k: string) => { memoria.delete(k); },
  });
  vi.stubGlobal('fetch', vi.fn(async (_u: unknown, init?: RequestInit) => {
    const corpo = JSON.parse(String(init?.body)) as { state: unknown; baseRevision?: number };
    bases.push(corpo.baseRevision);
    const modo = plano.shift() ?? 'normal';
    if (modo === 'segura') await new Promise<void>(r => { liberar.push(r); });
    if (corpo.baseRevision !== undefined && corpo.baseRevision !== srv.rev) {
      return new Response(JSON.stringify({ error: 'conflict', revision: srv.rev }), { status: 409 });
    }
    srv = { rev: srv.rev + 1, state: corpo.state };
    if (modo === 'aplica-e-perde') throw new TypeError('rede caiu depois de o servidor gravar');
    return new Response(JSON.stringify({ ok: true, revision: srv.rev }), { status: 200 });
  }));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('serialização por saveId', () => {
  it('POST2 com POST1 em voo espera e sai com a base nova (sem 409 contra si mesmo)', async () => {
    gravarRevisao(ID, 3);
    plano = ['segura'];
    const p1 = cloudSave(ID, { v: 1 });
    const p2 = cloudSave(ID, { v: 2 });
    await vi.waitFor(() => expect(liberar.length).toBe(1));
    expect(bases).toEqual([3]); // o segundo ainda nem saiu
    liberar[0]();
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    expect(bases).toEqual([3, 4]);
    expect(srv.state).toEqual({ v: 2 });
    expect(lerRevisao(ID)).toBe(5);
  });
});

describe('envio em dúvida (200 perdido)', () => {
  it('409 com revisão = base+1 depois de falha de rede é escrita própria: reenvia uma vez', async () => {
    gravarRevisao(ID, 3);
    plano = ['aplica-e-perde'];
    const r1 = await cloudSave(ID, { v: 1 });
    expect(r1).toMatchObject({ ok: false, kind: 'offline', status: 0 });
    const r2 = await cloudSave(ID, { v: 2 });
    expect(r2.ok).toBe(true);
    expect(bases).toEqual([3, 3, 4]);
    expect(srv.state).toEqual({ v: 2 });
    expect(lerRevisao(ID)).toBe(5);
  });

  it('409 com revisão diferente de base+1 continua conflito', async () => {
    gravarRevisao(ID, 3);
    plano = ['aplica-e-perde'];
    await cloudSave(ID, { v: 1 });
    srv.rev = 9; // outro aparelho escreveu mais
    const r2 = await cloudSave(ID, { v: 2 });
    expect(r2).toMatchObject({ ok: false, kind: 'conflict', revision: 9 });
    expect(bases).toEqual([3, 3]);
  });

  it('sem envio em dúvida, 409 base+1 NÃO é tratado como próprio', async () => {
    gravarRevisao(ID, 3);
    srv.rev = 4; // outro aparelho
    const r = await cloudSave(ID, { v: 2 });
    expect(r).toMatchObject({ ok: false, kind: 'conflict', revision: 4 });
    expect(bases).toEqual([3]);
  });
});
