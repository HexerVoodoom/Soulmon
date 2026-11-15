/**
 * QA r4, achado 1 (REGISTRO §381): TODO escritor de `ent:<saveId>` passa pela mesma trava (`comTravaDoEnt`, linha `entlock:` em
 * `order_claims`). Antes só `buyBitsPack` travava; `spendCredits`, `applyVerifiedPurchase`, `auditRefunds` e o resto liam e gravavam
 * o registro inteiro sem trava, e dois pedidos simultâneos da mesma conta apagavam um ao outro (débito sumia, Crédito de compra sumia).
 * KV lento e D1 de mentira que respeita as condições do WHERE (mesmo desenho de `bitsPacks.trava.antislop.test.js`).
 */
import { describe, it, expect } from 'vitest';
import { onRequestPost } from './entitlements.js';
import {
  ENT_PREFIX, ENT_LOCK_PREFIX, ENT_LOCK_TTL_MS, readEntitlement, spendCredits, applyVerifiedPurchase, auditRefunds,
  grantRankPrize, tomarTravaDoEnt, comTravaDoEnt, EntitlementOcupadoError,
} from './_entitlements.js';
import { buyBitsPack } from './_bitsPacks.js';

const ID = 'c'.repeat(32);

function fakeEnv({ ent = { tier: 'paid', credits: 100 }, d1 = true, save = null } = {}) {
  const store = new Map([[ENT_PREFIX + ID, JSON.stringify(ent)]]);
  if (save) store.set(ID, JSON.stringify(save));
  const tick = () => new Promise(r => setTimeout(r, 3));
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
            rows.set(a[0], { save: a[1], claimed: a[2], expires: a[3] });
          } else if (/^DELETE/i.test(sql)) {
            const r = rows.get(a[0]);
            if (!r) return { success: true };
            if (/expires_at <=/.test(sql)) { if (r.expires != null && r.expires <= a[1]) rows.delete(a[0]); }
            else if (/claimed_at = \?/.test(sql)) { if (r.claimed === a[1] && r.expires === a[2]) rows.delete(a[0]); }
            else rows.delete(a[0]);
          }
          return { success: true };
        },
        async first() { await tick(); const r = rows.get(a[0]); return r ? { save_id: r.save } : null; },
      }),
    }),
  };
  return { SOULMON_SAVES: kv, ...(d1 ? { DB } : {}) };
}
const ent = e => readEntitlement(e, ID);
const compra = (orderId, grantCredits) => ({ orderId, grantTier: null, grantCredits, provider: 'play', productId: 'credits_500', purchaseToken: 't' });

