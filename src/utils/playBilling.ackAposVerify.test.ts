/**
 * QA rodada 2 (01-seguranca §8): o RECONHECIMENTO da compra na Play só depois
 * de `/api/billing?action=verify` responder ok.
 *
 * Antes o `BillingPlugin.kt` reconhecia (`acknowledgeIfNeeded`) no próprio
 * callback da compra, ANTES de o JS mandar o comprovante ao servidor. Isso
 * fechava a janela de estorno automático de 3 dias — a rede de segurança para
 * um comprovante que o servidor RECUSA (fraude, `order-in-use`, 5xx). Hoje:
 * o Kotlin só devolve o token; o JS chama `acknowledge` (não consumível) ou
 * `consume` (consumível; consumir já reconhece) depois do verify ok.
 *
 * Dois lados: comportamental no JS (plugin falso) e textual no Kotlin (nenhum
 * teste em `node` alcança a JVM — mesmo padrão do `widgetSemCobranca`).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Verificado = { ok: true; ent: { tier: string; credits: number; adsLeft: number }; consumeToken?: string } | { ok: false; reason: string };
const { verify } = vi.hoisted(() => ({
  verify: { fn: vi.fn<(productId: string, purchaseToken: string) => Promise<Verificado>>() },
}));
vi.mock('./entitlements', () => ({ verifyPurchase: (p: string, t: string) => verify.fn(p, t) }));

import { purchase, restorePurchases } from './playBilling';

type Falso = {
  purchase: ReturnType<typeof vi.fn>;
  consume: ReturnType<typeof vi.fn>;
  acknowledge: ReturnType<typeof vi.fn> | undefined;
  getPurchases: ReturnType<typeof vi.fn>;
};
function plugin(extra: Partial<Falso> = {}) {
  const ordem: string[] = [];
  const p: Falso = {
    purchase: vi.fn(async () => { ordem.push('purchase'); return { purchaseToken: 'tok-1' }; }),
    consume: vi.fn(async () => { ordem.push('consume'); }),
    acknowledge: vi.fn(async () => { ordem.push('acknowledge'); }),
    getPurchases: vi.fn(async () => ({ purchases: [{ productId: 'sku', purchaseToken: 'tok-r' }] })),
    ...extra,
  };
  vi.stubGlobal('Capacitor', { isNativePlatform: () => true, Plugins: { Billing: p } });
  return { p, ordem };
}

beforeEach(() => {
  verify.fn.mockReset();
  verify.fn.mockImplementation(async () => ({ ok: true, ent: { tier: 'paid', credits: 0, adsLeft: 0 } }));
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('purchase(): reconhecer só depois do verify ok', () => {
  it('verify ok + não consumível → `acknowledge` DEPOIS do verify, com o token da compra', async () => {
    const { p, ordem } = plugin();
    verify.fn.mockImplementation(async () => { ordem.push('verify'); return { ok: true, ent: { tier: 'paid', credits: 0, adsLeft: 0 } }; });
    const r = await purchase('sku');
    expect(r.ok).toBe(true);
    expect(ordem).toEqual(['purchase', 'verify', 'acknowledge']);
    expect(p.acknowledge!).toHaveBeenCalledWith({ purchaseToken: 'tok-1' });
    expect(p.consume).not.toHaveBeenCalled();
  });

  it('verify ok + consumível (`consumeToken`) → `consume`, e NÃO `acknowledge` (consumir já reconhece)', async () => {
    const { p } = plugin();
    verify.fn.mockImplementation(async () => ({ ok: true, ent: { tier: 'paid', credits: 50, adsLeft: 0 }, consumeToken: 'tok-1' }));
    await purchase('sku');
    expect(p.consume).toHaveBeenCalledWith({ purchaseToken: 'tok-1' });
    expect(p.acknowledge!).not.toHaveBeenCalled();
  });

  it('verify RECUSA → nem acknowledge nem consume: a Play estorna sozinha em 3 dias', async () => {
    const { p } = plugin();
    verify.fn.mockImplementation(async () => ({ ok: false, reason: 'order-in-use' }));
    const r = await purchase('sku');
    expect(r).toEqual({ ok: false, reason: 'order-in-use' });
    expect(p.acknowledge!).not.toHaveBeenCalled();
    expect(p.consume).not.toHaveBeenCalled();
  });

  it('plugin antigo sem `acknowledge` → compra continua ok (o servidor já concedeu)', async () => {
    plugin({ acknowledge: undefined });
    const r = await purchase('sku');
    expect(r.ok).toBe(true);
  });

  it('`acknowledge` que lança não desfaz a compra (benefício já concedido)', async () => {
    plugin({ acknowledge: vi.fn(async () => { throw new Error('billing-unavailable'); }) });
    const r = await purchase('sku');
    expect(r.ok).toBe(true);
  });
});

describe('restorePurchases(): idem, compra a compra', () => {
  it('cada compra verificada ok é reconhecida; a recusada, não', async () => {
    const { p } = plugin({
      getPurchases: vi.fn(async () => ({ purchases: [
        { productId: 'sku', purchaseToken: 'ok-1' },
        { productId: 'sku', purchaseToken: 'ruim-2' },
      ] })),
    });
    verify.fn.mockImplementation(async (_p, tok) => tok === 'ok-1'
      ? { ok: true, ent: { tier: 'paid', credits: 0, adsLeft: 0 } }
      : { ok: false, reason: 'order-in-use' });
    const r = await restorePurchases();
    expect(r.ok).toBe(true);
    expect(p.acknowledge!.mock.calls).toEqual([[{ purchaseToken: 'ok-1' }]]);
  });
});

describe('BillingPlugin.kt: o Kotlin NÃO reconhece antes do verify (guard textual)', () => {
  const kt = readFileSync(resolve(__dirname, '../../android/app/src/main/java/com/hexervoodoom/soulmon/plugins/BillingPlugin.kt'), 'utf8');

  it('o callback da compra (`purchasesUpdatedListener`) só devolve o token — sem `acknowledgeIfNeeded`', () => {
    const listener = kt.slice(kt.indexOf('purchasesUpdatedListener = PurchasesUpdatedListener'), kt.indexOf('override fun load()'));
    expect(listener.length).toBeGreaterThan(200);
    expect(listener).not.toMatch(/acknowledgeIfNeeded\(/);
    expect(listener).toMatch(/call\.resolve\(JSObject\(\)\.put\("purchaseToken"/);
  });

  it('`getPurchases` (restore) também não reconhece', () => {
    const getP = kt.slice(kt.indexOf('fun getPurchases('), kt.indexOf('override fun handleOnDestroy'));
    expect(getP.length).toBeGreaterThan(100);
    expect(getP).not.toMatch(/acknowledgeIfNeeded\(/);
  });

  it('existe o método `acknowledge` exposto ao JS, e ele confere que a compra é da conta (`purchaseToken == token`)', () => {
    expect(kt).toMatch(/@PluginMethod\s+fun acknowledge\(call: PluginCall\)/);
    const ack = kt.slice(kt.indexOf('fun acknowledge(call'), kt.indexOf('fun purchase(call'));
    expect(ack).toMatch(/queryPurchasesAsync/);
    expect(ack).toMatch(/it\.purchaseToken == token/);
    expect(ack).toMatch(/acknowledgeIfNeeded\(purchase\)/);
  });
});
