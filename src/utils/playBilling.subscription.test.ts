import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./entitlements', async (orig) => ({
  ...(await orig<typeof import('./entitlements')>()),
  verifyPurchase: vi.fn(),
}));
vi.mock('./safeStorage', () => ({ readLocal: () => 'a'.repeat(32), writeLocal: () => {}, readFlag: () => false, writeFlag: () => {} }));

import { verifyPurchase } from './entitlements';
import { purchase, purchaseSubscription, getSubscriptionOffer, reconcileSubscription } from './playBilling';

const SKU = 'soulmon_cosmetic_quarterly';
const ent = { tier: 'demo' as const, credits: 0, adsLeft: 3, admin: false, subActive: true, subUntil: 99 };

function plugin(over: Record<string, unknown> = {}) {
  const p = {
    purchase: vi.fn(async () => ({ purchaseToken: 'tok-1' })),
    consume: vi.fn(async () => {}),
    acknowledge: vi.fn(async () => {}),
    getLocalizedPrice: vi.fn(async () => ({ formattedPrice: 'R$ 9,90', billingPeriod: 'P3M' })),
    getPurchases: vi.fn(async () => ({ purchases: [{ productId: SKU, purchaseToken: 'tok-1' }, { productId: 'soulmon.unlock.full', purchaseToken: 'tok-x' }] })),
    ...over,
  };
  (globalThis as unknown as { Capacitor: unknown }).Capacitor = { isNativePlatform: () => true, Plugins: { Billing: p } };
  return p;
}

beforeEach(() => { vi.mocked(verifyPurchase).mockReset(); });
afterEach(() => { delete (globalThis as { Capacitor?: unknown }).Capacitor; });

describe('purchaseSubscription', () => {
  it('abre o fluxo como assinatura (productType subs) com o saveId, e só dá ok depois do servidor', async () => {
    const p = plugin();
    vi.mocked(verifyPurchase).mockResolvedValue({ ok: true, ent });
    const r = await purchaseSubscription(SKU);
    expect(p.purchase).toHaveBeenCalledWith({ productId: SKU, productType: 'subs', saveId: 'a'.repeat(32) });
    expect(verifyPurchase).toHaveBeenCalledWith(SKU, 'tok-1');
    expect(r).toEqual({ ok: true, ent });
    expect(p.consume).not.toHaveBeenCalled(); // assinatura nunca é consumida
  });

  it('servidor recusou: não dá ok', async () => {
    plugin();
    vi.mocked(verifyPurchase).mockResolvedValue({ ok: false, reason: 'order-in-use' });
    expect(await purchaseSubscription(SKU)).toEqual({ ok: false, reason: 'order-in-use' });
  });

  it('fechar a janela da Play = cancelled; pagamento pendente e sem oferta base têm motivo próprio', async () => {
    plugin({ purchase: vi.fn(async () => { throw new Error('cancelled'); }) });
    expect(await purchaseSubscription(SKU)).toEqual({ ok: false, reason: 'cancelled' });
    plugin({ purchase: vi.fn(async () => { throw new Error('pending'); }) });
    expect(await purchaseSubscription(SKU)).toEqual({ ok: false, reason: 'pending' });
    plugin({ purchase: vi.fn(async () => { throw new Error('no-base-offer'); }) });
    expect(await purchaseSubscription(SKU)).toEqual({ ok: false, reason: 'no-base-offer' });
  });

  it('na web (sem plugin): unavailable', async () => {
    expect(await purchaseSubscription(SKU)).toEqual({ ok: false, reason: 'unavailable' });
  });
});

describe('o INAPP segue intacto', () => {
  it('purchase() do vitalício NÃO manda productType', async () => {
    const p = plugin();
    vi.mocked(verifyPurchase).mockResolvedValue({ ok: true, ent });
    await purchase('soulmon.unlock.full');
    expect(p.purchase).toHaveBeenCalledWith({ productId: 'soulmon.unlock.full', saveId: 'a'.repeat(32) });
  });
});

describe('getSubscriptionOffer', () => {
  it('preço e período da Play', async () => {
    const p = plugin();
    expect(await getSubscriptionOffer(SKU)).toEqual({ price: 'R$ 9,90', period: 'P3M' });
    expect(p.getLocalizedPrice).toHaveBeenCalledWith({ productId: SKU, productType: 'subs' });
  });
  it('sem preço ou sem período: null (a UI não oferece a compra)', async () => {
    plugin({ getLocalizedPrice: vi.fn(async () => ({ formattedPrice: '', billingPeriod: '' })) });
    expect(await getSubscriptionOffer(SKU)).toBeNull();
    plugin({ getLocalizedPrice: vi.fn(async () => ({ formattedPrice: 'R$ 9,90' })) });
    expect(await getSubscriptionOffer(SKU)).toBeNull();
    plugin({ getLocalizedPrice: vi.fn(async () => { throw new Error('x'); }) });
    expect(await getSubscriptionOffer(SKU)).toBeNull();
  });
});

describe('reconcileSubscription', () => {
  it('consulta SUBS e verifica SÓ o SKU da assinatura', async () => {
    const p = plugin();
    vi.mocked(verifyPurchase).mockResolvedValue({ ok: true, ent });
    expect(await reconcileSubscription(SKU)).toEqual(ent);
    expect(p.getPurchases).toHaveBeenCalledWith({ productType: 'subs' });
    expect(verifyPurchase).toHaveBeenCalledTimes(1);
    expect(verifyPurchase).toHaveBeenCalledWith(SKU, 'tok-1');
  });
  it('falha vira null, sem lançar', async () => {
    plugin({ getPurchases: vi.fn(async () => { throw new Error('x'); }) });
    expect(await reconcileSubscription(SKU)).toBeNull();
    delete (globalThis as { Capacitor?: unknown }).Capacitor;
    expect(await reconcileSubscription(SKU)).toBeNull();
  });
});
