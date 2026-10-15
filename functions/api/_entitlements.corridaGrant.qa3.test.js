import { it, expect } from 'vitest';
import { applyVerifiedPurchase, readEntitlement } from './_entitlements.js';
const ID = 'abcdefgh12345678abcdefgh12345678';
function env(comD1) {
  const m = new Map(); const rows = new Map();
  const tick = () => new Promise(r => setTimeout(r, 5));
  const kv = { get: async k => { await tick(); return m.get(k) ?? null; }, put: async (k, v) => { await tick(); m.set(k, String(v)); }, delete: async k => { m.delete(k); } };
  const DB = { prepare: sql => ({ bind: (...a) => ({ async run() {
    await tick();
    if (/^INSERT/i.test(sql)) { if (rows.has(a[0])) throw new Error('UNIQUE constraint failed: order_claims.order_id'); rows.set(a[0], a[1]); }
    if (/^DELETE/i.test(sql)) rows.delete(a[0]);
    return { success: true };
  } }) }) };
  return { SOULMON_SAVES: kv, ...(comD1 ? { DB } : {}), rows };
}
const compra = { orderId: 'GPA.1', grantTier: null, grantCredits: 50, provider: 'play', productId: 'x' };
it('REGRESSAO com D1: duas concessões simultâneas do MESMO pedido creditam uma vez', async () => {
  const e = env(true);
  const rs = await Promise.all([applyVerifiedPurchase(e, ID, compra), applyVerifiedPurchase(e, ID, compra)]);
  expect(rs.map(r => r.duplicate).sort()).toEqual([false, true]);
  expect((await readEntitlement(e, ID)).credits).toBe(50);
});
it('pedido diferente continua creditando; repetição sequencial segue duplicate', async () => {
  const e = env(true);
  await applyVerifiedPurchase(e, ID, compra);
  expect((await applyVerifiedPurchase(e, ID, compra)).duplicate).toBe(true);
  await applyVerifiedPurchase(e, ID, { ...compra, orderId: 'GPA.2' });
  expect((await readEntitlement(e, ID)).credits).toBe(100);
});
it('falha ao gravar o entitlement solta a trava (retry credita)', async () => {
  const e = env(true);
  const put = e.SOULMON_SAVES.put; let falhar = true;
  e.SOULMON_SAVES.put = async (...a) => { if (falhar) { falhar = false; throw new Error('kv'); } return put(...a); };
  await expect(applyVerifiedPurchase(e, ID, compra)).rejects.toThrow('kv');
  expect((await applyVerifiedPurchase(e, ID, compra)).duplicate).toBe(false);
  expect((await readEntitlement(e, ID)).credits).toBe(50);
});
