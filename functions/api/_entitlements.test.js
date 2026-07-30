import { describe, it, expect, beforeEach } from 'vitest';
import {
  readEntitlement, spendCredits, grantAdReward, applyVerifiedPurchase,
  publicView, AD_DAILY_CAP, AD_REWARD_CREDITS,
} from './_entitlements.js';

// Estas regras são as que separam "jogador pagou" de "jogador não pagou".
// Se algum destes testes cair, alguém consegue ganhar benefício sem pagar.

/** KV falso em memória, com a mesma interface usada pelo código. */
function fakeEnv(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    DIGIAPP_SAVES: {
      get: async (k) => (store.has(k) ? store.get(k) : null),
      put: async (k, v) => { store.set(k, v); },
    },
    _store: store,
  };
}

const SAVE = 'abcdefgh1234';

describe('entitlements — saldo e gasto', () => {
  let env;
  beforeEach(() => { env = fakeEnv(); });

  it('conta nova começa em demo, sem créditos', async () => {
    const ent = await readEntitlement(env, SAVE);
    expect(ent.tier).toBe('demo');
    expect(ent.credits).toBe(0);
  });

  it('recusa gasto sem saldo suficiente', async () => {
    await applyVerifiedPurchase(env, SAVE, { orderId: 'o1', grantTier: null, grantCredits: 10 });
    expect(await spendCredits(env, SAVE, 11)).toBeNull();
    // saldo intacto após a recusa
    expect((await readEntitlement(env, SAVE)).credits).toBe(10);
  });

  it('debita exatamente o valor gasto', async () => {
    await applyVerifiedPurchase(env, SAVE, { orderId: 'o1', grantTier: null, grantCredits: 60 });
    const ent = await spendCredits(env, SAVE, 50);
    expect(ent.credits).toBe(10);
  });

  it('recusa valores inválidos (zero, negativo, fracionário)', async () => {
    await applyVerifiedPurchase(env, SAVE, { orderId: 'o1', grantTier: null, grantCredits: 100 });
    expect(await spendCredits(env, SAVE, 0)).toBeNull();
    expect(await spendCredits(env, SAVE, -50)).toBeNull();
    expect(await spendCredits(env, SAVE, 1.5)).toBeNull();
    expect((await readEntitlement(env, SAVE)).credits).toBe(100);
  });
});

describe('entitlements — compras verificadas', () => {
  let env;
  beforeEach(() => { env = fakeEnv(); });

  it('desbloqueio completo promove a conta para paid', async () => {
    const { ent } = await applyVerifiedPurchase(env, SAVE, {
      orderId: 'order-1', grantTier: 'paid', grantCredits: 0,
    });
    expect(ent.tier).toBe('paid');
  });

  it('ignora o mesmo orderId reenviado (replay) sem creditar de novo', async () => {
    await applyVerifiedPurchase(env, SAVE, { orderId: 'order-1', grantTier: null, grantCredits: 60 });
    const second = await applyVerifiedPurchase(env, SAVE, { orderId: 'order-1', grantTier: null, grantCredits: 60 });
    expect(second.duplicate).toBe(true);
    expect(second.ent.credits).toBe(60);
  });

  it('orderIds diferentes acumulam normalmente', async () => {
    await applyVerifiedPurchase(env, SAVE, { orderId: 'a', grantTier: null, grantCredits: 60 });
    const { ent } = await applyVerifiedPurchase(env, SAVE, { orderId: 'b', grantTier: null, grantCredits: 150 });
    expect(ent.credits).toBe(210);
  });
});

describe('entitlements — anúncio recompensado', () => {
  let env;
  beforeEach(() => { env = fakeEnv(); });

  it('credita a recompensa e desconta do teto do dia', async () => {
    const ent = await grantAdReward(env, SAVE);
    expect(ent.credits).toBe(AD_REWARD_CREDITS);
    expect(publicView(ent).adsLeft).toBe(AD_DAILY_CAP - 1);
  });

  it('bloqueia depois do teto diário — não dá pra farmar', async () => {
    for (let i = 0; i < AD_DAILY_CAP; i++) {
      expect(await grantAdReward(env, SAVE)).not.toBeNull();
    }
    expect(await grantAdReward(env, SAVE)).toBeNull();
    const ent = await readEntitlement(env, SAVE);
    expect(ent.credits).toBe(AD_REWARD_CREDITS * AD_DAILY_CAP);
  });

  it('o teto reseta na virada do dia', async () => {
    for (let i = 0; i < AD_DAILY_CAP; i++) await grantAdReward(env, SAVE);
    // simula que o registro é de ontem
    const ent = await readEntitlement(env, SAVE);
    ent.adDate = '2000-01-01';
    await env.DIGIAPP_SAVES.put('ent:' + SAVE, JSON.stringify(ent));

    const after = await grantAdReward(env, SAVE);
    expect(after).not.toBeNull();
    expect(publicView(after).adsLeft).toBe(AD_DAILY_CAP - 1);
  });
});

describe('entitlements — visão pública', () => {
  it('não vaza o histórico de orderIds para o cliente', async () => {
    const env = fakeEnv();
    await applyVerifiedPurchase(env, SAVE, { orderId: 'secret-order', grantTier: 'paid', grantCredits: 60 });
    const view = publicView(await readEntitlement(env, SAVE));
    expect(view).toEqual({ tier: 'paid', credits: 60, adsLeft: AD_DAILY_CAP });
    expect(JSON.stringify(view)).not.toContain('secret-order');
  });
});
