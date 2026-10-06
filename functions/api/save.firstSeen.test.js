/**
 * `metadata.f` — a data da 1ª gravação do save (combate v3, PR5, contexto §2.15 P3 e §2.19).
 *
 * É o relógio do servidor que o teto S1 do duelo lê (`_duel.js` › `maxLevelFor`): o cliente escreve o
 * save inteiro, mas NÃO escreve este campo. Aqui se trava: o `f` nasce na 1ª gravação, atravessa toda
 * gravação seguinte e a renovação de TTK do GET, nunca vem do cliente e nunca entra no state (a
 * contagem de campos do save — `fuzz2`, 103 — não muda).
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './save.js';

const ID = 'a'.repeat(32);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const meta = new Map();
  return {
    store, meta,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, opts) => { store.set(k, v); if (opts?.metadata !== undefined) meta.set(k, opts.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
  };
}
const mkEnv = (seed) => ({ DIGIAPP_SAVES: fakeKV(seed) });
const post = (env, state, extra = {}) => onRequest({
  request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state, ...extra }) }),
  env,
});
const get = (env) => onRequest({ request: new Request(`https://x/api/save?id=${ID}`), env });

describe('metadata.f — a 1ª gravação do save', () => {
  it('a 1ª gravação grava f = agora', async () => {
    const env = mkEnv();
    const antes = Date.now();
    await post(env, { perfectDays: 3 });
    const m = env.DIGIAPP_SAVES.meta.get(ID);
    expect(m.f).toBeGreaterThanOrEqual(antes);
    expect(m.f).toBeLessThanOrEqual(Date.now());
    expect(m.t).toBeGreaterThanOrEqual(antes);
  });

  it('gravações seguidas PRESERVAM o f (só o t avança)', async () => {
    const env = mkEnv();
    await post(env, { perfectDays: 1 });
    const f0 = 1_700_000_000_000;
    env.DIGIAPP_SAVES.meta.set(ID, { t: 5, f: f0 });
    await post(env, { perfectDays: 2 });
    await post(env, { perfectDays: 3 });
    const m = env.DIGIAPP_SAVES.meta.get(ID);
    expect(m.f).toBe(f0);
    expect(m.t).toBeGreaterThan(5);
  });

  it('save gravado ANTES da regra (metadata sem f) recebe f = agora na 1ª gravação nova', async () => {
    const env = mkEnv({ [ID]: JSON.stringify({ perfectDays: 40 }) });
    env.DIGIAPP_SAVES.meta.set(ID, { t: 5 });
    const antes = Date.now();
    await post(env, { perfectDays: 41 });
    expect(env.DIGIAPP_SAVES.meta.get(ID).f).toBeGreaterThanOrEqual(antes);
  });

  it('a renovação de prazo do GET (save velho) não perde o f', async () => {
    const env = mkEnv({ [ID]: JSON.stringify({ perfectDays: 2 }) });
    const f0 = 1_700_000_000_000;
    env.DIGIAPP_SAVES.meta.set(ID, { t: Date.now() - 40 * 86400_000, f: f0 });
    const res = await get(env);
    expect((await res.json()).found).toBe(true);
    const m = env.DIGIAPP_SAVES.meta.get(ID);
    expect(m.t).toBeGreaterThan(Date.now() - 60_000); // renovou
    expect(m.f).toBe(f0);
  });

  it('o cliente NÃO escolhe o f: `metadata`, `f` e `firstSeen` no corpo ou no state são ignorados', async () => {
    const env = mkEnv();
    await post(env, { perfectDays: 1, f: 1, firstSeen: 1, metadata: { f: 1 } }, { f: 1, metadata: { f: 1 } });
    const m = env.DIGIAPP_SAVES.meta.get(ID);
    expect(m.f).toBeGreaterThan(1_000_000_000_000);
    // e um f forjado/lixo no metadata antigo nunca é "preservado"
    for (const lixo of [0, -5, NaN, 'x', null, Infinity]) {
      env.DIGIAPP_SAVES.meta.set(ID, { t: 5, f: lixo });
      await post(env, { perfectDays: 2 });
      expect(Number.isFinite(env.DIGIAPP_SAVES.meta.get(ID).f), String(lixo)).toBe(true);
      expect(env.DIGIAPP_SAVES.meta.get(ID).f).toBeGreaterThan(1_000_000_000_000);
    }
  });

  it('nada vai para o state: os campos do save gravado são os que o cliente mandou (a contagem não muda)', async () => {
    const env = mkEnv();
    const state = { perfectDays: 3, totalXP: 10, evolutionStage: 'rookie' };
    await post(env, state);
    expect(Object.keys(JSON.parse(env.DIGIAPP_SAVES.store.get(ID))).sort()).toEqual(Object.keys(state).sort());
    const lido = (await (await get(env)).json()).state;
    expect(Object.keys(lido).filter(k => !['accountTier', 'credits'].includes(k)).sort()).toEqual(Object.keys(state).sort());
  });
});
