/**
 * TESTE DE CONTRATO da rota de CRÉDITOS — `functions/api/entitlements.js`.
 *
 * Cobertura antes desta rodada: **0%**. É a rota por onde o cliente lê o saldo
 * e GASTA crédito comprado com dinheiro real. `_entitlements.test.js` cobre
 * `spendCredits`/`grantAdReward` como funções; ninguém nunca exercitou o
 * handler HTTP que decide quem pode chamá-las, com que corpo e com que status.
 *
 * Como em `billing.test.js`, o handler é o REAL — só o KV é de mentira.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { onRequestGet, onRequestPost, onRequestOptions } from './entitlements.js';
import { ENT_PREFIX, AD_REWARD_CREDITS, AD_DAILY_CAP } from './_entitlements.js';

const ID = 'a'.repeat(32);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
  };
}

const hoje = () => new Date().toISOString().slice(0, 10);

const env = (entitlement, extra = {}) => ({
  DIGIAPP_SAVES: fakeKV(entitlement ? { [ENT_PREFIX + ID]: JSON.stringify(entitlement) } : {}),
  ...extra,
});

const post = (url, body) => new Request(url, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

const saldo = e => JSON.parse(e.DIGIAPP_SAVES.store.get(ENT_PREFIX + ID)).credits;

afterEach(() => { vi.unstubAllGlobals(); });

describe('entitlements.js — leitura', () => {
  it('conta nova lê demo/0 crédito sem gravar nada no KV', async () => {
    const e = env();
    const res = await onRequestGet({ request: new Request(`https://x/api/entitlements?id=${ID}`), env: e });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ tier: 'demo', credits: 0, adsLeft: AD_DAILY_CAP, adsEnabled: false });
    expect(e.DIGIAPP_SAVES.store.size).toBe(0);
  });

  it('devolve o que está no KV, não o que o cliente acha', async () => {
    const e = env({ tier: 'paid', credits: 42, adDate: hoje(), adCount: 1 });
    const body = await (await onRequestGet({ request: new Request(`https://x/api/entitlements?id=${ID}`), env: e })).json();
    expect(body).toMatchObject({ tier: 'paid', credits: 42, adsLeft: AD_DAILY_CAP - 1 });
  });

  it('NÃO vaza o histórico interno de compras para o cliente', async () => {
    const e = env({
      tier: 'paid', credits: 5,
      consumedOrders: ['play:GPA.1'], orderDetails: [{ orderId: 'play:GPA.1', purchaseToken: 'SEGREDO' }],
    });
    const body = await (await onRequestGet({ request: new Request(`https://x/api/entitlements?id=${ID}`), env: e })).json();
    expect(JSON.stringify(body)).not.toContain('SEGREDO');
    expect(body.consumedOrders).toBeUndefined();
    expect(body.orderDetails).toBeUndefined();
  });

  it('id inválido é 400 e não toca o KV', async () => {
    for (const id of ['', 'curto', 'a'.repeat(65), '../../ent:' + ID]) {
      const e = env();
      const res = await onRequestGet({ request: new Request(`https://x/api/entitlements?id=${encodeURIComponent(id)}`), env: e });
      expect(res.status).toBe(400);
      expect(e.DIGIAPP_SAVES.store.size).toBe(0);
    }
  });

  it('sem KV ligado é 500, não 200 com saldo fantasma', async () => {
    const res = await onRequestGet({ request: new Request(`https://x/api/entitlements?id=${ID}`), env: {} });
    expect(res.status).toBe(500);
  });

  it('entitlement corrompido no KV degrada para conta zerada, não explode', async () => {
    const e = { DIGIAPP_SAVES: fakeKV({ [ENT_PREFIX + ID]: '{isto não é json' }) };
    const res = await onRequestGet({ request: new Request(`https://x/api/entitlements?id=${ID}`), env: e });
    expect(res.status).toBe(200);
    expect((await res.json()).credits).toBe(0);
  });
});

describe('entitlements.js — gastar crédito (dinheiro real)', () => {
  it('gasto válido debita NO KV e devolve o saldo novo', async () => {
    const e = env({ tier: 'paid', credits: 60, adDate: hoje(), adCount: 0 });
    const res = await onRequestPost({
      request: post('https://x/api/entitlements?action=spend', { id: ID, amount: 50, reason: 'reroll' }),
      env: e,
    });
    expect(res.status).toBe(200);
    expect((await res.json()).credits).toBe(10);
    expect(saldo(e)).toBe(10);
  });

  it('saldo insuficiente é 402 e NÃO debita nada', async () => {
    const e = env({ tier: 'demo', credits: 3, adDate: hoje(), adCount: 0 });
    const res = await onRequestPost({
      request: post('https://x/api/entitlements?action=spend', { id: ID, amount: 50 }),
      env: e,
    });
    expect(res.status).toBe(402);
    expect((await res.json()).reason).toBe('insufficient');
    expect(saldo(e)).toBe(3);
  });

  // A entrada é do cliente. Cada um destes, aceito, é crédito criado do nada.
  const valoresRuins = [
    ['negativo (crédito de graça)', -100],
    ['zero', 0],
    ['fracionário', 1.5],
    ['NaN', 'abc'],
    ['Infinity', 1e999],
    ['objeto', { toString: () => '10' }],
    ['ausente', undefined],
    ['null', null],
  ];
  for (const [nome, amount] of valoresRuins) {
    it(`amount ${nome} é recusado sem alterar o saldo`, async () => {
      const e = env({ tier: 'paid', credits: 60, adDate: hoje(), adCount: 0 });
      const res = await onRequestPost({
        request: post('https://x/api/entitlements?action=spend', { id: ID, amount }),
        env: e,
      });
      expect(res.status).toBe(402);
      expect(saldo(e)).toBe(60);
    });
  }

  it('OBSERVADO, não bug: `amount` string numérica é coagido por `Number()` e aceito', async () => {
    // `entitlements.js:84` faz `Number(body?.amount)`. `'10'` vira 10 e o gasto
    // acontece. Não é furo — quem gasta gasta o PRÓPRIO saldo, e todo valor que
    // não vira inteiro positivo (`'abc'`, `null`, `1e999`, `-1`, `1.5`) é
    // recusado pelos casos acima. Fica travado para que a coerção seja uma
    // decisão registrada e não uma surpresa em cima do dinheiro.
    const e = env({ tier: 'paid', credits: 60, adDate: hoje(), adCount: 0 });
    const res = await onRequestPost({
      request: post('https://x/api/entitlements?action=spend', { id: ID, amount: '10' }), env: e,
    });
    expect(res.status).toBe(200);
    expect(saldo(e)).toBe(50);
  });

  it('gastar exatamente o saldo zera, e o próximo gasto já é recusado', async () => {
    const e = env({ tier: 'paid', credits: 10, adDate: hoje(), adCount: 0 });
    const url = 'https://x/api/entitlements?action=spend';
    expect((await onRequestPost({ request: post(url, { id: ID, amount: 10 }), env: e })).status).toBe(200);
    expect(saldo(e)).toBe(0);
    expect((await onRequestPost({ request: post(url, { id: ID, amount: 1 }), env: e })).status).toBe(402);
    expect(saldo(e)).toBe(0);
  });

  it('action desconhecida é 400 (nada de rota implícita)', async () => {
    const e = env({ tier: 'paid', credits: 10, adDate: hoje(), adCount: 0 });
    const res = await onRequestPost({ request: post('https://x/api/entitlements?action=grant', { id: ID, amount: 5 }), env: e });
    expect(res.status).toBe(400);
    expect(saldo(e)).toBe(10);
  });

  it('corpo não-JSON é 400 e não debita', async () => {
    const e = env({ tier: 'paid', credits: 10, adDate: hoje(), adCount: 0 });
    const res = await onRequestPost({
      request: new Request('https://x/api/entitlements?action=spend', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '<<<',
      }),
      env: e,
    });
    expect(res.status).toBe(400);
    expect(saldo(e)).toBe(10);
  });
});

describe('entitlements.js — anúncio recompensado', () => {
  it('DESLIGADO por padrão: 501 e nenhum crédito (senão vira curl de graça)', async () => {
    const e = env({ tier: 'demo', credits: 0, adDate: hoje(), adCount: 0 });
    const res = await onRequestPost({ request: post('https://x/api/entitlements?action=ad', { id: ID }), env: e });
    expect(res.status).toBe(501);
    expect((await res.json()).reason).toBe('ads-not-configured');
    expect(saldo(e)).toBe(0);
  });

  it('ligado, credita a recompensa e respeita o teto diário do SERVIDOR', async () => {
    const e = env({ tier: 'demo', credits: 0, adDate: hoje(), adCount: 0 }, { ADMOB_SSV_ENABLED: 'true' });
    const req = () => onRequestPost({ request: post('https://x/api/entitlements?action=ad', { id: ID }), env: e });
    for (let i = 1; i <= AD_DAILY_CAP; i++) {
      const res = await req();
      expect(res.status).toBe(200);
      expect(saldo(e)).toBe(AD_REWARD_CREDITS * i);
    }
    const estouro = await req();
    expect(estouro.status).toBe(429);
    expect(saldo(e)).toBe(AD_REWARD_CREDITS * AD_DAILY_CAP);
  });

  it('o GET informa que o anúncio está desligado (a UI esconde o botão)', async () => {
    const desligado = await (await onRequestGet({ request: new Request(`https://x/api/entitlements?id=${ID}`), env: env() })).json();
    expect(desligado.adsEnabled).toBe(false);
    const ligado = await (await onRequestGet({
      request: new Request(`https://x/api/entitlements?id=${ID}`), env: env(null, { ADMOB_SSV_ENABLED: 'true' }),
    })).json();
    expect(ligado.adsEnabled).toBe(true);
  });
});

describe('entitlements.js — autorização e CORS', () => {
  it('com auth ligada e sem token, gastar crédito alheio é 401', async () => {
    const e = env({ tier: 'paid', credits: 60, adDate: hoje(), adCount: 0 }, { FIREBASE_PROJECT_ID: 'p' });
    const res = await onRequestPost({
      request: post('https://x/api/entitlements?action=spend', { id: ID, amount: 50 }), env: e,
    });
    expect(res.status).toBe(401);
    expect(saldo(e)).toBe(60);
  });

  it('com auth ligada, LER saldo alheio também é 401', async () => {
    const e = env({ tier: 'paid', credits: 60 }, { FIREBASE_PROJECT_ID: 'p' });
    const res = await onRequestGet({ request: new Request(`https://x/api/entitlements?id=${ID}`), env: e });
    expect(res.status).toBe(401);
  });

  it('o preflight anuncia Authorization (a rota exige o header)', async () => {
    const res = await onRequestOptions();
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
  });
});

describe('entitlements.js — conferência de reembolso não pode tirar o que foi pago', () => {
  it('loja inalcançável MANTÉM o benefício (na dúvida, não se tira)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const e = env({
      tier: 'paid', credits: 100, auditedAt: 0,
      consumedOrders: ['play:GPA.1'],
      orderDetails: [{ orderId: 'play:GPA.1', provider: 'play', productId: 'soulmon.unlock.full', purchaseToken: 'tk', grantTier: 'paid', grantCredits: 0 }],
    }, { GOOGLE_PLAY_SERVICE_ACCOUNT: '{}', ANDROID_PACKAGE_NAME: 'com.x' });
    const body = await (await onRequestGet({ request: new Request(`https://x/api/entitlements?id=${ID}`), env: e })).json();
    expect(body.tier).toBe('paid');
    expect(body.credits).toBe(100);
  });
});
