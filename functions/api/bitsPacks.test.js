/**
 * PACOTES DE BITS pagos em Créditos (REGISTRO §373) — servidor como fonte do câmbio, do teto de 1.000 Bits/dia UTC e da
 * idempotência. Handler REAL (`entitlements.js`), KV e D1 de mentira.
 */
import { describe, it, expect } from 'vitest';
import { onRequestPost, onRequestGet } from './entitlements.js';
import { ENT_PREFIX, ENT_LOCK_PREFIX, ENT_LOCK_TTL_MS as LOCK_TTL_MS, readEntitlement } from './_entitlements.js';
import { BITS_PACKS, BITS_PACK_DAILY_CAP, buyBitsPack, bitsPackLeftToday, OPS_MAX } from './_bitsPacks.js';

const ID = 'b'.repeat(32);
const DIA = Date.UTC(2026, 10, 14, 12, 0, 0);

function fakeEnv({ credits = 0, d1 = false, slow = false, extra = {} } = {}) {
  const store = new Map();
  store.set(ENT_PREFIX + ID, JSON.stringify({ tier: 'paid', credits, ...extra }));
  const tick = () => (slow ? new Promise(r => setTimeout(r, 3)) : Promise.resolve());
  const kv = {
    store,
    get: async k => { await tick(); return store.get(k) ?? null; },
    put: async (k, v) => { await tick(); store.set(k, String(v)); },
    delete: async k => { store.delete(k); },
  };
  const rows = new Map();
  const DB = {
    rows,
    prepare: sql => ({
      bind: (...a) => ({
        async run() {
          await tick();
          if (/^INSERT/i.test(sql)) {
            if (rows.has(a[0])) throw new Error('UNIQUE constraint failed: order_claims.order_id');
            rows.set(a[0], { save: a[1], expires: a[3] });
          } else if (/^DELETE/i.test(sql)) {
            if (/expires_at <=/.test(sql)) { const r = rows.get(a[0]); if (r && r.expires != null && r.expires <= a[1]) rows.delete(a[0]); }
            else rows.delete(a[0]);
          }
          return { success: true };
        },
      }),
    }),
  };
  return { SOULMON_SAVES: kv, ...(d1 ? { DB } : {}) };
}

const ent = async e => readEntitlement(e, ID);
const pack = id => BITS_PACKS.find(p => p.id === id);

