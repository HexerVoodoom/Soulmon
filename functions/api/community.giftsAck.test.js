/**
 * L03-01 residual (3) — ack do cliente no resgate de presentes.
 * `claim=1&ack=1` não apaga; `POST giftsAck` apaga só os gids confirmados; o legado `claim=1` segue destrutivo.
 */
import { describe, it, expect } from 'vitest';
import { onRequest, GIFT_ACK_LEASE_MS } from './community.js';

const ME = 'a'.repeat(32);
const KEY = `gifts:${ME}`;
const g = (gid, bits = 20) => ({ from: 'Ana', bits, at: 1, gid });

function mkEnv({ seed = [], comD1 = false, auth = false } = {}) {
  const store = new Map([[KEY, JSON.stringify(seed)]]);
  const rows = new Map();
  const updates = [];
  const kv = {
    get: async (k) => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, String(v)); },
    delete: async (k) => { store.delete(k); },
  };
  const DB = { prepare: sql => ({ bind: (...a) => ({
    async run() {
      if (/^INSERT/i.test(sql)) { if (rows.has(a[0])) throw new Error('UNIQUE constraint failed: order_claims.order_id'); rows.set(a[0], a[2]); return { success: true }; }
      if (/^UPDATE/i.test(sql)) { updates.push(a); if (rows.get(a[1]) === a[2]) { rows.set(a[1], a[0]); return { meta: { changes: 1 } }; } return { meta: { changes: 0 } }; }
      return { success: true };
    },
    async first() { return rows.has(a[0]) ? { claimed_at: rows.get(a[0]) } : null; },
  }) }) };
  return { SOULMON_SAVES: kv, ...(comD1 ? { DB } : {}), ...(auth ? { FIREBASE_PROJECT_ID: 'soulmon-test' } : {}), store, rows, updates };
}
const get = async (env, q) => (await onRequest({ request: new Request(`https://x.dev/api/community?action=gifts&id=${ME}&${q}`), env })).json();
const ack = (env, body) => onRequest({
  request: new Request('https://x.dev/api/community?action=giftsAck', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  env,
});
const fila = (env) => JSON.parse(env.store.get(KEY) ?? '[]');

describe('L03-01 ack de presentes', () => {
  it('modo ack entrega e NAO apaga', async () => {
    const env = mkEnv({ seed: [g('g1'), g('g2')] });
    const r = await get(env, 'claim=1&ack=1');
    expect(r.ack).toBe(true);
    expect(r.gifts.map(x => x.gid)).toEqual(['g1', 'g2']);
    expect(fila(env)).toHaveLength(2);
  });

  it('giftsAck apaga so os gids dados e preserva o que chegou no meio; idempotente', async () => {
    const env = mkEnv({ seed: [g('g1'), g('g2')] });
    await get(env, 'claim=1&ack=1');
    env.store.set(KEY, JSON.stringify([g('g1'), g('g2'), g('g3')])); // chegou no meio
    const res = await ack(env, { id: ME, gids: ['g1', 'g2'] });
    expect(await res.json()).toEqual({ ok: true, removed: 2 });
    expect(fila(env).map(x => x.gid)).toEqual(['g3']);
    expect(await (await ack(env, { id: ME, gids: ['g1', 'g2'] })).json()).toEqual({ ok: true, removed: 0 });
    await ack(env, { id: ME, gids: ['g3'] });
    expect(env.store.has(KEY)).toBe(false);
  });

  it('legado claim=1 sem ack continua destrutivo e sem campo ack', async () => {
    const env = mkEnv({ seed: [g('g1')] });
    const r = await get(env, 'claim=1');
    expect(r.ack).toBeUndefined();
    expect(r.gifts).toHaveLength(1);
    expect(env.store.has(KEY)).toBe(false);
  });

  it('D1: segundo claim dentro do lease nao entrega; depois do lease entrega com UPDATE condicional', async () => {
    const env = mkEnv({ comD1: true, seed: [g('g1')] });
    expect((await get(env, 'claim=1&ack=1')).gifts).toHaveLength(1);
    expect((await get(env, 'claim=1&ack=1')).gifts).toHaveLength(0);
    expect(env.updates).toHaveLength(0);
    env.rows.set(`gift:${ME}:g1`, Date.now() - GIFT_ACK_LEASE_MS - 1000);
    const r = await get(env, 'claim=1&ack=1');
    expect(r.gifts).toHaveLength(1);
    expect(env.updates).toHaveLength(1);
    expect(await get(env, 'claim=1&ack=1')).toMatchObject({ gifts: [] }); // lease renovado
  });

  it('giftsAck sem token com auth ligada: negado e nada apagado', async () => {
    const env = mkEnv({ seed: [g('g1')], auth: true });
    const res = await ack(env, { id: ME, gids: ['g1'] });
    expect([401, 403]).toContain(res.status);
    expect(fila(env)).toHaveLength(1);
  });

  it('corpo invalido -> 400', async () => {
    const env = mkEnv({ seed: [g('g1')] });
    for (const gids of [undefined, 'g1', [1], [''], ['x'.repeat(101)], Array.from({ length: 51 }, (_, i) => `g${i}`)]) {
      expect((await ack(env, { id: ME, gids })).status).toBe(400);
    }
    expect(fila(env)).toHaveLength(1);
  });
});
