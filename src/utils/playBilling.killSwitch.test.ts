/**
 * Kill-switch `BILLING_DISABLED` no CLIENTE (BETA-CONTINGENCIA §0): com a loja
 * fechada no `/api/config`, a compra NOVA nem abre a janela da Play (nada é
 * cobrado) e devolve `billing-disabled`; restaurar NÃO é afetado.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./entitlements', async (orig) => ({
  ...(await orig<typeof import('./entitlements')>()),
  verifyPurchase: vi.fn(),
}));
vi.mock('./safeStorage', () => ({ readLocal: () => 'a'.repeat(32), writeLocal: () => {}, readFlag: () => false, writeFlag: () => {} }));
const cfg = vi.hoisted(() => ({ billingDisabled: false }));
vi.mock('./serverConfig', () => ({
  fetchServerConfig: async () => ({ authRequired: false, transcribeAvailable: false, chatDisabled: false, billingDisabled: cfg.billingDisabled }),
}));

import { verifyPurchase } from './entitlements';
import { purchase, purchaseSubscription, isStoreOpen, isBillingAvailable, billingDisabledMessage } from './playBilling';

const ent = { tier: 'paid' as const, credits: 0, adsLeft: 3, admin: false };
function plugin() {
  const p = {
    purchase: vi.fn(async () => ({ purchaseToken: 'tok-1' })),
    consume: vi.fn(async () => {}),
    acknowledge: vi.fn(async () => {}),
  };
  (globalThis as unknown as { Capacitor: unknown }).Capacitor = { isNativePlatform: () => true, Plugins: { Billing: p } };
  return p;
}

beforeEach(() => { vi.mocked(verifyPurchase).mockReset(); cfg.billingDisabled = false; });
afterEach(() => { delete (globalThis as { Capacitor?: unknown }).Capacitor; });

describe('loja fechada (BILLING_DISABLED)', () => {
  it('purchase: nem abre a Play, devolve billing-disabled', async () => {
    const p = plugin();
    cfg.billingDisabled = true;
    expect(await purchase('soulmon.unlock.full')).toEqual({ ok: false, reason: 'billing-disabled' });
    expect(p.purchase).not.toHaveBeenCalled();
    expect(verifyPurchase).not.toHaveBeenCalled();
  });

  it('purchaseSubscription: idem', async () => {
    const p = plugin();
    cfg.billingDisabled = true;
    expect(await purchaseSubscription('soulmon_cosmetic_quarterly')).toEqual({ ok: false, reason: 'billing-disabled' });
    expect(p.purchase).not.toHaveBeenCalled();
  });

  it('isBillingAvailable continua "há plugin" (restaurar precisa dele); isStoreOpen diz a verdade', async () => {
    plugin();
    cfg.billingDisabled = true;
    expect(isBillingAvailable()).toBe(true);
    expect(await isStoreOpen()).toBe(false);
  });

  it('loja aberta: fluxo normal', async () => {
    const p = plugin();
    vi.mocked(verifyPurchase).mockResolvedValue({ ok: true, ent });
    expect(await purchase('soulmon.unlock.full')).toEqual({ ok: true, ent });
    expect(p.purchase).toHaveBeenCalledTimes(1);
  });

  it('web (sem plugin): isStoreOpen = false sem tocar a rede', async () => {
    expect(await isStoreOpen()).toBe(false);
  });

  it('mensagem PT/EN amigável e sem cobrança', () => {
    expect(billingDisabledMessage(true)).toMatch(/Nada foi cobrado/);
    expect(billingDisabledMessage(false)).toMatch(/Nothing was charged/);
  });
});
