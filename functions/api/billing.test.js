/**
 * TESTE DE CONTRATO da rota de DINHEIRO — `functions/api/billing.js`.
 *
 * Situação antes desta rodada: `_billing.js` tinha 48,2% de cobertura e
 * **`billing.js` tinha 0%** — exatamente a situação em que `save.js` estava
 * quando chegou à produção com dois defeitos dentro. `_billing.test.js` cobre
 * as funções puras; ninguém nunca chamou o `onRequestPost` que as orquestra.
 *
 * Modelo copiado de `desktop/renderer/src/pushCareAction.test.ts`: ligar no
 * handler REAL, não num mock que devolve 200. Aqui o único ponto falsificado é
 * o `fetch` para a LOJA (Valve) — tudo entre a requisição HTTP e o KV é o
 * código de produção: `_billing.js`, `_entitlements.js`, `_auth.js`.
 *
 * A Steam é o provedor escolhido porque a verificação dela é 100% `fetch`; a
 * Play exigiria assinar um JWT com chave de serviço real, o que faria o teste
 * medir a criptografia em vez do contrato.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestPost, onRequestOptions } from './billing.js';
import { ENT_PREFIX, ORDER_PREFIX } from './_entitlements.js';

const ID = 'a'.repeat(32);
const OUTRO_ID = 'b'.repeat(32);
const STEAM_ID = '76561198000000001';

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
  };
}

const env = (extra = {}, seed = {}) => ({
  DIGIAPP_SAVES: fakeKV(seed),
  STEAM_PUBLISHER_KEY: 'chave-de-teste',
  STEAM_APP_ID: '1234567',
  ...extra,
});

const post = (url, body) => new Request(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/**
 * A Valve de mentira. `overrides` permite cada caso mexer só no que interessa,
 * em vez de reescrever a loja inteira.
 */
function steamStub({ ticketOk = true, steamId = STEAM_ID, ownerSteamId = null, ownsApp = true, txn } = {}) {
  return vi.fn(async (url) => {
    const u = String(url);
    if (u.includes('AuthenticateUserTicket')) {
      if (!ticketOk) return Response.json({ response: { params: { result: 'Failure' } } });
      return Response.json({
        response: { params: { result: 'OK', steamid: steamId, ownersteamid: ownerSteamId ?? steamId } },
      });
    }
    if (u.includes('CheckAppOwnership')) {
      return Response.json({ appownership: { ownsapp: ownsApp } });
    }
    if (u.includes('QueryTxn')) {
      return Response.json({ response: { params: txn } });
    }
    throw new Error(`fetch inesperado no teste: ${u}`);
  });
}

let fetchSpy;
beforeEach(() => { fetchSpy = null; });
afterEach(() => { vi.unstubAllGlobals(); });
const useStore = (stub) => { fetchSpy = stub; vi.stubGlobal('fetch', stub); };

const ent = (e, id = ID) => JSON.parse(e.DIGIAPP_SAVES.store.get(ENT_PREFIX + id) ?? 'null');

// ─────────────────────────────────────────── o caminho feliz, ponta a ponta

