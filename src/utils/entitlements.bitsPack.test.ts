import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buyBitsPack, bitsPackLeftToday, noteBitsPackLeft } from './entitlements';
import { STORAGE_KEYS } from './storageKeys';

// §373 — PACOTES DE BITS: o cliente só credita o que o SERVIDOR confirmou. `buyBitsPack` manda só o id do pacote e o opId;
// recusa (teto, saldo, trava) volta como `ok: false` e nenhum Bit entra; reenvio só quando a rede LANÇOU, com o MESMO opId.

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

describe('buyBitsPack (cliente)', () => {
  it('manda só o id do pacote e o opId; os Bits que voltam são os do SERVIDOR; guarda o que resta hoje', async () => {
    const corpos: any[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe('/api/entitlements?action=buy-bits');
      corpos.push(JSON.parse(String(init.body)));
      return resp(200, { ok: true, pack: 'bits-500', bits: 500, price: 460, leftToday: 500, tier: 'paid', credits: 40, adsLeft: 0 });
    }));
    const r = await buyBitsPack('bits-500');
    expect(r).toMatchObject({ ok: true, bits: 500, price: 460, leftToday: 500, ent: { credits: 40, tier: 'paid' } });
    expect(Object.keys(corpos[0]).sort()).toEqual(['id', 'opId', 'pack']);
    expect(bitsPackLeftToday()).toBe(500);
  });

  it('teto do dia: ok false com leftToday, sem Bits; o eco do que resta é atualizado', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => resp(409, { ok: false, reason: 'daily-cap', leftToday: 300 })));
    const r = await buyBitsPack('bits-1000');
    expect(r).toEqual({ ok: false, reason: 'daily-cap', leftToday: 300 });
    expect(bitsPackLeftToday()).toBe(300);
  });

  it('recusa do servidor (402) não é reenviada; resposta ok mas sem bits válidos NÃO vira crédito', async () => {
    const f = vi.fn(async () => resp(402, { ok: false, reason: 'insufficient' }));
    vi.stubGlobal('fetch', f);
    expect(await buyBitsPack('bits-200')).toMatchObject({ ok: false, reason: 'insufficient' });
    expect(f).toHaveBeenCalledTimes(1);
    vi.stubGlobal('fetch', vi.fn(async () => resp(200, { ok: true, bits: 'muito' })));
    expect(await buyBitsPack('bits-200')).toEqual({ ok: false, reason: 'error' });
  });

  it('rede caiu na 1ª tentativa: reenvia UMA vez com o MESMO opId (o servidor é idempotente)', async () => {
    const corpos: any[] = [];
    let n = 0;
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
      corpos.push(JSON.parse(String(init.body)));
      if (++n === 1) throw new TypeError('network lost');
      return resp(200, { ok: true, pack: 'bits-200', bits: 200, price: 200, leftToday: 800, replay: true, tier: 'paid', credits: 0, adsLeft: 0 });
    }));
    const r = await buyBitsPack('bits-200');
    expect(r.ok && r.bits).toBe(200);
    expect(corpos).toHaveLength(2);
    expect(corpos[1].opId).toBe(corpos[0].opId);
  });

  it('sem saveId não chama o servidor', async () => {
    store.clear();
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await buyBitsPack('bits-200')).toEqual({ ok: false, reason: 'no-save' });
    expect(f).not.toHaveBeenCalled();
  });
});
