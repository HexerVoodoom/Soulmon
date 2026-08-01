import { describe, it, expect, beforeEach } from 'vitest';
import {
  readEntitlement, spendCredits, grantAdReward, applyVerifiedPurchase,
  claimOrder, auditRefunds, publicView, AD_DAILY_CAP, AD_REWARD_CREDITS,
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

describe('comprovante de compra — uma compra, uma conta', () => {
  // Vale para as DUAS lojas: o desbloqueio da Play é não consumível (o
  // "restaurar compras" reenvia o mesmo orderId para sempre) e na Steam o
  // benefício vem da posse do app, que é permanente. Sem esta trava, uma
  // compra só viraria quantas contas pagas o jogador quisesse.
  const PLAY_ORDER = 'play:GPA.1234-5678-9012-34567';
  const STEAM_LICENSE = 'steam:own:480:7656119';

  it('o primeiro que resgata fica com o comprovante', async () => {
    const env = fakeEnv();
    expect(await claimOrder(env, SAVE, PLAY_ORDER)).toEqual({ ok: true });
  });

  it('resgatar de novo NA MESMA conta é permitido (restaurar compras)', async () => {
    const env = fakeEnv();
    await claimOrder(env, SAVE, PLAY_ORDER);
    expect(await claimOrder(env, SAVE, PLAY_ORDER)).toEqual({ ok: true });
  });

  it('Play: outra conta NÃO clona o desbloqueio pelo restaurar compras', async () => {
    const env = fakeEnv();
    await claimOrder(env, SAVE, PLAY_ORDER);
    expect(await claimOrder(env, 'outraconta99', PLAY_ORDER))
      .toEqual({ ok: false, reason: 'order-in-use' });
  });

  it('Steam: outra conta NÃO herda a licença do mesmo dono', async () => {
    const env = fakeEnv();
    await claimOrder(env, SAVE, STEAM_LICENSE);
    expect(await claimOrder(env, 'outraconta99', STEAM_LICENSE))
      .toEqual({ ok: false, reason: 'order-in-use' });
  });

  it('comprovantes diferentes não colidem entre si', async () => {
    const env = fakeEnv();
    await claimOrder(env, SAVE, PLAY_ORDER);
    expect(await claimOrder(env, 'outraconta99', STEAM_LICENSE)).toEqual({ ok: true });
  });

  it('consumedOrders sozinho NÃO protegeria — o registro global é o que trava', async () => {
    // Demonstra a causa raiz: a lista por conta acha que a compra é inédita.
    const env = fakeEnv();
    // Fluxo real da rota: reivindica e só então aplica.
    await claimOrder(env, SAVE, PLAY_ORDER);
    await applyVerifiedPurchase(env, SAVE, { orderId: PLAY_ORDER, grantTier: 'paid', grantCredits: 0 });
    const outra = await applyVerifiedPurchase(env, 'outraconta99', {
      orderId: PLAY_ORDER, grantTier: 'paid', grantCredits: 0,
    });
    expect(outra.duplicate).toBe(false);   // <- o furo, se nada mais existisse
    expect(await claimOrder(env, 'outraconta99', PLAY_ORDER))
      .toEqual({ ok: false, reason: 'order-in-use' });  // <- a trava que a rota aplica antes
  });
});

describe('reembolso — desfaz o que a loja estornou', () => {
  const PLAY_ORDER = 'play:GPA.1111';
  const DIA = 24 * 60 * 60 * 1000;

  /** Conta com uma compra aplicada, pronta para ser auditada. */
  async function comCompra(grant) {
    const env = fakeEnv();
    await claimOrder(env, SAVE, PLAY_ORDER);
    await applyVerifiedPurchase(env, SAVE, {
      orderId: PLAY_ORDER, provider: 'play',
      productId: 'soulmon.unlock.full', purchaseToken: 'tok',
      ...grant,
    });
    return env;
  }

  it('compra estornada derruba o tier de volta para demo', async () => {
    const env = await comCompra({ grantTier: 'paid', grantCredits: 0 });
    const { ent, revoked } = await auditRefunds(env, SAVE, async () => true);
    expect(ent.tier).toBe('demo');
    expect(revoked).toEqual([PLAY_ORDER]);
  });

  it('pacote de créditos estornado é debitado', async () => {
    const env = await comCompra({ grantTier: null, grantCredits: 150 });
    const { ent } = await auditRefunds(env, SAVE, async () => true);
    expect(ent.credits).toBe(0);
  });

  it('saldo nunca fica negativo se o jogador já gastou', async () => {
    const env = await comCompra({ grantTier: null, grantCredits: 150 });
    await spendCredits(env, SAVE, 120);
    const { ent } = await auditRefunds(env, SAVE, async () => true);
    expect(ent.credits).toBe(0);
  });

  it('compra válida não é mexida', async () => {
    const env = await comCompra({ grantTier: 'paid', grantCredits: 0 });
    const { ent, revoked } = await auditRefunds(env, SAVE, async () => false);
    expect(ent.tier).toBe('paid');
    expect(revoked).toEqual([]);
  });

  it('loja fora do ar NÃO tira o benefício de quem pagou', async () => {
    // Na dúvida, mantém. O contrário puniria o cliente legítimo por uma falha
    // de rede nossa.
    const env = await comCompra({ grantTier: 'paid', grantCredits: 0 });
    expect((await auditRefunds(env, SAVE, async () => null)).ent.tier).toBe('paid');
    expect((await auditRefunds(env, SAVE, async () => { throw new Error('timeout'); })).ent.tier).toBe('paid');
  });

  it('não confere de novo antes de 24h', async () => {
    const env = await comCompra({ grantTier: 'paid', grantCredits: 0 });
    const t0 = Date.now();
    await auditRefunds(env, SAVE, async () => false, t0);

    let chamadas = 0;
    await auditRefunds(env, SAVE, async () => { chamadas++; return true; }, t0 + DIA / 2);
    expect(chamadas).toBe(0);

    await auditRefunds(env, SAVE, async () => { chamadas++; return true; }, t0 + DIA + 1);
    expect(chamadas).toBe(1);
  });

  it('não estorna a mesma compra duas vezes', async () => {
    const env = await comCompra({ grantTier: null, grantCredits: 150 });
    const t0 = Date.now();
    await auditRefunds(env, SAVE, async () => true, t0);
    // Créditos voltam por outra compra; a antiga já estornada não pode debitar de novo.
    await claimOrder(env, SAVE, 'play:GPA.2222');
    await applyVerifiedPurchase(env, SAVE, {
      orderId: 'play:GPA.2222', provider: 'play', productId: 'soulmon.credits.60',
      purchaseToken: 't2', grantTier: null, grantCredits: 60,
    });
    const { ent, revoked } = await auditRefunds(env, SAVE, async () => false, t0 + DIA + 1);
    expect(revoked).toEqual([]);
    expect(ent.credits).toBe(60);
  });

  it('conta sem compras não grava nada no KV', async () => {
    // Senão toda leitura de saldo criaria um registro só pra anotar a data.
    const env = fakeEnv();
    await auditRefunds(env, SAVE, async () => true);
    expect(env._store.size).toBe(0);
  });
});