describe('billing.js — posse do app na Steam concede tier pago', () => {
  it('compra verificada vira `paid` NO KV, não só na resposta', async () => {
    useStore(steamStub());
    const e = env();
    const res = await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, ticket: 'tkt' }),
      env: e,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.tier).toBe('paid');
    // O que importa é o efeito persistido: a resposta pode mentir, o KV não.
    expect(ent(e).tier).toBe('paid');
    expect(ent(e).consumedOrders).toEqual([`steam:own:1234567:${STEAM_ID}`]);
  });

  it('reenviar a MESMA compra não dá tier duas vezes (restaurar compras)', async () => {
    useStore(steamStub());
    const e = env();
    const req = () => onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, ticket: 'tkt' }),
      env: e,
    });
    await req();
    const body = await (await req()).json();
    expect(body.ok).toBe(true);
    expect(body.duplicate).toBe(true);
    expect(ent(e).consumedOrders).toHaveLength(1);
  });

  it('o comprovante vale para UMA conta: a segunda leva 409', async () => {
    useStore(steamStub());
    const e = env();
    await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, ticket: 'tkt' }),
      env: e,
    });
    const res = await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: OUTRO_ID, ticket: 'tkt' }),
      env: e,
    });
    expect(res.status).toBe(409);
    expect((await res.json()).reason).toBe('order-in-use');
    // e a segunda conta continua sem NADA
    expect(ent(e, OUTRO_ID)).toBeNull();
  });

  it('Family Sharing: quem pegou emprestado NÃO herda a compra', async () => {
    useStore(steamStub({ steamId: '76561198000000009', ownerSteamId: STEAM_ID }));
    const e = env();
    const res = await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, ticket: 'tkt' }),
      env: e,
    });
    expect(res.status).toBe(402);
    expect((await res.json()).reason).toBe('family-shared');
    expect(ent(e)).toBeNull();
  });

  it('não possui o app → nada é concedido', async () => {
    useStore(steamStub({ ownsApp: false }));
    const e = env();
    const res = await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, ticket: 'tkt' }),
      env: e,
    });
    expect(res.status).toBe(402);
    expect(ent(e)).toBeNull();
  });

  it('ticket inválido não vira compra', async () => {
    useStore(steamStub({ ticketOk: false }));
    const e = env();
    const res = await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, ticket: 'forjado' }),
      env: e,
    });
    expect(res.status).toBe(402);
    expect(ent(e)).toBeNull();
    // e não chegamos nem a perguntar pela posse
    expect(fetchSpy.mock.calls.every(([u]) => !String(u).includes('CheckAppOwnership'))).toBe(true);
  });
});

describe('billing.js — microtransação da Steam (créditos)', () => {
  const txnOk = { status: 'Succeeded', orderid: '999', steamid: STEAM_ID, items: [{ itemid: 102 }] };

  it('transação confirmada credita exatamente o pacote comprado', async () => {
    useStore(steamStub({ txn: txnOk }));
    const e = env();
    const res = await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, orderId: '999', ticket: 'tkt' }),
      env: e,
    });
    expect(res.status).toBe(200);
    expect((await res.json()).credits).toBe(150); // itemid 102 → soulmon.credits.150
    expect(ent(e).credits).toBe(150);
  });

  it('transação de OUTRO jogador não credita (orderid é adivinhável)', async () => {
    useStore(steamStub({ txn: { ...txnOk, steamid: '76561198000000099' } }));
    const e = env();
    const res = await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, orderId: '999', ticket: 'tkt' }),
      env: e,
    });
    expect(res.status).toBe(402);
    expect(ent(e)).toBeNull();
  });

  it('transação não paga não credita', async () => {
    useStore(steamStub({ txn: { ...txnOk, status: 'Init' } }));
    const e = env();
    const res = await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, orderId: '999', ticket: 'tkt' }),
      env: e,
    });
    expect(res.status).toBe(402);
    expect(ent(e)).toBeNull();
  });

  it('item desconhecido não vira crédito adivinhado', async () => {
    useStore(steamStub({ txn: { ...txnOk, items: [{ itemid: 777 }] } }));
    const e = env();
    const res = await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, orderId: '999', ticket: 'tkt' }),
      env: e,
    });
    expect(res.status).toBe(400);
    expect((await res.json()).reason).toBe('unknown-product');
    expect(ent(e)).toBeNull();
  });

  it('microtransação SEM ticket é recusada (não basta o orderid)', async () => {
    useStore(steamStub({ txn: txnOk }));
    const e = env();
    const res = await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, orderId: '999' }),
      env: e,
    });
    expect(res.status).toBe(402);
    expect((await res.json()).reason).toBe('missing-ticket');
    expect(ent(e)).toBeNull();
  });
});

// ───────────────────────────────────── entrada ruim e credencial ausente

