import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { STORAGE_KEYS } from './storageKeys';

// QA r4 C2 · A1/A2 (REGISTRO §386). A rede cai DEPOIS do débito e o jogador reabre o app: os Créditos já caíram, o botão do
// pacote pode estar desabilitado e o opId pendente nunca era reenviado (Créditos pagos, Bits nunca creditados). Agora o app
// reenvia o pendente com `replayOnly`; e o pendente só fecha depois de os Bits entrarem no estado (`confirmar`).

const store = new Map<string, string>();
beforeEach(() => {
  vi.resetModules();
  store.clear();
  store.set(STORAGE_KEYS.SAVE_ID, 'save-id-de-teste');
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const resp = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const ent = { tier: 'paid', credits: 40, adsLeft: 0 };

/** Servidor idempotente por opId que conhece `replayOnly` (como `_bitsPacks.js`). `perder` = respostas perdidas após o débito. */
function servidor() {
  const feitos = new Map<string, string>();
  const s = { debitos: 0, perder: 0, offline: false, corpos: [] as Record<string, unknown>[] };
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    const b = JSON.parse(String(init.body));
    s.corpos.push(b);
    if (s.offline) throw new TypeError('offline');
    if (b.replayOnly === true && !feitos.has(b.opId)) return resp(409, { ok: false, reason: 'no-op', leftToday: 1000 });
    if (!feitos.has(b.opId)) { feitos.set(b.opId, b.pack); s.debitos++; }
    if (s.perder > 0) { s.perder--; throw new TypeError('network lost'); }
    return resp(200, { ok: true, pack: feitos.get(b.opId), bits: 500, price: 460, leftToday: 500, replay: b.replayOnly === true, ...ent });
  }));
  return s;
}

describe('A1 · o pendente do pacote de Bits é reenviado ao reabrir', () => {
  it('débito com as 2 respostas perdidas → reabre → replayOnly credita UMA vez e fecha o pendente', async () => {
    const s = servidor();
    s.perder = 2;
    const m1 = await import('./entitlements');
    expect(await m1.buyBitsPack('bits-500')).toEqual({ ok: false, reason: 'network' });
    expect(s.debitos).toBe(1);
    const op = s.corpos[0].opId;

    vi.resetModules(); // o app foi fechado e aberto de novo
    const m2 = await import('./entitlements');
    const achados = await m2.recoverPendingBitsBuys();
    expect(achados.map(a => a.bits)).toEqual([500]);
    expect(s.corpos.at(-1)).toMatchObject({ opId: op, pack: 'bits-500', replayOnly: true });
    expect(s.debitos).toBe(1);

    // Antes de confirmar (os Bits ainda não entraram no estado): nem outra recuperação nem o toque no MESMO pacote pegam o replay.
    expect(await m2.recoverPendingBitsBuys()).toEqual([]);
    expect(await m2.buyBitsPack('bits-500')).toEqual({ ok: false, reason: 'busy' });

    achados[0].confirmar();
    const enviados = s.corpos.length;
    expect(await m2.recoverPendingBitsBuys()).toEqual([]);
    expect(s.corpos.length).toBe(enviados); // nada mais pendente: nenhum pedido sai
    expect(store.get(STORAGE_KEYS.PENDING_OP_IDS) ?? '').not.toContain(op);
  });

  it('pedido que nunca chegou ao servidor: replayOnly responde no-op, o pendente fecha e nenhum Bit entra', async () => {
    const s = servidor();
    s.offline = true;
    const m = await import('./entitlements');
    expect((await m.buyBitsPack('bits-200')).ok).toBe(false);
    s.offline = false;
    expect(await m.recoverPendingBitsBuys()).toEqual([]);
    expect(s.debitos).toBe(0);
    const enviados = s.corpos.length;
    await m.recoverPendingBitsBuys();
    expect(s.corpos.length).toBe(enviados);
  });

  it('rede caída na recuperação mantém o pendente para a próxima abertura', async () => {
    const s = servidor();
    s.perder = 2;
    const m = await import('./entitlements');
    await m.buyBitsPack('bits-500');
    s.offline = true;
    expect(await m.recoverPendingBitsBuys()).toEqual([]);
    s.offline = false;
    expect((await m.recoverPendingBitsBuys()).map(a => a.bits)).toEqual([500]);
    expect(s.debitos).toBe(1);
  });

  it('outra conta no mesmo aparelho não reenvia o pendente da primeira', async () => {
    const s = servidor();
    s.perder = 2;
    const m = await import('./entitlements');
    await m.buyBitsPack('bits-500');
    store.set(STORAGE_KEYS.SAVE_ID, 'outra-conta-de-teste');
    const enviados = s.corpos.length;
    expect(await m.recoverPendingBitsBuys()).toEqual([]);
    expect(s.corpos.length).toBe(enviados);
  });
});

describe('A2 · o gesto só fecha depois de os Bits entrarem no estado', () => {
  it('compra ok sem confirmar (app morto antes do commit) → a reabertura ainda acha o replay', async () => {
    const s = servidor();
    const m1 = await import('./entitlements');
    const r = await m1.buyBitsPack('bits-500');
    expect(r.ok).toBe(true);
    vi.resetModules();
    const m2 = await import('./entitlements');
    expect((await m2.recoverPendingBitsBuys()).map(a => a.bits)).toEqual([500]);
    expect(s.debitos).toBe(1);
  });

  it('compra ok e confirmada → nada pendente; o próximo toque é um gesto novo', async () => {
    const s = servidor();
    const m = await import('./entitlements');
    const r = await m.buyBitsPack('bits-500');
    if (!r.ok) throw new Error('esperava ok');
    r.confirmar();
    r.confirmar(); // idempotente
    expect(await m.recoverPendingBitsBuys()).toEqual([]);
    await m.buyBitsPack('bits-500');
    expect(new Set(s.corpos.map(c => c.opId)).size).toBe(2);
  });
});