describe('buyBitsPack — câmbio por pacote, decidido no servidor', () => {
  it('cada pacote debita os Créditos certos e devolve os Bits certos (200/200, 500/460, 1.000/800)', async () => {
    for (const p of BITS_PACKS) {
      const e = fakeEnv({ credits: 5000 });
      const r = await buyBitsPack(e, ID, p.id, `op-${p.id}-0001`, { nowMs: DIA });
      expect(r).toMatchObject({ ok: true, bits: p.bits, price: p.credits, leftToday: BITS_PACK_DAILY_CAP - p.bits });
      expect((await ent(e)).credits).toBe(5000 - p.credits);
    }
  });

  it('pacote desconhecido e opId ausente/curto: recusa sem tocar no saldo', async () => {
    const e = fakeEnv({ credits: 5000 });
    expect(await buyBitsPack(e, ID, 'bits-10', 'op-x-00001', { nowMs: DIA })).toMatchObject({ ok: false, reason: 'unknown-pack', status: 400 });
    expect(await buyBitsPack(e, ID, 'bits-200', undefined, { nowMs: DIA })).toMatchObject({ ok: false, reason: 'bad-op', status: 400 });
    expect(await buyBitsPack(e, ID, 'bits-200', 'curto', { nowMs: DIA })).toMatchObject({ ok: false, reason: 'bad-op' });
    expect((await ent(e)).credits).toBe(5000);
  });

  it('sem Créditos suficientes: 402 e nada muda (nem saldo, nem contador do dia)', async () => {
    const e = fakeEnv({ credits: 459 });
    expect(await buyBitsPack(e, ID, 'bits-500', 'op-pobre-0001', { nowMs: DIA })).toMatchObject({ ok: false, reason: 'insufficient', status: 402 });
    const x = await ent(e);
    expect(x.credits).toBe(459);
    expect(x.bitsBuy).toBeUndefined();
  });

  it('TETO de 1.000/dia: 200 + 500 passam; depois o de 1.000 é recusado SEM debitar e diz quanto resta; o de 200 ainda cabe', async () => {
    const e = fakeEnv({ credits: 10_000 });
    expect((await buyBitsPack(e, ID, 'bits-200', 'op-a-00001', { nowMs: DIA })).ok).toBe(true);
    expect((await buyBitsPack(e, ID, 'bits-500', 'op-b-00001', { nowMs: DIA })).ok).toBe(true);
    const antes = (await ent(e)).credits;
    const r = await buyBitsPack(e, ID, 'bits-1000', 'op-c-00001', { nowMs: DIA });
    expect(r).toMatchObject({ ok: false, reason: 'daily-cap', status: 409, leftToday: 300 });
    expect((await ent(e)).credits).toBe(antes);
    expect((await buyBitsPack(e, ID, 'bits-200', 'op-d-00001', { nowMs: DIA })).ok).toBe(true); // 900
    expect(await buyBitsPack(e, ID, 'bits-200', 'op-e-00001', { nowMs: DIA })).toMatchObject({ ok: false, reason: 'daily-cap', leftToday: 100 });
  });

  it('borda exata: 999 comprados + 1 cabe; +1 além disso recusa (teto contado em Bits, não em pedidos)', async () => {
    const hoje = new Date(DIA).toISOString().slice(0, 10);
    expect(bitsPackLeftToday({ bitsBuy: { day: hoje, bits: 999 } }, DIA)).toBe(1);
    expect(bitsPackLeftToday({ bitsBuy: { day: hoje, bits: 1000 } }, DIA)).toBe(0);
    // com 800 já comprados, o de 200 fecha o dia EXATO em 1.000; o próximo recusa
    const e = fakeEnv({ credits: 10_000, extra: { bitsBuy: { day: hoje, bits: 800 } } });
    expect(await buyBitsPack(e, ID, 'bits-200', 'op-borda-01', { nowMs: DIA })).toMatchObject({ ok: true, leftToday: 0 });
    expect(await buyBitsPack(e, ID, 'bits-200', 'op-borda-02', { nowMs: DIA })).toMatchObject({ ok: false, reason: 'daily-cap', leftToday: 0 });
  });

  it('o pacote de 1.000 usa o dia inteiro; virar o dia UTC zera o contador', async () => {
    const e = fakeEnv({ credits: 10_000 });
    expect((await buyBitsPack(e, ID, 'bits-1000', 'op-dia1-001', { nowMs: DIA })).ok).toBe(true);
    expect((await buyBitsPack(e, ID, 'bits-200', 'op-dia1-002', { nowMs: DIA })).reason).toBe('daily-cap');
    const amanha = DIA + 24 * 60 * 60 * 1000;
    expect(await buyBitsPack(e, ID, 'bits-1000', 'op-dia2-001', { nowMs: amanha })).toMatchObject({ ok: true, leftToday: 0 });
    expect((await ent(e)).credits).toBe(10_000 - 1600);
  });

  it('IDEMPOTÊNCIA: o mesmo pedido reenviado devolve o mesmo pacote e NÃO debita nem conta de novo', async () => {
    const e = fakeEnv({ credits: 1000 });
    const a = await buyBitsPack(e, ID, 'bits-500', 'op-mesmo-001', { nowMs: DIA });
    const b = await buyBitsPack(e, ID, 'bits-500', 'op-mesmo-001', { nowMs: DIA });
    expect(a).toMatchObject({ ok: true, bits: 500 });
    expect(b).toMatchObject({ ok: true, bits: 500, replay: true });
    const x = await ent(e);
    expect(x.credits).toBe(540);
    expect(x.bitsBuy.bits).toBe(500);
    // reusar o opId com OUTRO pacote não compra nada novo: devolve o que aquele pedido comprou
    expect(await buyBitsPack(e, ID, 'bits-200', 'op-mesmo-001', { nowMs: DIA })).toMatchObject({ ok: true, pack: 'bits-500', replay: true });
    expect((await ent(e)).credits).toBe(540);
  });

  it('a lista de pedidos guardados é limitada (OPS_MAX) e nunca sai na visão pública', async () => {
    const e = fakeEnv({ credits: 100_000 });
    let dia = DIA;
    for (let i = 0; i < OPS_MAX + 5; i++) {
      dia += 24 * 60 * 60 * 1000;
      expect((await buyBitsPack(e, ID, 'bits-200', `op-lote-${String(i).padStart(4, '0')}`, { nowMs: dia })).ok).toBe(true);
    }
    expect((await ent(e)).bitsBuyOps).toHaveLength(OPS_MAX);
  });

  it('CONCORRÊNCIA com D1: duas trocas simultâneas da mesma conta não passam juntas (uma recebe busy, nada além do teto)', async () => {
    const e = fakeEnv({ credits: 10_000, d1: true, slow: true });
    const rs = await Promise.all([
      buyBitsPack(e, ID, 'bits-1000', 'op-corr-0001', { nowMs: DIA }),
      buyBitsPack(e, ID, 'bits-1000', 'op-corr-0002', { nowMs: DIA }),
    ]);
    expect(rs.filter(r => r.ok)).toHaveLength(1);
    expect(rs.find(r => !r.ok)).toMatchObject({ reason: 'busy', status: 409 });
    const x = await ent(e);
    expect(x.credits).toBe(9200);
    expect(x.bitsBuy.bits).toBe(1000);
    // a trava foi solta: a próxima troca do dia é decidida pelo TETO, não pela trava
    expect((await buyBitsPack(e, ID, 'bits-200', 'op-corr-0003', { nowMs: DIA })).reason).toBe('daily-cap');
    expect(e.DB.rows.size).toBe(0);
  });

  it('trava vencida (worker morto) não prende a conta: depois de LOCK_TTL_MS a troca volta a passar', async () => {
    const e = fakeEnv({ credits: 1000, d1: true });
    e.DB.rows.set(ENT_LOCK_PREFIX + ID, { save: ID, expires: DIA + LOCK_TTL_MS });
    expect((await buyBitsPack(e, ID, 'bits-200', 'op-trava-001', { nowMs: DIA })).reason).toBe('busy');
    expect((await buyBitsPack(e, ID, 'bits-200', 'op-trava-002', { nowMs: DIA + LOCK_TTL_MS })).ok).toBe(true);
  });

  it('admin não debita nem conta (padrão de spend/buy-essence)', async () => {
    const e = fakeEnv({ credits: 0 });
    expect(await buyBitsPack(e, ID, 'bits-1000', 'op-admin-001', { nowMs: DIA, admin: true })).toMatchObject({ ok: true, bits: 1000, price: 0 });
    expect((await ent(e)).bitsBuy).toBeUndefined();
  });
});

