/**
 * L03-01 — resgate de presentes de Bits (`gifts&claim=1`) era get -> delete:
 *  (1) dois claims simultâneos entregavam a MESMA lista (dobro);
 *  (2) presente que chegava entre o get e o delete era apagado sem entrega;
 *  (3) GET destrutivo (resposta perdida) — residual documentado, sem ack obrigatório.
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';

const ME = 'a'.repeat(32);
const KEY = `gifts:${ME}`;
const soma = (r) => r.gifts.reduce((s, g) => s + g.bits, 0);

function mkEnv({ seed = [], comD1 = false, aposGet = null } = {}) {
  const store = new Map([[KEY, JSON.stringify(seed)]]);
  const rows = new Map();
  const tick = () => new Promise(r => setTimeout(r, 5));
  let hook = aposGet;
  const kv = {
    store,
    get: async (k) => {
      const v = store.get(k) ?? null;
      if (k === KEY && hook) { const h = hook; hook = null; await h(store); }
      else await tick();
      return v;
    },
    put: async (k, v) => { await tick(); store.set(k, String(v)); },
    delete: async (k) => { store.delete(k); },
  };
  const DB = { prepare: sql => ({ bind: (...a) => ({ async run() {
    await tick();
    if (/^INSERT/i.test(sql)) { if (rows.has(a[0])) throw new Error('UNIQUE constraint failed: order_claims.order_id'); rows.set(a[0], a[1]); }
    return { success: true };
  } }) }) };
  return { SOULMON_SAVES: kv, ...(comD1 ? { DB } : {}), rows, kv };
}
const claim = async (env) => (await onRequest({ request: new Request(`https://x.dev/api/community?action=gifts&id=${ME}&claim=1`), env })).json();
const gift = (bits, at) => ({ from: 'Ana', bits, at });

describe('L03-01 resgate de presentes', () => {
  it('(a) presente que chega entre o get e a limpeza do claim NAO some', async () => {
    const env = mkEnv({
      seed: [gift(20, 1)],
      aposGet: async (store) => { // action=gift gravando no meio do claim
        const l = JSON.parse(store.get(KEY)); l.push(gift(20, 2)); store.set(KEY, JSON.stringify(l));
      },
    });
    const r1 = await claim(env);
    expect(soma(r1)).toBe(20);
    const r2 = await claim(env);
    expect(soma(r2)).toBe(20); // o que chegou no meio aparece no proximo claim
    expect(soma(await claim(env))).toBe(0);
  });

  it('(b) dois claims concorrentes com D1: soma entregue = soma real', async () => {
    const env = mkEnv({ comD1: true, seed: [gift(20, 1), gift(20, 2), gift(20, 3)] });
    const [r1, r2] = await Promise.all([claim(env), claim(env)]);
    expect(soma(r1) + soma(r2)).toBe(60);
    expect(soma(await claim(env))).toBe(0);
  });

  it('(c) presentes legados sem gid sao entregues uma unica vez', async () => {
    const env = mkEnv({ comD1: true, seed: [gift(20, 1), gift(10, 1)] });
    expect(soma(await claim(env))).toBe(30);
    expect(soma(await claim(env))).toBe(0);
    const env2 = mkEnv({ seed: [gift(20, 1)] });
    expect(soma(await claim(env2))).toBe(20);
    expect(soma(await claim(env2))).toBe(0);
  });

  it('sem claim=1 nao consome nada e o formato { gifts } segue', async () => {
    const env = mkEnv({ seed: [gift(20, 1)] });
    const r = await (await onRequest({ request: new Request(`https://x.dev/api/community?action=gifts&id=${ME}`), env })).json();
    expect(r.gifts).toHaveLength(1);
    expect(r.gifts[0]).toMatchObject({ from: 'Ana', bits: 20 });
    expect(soma(await claim(env))).toBe(20);
  });
});
