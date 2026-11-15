import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { STORAGE_KEYS } from './storageKeys';

// Antislop P6 (14/11/2026, itens 2 e 3 do relatório r3; REGISTRO §378) — Créditos são DINHEIRO REAL.
//
// O `opId` nascia a CADA chamada de `buyBitsPack`/`buyEssence`/`spendCredits`. O reenvio com o mesmo id só existia DENTRO da
// chamada (2 tentativas): se o servidor debitou e as duas respostas se perderam, o toast era genérico ("tente de novo") e o
// toque seguinte mandava OUTRO `opId`, que o servidor (idempotente por `opId`) tratava como compra nova e debitava de novo.
//
// Agora o `opId` do gesto fica PENDENTE (memória + `STORAGE_KEYS.PENDING_OP_IDS`, nunca no save), por operação + item, até o
// servidor dar uma resposta definitiva (ok ou recusa 4xx). O toque seguinte do MESMO item reusa o id; item diferente, id novo.

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
const ent = { tier: 'paid', credits: 100, adsLeft: 0 };

/**
 * Servidor falso IDEMPOTENTE por `opId` (como `_bitsPacks.js`, `buy-essence` e `spend`): debita uma vez por `opId` e devolve o
 * resultado guardado no reenvio. `perder` = quantas respostas seguidas se perdem DEPOIS de o servidor já ter debitado.
 */
function servidor(sucesso: (body: any) => unknown) {
  const vistos = new Set<string>();
  const s = { debitos: 0, perder: 0, opIds: [] as string[], recusar: null as null | { status: number; body: unknown } };
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    s.opIds.push(body.opId);
    if (s.recusar) return resp(s.recusar.status, s.recusar.body);
    if (!vistos.has(body.opId)) { vistos.add(body.opId); s.debitos++; }
    if (s.perder > 0) { s.perder--; throw new TypeError('network lost'); }
    return resp(200, sucesso(body));
  }));
  return s;
}