describe('trava única do entitlement (§381)', () => {
  it('dois gastos simultâneos com opIds diferentes debitam os DOIS (antes: um apagava o outro)', async () => {
    const e = fakeEnv();
    const rs = await Promise.all([spendCredits(e, ID, 10, 'op-gasto-0001'), spendCredits(e, ID, 10, 'op-gasto-0002')]);
    expect(rs.every(Boolean)).toBe(true);
    expect((await ent(e)).credits).toBe(80);
    expect(e.DB.rows.size).toBe(0);
  });

  it('gasto e compra verificada simultâneos: os Créditos da compra NÃO somem', async () => {
    const e = fakeEnv();
    await Promise.all([spendCredits(e, ID, 10, 'op-gasto-0003'), applyVerifiedPurchase(e, ID, compra('GPA.1', 500))]);
    expect((await ent(e)).credits).toBe(590);
  });

  it('reembolso (auditRefunds) simultâneo a uma compra nova: a compra nova fica, o reembolso desconta o pedido certo', async () => {
    const e = fakeEnv({ ent: { tier: 'demo', credits: 500, consumedOrders: ['GPA.velho'], orderDetails: [{ orderId: 'GPA.velho', provider: 'play', grantTier: null, grantCredits: 500 }], auditedAt: 0 } });
    const isVoided = async () => { await new Promise(r => setTimeout(r, 5)); return true; };
    await Promise.all([auditRefunds(e, ID, isVoided), applyVerifiedPurchase(e, ID, compra('GPA.novo', 200))]);
    const x = await ent(e);
    expect(x.credits).toBe(200);
    expect(x.consumedOrders).toContain('GPA.novo');
  });

  it('o mesmo opId em paralelo no spend cobra UMA vez', async () => {
    const e = fakeEnv();
    const rs = await Promise.all([spendCredits(e, ID, 30, 'op-mesmo-0001'), spendCredits(e, ID, 30, 'op-mesmo-0001'), spendCredits(e, ID, 30, 'op-mesmo-0001')]);
    expect(rs.every(Boolean)).toBe(true);
    expect((await ent(e)).credits).toBe(70);
  });

  it('o mesmo opId em paralelo no buy-essence cobra UMA vez (rota real)', async () => {
    const e = fakeEnv({ save: { defeatedElements: ['fogo'], essences: {} } });
    const post = () => onRequestPost({ request: new Request('https://x/api/entitlements?action=buy-essence', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ID, element: 'fogo', qty: 1, opId: 'op-ess-00001' }),
    }), env: e });
    const rs = await Promise.all([post(), post()]);
    expect(rs.map(r => r.status)).toEqual([200, 200]);
    const preco = (await rs[0].json()).price;
    expect(preco).toBeGreaterThan(0);
    expect((await ent(e)).credits).toBe(100 - preco);
  });

  it('compra verificada ESPERA a trava ocupada em vez de recusar', async () => {
    const e = fakeEnv();
    const trava = await tomarTravaDoEnt(e, ID);
    expect(trava.ok).toBe(true);
    const p = applyVerifiedPurchase(e, ID, compra('GPA.2', 500));
    await new Promise(r => setTimeout(r, 60));
    await trava.release();
    const r = await p;
    expect(r.duplicate).toBe(false);
    expect((await ent(e)).credits).toBe(600);
  });

  it('prêmio de ranking também passa pela trava (dois aprovadores simultâneos de prêmios diferentes somam os dois)', async () => {
    const e = fakeEnv();
    await Promise.all([grantRankPrize(e, ID, 50, 'rift:2026-10'), grantRankPrize(e, ID, 30, 'rift:2026-09')]);
    expect((await ent(e)).credits).toBe(180);
  });

  it('trava presa além da espera: comTravaDoEnt lança EntitlementOcupadoError e não roda o efeito', async () => {
    const e = fakeEnv();
    e.DB.rows.set(ENT_LOCK_PREFIX + ID, { save: ID, claimed: Date.now(), expires: Date.now() + ENT_LOCK_TTL_MS });
    let rodou = false;
    await expect(comTravaDoEnt(e, ID, async () => { rodou = true; }, { esperaMs: 50 })).rejects.toBeInstanceOf(EntitlementOcupadoError);
    expect(rodou).toBe(false);
  });

  it('rota spend com a trava presa responde 409 busy sem debitar', async () => {
    const e = fakeEnv();
    e.DB.rows.set(ENT_LOCK_PREFIX + ID, { save: ID, claimed: Date.now(), expires: Date.now() + ENT_LOCK_TTL_MS });
    const res = await onRequestPost({ request: new Request('https://x/api/entitlements?action=spend', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ID, amount: 10, reason: 'reroll', opId: 'op-preso-0001' }),
    }), env: e });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ ok: false, reason: 'busy' });
    expect((await ent(e)).credits).toBe(100);
  }, 10_000);

  it('buy-bits e spend disputam a MESMA trava', async () => {
    const e = fakeEnv({ ent: { tier: 'paid', credits: 1000 } });
    const trava = await tomarTravaDoEnt(e, ID);
    expect((await buyBitsPack(e, ID, 'bits-200', 'op-bits-00001')).reason).toBe('busy');
    await trava.release();
    expect((await buyBitsPack(e, ID, 'bits-200', 'op-bits-00002')).ok).toBe(true);
  });

  it('sem env.DB: sem trava, o comportamento de antes (gasto sequencial funciona)', async () => {
    const e = fakeEnv({ d1: false });
    expect(await spendCredits(e, ID, 10, 'op-semdb-001')).toMatchObject({ credits: 90 });
    expect(await spendCredits(e, ID, 10, 'op-semdb-001')).toMatchObject({ credits: 90 });
    expect((await ent(e)).credits).toBe(90);
  });
});
