// ---------------------------------------------------------------------------
// QA rodada 1 (21/09/2026, noite) — guarda do SUSTENTO.
//
// BUG CONFIRMADO (o skeptic o fixou como "OBSERVADO" em
// `entitlements.grant.qa.test.js`; aqui ele REPROVA, porque a invariante que
// ele quebra não depende da decisão do dono):
//
//   `auditRefunds` faz `if (order.grantTier === 'paid') ent.tier = 'demo'` por
//   pedido desfeito, sem olhar se OUTRO pedido pago ainda vale. Enquanto só
//   existia UM pedido pago por conta (a compra da Play/Steam), isso era
//   inalcançável. A cortesia (`grantCourtesy`, decisão #12) criou o segundo
//   pedido pago — e, com ele, o estado em que `ent.tier === 'demo'` enquanto
//   `paidProviderOf(ent) === 'courtesy'`: o próprio arquivo devolve duas
//   respostas diferentes para "esta conta é paga?".
//
// A INVARIANTE que este teste trava: `ent.tier === 'paid'` SE E SOMENTE SE
// existe pedido pago não desfeito (`paidProviderOf(ent) !== null`). Ela vale
// qualquer que seja a decisão do dono sobre "cortesia sobrevive a reembolso?":
//   - se SIM, o conserto é `ent.tier = paidProviderOf(ent) ? 'paid' : 'demo'`
//     no fim do laço de `auditRefunds`;
//   - se NÃO, o conserto é marcar TAMBÉM o pedido de cortesia como `voided`
//     (e aí `paidProviderOf` volta `null` e o tier cai com razão).
// O que não pode é o tier discordar do histórico que o justifica.
//
// NÃO corrige código de produção — só reprova.
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest';
import {
  readEntitlement, applyVerifiedPurchase, claimOrder, auditRefunds,
  grantCourtesy, paidProviderOf, publicView,
} from './_entitlements.js';

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
const PLAY_ORDER = 'play:GPA.9999';

async function compraPlay(env) {
  await claimOrder(env, SAVE, PLAY_ORDER);
  await applyVerifiedPurchase(env, SAVE, {
    orderId: PLAY_ORDER, provider: 'play', productId: 'soulmon.unlock.full',
    purchaseToken: 'tok', grantTier: 'paid', grantCredits: 0,
  });
}

/** A loja diz "reembolsado" só para a compra da Play; cortesia não tem loja. */
const soPlayReembolsada = async (order) => (order.provider === 'play' ? true : false);

describe('sustento — o tier é DERIVADO dos pedidos pagos não desfeitos (invariante)', () => {
  it('Play comprada, depois cortesia, depois Play reembolsada: a cortesia ainda vale, o tier não pode cair', async () => {
    const env = fakeEnv();
    await compraPlay(env);
    const g = await grantCourtesy(env, SAVE, 5);
    expect(g.ok).toBe(true);

    const { ent, revoked } = await auditRefunds(env, SAVE, soPlayReembolsada, Date.now());

    expect(revoked).toEqual([PLAY_ORDER]);
    // O histórico diz que há um pedido pago em pé…
    expect(paidProviderOf(ent)).toBe('courtesy');
    // …então o tier tem de dizer o mesmo. Hoje diz 'demo' — REPROVA.
    expect(ent.tier, 'tier discorda de paidProviderOf: a conta fica demo com cortesia válida').toBe('paid');
    expect(publicView(ent).tier).toBe('paid');
  });

  it('cortesia primeiro, Play depois, Play reembolsada: mesma coisa na ordem inversa', async () => {
    const env = fakeEnv();
    await grantCourtesy(env, SAVE, 5);
    await compraPlay(env);

    const { ent } = await auditRefunds(env, SAVE, soPlayReembolsada, Date.now());

    expect(paidProviderOf(ent)).toBe('courtesy');
    expect(ent.tier).toBe('paid');
  });

  it('o que já foi gravado no KV é o que o próximo GET lê — o rebaixamento persiste', async () => {
    const env = fakeEnv();
    await compraPlay(env);
    await grantCourtesy(env, SAVE, 5);
    await auditRefunds(env, SAVE, soPlayReembolsada, Date.now());

    const relido = await readEntitlement(env, SAVE);
    expect(paidProviderOf(relido)).toBe('courtesy');
    expect(relido.tier).toBe('paid');
  });

  it('CONTROLE (passa hoje): sem segundo pedido pago, reembolso derruba para demo — e a invariante concorda', async () => {
    const env = fakeEnv();
    await compraPlay(env);
    const { ent } = await auditRefunds(env, SAVE, soPlayReembolsada, Date.now());
    expect(paidProviderOf(ent)).toBeNull();
    expect(ent.tier).toBe('demo');
  });
});
