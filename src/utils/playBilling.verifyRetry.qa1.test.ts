/**
 * QA1 (rodada 6) — compra PAGA na Play + verificação no servidor que falha por
 * causa transitória (rede, 5xx, loja não respondeu). O jogador já pagou; sem
 * reenvio a tela dizia "não deu" e o crédito/tier só aparecia se ele lembrasse
 * de "Restaurar compras" antes do estorno automático da Play (3 dias). O
 * servidor é idempotente (`consumedOrders` + `claimOrder` na mesma conta), então
 * reenviar o MESMO comprovante é seguro. Recusa DEFINITIVA (`order-in-use`,
 * `account-mismatch`, `unknown-product`) NÃO reenvia.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type Verificado = { ok: true; ent: { tier: string; credits: number; adsLeft: number }; consumeToken?: string } | { ok: false; reason: string };
const { verify } = vi.hoisted(() => ({
  verify: { fn: vi.fn<(productId: string, purchaseToken: string) => Promise<Verificado>>() },
}));
vi.mock('./entitlements', () => ({ verifyPurchase: (p: string, t: string) => verify.fn(p, t) }));

import { purchase } from './playBilling';

const OK = { ok: true as const, ent: { tier: 'paid', credits: 50, adsLeft: 0 }, consumeToken: 'tok-1' };

function plugin() {
  const p = {
    purchase: vi.fn(async () => ({ purchaseToken: 'tok-1' })),
    consume: vi.fn(async () => {}),
    acknowledge: vi.fn(async () => {}),
    getPurchases: vi.fn(async () => ({ purchases: [] })),
  };
  vi.stubGlobal('Capacitor', { isNativePlatform: () => true, Plugins: { Billing: p } });
  return p;
}

beforeEach(() => {
  vi.useFakeTimers();
  verify.fn.mockReset();
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

async function comTempo<T>(p: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return p;
}

describe('purchase(): falha transitória na verificação', () => {
  it('network → reenvia o mesmo comprovante e conclui (consome só no sucesso)', async () => {
    const p = plugin();
    verify.fn
      .mockResolvedValueOnce({ ok: false, reason: 'network' })
      .mockResolvedValueOnce({ ok: false, reason: 'http-503' })
      .mockResolvedValueOnce(OK);
    const r = await comTempo(purchase('sku'));
    expect(r.ok).toBe(true);
    expect(verify.fn).toHaveBeenCalledTimes(3);
    expect(verify.fn.mock.calls.every(c => c[1] === 'tok-1')).toBe(true);
    expect(p.consume).toHaveBeenCalledTimes(1);
  });

  it('continua falhando → desiste depois do teto e NÃO consome nem reconhece', async () => {
    const p = plugin();
    verify.fn.mockResolvedValue({ ok: false, reason: 'network' });
    const r = await comTempo(purchase('sku'));
    expect(r).toEqual({ ok: false, reason: 'network' });
    expect(verify.fn.mock.calls.length).toBeLessThanOrEqual(3);
    expect(p.consume).not.toHaveBeenCalled();
    expect(p.acknowledge).not.toHaveBeenCalled();
  });

  it('recusa definitiva não reenvia', async () => {
    plugin();
    verify.fn.mockResolvedValue({ ok: false, reason: 'order-in-use' });
    const r = await comTempo(purchase('sku'));
    expect(r).toEqual({ ok: false, reason: 'order-in-use' });
    expect(verify.fn).toHaveBeenCalledTimes(1);
  });
});
