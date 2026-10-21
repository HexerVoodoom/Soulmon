import { it, expect } from 'vitest';
import { applyVerifiedPurchase, spendCredits, auditRefunds, readEntitlement } from './_entitlements.js';
const ID = 'abcdef0123456789abcdef0123456789';

function env(comD1) {
  const m = new Map(); const rows = new Map();
  const kv = { get: async k => m.get(k) ?? null, put: async (k, v) => { m.set(k, String(v)); }, delete: async k => { m.delete(k); } };
  const DB = { prepare: sql => ({ bind: (...a) => ({
    async run() {
      if (/^INSERT/i.test(sql)) { if (rows.has(a[0])) throw new Error('UNIQUE constraint failed: order_claims.order_id'); rows.set(a[0], a[1]); }
      if (/^DELETE/i.test(sql)) rows.delete(a[0]);
      return { success: true };
    },
    async first() { return rows.has(a[0]) ? { save_id: rows.get(a[0]) } : null; },
  }) }) };
  return { SOULMON_SAVES: kv, ...(comD1 ? { DB } : {}) };
}
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const velha = { orderId: 'GPA.old', grantTier: 'paid', grantCredits: 0, provider: 'play', productId: 'full', purchaseToken: 't0' };
const nova = { orderId: 'GPA.new', grantTier: null, grantCredits: 50, provider: 'play', productId: 'credits50', purchaseToken: 't1' };
const tick = () => new Promise(r => setTimeout(r, 0));

async function auditoriaLenta(e, acao, voided = () => false) {
  await applyVerifiedPurchase(e, ID, velha);
  const gate = deferred();
  const audit = auditRefunds(e, ID, async o => { await gate.promise; return voided(o); }, Date.now());
  await tick(); await tick();
  await acao();
  gate.resolve();
  return audit;
}

it('KV: compra no meio da auditoria lenta nao e apagada', async () => {
  const e = env(false);
  await auditoriaLenta(e, () => applyVerifiedPurchase(e, ID, nova));
  const f = await readEntitlement(e, ID);
  expect(f.credits).toBe(50);
  expect(f.consumedOrders).toContain('GPA.new');
});

it('KV+D1: compra no meio sobrevive e o retry responde duplicate COM credits 50', async () => {
  const e = env(true);
  await auditoriaLenta(e, () => applyVerifiedPurchase(e, ID, nova));
  const retry = await applyVerifiedPurchase(e, ID, nova);
  expect(retry.duplicate).toBe(true);
  expect(retry.ent.credits).toBe(50);
  expect((await readEntitlement(e, ID)).credits).toBe(50);
});

it('spend no meio da janela nao e desfeito', async () => {
  const e = env(false);
  await applyVerifiedPurchase(e, ID, nova);
  const gate = deferred();
  const audit = auditRefunds(e, ID, async () => { await gate.promise; return false; }, Date.now());
  await tick(); await tick();
  await spendCredits(e, ID, 20);
  gate.resolve();
  await audit;
  expect((await readEntitlement(e, ID)).credits).toBe(30);
});

it('reembolso real desconta e marca voided; auditorias concorrentes nao descontam em dobro', async () => {
  const e = env(false);
  await applyVerifiedPurchase(e, ID, velha);
  await applyVerifiedPurchase(e, ID, nova);
  await applyVerifiedPurchase(e, ID, { ...nova, orderId: 'GPA.x', grantCredits: 10 });
  const gate = deferred();
  const isVoided = async o => { await gate.promise; return o.orderId === 'GPA.new'; };
  const now = Date.now();
  const a = auditRefunds(e, ID, isVoided, now);
  const b = auditRefunds(e, ID, isVoided, now);
  await tick(); await tick();
  gate.resolve();
  const [ra, rb] = await Promise.all([a, b]);
  expect([...ra.revoked, ...rb.revoked]).toContain('GPA.new');
  const f = await readEntitlement(e, ID);
  expect(f.credits).toBe(10);
  expect(f.orderDetails.find(o => o.orderId === 'GPA.new').voided).toBe(true);
  expect(f.orderDetails.find(o => o.orderId === 'GPA.x').voided).toBeFalsy();
});
