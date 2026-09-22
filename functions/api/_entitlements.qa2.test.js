/**
 * QA rodada 2 (22/09/2026) — dinheiro:
 *
 *   (6) `00-skeptic-r2` #3: `orderDetails.slice(-200)` podava o pedido PAGO
 *       vivo; `auditRefunds` derivava o tier de `paidProviderOf(ent)` e
 *       REBAIXAVA a conta paga para demo. Agora `podarOrderDetails` nunca
 *       descarta `grantTier === 'paid' && !voided`.
 *   (7) `04-dados-r2` §5/#10: `claimOrderAtomic` engolia QUALQUER erro do
 *       INSERT e respondia `order-in-use` acusando o comprador. Agora só a
 *       violação de chave é tratada; o resto sobe (500 honesto, retry).
 *       `closed:<season>` ganhou TTL de 400 d (#12).
 */
import { describe, it, expect, vi } from 'vitest';
import {
  applyVerifiedPurchase, podarOrderDetails, ORDER_HISTORY_MAX, claimOrder, ehViolacaoDeChave,
  auditRefunds, readEntitlement, AUDIT_INTERVAL_MS,
} from './_entitlements.js';
import { CLOSED_SEASON_TTL } from './community.js';

const ID = 'a'.repeat(32);

function fakeKV() {
  const store = new Map();
  const ttls = new Map();
  return {
    store, ttls,
    get: async k => store.get(k) ?? null,
    put: async (k, v, o) => { store.set(k, v); if (o?.expirationTtl) ttls.set(k, o.expirationTtl); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}

describe('(6) o pedido pago vivo nunca é podado', () => {
  it(`${ORDER_HISTORY_MAX} pedidos de crédito depois da compra do tier: o pedido paid continua e a auditoria NÃO rebaixa`, async () => {
    const env = { DIGIAPP_SAVES: fakeKV() };
    await applyVerifiedPurchase(env, ID, { orderId: 'PAID-1', grantTier: 'paid', grantCredits: 0, provider: 'play', productId: 'full' });
    for (let i = 0; i < ORDER_HISTORY_MAX + 5; i++) {
      await applyVerifiedPurchase(env, ID, { orderId: `CRED-${i}`, grantCredits: 10, provider: 'play', productId: 'credits' });
    }
    const ent = await readEntitlement(env, ID);
    expect(ent.orderDetails.length).toBe(ORDER_HISTORY_MAX);
    expect(ent.orderDetails.some(o => o.orderId === 'PAID-1'), 'o pedido pago vivo ficou').toBe(true);
    expect(ent.orderDetails[0].orderId, 'e ficou na posição cronológica').toBe('PAID-1');
    // A auditoria (nada reembolsado) mantém o tier — é o que rebaixava antes.
    const { ent: depois } = await auditRefunds(env, ID, async () => false, Date.now() + AUDIT_INTERVAL_MS + 1);
    expect(depois.tier).toBe('paid');
  });

  it('podarOrderDetails: pagos vivos ficam todos, `voided` e crédito saem pelos mais velhos', () => {
    const lista = [
      { orderId: 'p-void', grantTier: 'paid', voided: true },
      { orderId: 'p1', grantTier: 'paid' },
      ...Array.from({ length: 10 }, (_, i) => ({ orderId: `c${i}`, grantCredits: 1 })),
      { orderId: 'p2', grantTier: 'paid' },
    ];
    const podada = podarOrderDetails(lista, 5);
    expect(podada.map(o => o.orderId)).toEqual(['p1', 'c7', 'c8', 'c9', 'p2']);
    // Abaixo do teto devolve a mesma referência (sem custo).
    expect(podarOrderDetails(lista, 100)).toBe(lista);
  });
});

describe('(7) claimOrderAtomic só engole violação de chave', () => {
  function d1(comportamentoInsert) {
    const sqls = [];
    return {
      _sqls: sqls,
      prepare: (sql) => ({
        bind: (...args) => ({
          async run() {
            sqls.push(sql);
            if (/^INSERT/i.test(sql)) return comportamentoInsert(args);
            return { success: true };
          },
          async first() { sqls.push(sql); return null; },
        }),
      }),
    };
  }

  it('erro que NÃO é de chave (D1 caiu no meio) SOBE — não vira `order-in-use`', async () => {
    const env = { DIGIAPP_SAVES: fakeKV(), DB: d1(() => { throw new Error('D1_ERROR: network'); }) };
    await expect(claimOrder(env, ID, 'ORD-1')).rejects.toThrow(/D1_ERROR/);
    expect(env.DB._sqls.some(s => /^SELECT/i.test(s)), 'não consultou o dono').toBe(false);
  });

  it('violação de PRIMARY KEY continua sendo tratada: outro dono → order-in-use', async () => {
    const env = { DIGIAPP_SAVES: fakeKV(), DB: d1(() => { throw new Error('UNIQUE constraint failed: order_claims.order_id'); }) };
    // `first()` devolve null → dono desconhecido → recusa (comportamento anterior preservado).
    expect(await claimOrder(env, ID, 'ORD-1')).toEqual({ ok: false, reason: 'order-in-use' });
  });

  it('ehViolacaoDeChave reconhece as mensagens do SQLite/D1 e só elas', () => {
    expect(ehViolacaoDeChave(new Error('UNIQUE constraint failed: order_claims.order_id'))).toBe(true);
    expect(ehViolacaoDeChave(new Error('PRIMARY KEY must be unique'))).toBe(true);
    expect(ehViolacaoDeChave({ cause: { message: 'D1_ERROR: UNIQUE constraint failed' } })).toBe(true);
    expect(ehViolacaoDeChave(new Error('no such column: expires_at'))).toBe(false);
    expect(ehViolacaoDeChave(undefined)).toBe(false);
  });
});

describe('(#12) closed:<season> tem prazo', () => {
  it('o fechamento grava a marca com TTL de 400 d', async () => {
    const { onRequest } = await import('./community.js');
    const kv = fakeKV();
    const env = { DIGIAPP_SAVES: kv, SEASON_ADMIN_KEY: 'k' };
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const r = await onRequest({ request: new Request('https://x/api/community?action=closeSeason', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ season: '2026-08', adminKey: 'k' }) }), env });
    expect(r.status, await r.text()).toBe(200);
    expect(kv.ttls.get('closed:2026-08')).toBe(CLOSED_SEASON_TTL);
    expect(CLOSED_SEASON_TTL).toBe(86400 * 400);
  });
});