describe('rota /api/entitlements — buy-bits e o cliente antigo', () => {
  const post = (action, body) => new Request(`https://x/api/entitlements?action=${action}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });

  it('buy-bits: o servidor IGNORA bits/credits do corpo e cobra o pacote; resposta traz bits, leftToday e o saldo novo', async () => {
    const e = fakeEnv({ credits: 1000 });
    const res = await onRequestPost({ request: post('buy-bits', { id: ID, pack: 'bits-200', opId: 'op-rota-0001', bits: 99999, credits: 1 }), env: e });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, pack: 'bits-200', bits: 200, price: 200, credits: 800, leftToday: BITS_PACK_DAILY_CAP - 200 });
  });

  it('buy-bits recusado por teto devolve 409 com leftToday; sem crédito, 402', async () => {
    const e = fakeEnv({ credits: 5000 });
    await onRequestPost({ request: post('buy-bits', { id: ID, pack: 'bits-1000', opId: 'op-rota-0002' }), env: e });
    const cap = await onRequestPost({ request: post('buy-bits', { id: ID, pack: 'bits-200', opId: 'op-rota-0003' }), env: e });
    expect(cap.status).toBe(409);
    expect(await cap.json()).toEqual({ ok: false, reason: 'daily-cap', leftToday: 0 });
    const pobre = fakeEnv({ credits: 10 });
    const r = await onRequestPost({ request: post('buy-bits', { id: ID, pack: 'bits-200', opId: 'op-rota-0004' }), env: pobre });
    expect(r.status).toBe(402);
  });

  it('buy-bits com pacote desconhecido: 400 unknown-pack e nada é debitado', async () => {
    const e = fakeEnv({ credits: 1000 });
    const res = await onRequestPost({ request: post('buy-bits', { id: ID, pack: 'bits-9999', opId: 'op-rota-0101' }), env: e });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, reason: 'unknown-pack' });
    expect((await ent(e)).credits).toBe(1000);
  });

  it('buy-bits com opId curto: 400 bad-op e nada é debitado', async () => {
    const e = fakeEnv({ credits: 1000 });
    const res = await onRequestPost({ request: post('buy-bits', { id: ID, pack: 'bits-200', opId: 'curto' }), env: e });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, reason: 'bad-op' });
    expect((await ent(e)).credits).toBe(1000);
  });

  it('buy-bits com a trava da conta ocupada: 409 busy e nada é debitado', async () => {
    const e = fakeEnv({ credits: 1000, d1: true });
    e.DB.rows.set(ENT_LOCK_PREFIX + ID, { save: ID, expires: Date.now() + LOCK_TTL_MS });
    const res = await onRequestPost({ request: post('buy-bits', { id: ID, pack: 'bits-200', opId: 'op-rota-0102' }), env: e });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ ok: false, reason: 'busy' });
    expect((await ent(e)).credits).toBe(1000);
  });

  it('buy-bits com o mesmo opId repetido: 200 nas duas e um débito só', async () => {
    const e = fakeEnv({ credits: 1000, d1: true });
    const a = await onRequestPost({ request: post('buy-bits', { id: ID, pack: 'bits-500', opId: 'op-rota-0103' }), env: e });
    const b = await onRequestPost({ request: post('buy-bits', { id: ID, pack: 'bits-500', opId: 'op-rota-0103' }), env: e });
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(await b.json()).toMatchObject({ ok: true, bits: 500, replay: true, credits: 540 });
    expect((await ent(e)).credits).toBe(540);
  });

  it('CLIENTE EM CACHE: a troca livre antiga (spend reason=exchange-bits, 1 Crédito → 10 Bits) é recusada com erro claro e NÃO debita', async () => {
    const e = fakeEnv({ credits: 50 });
    const res = await onRequestPost({ request: post('spend', { id: ID, amount: 4, reason: 'exchange-bits', opId: 'op-velho-0001' }), env: e });
    expect(res.status).toBe(410);
    expect(await res.json()).toEqual({ ok: false, reason: 'exchange-moved' });
    expect((await ent(e)).credits).toBe(50);
  });

  it('o resto do spend segue igual (ex.: reroll de 50 Créditos)', async () => {
    const e = fakeEnv({ credits: 60 });
    const res = await onRequestPost({ request: post('spend', { id: ID, amount: 50, reason: 'reroll', opId: 'op-reroll-001' }), env: e });
    expect(res.status).toBe(200);
    expect((await ent(e)).credits).toBe(10);
  });

  it('GET mostra bitsPackLeft só quando a conta já trocou HOJE (formato de sempre nos outros casos)', async () => {
    const e = fakeEnv({ credits: 1000 });
    const get = async () => (await onRequestGet({ request: new Request(`https://x/api/entitlements?id=${ID}`), env: e })).json();
    expect('bitsPackLeft' in (await get())).toBe(false);
    await onRequestPost({ request: post('buy-bits', { id: ID, pack: 'bits-500', opId: 'op-get-00001' }), env: e });
    expect((await get()).bitsPackLeft).toBe(500);
  });

  it('o desconto do pacote, derivado, bate com o pedido do dono (~8% e ~20%)', () => {
    const base = pack('bits-200').credits / pack('bits-200').bits;
    expect(Math.round((1 - pack('bits-500').credits / pack('bits-500').bits / base) * 100)).toBe(8);
    expect(Math.round((1 - pack('bits-1000').credits / pack('bits-1000').bits / base) * 100)).toBe(20);
  });
});