describe('billing.js — entrada ruim nunca concede benefício', () => {
  const casos = [
    ['sem action', 'https://x/api/billing', { id: ID, ticket: 't' }, 400],
    ['action desconhecida', 'https://x/api/billing?action=hack', { id: ID, ticket: 't' }, 400],
    ['provider desconhecido', 'https://x/api/billing?action=verify&provider=epic', { id: ID, ticket: 't' }, 400],
    ['saveId curto', 'https://x/api/billing?action=verify&provider=steam', { id: 'x', ticket: 't' }, 400],
    ['saveId ausente', 'https://x/api/billing?action=verify&provider=steam', { ticket: 't' }, 400],
    ['saveId com caractere fora do alfabeto', 'https://x/api/billing?action=verify&provider=steam', { id: '../../etc/passwd', ticket: 't' }, 400],
    ['sem comprovante nenhum', 'https://x/api/billing?action=verify&provider=steam', { id: ID }, 400],
  ];

  for (const [nome, url, body, status] of casos) {
    it(`${nome} → ${status} e KV intocado`, async () => {
      useStore(steamStub());
      const e = env();
      const res = await onRequestPost({ request: post(url, body), env: e });
      expect(res.status).toBe(status);
      expect(e.DIGIAPP_SAVES.store.size).toBe(0);
    });
  }

  it('corpo que não é JSON não derruba a rota nem concede nada', async () => {
    useStore(steamStub());
    const e = env();
    const res = await onRequestPost({
      request: new Request('https://x/api/billing?action=verify&provider=steam', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'isto não é json',
      }),
      env: e,
    });
    expect(res.status).toBe(400);
    expect(e.DIGIAPP_SAVES.store.size).toBe(0);
  });

  it('sem KV ligado responde 500 antes de falar com a loja', async () => {
    useStore(steamStub());
    const res = await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, ticket: 't' }),
      env: { STEAM_PUBLISHER_KEY: 'k', STEAM_APP_ID: '1' },
    });
    expect(res.status).toBe(500);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('SEM credencial da Steam responde 503 e NUNCA concede', async () => {
    useStore(steamStub());
    const e = env({ STEAM_PUBLISHER_KEY: undefined, STEAM_APP_ID: undefined });
    const res = await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, ticket: 'tkt' }),
      env: e,
    });
    expect(res.status).toBe(503);
    expect(ent(e)).toBeNull();
  });

  it('loja fora do ar (fetch lança) responde erro e não credita', async () => {
    useStore(vi.fn(async () => { throw new Error('ECONNRESET'); }));
    const e = env();
    const res = await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, ticket: 'tkt' }),
      env: e,
    });
    expect(res.ok).toBe(false);
    expect(ent(e)).toBeNull();
  });

  it('loja respondendo HTTP 500 não vira compra', async () => {
    useStore(vi.fn(async () => new Response('boom', { status: 500 })));
    const e = env();
    const res = await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, ticket: 'tkt' }),
      env: e,
    });
    expect(res.ok).toBe(false);
    expect(ent(e)).toBeNull();
  });
});

describe('billing.js — CORS', () => {
  it('o preflight anuncia Authorization (a rota exige o header)', async () => {
    const res = await onRequestOptions();
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
  });
});

// ───────────────────────────────────────────────── autorização por conta

describe('billing.js — creditar na conta de outro', () => {
  it('com FIREBASE_PROJECT_ID ligado e sem token, a compra é recusada com 401', async () => {
    useStore(steamStub());
    const e = env({ FIREBASE_PROJECT_ID: 'projeto-x' });
    const res = await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, ticket: 'tkt' }),
      env: e,
    });
    expect(res.status).toBe(401);
    expect(ent(e)).toBeNull();
    // e a loja nem chegou a ser consultada — a autorização vem antes
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('o registro global de comprovante é gravado sob a chave `ord:`', async () => {
    useStore(steamStub());
    const e = env();
    await onRequestPost({
      request: post('https://x/api/billing?action=verify&provider=steam', { id: ID, ticket: 'tkt' }),
      env: e,
    });
    expect(e.DIGIAPP_SAVES.store.get(`${ORDER_PREFIX}steam:own:1234567:${STEAM_ID}`)).toBe(ID);
  });
});
