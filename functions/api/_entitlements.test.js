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

  it('gastar 1 crédito é um gasto VÁLIDO (troca por Bits)', async () => {
    // O guard é `amount <= 0`. Trocá-lo por `<= 1` recusava exatamente o gasto
    // de 1 crédito — que é o caminho real do BITS_EXCHANGE (1 Crédito = 10
    // Bits, CLAUDE.md) — e nenhum teste percebia, porque todos gastavam 50+.
    await applyVerifiedPurchase(env, SAVE, { orderId: 'o1', grantTier: null, grantCredits: 10 });
    const ent = await spendCredits(env, SAVE, 1);
    expect(ent).not.toBeNull();
    expect(ent.credits).toBe(9);
  });

  it('gastar exatamente o saldo inteiro é permitido e zera a conta', async () => {
    // Fronteira do `ent.credits < amount`.
    await applyVerifiedPurchase(env, SAVE, { orderId: 'o1', grantTier: null, grantCredits: 10 });
    const ent = await spendCredits(env, SAVE, 10);
    expect(ent).not.toBeNull();
    expect(ent.credits).toBe(0);
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

  it('uma compra de 1 crédito TAMBÉM credita', async () => {
    // O guard é `if (grantCredits > 0)`. Trocar o `0` por `1` engolia em
    // silêncio a menor compra possível: o jogador paga e não recebe nada.
    const { ent } = await applyVerifiedPurchase(env, SAVE, {
      orderId: 'menor', grantTier: null, grantCredits: 1,
    });
    expect(ent.credits).toBe(1);
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

  // Os NÚMEROS da recompensa são crus de propósito. Estas duas afirmações já
  // foram `toBe(AD_REWARD_CREDITS)` e `toBe(AD_REWARD_CREDITS * AD_DAILY_CAP)`
  // — expectativa derivada da própria constante auditada, que é a doença dos
  // guards cegos das rodadas anteriores. Medido na rodada 7: zerar
  // `AD_REWARD_CREDITS` deixava os 829 testes verdes, num número que é DINHEIRO
  // (é o que o jogador recebe por assistir anúncio, e espelha
  // `utils/monetization.ts`).
  it('a recompensa por anúncio vale 5 créditos, e o teto é 3 por dia', () => {
    expect(AD_REWARD_CREDITS).toBe(5);
    expect(AD_DAILY_CAP).toBe(3);
  });

  it('credita a recompensa e desconta do teto do dia', async () => {
    const ent = await grantAdReward(env, SAVE);
    expect(ent.credits).toBe(5);
    expect(publicView(ent).adsLeft).toBe(2);
  });

  it('bloqueia depois do teto diário — não dá pra farmar', async () => {
    for (let i = 0; i < AD_DAILY_CAP; i++) {
      expect(await grantAdReward(env, SAVE)).not.toBeNull();
    }
    expect(await grantAdReward(env, SAVE)).toBeNull();
    const ent = await readEntitlement(env, SAVE);
    expect(ent.credits).toBe(15); // 5 × 3, cru: ver o comentário acima
    expect(publicView(ent).adsLeft).toBe(0);
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
    // A segunda conferência responde `true` PARA A COMPRA ANTIGA de novo — é
    // exatamente isso que a loja faz, já que o estorno é permanente. Quem
    // impede o débito duplo é a marca `order.voided = true` gravada na
    // primeira rodada (o `pending` filtra por `!o.voided`).
    //
    // Antes esta segunda chamada respondia `false` para tudo, então ela não
    // exercia a marca coisa nenhuma: a rodada 7 trocou `order.voided = true`
    // por `false` e a suíte inteira continuou verde — com o mutante vivo, esta
    // conta perderia 150 créditos a cada leitura de saldo, para sempre.
    const { ent, revoked } = await auditRefunds(
      env, SAVE, async (o) => o.orderId === PLAY_ORDER, t0 + DIA + 1,
    );
    expect(revoked).toEqual([]);
    expect(ent.credits).toBe(60);
  });

  it('confere no máximo 20 compras por rodada (quota da loja)', async () => {
    // `AUDIT_MAX_ORDERS = 20` com `.slice(-20)`. Zerar a constante vira
    // `.slice(-0)`, que em JS é a lista INTEIRA — o teto silenciosamente deixa
    // de existir e uma conta com histórico longo dispara uma consulta à loja
    // por compra, a cada 24h.
    const env = fakeEnv();
    for (let i = 0; i < 25; i++) {
      const id = `play:GPA.bulk${i}`;
      await claimOrder(env, SAVE, id);
      await applyVerifiedPurchase(env, SAVE, {
        orderId: id, provider: 'play', productId: 'soulmon.credits.60',
        purchaseToken: `tok${i}`, grantTier: null, grantCredits: 60,
      });
    }
    let consultas = 0;
    await auditRefunds(env, SAVE, async () => { consultas++; return false; });
    expect(consultas).toBe(20);
  });

  it('conta sem compras não grava nada no KV', async () => {
    // Senão toda leitura de saldo criaria um registro só pra anotar a data.
    const env = fakeEnv();
    await auditRefunds(env, SAVE, async () => true);
    expect(env._store.size).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// A atomicidade do resgate.
//
// O `fakeEnv` acima usa um Map, que é FORTEMENTE consistente — e por isso dava
// falsa segurança: nenhum teste conseguia reproduzir o modo de falha real do
// Workers KV, que é eventualmente consistente com janela de até ~60s e cache de
// borda inclusive para chave inexistente.
// ─────────────────────────────────────────────────────────────────────────────

/** KV que NUNCA enxerga a própria escrita — o pior caso real, e não um exagero:
 *  é o que um colo que ainda não recebeu a propagação devolve. */
function fakeEnvStaleKV() {
  const store = new Map();
  return {
    DIGIAPP_SAVES: {
      get: async () => null,               // leitura obsoleta
      put: async (k, v) => { store.set(k, v); },
    },
    _store: store,
  };
}

/**
 * D1 falso com a restrição que importa: order_id é PRIMARY KEY.
 *
 * Fala também o SQL de RETENÇÃO (`DELETE` do que venceu, `UPDATE` que renova o
 * prazo), porque `claimOrderAtomic` emite os três. O que este bloco afere,
 * porém, continua sendo só a ATOMICIDADE — o prazo tem arquivo próprio,
 * `_entitlements.d1Retencao.test.js`.
 */
function fakeEnvD1() {
  const rows = new Map();
  const db = {
    prepare: (sql) => ({
      bind: (...args) => ({
        async run() {
          if (/^INSERT/i.test(sql)) {
            const [orderId, saveId, at, expiresAt] = args;
            if (rows.has(orderId)) throw new Error('UNIQUE constraint failed');
            rows.set(orderId, { save_id: saveId, claimed_at: at, expires_at: expiresAt ?? null });
            return { success: true };
          }
          if (/^DELETE/i.test(sql)) {
            const [orderId, agora] = args;
            const row = rows.get(orderId);
            if (row && row.expires_at !== null && row.expires_at <= agora) rows.delete(orderId);
            return { success: true };
          }
          if (/^UPDATE/i.test(sql)) {
            const [expiresAt, orderId] = args;
            const row = rows.get(orderId);
            if (row) row.expires_at = expiresAt;
            return { success: true };
          }
          throw new Error('sql inesperado: ' + sql);
        },
        async first() {
          return rows.get(args[0]) ?? null;
        },
      }),
    }),
  };
  return { DIGIAPP_SAVES: { get: async () => null, put: async () => {} }, DB: db, _rows: rows };
}

describe('resgate de comprovante — atomicidade', () => {
  const ORDER = 'play:GPA.0000-1111-2222-33333';

  it('SEM D1, o KV não segura a corrida — limitação conhecida e assumida', async () => {
    // Este teste documenta a fraqueza em vez de fingir que ela não existe: com
    // leitura obsoleta, duas contas diferentes conseguem reivindicar o mesmo
    // recibo. É por isso que a defesa real é o vínculo do recibo com a conta na
    // origem (obfuscatedExternalAccountId na Play, ticket na Steam).
    const env = fakeEnvStaleKV();
    expect(await claimOrder(env, 'contaA12345', ORDER)).toEqual({ ok: true });
    expect(await claimOrder(env, 'contaB12345', ORDER)).toEqual({ ok: true });
  });

  it('COM D1, a corrida é resolvida pelo banco: só um vencedor', async () => {
    const env = fakeEnvD1();
    expect(await claimOrder(env, 'contaA12345', ORDER)).toEqual({ ok: true });
    expect(await claimOrder(env, 'contaB12345', ORDER))
      .toEqual({ ok: false, reason: 'order-in-use' });
  });

  it('COM D1, reprocessar na MESMA conta continua valendo (restaurar compras)', async () => {
    const env = fakeEnvD1();
    await claimOrder(env, 'contaA12345', ORDER);
    expect(await claimOrder(env, 'contaA12345', ORDER)).toEqual({ ok: true });
  });

  it('COM D1, dez tentativas simultâneas produzem exatamente um dono', async () => {
    const env = fakeEnvD1();
    const contas = Array.from({ length: 10 }, (_, i) => `conta${i}12345`);
    const res = await Promise.all(contas.map(c => claimOrder(env, c, ORDER)));
    expect(res.filter(r => r.ok)).toHaveLength(1);
    expect(env._rows.size).toBe(1);
  });
});

describe('WP5.3 — gastar créditos é IDEMPOTENTE por gesto', () => {
  // Créditos são comprados com DINHEIRO REAL. Até aqui a única proteção
  // contra o débito duplo era uma guarda de CLIENTE (`healInFlightRef`), e
  // guarda de cliente não protege dinheiro: o cliente é editável e a rede
  // repete sozinha.
  const SAVE = 'a'.repeat(32);

  function envComCreditos(creditos) {
    const store = new Map();
    store.set(`ent:${SAVE}`, JSON.stringify({ tier: 'paid', credits: creditos }));
    return {
      DIGIAPP_SAVES: {
        store,
        get: async k => store.get(k) ?? null,
        put: async (k, v) => { store.set(k, v); },
        delete: async k => { store.delete(k); },
      },
    };
  }

  const saldo = env => JSON.parse(env.DIGIAPP_SAVES.store.get(`ent:${SAVE}`)).credits;

  it('o MESMO gesto repetido debita UMA vez', async () => {
    const env = envComCreditos(100);
    const um = await spendCredits(env, SAVE, 50, 'gesto-abc123');
    const dois = await spendCredits(env, SAVE, 50, 'gesto-abc123');
    expect(um.credits).toBe(50);
    // A repetição devolve o MESMO resultado — para quem chamou duas vezes o
    // correto é "sua compra foi feita", não "falhou".
    expect(dois.credits).toBe(50);
    expect(saldo(env)).toBe(50);
  });

  it('gestos DIFERENTES debitam cada um', async () => {
    const env = envComCreditos(100);
    await spendCredits(env, SAVE, 50, 'gesto-aaa11111');
    await spendCredits(env, SAVE, 50, 'gesto-bbb22222');
    expect(saldo(env)).toBe(0);
  });

  it('sem `opId` (cliente antigo) o comportamento é o de antes', async () => {
    // Nunca uma recusa por causa de um campo que o APK instalado não manda.
    const env = envComCreditos(100);
    await spendCredits(env, SAVE, 50);
    await spendCredits(env, SAVE, 50);
    expect(saldo(env)).toBe(0);
  });

  it('`opId` malformado não vira chave — e não cobra duas vezes por engano', async () => {
    const env = envComCreditos(100);
    await spendCredits(env, SAVE, 50, 'x');
    expect(saldo(env)).toBe(50);
  });

  it('sem saldo, recusa — e a recusa NÃO é memorizada como sucesso', async () => {
    const env = envComCreditos(10);
    expect(await spendCredits(env, SAVE, 50, 'gesto-ccc33333')).toBeNull();
    expect(saldo(env)).toBe(10);
    // Depois de recarregar, o mesmo gesto pode acontecer de verdade.
    env.DIGIAPP_SAVES.store.set(`ent:${SAVE}`, JSON.stringify({ tier: 'paid', credits: 100 }));
    const agora = await spendCredits(env, SAVE, 50, 'gesto-ccc33333');
    expect(agora?.credits).toBe(50);
  });

  it('a marca do gesto expira — não vira lista infinita', async () => {
    const env = envComCreditos(100);
    let ttl = null;
    env.DIGIAPP_SAVES.put = async (k, v, opts) => {
      if (k.startsWith('spend:')) ttl = opts?.expirationTtl ?? null;
      env.DIGIAPP_SAVES.store.set(k, v);
    };
    await spendCredits(env, SAVE, 10, 'gesto-ddd44444');
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(48 * 60 * 60);
  });
});