describe('itens 2 e 3 · o opId do gesto sobrevive à resposta perdida (um único débito)', () => {
  it('PACOTE DE BITS: as 2 respostas se perdem → o 2º toque reusa o MESMO opId → um débito só; confirmado, o próximo é novo', async () => {
    const { buyBitsPack } = await import('./entitlements');
    const s = servidor(b => ({ ok: true, pack: b.pack, bits: 200, price: 200, leftToday: 800, ...ent }));
    s.perder = 2;
    expect(await buyBitsPack('bits-200')).toEqual({ ok: false, reason: 'network' });
    const r = await buyBitsPack('bits-200');
    expect(r.ok && r.bits).toBe(200);
    expect(new Set(s.opIds).size).toBe(1);
    expect(s.debitos).toBe(1);
    // o servidor confirmou e os Bits entraram no estado (`confirmar`, §386 A2): a PRÓXIMA compra é um gesto novo
    if (r.ok) r.confirmar();
    const r2 = await buyBitsPack('bits-200');
    if (r2.ok) r2.confirmar();
    expect(new Set(s.opIds).size).toBe(2);
    expect(s.debitos).toBe(2);
  });

  it('PACOTE DE BITS: pacote diferente ganha opId próprio; o pendente do outro pacote continua guardado', async () => {
    const { buyBitsPack } = await import('./entitlements');
    const s = servidor(b => ({ ok: true, pack: b.pack, bits: 500, price: 460, leftToday: 500, ...ent }));
    s.perder = 2;
    await buyBitsPack('bits-200');
    const pendente200 = s.opIds[0];
    await buyBitsPack('bits-500');
    expect(s.opIds[2]).not.toBe(pendente200);
    await buyBitsPack('bits-200');
    expect(s.opIds[3]).toBe(pendente200);
  });

  it('PACOTE DE BITS: recusa definitiva (402, teto 409 daily-cap) limpa; 5xx e 409 busy mantêm o pendente', async () => {
    const { buyBitsPack } = await import('./entitlements');
    const s = servidor(() => ({ ok: true, bits: 200, ...ent }));
    s.recusar = { status: 500, body: { error: 'boom' } };
    await buyBitsPack('bits-200');
    s.recusar = { status: 409, body: { ok: false, reason: 'busy' } };
    await buyBitsPack('bits-200');
    expect(s.opIds[1]).toBe(s.opIds[0]);
    s.recusar = { status: 402, body: { ok: false, reason: 'insufficient' } };
    await buyBitsPack('bits-200');
    expect(s.opIds[2]).toBe(s.opIds[0]);
    await buyBitsPack('bits-200');
    expect(s.opIds[3]).not.toBe(s.opIds[0]);
    s.recusar = { status: 409, body: { ok: false, reason: 'daily-cap', leftToday: 0 } };
    await buyBitsPack('bits-200');
    await buyBitsPack('bits-200');
    expect(s.opIds[5]).not.toBe(s.opIds[4]);
  });

  it('ESSÊNCIA: resposta perdida → o 2º toque do mesmo elemento/quantidade reusa o opId → um débito; outro elemento, opId novo', async () => {
    const { buyEssence } = await import('./entitlements');
    const s = servidor(b => ({ ok: true, element: b.element, qty: b.qty, price: 30, ...ent }));
    s.perder = 2;
    expect(await buyEssence('fire', 1)).toEqual({ ok: false, reason: 'network' });
    await buyEssence('water', 1);
    expect(s.opIds[2]).not.toBe(s.opIds[0]);
    const r = await buyEssence('fire', 1);
    expect(r.ok).toBe(true);
    expect(s.opIds[3]).toBe(s.opIds[0]);
    expect(s.debitos).toBe(2); // fire uma vez, water uma vez
    await buyEssence('fire', 1);
    expect(s.opIds[4]).not.toBe(s.opIds[0]);
  });

  it('REROLL (spendCredits): resposta perdida → o 2º toque reusa o opId → um débito; recusa 402 limpa', async () => {
    const { spendCredits } = await import('./entitlements');
    const s = servidor(() => ({ ok: true, ...ent }));
    s.perder = 2;
    expect(await spendCredits(50, 'reroll')).toBeNull();
    expect((await spendCredits(50, 'reroll'))?.credits).toBe(100);
    expect(new Set(s.opIds).size).toBe(1);
    expect(s.debitos).toBe(1);
    s.recusar = { status: 402, body: { ok: false, reason: 'insufficient' } };
    await spendCredits(50, 'reroll');
    await spendCredits(50, 'reroll');
    expect(s.opIds[4]).not.toBe(s.opIds[3]);
  });

  it('o pendente sobrevive a recarregar o app (fica em STORAGE_KEYS.PENDING_OP_IDS, fora do save) e é por conta', async () => {
    const m1 = await import('./entitlements');
    const s = servidor(b => ({ ok: true, pack: b.pack, bits: 200, price: 200, leftToday: 800, ...ent }));
    s.perder = 2;
    await m1.buyBitsPack('bits-200');
    expect(store.get(STORAGE_KEYS.PENDING_OP_IDS)).toContain(s.opIds[0]);
    vi.resetModules();
    const m2 = await import('./entitlements');
    const r = await m2.buyBitsPack('bits-200');
    if (r.ok) r.confirmar();
    expect(s.opIds[2]).toBe(s.opIds[0]);
    expect(s.debitos).toBe(1);
    expect(store.get(STORAGE_KEYS.PENDING_OP_IDS) ?? '').not.toContain(s.opIds[0]);
    // outra conta no mesmo aparelho não herda o pendente
    s.perder = 2;
    await m2.buyBitsPack('bits-200');
    store.set(STORAGE_KEYS.SAVE_ID, 'outra-conta-de-teste');
    await m2.buyBitsPack('bits-200');
    expect(s.opIds[5]).not.toBe(s.opIds[3]);
  });

  it('opId explícito de quem chama continua valendo e não mexe nos pendentes', async () => {
    const { buyBitsPack } = await import('./entitlements');
    const s = servidor(b => ({ ok: true, pack: b.pack, bits: 200, price: 200, leftToday: 800, ...ent }));
    await buyBitsPack('bits-200', 'opid-explicito-01');
    expect(s.opIds).toEqual(['opid-explicito-01']);
    expect(store.get(STORAGE_KEYS.PENDING_OP_IDS) ?? '').not.toContain('opid-explicito-01');
  });
});
