/** CAMBISTA — compra de essência por Créditos (§205): preço do servidor, saldo, idempotência, trancado/desconhecido, teto. */
import { describe, it, expect } from 'vitest';
import { onRequestPost } from './entitlements.js';
import { ENT_PREFIX } from './_entitlements.js';
import { essencePackPrice, essenceUnitPrice, ESSENCE_MAX_PER_ELEMENT } from './_essenceShop.js';

const ID = 'e'.repeat(32);
const OP = 'op_essence_0001';
function setup(credits = 20, save = { defeatedElements: ['fogo', 'vapor'], essences: { fogo: 3 } }) {
  const store = new Map([[ENT_PREFIX + ID, JSON.stringify({ tier: 'paid', credits })], [ID, JSON.stringify(save)]]);
  const e = { DIGIAPP_SAVES: { store, get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); } } };
  const buy = async body => {
    const res = await onRequestPost({ request: new Request('https://x/api/entitlements?action=buy-essence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ID, opId: OP, ...body }) }), env: e });
    return { status: res.status, body: await res.json() };
  };
  const saldo = () => JSON.parse(store.get(ENT_PREFIX + ID)).credits;
  return { buy, saldo };
}

describe('tabela de preço (servidor)', () => {
  it('base 1, par 2; pacote de 5 com 10% off arredondado para baixo', () => {
    expect(essenceUnitPrice('fogo')).toBe(3); // ×3 (dono, 24/11/2026)
    expect(essenceUnitPrice('vapor')).toBe(6);
    expect(essencePackPrice('fogo', 1)).toBe(3);
    expect(essencePackPrice('fogo', 5)).toBe(13);
    expect(essencePackPrice('vapor', 5)).toBe(27);
    expect(essencePackPrice('fogo', 3)).toBe(9);
    expect(essencePackPrice('fogo', 12)).toBe(32); // 2 grupos de 5 (13+13) + 2 soltas
    expect(essencePackPrice('vapor', 7)).toBe(27 + 12);
    expect(essencePackPrice('fogo', 0)).toBe(0);
    expect(essencePackPrice('fogo', 1.5)).toBe(0);
    expect(essencePackPrice('fogo', 999_999)).toBe(199_999 * 13 + 12);
    expect(essencePackPrice('fogo', ESSENCE_MAX_PER_ELEMENT)).toBe(200_000 * 13);
    expect(essencePackPrice('fogo', ESSENCE_MAX_PER_ELEMENT + 1)).toBe(0);
    expect(essencePackPrice('nada', 1)).toBe(0);
  });
});

describe('action=buy-essence', () => {
  it('compra de N qualquer (§479): cobra o preço do servidor para N e credita N', async () => {
    const t = setup(60);
    const r = await t.buy({ element: 'fogo', qty: 7 });
    expect(r.body).toMatchObject({ ok: true, qty: 7, price: 19, credits: 41 });
    expect(t.saldo()).toBe(41);
  });
  it('N grande (1000) sem limite por compra: cobra 2600 e credita', async () => {
    const t = setup(3000);
    const r = await t.buy({ element: 'fogo', qty: 1000 });
    expect(r.body).toMatchObject({ ok: true, qty: 1000, price: 2600 });
  });
  it('N acima do teto de estoque = 409 sem cobrar', async () => {
    const t = setup(10_000_000, { defeatedElements: ['fogo'], essences: { fogo: 5 } });
    const r = await t.buy({ element: 'fogo', qty: ESSENCE_MAX_PER_ELEMENT - 4 });
    expect(r.status).toBe(409);
    expect(t.saldo()).toBe(10_000_000);
  });
  it('N acima do saldo = 402 sem cobrar', async () => {
    const t = setup(3);
    expect((await t.buy({ element: 'fogo', qty: 2 })).status).toBe(402);
    expect(t.saldo()).toBe(3);
  });
  it('debita o preço do SERVIDOR (ignora price do corpo) e devolve o novo saldo', async () => {
    const t = setup(60);
    const r = await t.buy({ element: 'vapor', qty: 5, price: 1 });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, element: 'vapor', qty: 5, price: 27, credits: 33 });
    expect(t.saldo()).toBe(33);
  });
  it('saldo insuficiente = 402 e nada debitado', async () => {
    const t = setup(1);
    const r = await t.buy({ element: 'vapor', qty: 1 });
    expect(r.status).toBe(402);
    expect(r.body.reason).toBe('insufficient');
    expect(t.saldo()).toBe(1);
  });
  it('mesmo opId = mesma resposta, cobra uma vez só', async () => {
    const t = setup(60);
    const a = await t.buy({ element: 'fogo', qty: 5 });
    const b = await t.buy({ element: 'fogo', qty: 5 });
    expect(b.status).toBe(200);
    expect(b.body.credits).toBe(a.body.credits);
    expect(t.saldo()).toBe(47);
  });
  it('sem opId válido = 400', async () => {
    const t = setup(20);
    expect((await t.buy({ element: 'fogo', qty: 1, opId: 'x' })).status).toBe(400);
    expect(t.saldo()).toBe(20);
  });
  it('elemento desconhecido = 400; trancado (fora da Biblioteca) = 403; qty inválida (0, fracionada, negativa) = 400', async () => {
    const t = setup(20);
    expect((await t.buy({ element: 'unobtainium', qty: 1 })).body.reason).toBe('unknown-element');
    const lk = await t.buy({ element: 'agua', qty: 1 });
    expect(lk.status).toBe(403);
    expect(lk.body.reason).toBe('locked');
    for (const qty of [0, 1.5, -3, 'abc']) expect((await t.buy({ element: 'fogo', qty })).body.reason).toBe('bad-qty');
    expect(t.saldo()).toBe(20);
  });
  it('teto por elemento = 409 sem cobrar', async () => {
    const t = setup(20, { defeatedElements: ['fogo'], essences: { fogo: ESSENCE_MAX_PER_ELEMENT - 2 } });
    const r = await t.buy({ element: 'fogo', qty: 5 });
    expect(r.status).toBe(409);
    expect(r.body.reason).toBe('cap');
    expect(t.saldo()).toBe(20);
  });
});
