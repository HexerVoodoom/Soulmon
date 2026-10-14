/**
 * REGISTRO 49: a compra credita SOZINHA (reconcilePurchases ao abrir/voltar),
 * sem botão; "Restaurar compras" é o mesmo caminho manual e nunca recredita.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type Verificado = { ok: true; ent: { tier: string; credits: number; adsLeft: number }; consumeToken?: string } | { ok: false; reason: string };
const { verify } = vi.hoisted(() => ({ verify: { fn: vi.fn<(p: string, t: string) => Promise<Verificado>>() } }));
vi.mock('./entitlements', () => ({ verifyPurchase: (p: string, t: string) => verify.fn(p, t) }));
vi.mock('./serverConfig', () => ({ fetchServerConfig: async () => ({ billingDisabled: false }) }));

import { reconcilePurchases, restorePurchases, purchase } from './playBilling';

function plugin(pend: Array<{ productId: string; purchaseToken: string }>) {
  const p = {
    purchase: vi.fn(async () => ({ purchaseToken: 'novo' })),
    consume: vi.fn(async () => {}),
    acknowledge: vi.fn(async () => {}),
    getPurchases: vi.fn(async () => ({ purchases: pend })),
  };
  vi.stubGlobal('Capacitor', { isNativePlatform: () => true, Plugins: { Billing: p } });
  return p;
}
const ok = (credits: number, consumeToken?: string): Verificado => ({ ok: true, ent: { tier: 'demo', credits, adsLeft: 0 }, consumeToken });

beforeEach(() => {
  verify.fn.mockReset();
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });
});
afterEach(() => vi.unstubAllGlobals());

describe('crédito automático (sem botão)', () => {
  it('compra paga e interrompida (pacote pendente) é verificada, creditada e consumida sem ação da pessoa', async () => {
    const p = plugin([{ productId: 'soulmon.credits.60', purchaseToken: 'tok-pend' }]);
    verify.fn.mockResolvedValue(ok(60, 'tok-pend'));
    const ent = await reconcilePurchases();
    expect(ent?.credits).toBe(60);
    expect(verify.fn).toHaveBeenCalledWith('soulmon.credits.60', 'tok-pend');
    expect(p.consume).toHaveBeenCalledWith({ purchaseToken: 'tok-pend' });
  });

  it('desbloqueio pendente é reconhecido (acknowledge) depois do ok do servidor', async () => {
    const p = plugin([{ productId: 'soulmon.unlock.full', purchaseToken: 'tok-u' }]);
    verify.fn.mockResolvedValue({ ok: true, ent: { tier: 'paid', credits: 0, adsLeft: 0 } });
    expect((await reconcilePurchases())?.tier).toBe('paid');
    expect(p.acknowledge).toHaveBeenCalledWith({ purchaseToken: 'tok-u' });
  });

  it('comprovante de outra conta / conta excluída (order-in-use) é ignorado em silêncio', async () => {
    const p = plugin([{ productId: 'soulmon.unlock.full', purchaseToken: 'tok-x' }]);
    verify.fn.mockResolvedValue({ ok: false, reason: 'order-in-use' });
    expect(await reconcilePurchases()).toBeNull();
    expect(p.acknowledge).not.toHaveBeenCalled();
  });

  it('chamadas simultâneas viram UMA consulta (sem verify duplo)', async () => {
    const p = plugin([{ productId: 'soulmon.credits.60', purchaseToken: 't' }]);
    verify.fn.mockResolvedValue(ok(60));
    await Promise.all([reconcilePurchases(), reconcilePurchases(), reconcilePurchases()]);
    expect(p.getPurchases).toHaveBeenCalledTimes(1);
    expect(verify.fn).toHaveBeenCalledTimes(1);
  });

  it('durante uma compra manual a reconciliação não corre (nada de verify duplo do mesmo pedido)', async () => {
    const p = plugin([{ productId: 'soulmon.credits.60', purchaseToken: 'novo' }]);
    let solta!: () => void;
    p.purchase.mockImplementation(() => new Promise(res => { solta = () => res({ purchaseToken: 'novo' }); }));
    verify.fn.mockResolvedValue(ok(60, 'novo'));
    const compra = purchase('soulmon.credits.60');
    await new Promise(r => setTimeout(r, 10));
    expect(await reconcilePurchases()).toBeNull();
    expect(p.getPurchases).not.toHaveBeenCalled();
    solta();
    expect((await compra).ok).toBe(true);
    expect(verify.fn).toHaveBeenCalledTimes(1);
  });

  it('web/PWA sem plugin: nada acontece', async () => {
    vi.stubGlobal('Capacitor', { isNativePlatform: () => false });
    expect(await reconcilePurchases()).toBeNull();
  });
});

describe('Restaurar compras (botão mantido) não recredita', () => {
  it('sem nada pendente na Play (pacotes consumidos não são listados): nothing-to-restore, nenhum verify', async () => {
    plugin([]);
    const r = await restorePurchases();
    expect(r).toEqual({ ok: false, reason: 'nothing-to-restore' });
    expect(verify.fn).not.toHaveBeenCalled();
  });

  it('pacote ainda listado mas já creditado: o servidor decide (duplicate) e o cliente só consome — saldo vem do servidor', async () => {
    const p = plugin([{ productId: 'soulmon.credits.150', purchaseToken: 'tok-dup' }]);
    verify.fn.mockResolvedValue(ok(7, 'tok-dup')); // saldo atual do servidor (gasto), não +150
    const r = await restorePurchases();
    expect(r.ok && r.ent.credits).toBe(7);
    expect(p.consume).toHaveBeenCalledTimes(1);
  });
});
