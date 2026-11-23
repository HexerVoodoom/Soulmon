/**
 * Molduras do WIDGET V-Pet (04/11/2026): produto permanente `moldura_<elemento>` pelo MESMO caminho de compra verificada.
 * Aqui: catálogo, concessão única (replay não duplica), visão pública, reembolso. A verificação na Play em si é a de sempre.
 */
import { describe, it, expect } from 'vitest';
import { PRODUCTS } from './_billing.js';
import { COUNTER_RING } from './_elementoBase.js';
import { applyVerifiedPurchase, auditRefunds, publicView, readEntitlement } from './_entitlements.js';

const ID = 'c'.repeat(32);
const kvFake = () => {
  const store = new Map();
  return { store, get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); } };
};
const env = () => ({ DIGIAPP_SAVES: kvFake() });
const compra = (el, n = 1) => ({
  orderId: `play:GPA.${el}.${n}`, grantTier: PRODUCTS[`moldura_${el}`].grantTier, grantCredits: PRODUCTS[`moldura_${el}`].grantCredits,
  grantFrame: PRODUCTS[`moldura_${el}`].grantFrame, provider: 'play', productId: `moldura_${el}`, purchaseToken: `tok-${el}-${n}`,
});

describe('catálogo do servidor', () => {
  it('20 produtos, não consumíveis, sem tier nem Créditos', () => {
    const ids = Object.keys(PRODUCTS).filter(k => k.startsWith('moldura_'));
    expect(ids).toHaveLength(20);
    expect(ids.map(k => k.slice(8)).sort()).toEqual([...COUNTER_RING].sort());
    for (const k of ids) expect(PRODUCTS[k]).toMatchObject({ grantTier: null, grantCredits: 0, consumable: false });
  });
});

describe('concessão', () => {
  it('compra concede a moldura, e o replay do mesmo pedido não duplica', async () => {
    const e = env();
    const a = await applyVerifiedPurchase(e, ID, compra('sombra'));
    expect(a.duplicate).toBe(false);
    expect(a.ent.frames).toEqual(['sombra']);
    expect(a.ent.tier).toBe('demo');
    expect(a.ent.credits).toBe(0);
    const b = await applyVerifiedPurchase(e, ID, compra('sombra'));
    expect(b.duplicate).toBe(true);
    expect((await readEntitlement(e, ID)).frames).toEqual(['sombra']);
  });

  it('visão pública: `frames` só aparece quando há alguma (contas antigas mantêm o formato)', async () => {
    const e = env();
    expect(publicView(await readEntitlement(e, ID))).not.toHaveProperty('frames');
    await applyVerifiedPurchase(e, ID, compra('luz'));
    await applyVerifiedPurchase(e, ID, compra('fogo'));
    expect(publicView(await readEntitlement(e, ID)).frames).toEqual(['luz', 'fogo']);
  });

  it('entitlement antigo (sem o campo) lê como vazio e aceita a compra', async () => {
    const e = env();
    e.DIGIAPP_SAVES.store.set(`ent:${ID}`, JSON.stringify({ tier: 'paid', credits: 5, consumedOrders: [], orderDetails: [] }));
    const ent = await readEntitlement(e, ID);
    expect(ent.frames).toEqual([]);
    const r = await applyVerifiedPurchase(e, ID, compra('terra'));
    expect(r.ent.frames).toEqual(['terra']);
    expect(r.ent.tier).toBe('paid');
    expect(r.ent.credits).toBe(5);
  });
});

describe('reembolso', () => {
  it('o pedido reembolsado leva a moldura; a outra fica', async () => {
    const e = env();
    await applyVerifiedPurchase(e, ID, compra('sombra'));
    await applyVerifiedPurchase(e, ID, compra('luz'));
    const { ent, revoked } = await auditRefunds(e, ID, async o => o.productId === 'moldura_sombra', Date.now() + 2 * 24 * 3600 * 1000);
    expect(revoked).toEqual(['play:GPA.sombra.1']);
    expect(ent.frames).toEqual(['luz']);
    expect(publicView(ent).frames).toEqual(['luz']);
  });

  it('na dúvida (null) mantém', async () => {
    const e = env();
    await applyVerifiedPurchase(e, ID, compra('sombra'));
    const { ent } = await auditRefunds(e, ID, async () => null, Date.now() + 2 * 24 * 3600 * 1000);
    expect(ent.frames).toEqual(['sombra']);
  });
});
