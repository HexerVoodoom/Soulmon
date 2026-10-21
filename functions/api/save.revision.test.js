/**
 * ADR-004 (contrato aditivo): `revision` no METADATA da chave KV; o valor segue sendo o state JSON cru (rollback seguro).
 * KV sem compare-and-set: a janela de segundos entre get e put continua declarada como residual.
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './save.js';

const ID = 'b'.repeat(32);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const meta = new Map();
  const puts = [];
  return {
    store, meta, puts,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, opts) => { puts.push(k); store.set(k, v); if (opts?.metadata !== undefined) meta.set(k, opts.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
  };
}
const mkEnv = (seed) => ({ DIGIAPP_SAVES: fakeKV(seed) });
const post = (env, state, extra = {}) => onRequest({
  request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state, ...extra }) }),
  env,
});
const get = (env) => onRequest({ request: new Request(`https://x/api/save?id=${ID}`), env });

describe('revisão do save (ADR-004)', () => {
  it('(a) GET de registro legado sem metadata.r devolve revision 0', async () => {
    const env = mkEnv({ [ID]: JSON.stringify({ perfectDays: 1 }) });
    env.DIGIAPP_SAVES.meta.set(ID, { t: Date.now(), f: 1_700_000_000_000 });
    const j = await (await get(env)).json();
    expect(j.found).toBe(true);
    expect(j.revision).toBe(0);
  });

  it('(b) POST sem baseRevision grava e devolve revision cur+1 (cliente antigo)', async () => {
    const env = mkEnv();
    const r1 = await post(env, { perfectDays: 1 });
    expect(r1.status).toBe(200);
    expect(await r1.json()).toEqual({ ok: true, revision: 1 });
    const r2 = await post(env, { perfectDays: 2 });
    expect(await r2.json()).toEqual({ ok: true, revision: 2 });
    expect(env.DIGIAPP_SAVES.meta.get(ID).r).toBe(2);
  });

  it('(c) POST com baseRevision certo grava e incrementa', async () => {
    const env = mkEnv();
    expect(await (await post(env, { perfectDays: 1 }, { baseRevision: 0 })).json()).toEqual({ ok: true, revision: 1 });
    expect(await (await post(env, { perfectDays: 2 }, { baseRevision: 1 })).json()).toEqual({ ok: true, revision: 2 });
    const m = env.DIGIAPP_SAVES.meta.get(ID);
    expect(m.r).toBe(2);
    expect(m.h).toMatch(/^[0-9a-f]{64}$/);
    expect((await (await get(env)).json()).revision).toBe(2);
  });

  it('(d) baseRevision velho com conteúdo diferente → 409 e o KV NÃO muda', async () => {
    const env = mkEnv();
    await post(env, { perfectDays: 1 }, { baseRevision: 0 });
    await post(env, { perfectDays: 2 }, { baseRevision: 1 });
    const antes = env.DIGIAPP_SAVES.store.get(ID);
    const metaAntes = { ...env.DIGIAPP_SAVES.meta.get(ID) };
    const putsAntes = env.DIGIAPP_SAVES.puts.length;
    const res = await post(env, { perfectDays: 99 }, { baseRevision: 0 });
    expect(res.status).toBe(409);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(await res.json()).toEqual({ error: 'conflict', revision: 2 });
    expect(env.DIGIAPP_SAVES.store.get(ID)).toBe(antes);
    expect(env.DIGIAPP_SAVES.meta.get(ID)).toEqual(metaAntes);
    expect(env.DIGIAPP_SAVES.puts.length).toBe(putsAntes);
  });

  it('(e) reenvio do mesmo conteúdo com base velha após um 200 → 200 duplicate, sem regravar', async () => {
    const env = mkEnv();
    await post(env, { perfectDays: 1 }, { baseRevision: 0 }); // 200 "perdido" no cliente
    const putsAntes = env.DIGIAPP_SAVES.puts.length;
    const res = await post(env, { perfectDays: 1 }, { baseRevision: 0 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, revision: 1, duplicate: true });
    expect(env.DIGIAPP_SAVES.puts.length).toBe(putsAntes);
    expect(env.DIGIAPP_SAVES.meta.get(ID).r).toBe(1);
  });

  it('(f) renovação de TTL no GET preserva r e h', async () => {
    const env = mkEnv();
    await post(env, { perfectDays: 1 }, { baseRevision: 0 });
    const m0 = env.DIGIAPP_SAVES.meta.get(ID);
    env.DIGIAPP_SAVES.meta.set(ID, { ...m0, t: Date.now() - 40 * 86400_000 });
    const j = await (await get(env)).json();
    expect(j.revision).toBe(1);
    const m = env.DIGIAPP_SAVES.meta.get(ID);
    expect(m.t).toBeGreaterThan(Date.now() - 60_000); // renovou
    expect(m.r).toBe(1);
    expect(m.h).toBe(m0.h);
    expect(m.f).toBe(m0.f);
  });

  it('(g) rollback: valor gravado pelo código novo é JSON cru do state (formato inalterado)', async () => {
    const env = mkEnv();
    await post(env, { perfectDays: 7, totalXP: 3 }, { baseRevision: 0 });
    const cru = env.DIGIAPP_SAVES.store.get(ID);
    expect(typeof cru).toBe('string');
    expect(JSON.parse(cru)).toEqual({ perfectDays: 7, totalXP: 3 });
    expect(cru).not.toContain('revision');
    expect(cru).not.toContain('baseRevision');
  });
});
