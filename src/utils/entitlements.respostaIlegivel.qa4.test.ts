import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buyBitsPack, buyEssence, spendCredits, noteBitsPackLeft } from './entitlements';
import { STORAGE_KEYS } from './storageKeys';

// QA r4, achado 7 (REGISTRO §381): 200 com corpo ilegível NÃO é recusa definitiva. O servidor pode ter debitado; o gesto reenvia
// com o MESMO opId (o servidor devolve o replay sem cobrar de novo), como `spendCredits` já fazia. E resposta `ok` sem `tier`/`credits`
// não vira `credits: 0`/`'demo'` no estado: volta sem `ent`, e a tela fica com o saldo que já tinha.

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  store.set(STORAGE_KEYS.SAVE_ID, 'save-id-de-teste');
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  });
  noteBitsPackLeft(null);
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const resp = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const ilegivel = () => new Response('<html>oops', { status: 200 });

/** 1ª resposta ilegível, 2ª válida; guarda os opIds enviados. */
function servidor(valida: unknown) {
  const ops: string[] = [];
  let n = 0;
  vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
    ops.push(JSON.parse(String(init.body)).opId);
    return ++n === 1 ? ilegivel() : resp(200, valida);
  }));
  return ops;
}

describe('200 ilegível reenvia com o mesmo opId', () => {
  it('buyBitsPack', async () => {
    const ops = servidor({ ok: true, pack: 'bits-200', bits: 200, price: 200, leftToday: 800, replay: true, tier: 'paid', credits: 10, adsLeft: 0 });
    const r = await buyBitsPack('bits-200');
    expect(r).toMatchObject({ ok: true, bits: 200, ent: { credits: 10, tier: 'paid' } });
    expect(ops).toHaveLength(2);
    expect(ops[1]).toBe(ops[0]);
  });

  it('buyEssence', async () => {
    const ops = servidor({ ok: true, element: 'fogo', qty: 1, price: 2, replay: true, tier: 'paid', credits: 8, adsLeft: 0 });
    const r = await buyEssence('fogo', 1);
    expect(r).toMatchObject({ ok: true, element: 'fogo', qty: 1, ent: { credits: 8, tier: 'paid' } });
    expect(ops).toHaveLength(2);
    expect(ops[1]).toBe(ops[0]);
  });
});

describe('resposta ok sem tier/credits volta SEM ent (nada de 0/demo inventado)', () => {
  it('buyBitsPack', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => resp(200, { ok: true, pack: 'bits-200', bits: 200, price: 200, leftToday: 800 })));
    const r = await buyBitsPack('bits-200');
    expect(r.ok).toBe(true);
    expect(r).not.toHaveProperty('ent');
  });

  it('buyEssence', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => resp(200, { ok: true, element: 'fogo', qty: 1, price: 2, credits: 'x' })));
    const r = await buyEssence('fogo', 1);
    expect(r.ok).toBe(true);
    expect(r).not.toHaveProperty('ent');
  });

  it('spendCredits: ok sem saldo legível conta como resposta ilegível (reenvia com o mesmo opId)', async () => {
    const ops: string[] = [];
    let n = 0;
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
      ops.push(JSON.parse(String(init.body)).opId);
      return ++n === 1 ? resp(200, { ok: true }) : resp(200, { ok: true, tier: 'paid', credits: 40, adsLeft: 0, admin: false });
    }));
    expect(await spendCredits(50, 'reroll')).toEqual({ tier: 'paid', credits: 40, adsLeft: 0, admin: false });
    expect(ops).toHaveLength(2);
    expect(ops[1]).toBe(ops[0]);
  });
});
