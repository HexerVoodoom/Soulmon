import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PRODUCTS, STEAM_ITEMS,
  verifyPlayPurchase, verifySteamOwnership, verifySteamPurchase,
} from './_billing.js';

// Estes testes protegem o portão do dinheiro do lado da Steam. Se algum cair,
// alguém ganha crédito ou o tier pago sem ter comprado.

const STEAM_ENV = { STEAM_PUBLISHER_KEY: 'k', STEAM_APP_ID: '480' };

/** Responde às chamadas da Valve por trecho da URL. */
function mockSteam(routes) {
  return vi.fn(async url => {
    for (const [needle, payload] of Object.entries(routes)) {
      if (String(url).includes(needle)) {
        if (payload === 'http-error') return { ok: false, status: 500 };
        return { ok: true, json: async () => payload };
      }
    }
    throw new Error(`URL inesperada no teste: ${url}`);
  });
}

const okTicket = (steamid, ownersteamid) => ({
  response: { params: { result: 'OK', steamid, ownersteamid } },
});
const ownership = owns => ({ appownership: { ownsapp: owns } });

beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('catálogo cross-store', () => {
  it('todo itemid da Steam aponta pra um produto existente', () => {
    for (const productId of Object.values(STEAM_ITEMS)) {
      expect(PRODUCTS[productId]).toBeDefined();
    }
  });

  it('o desbloqueio completo NÃO é vendido por microtransação na Steam', () => {
    // Na Steam ele vem da posse do app (a loja cobra pelo jogo). Se aparecesse
    // aqui, o jogador poderia pagar duas vezes pela mesma coisa.
    expect(Object.values(STEAM_ITEMS)).not.toContain('soulmon.unlock.full');
  });
});

describe('sem credencial configurada, nada é concedido', () => {
  it('Play', async () => {
    const r = await verifyPlayPurchase({}, { productId: 'soulmon.credits.60', purchaseToken: 't' });
    expect(r).toEqual({ ok: false, reason: 'billing-not-configured' });
  });

  it('Steam — microtransação', async () => {
    const r = await verifySteamPurchase({}, { orderId: '123' });
    expect(r).toEqual({ ok: false, reason: 'billing-not-configured' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('Steam — posse do app', async () => {
    const r = await verifySteamOwnership({}, { ticket: 'abc' });
    expect(r).toEqual({ ok: false, reason: 'billing-not-configured' });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('Steam — microtransação (créditos)', () => {
  it('credita quando a Valve confirma Succeeded', async () => {
    vi.stubGlobal('fetch', mockSteam({
      QueryTxn: { response: { params: { status: 'Succeeded', orderid: '999', items: [{ itemid: 102 }] } } },
    }));
    const r = await verifySteamPurchase(STEAM_ENV, { orderId: '999' });
    expect(r.ok).toBe(true);
    expect(r.product).toEqual(PRODUCTS['soulmon.credits.150']);
    // orderId com namespace da loja — não pode colidir com um orderId da Play.
    expect(r.orderId).toBe('steam:txn:999');
  });

  it('recusa transação que não foi paga', async () => {
    vi.stubGlobal('fetch', mockSteam({
      QueryTxn: { response: { params: { status: 'Failed', items: [{ itemid: 102 }] } } },
    }));
    expect(await verifySteamPurchase(STEAM_ENV, { orderId: '1' }))
      .toEqual({ ok: false, reason: 'not-purchased' });
  });

  it('recusa item que não está no catálogo', async () => {
    vi.stubGlobal('fetch', mockSteam({
      QueryTxn: { response: { params: { status: 'Succeeded', items: [{ itemid: 9999 }] } } },
    }));
    expect(await verifySteamPurchase(STEAM_ENV, { orderId: '1' }))
      .toEqual({ ok: false, reason: 'unknown-product' });
  });

  it('recusa transação com mais de um item em vez de adivinhar', async () => {
    vi.stubGlobal('fetch', mockSteam({
      QueryTxn: { response: { params: { status: 'Succeeded', items: [{ itemid: 101 }, { itemid: 102 }] } } },
    }));
    expect(await verifySteamPurchase(STEAM_ENV, { orderId: '1' }))
      .toEqual({ ok: false, reason: 'unsupported-transaction' });
  });

  it('recusa orderId que não é numérico sem chamar a Valve', async () => {
    expect(await verifySteamPurchase(STEAM_ENV, { orderId: '1 OR 1=1' }))
      .toEqual({ ok: false, reason: 'missing-token' });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('Steam — posse do app (tier pago)', () => {
  it('concede o tier pago quando o ticket é válido e a conta possui o app', async () => {
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: okTicket('7656119', '7656119'),
      CheckAppOwnership: ownership(true),
    }));
    const r = await verifySteamOwnership(STEAM_ENV, { ticket: 'deadbeef' });
    expect(r.ok).toBe(true);
    expect(r.product.grantTier).toBe('paid');
    expect(r.orderId).toBe('steam:own:480:7656119');
  });

  it('mesmo jogador reenviando o ticket gera o MESMO orderId (idempotente)', async () => {
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: okTicket('7656119', '7656119'),
      CheckAppOwnership: ownership(true),
    }));
    const a = await verifySteamOwnership(STEAM_ENV, { ticket: 't1' });
    const b = await verifySteamOwnership(STEAM_ENV, { ticket: 't2' });
    expect(a.orderId).toBe(b.orderId);
  });

  it('recusa ticket que a Valve não valida', async () => {
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: { response: { error: { errorcode: 101 } } },
    }));
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 'forjado' }))
      .toEqual({ ok: false, reason: 'invalid-ticket' });
  });

  it('recusa quem tem o ticket mas não possui o app', async () => {
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: okTicket('7656119', '7656119'),
      CheckAppOwnership: ownership(false),
    }));
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'not-purchased' });
  });

  it('Family Sharing: a posse é checada no DONO da licença, não em quem joga', async () => {
    // Sem isto, emprestar a biblioteca daria tier pago para contas que nunca
    // compraram — e o orderId de cada uma seria diferente, multiplicando o
    // benefício de uma compra só.
    const fetchMock = mockSteam({
      AuthenticateUserTicket: okTicket('111_jogador', '999_dono'),
      CheckAppOwnership: ownership(true),
    });
    vi.stubGlobal('fetch', fetchMock);
    const r = await verifySteamOwnership(STEAM_ENV, { ticket: 't' });
    const ownershipUrl = fetchMock.mock.calls.map(c => String(c[0])).find(u => u.includes('CheckAppOwnership'));
    expect(ownershipUrl).toContain('steamid=999_dono');
    expect(r.orderId).toBe('steam:own:480:999_dono');
  });

  it('recusa conta banida pelo publisher', async () => {
    vi.stubGlobal('fetch', mockSteam({
      AuthenticateUserTicket: { response: { params: { result: 'OK', steamid: '1', publisherbanned: true } } },
    }));
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'banned' });
  });

  it('Valve fora do ar não vira concessão', async () => {
    vi.stubGlobal('fetch', mockSteam({ AuthenticateUserTicket: 'http-error' }));
    expect(await verifySteamOwnership(STEAM_ENV, { ticket: 't' }))
      .toEqual({ ok: false, reason: 'steam-unreachable' });
  });
});
