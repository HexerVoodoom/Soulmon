/**
 * QA r4 C2 · A1 (REGISTRO §386): `replayOnly` no buy-bits. O app reabre com um opId PENDENTE (a rede caiu depois do débito) e pergunta
 * ao servidor só pelo replay: se o pedido foi atendido, devolve o MESMO pacote (sem cobrar); se não foi, responde `409 no-op` sem
 * comprar nada, mesmo com saldo e teto livres. Handler REAL (`entitlements.js`), KV e D1 de mentira.
 */
import { describe, it, expect } from 'vitest';
import { onRequestPost } from './entitlements.js';
import { ENT_PREFIX, readEntitlement } from './_entitlements.js';
import { BITS_PACKS, BITS_PACK_DAILY_CAP, buyBitsPack, OPS_MAX } from './_bitsPacks.js';

const ID = 'c'.repeat(32);
const DIA = Date.UTC(2026, 10, 14, 12, 0, 0);

function fakeEnv(credits = 5000) {
  const store = new Map();
  store.set(ENT_PREFIX + ID, JSON.stringify({ tier: 'paid', credits }));
  return {
    SOULMON_SAVES: {
      store,
      get: async k => store.get(k) ?? null,
      put: async (k, v) => { store.set(k, String(v)); },
      delete: async k => { store.delete(k); },
    },
  };
}

const post = (env, body) => onRequestPost({
  request: new Request('https://x/api/entitlements?action=buy-bits', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ID, ...body }),
  }),
  env,
});

describe('buy-bits com replayOnly', () => {
  it('opId nunca visto: 409 no-op, nada debitado nem contado (saldo e teto livres)', async () => {
    const e = fakeEnv();
    const r = await buyBitsPack(e, ID, 'bits-200', 'op-nunca-visto-01', { nowMs: DIA, replayOnly: true });
    expect(r).toMatchObject({ ok: false, status: 409, reason: 'no-op' });
    const ent = await readEntitlement(e, ID);
    expect(ent.credits).toBe(5000);
    expect(ent.bitsBuy).toBeUndefined();
    expect(ent.bitsBuyOps).toBeUndefined();
  });

  it('opId já atendido: a MESMA resposta do replay normal, sem cobrar de novo', async () => {
    const e = fakeEnv();
    const compra = await buyBitsPack(e, ID, 'bits-500', 'op-pendente-0001', { nowMs: DIA });
    expect(compra.ok).toBe(true);
    const normal = await buyBitsPack(e, ID, 'bits-500', 'op-pendente-0001', { nowMs: DIA + 1000 });
    const so = await buyBitsPack(e, ID, 'bits-500', 'op-pendente-0001', { nowMs: DIA + 2000, replayOnly: true });
    expect(so).toMatchObject({ ok: true, replay: true, bits: 500, price: 460, pack: 'bits-500' });
    expect({ ...so, ent: undefined }).toEqual({ ...normal, ent: undefined, resetAt: so.resetAt });
    expect((await readEntitlement(e, ID)).credits).toBe(5000 - 460);
  });

  it('a rota HTTP: replayOnly sem pedido anterior responde 409 { ok:false, reason:"no-op" } e não debita', async () => {
    const e = fakeEnv();
    const res = await post(e, { pack: 'bits-200', opId: 'op-http-nunca-01', replayOnly: true });
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ ok: false, reason: 'no-op' });
    expect((await readEntitlement(e, ID)).credits).toBe(5000);
  });

  it('a rota HTTP: replayOnly de pedido atendido devolve replay:true com os Bits', async () => {
    const e = fakeEnv();
    await post(e, { pack: 'bits-200', opId: 'op-http-feito-01' });
    const res = await post(e, { pack: 'bits-200', opId: 'op-http-feito-01', replayOnly: true });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, replay: true, bits: 200 });
    expect((await readEntitlement(e, ID)).credits).toBe(4800);
  });

  it('replayOnly com opId inválido segue 400 bad-op (a forma é conferida antes)', async () => {
    const e = fakeEnv();
    expect(await buyBitsPack(e, ID, 'bits-200', 'x', { nowMs: DIA, replayOnly: true })).toMatchObject({ ok: false, status: 400, reason: 'bad-op' });
  });

  it('janela de replay: todas as compras possíveis em 24 h cabem em OPS_MAX (o pendente do cliente vive 24 h)', () => {
    // Pior caso: o menor pacote enche o teto do dia; 24 h cruzam no máximo 3 rótulos de dia (troca de âncora de fuso no meio).
    const menor = Math.min(...BITS_PACKS.map(p => p.bits));
    const porDia = Math.floor(BITS_PACK_DAILY_CAP / menor);
    expect(OPS_MAX).toBeGreaterThanOrEqual(porDia * 3);
  });
});
