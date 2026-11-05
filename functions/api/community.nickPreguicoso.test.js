import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';

// Indexação preguiçosa do apelido: perfil anterior ao índice `nick:` entra ao salvar, sem backfill do dono.
const ID = 'c'.repeat(32);
const OUTRO = 'd'.repeat(32);

function fakeKV(seed = {}, { falhaNick = false } = {}) {
  const store = new Map(Object.entries(seed));
  const ops = { gets: [], puts: [] };
  return {
    store, ops,
    get: async k => { ops.gets.push(k); if (falhaNick && k.startsWith('nick')) throw new Error('kv down'); return store.get(k) ?? null; },
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }),
    put: async (k, v) => { ops.puts.push(k); store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async () => ({ keys: [], list_complete: true }),
  };
}
const antigo = (name, extra = {}) => JSON.stringify({ id: ID, pid: 'ee'.repeat(12), name, stage: 'rookie', pvpEnabled: false, attrs: { power: 0, harmony: 0, benevolence: 0 }, createdAt: 1, ...extra });
const salvar = (env, body = {}) => onRequest({
  request: new Request(`https://x.dev/api/community?action=profile&id=${ID}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: ID, ...body }),
  }), env,
});
const mk = (seed, opt) => ({ DIGIAPP_SAVES: fakeKV(seed, opt) });
const nickPuts = (env) => env.DIGIAPP_SAVES.ops.puts.filter(k => k.startsWith('nick'));

describe('indice de apelido ao salvar', () => {
  it('indexa o perfil antigo sem nome no corpo, e uma vez so', async () => {
    const env = mk({ [`profile:${ID}`]: antigo('Zelda') });
    expect((await salvar(env)).status).toBe(200);
    expect(env.DIGIAPP_SAVES.store.get('nick:zelda')).toBe(ID);
    expect(env.DIGIAPP_SAVES.store.get(`nickof:${ID}`)).toBe('nick:zelda');
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${ID}`)).nickIx).toBe(true);
    env.DIGIAPP_SAVES.ops.gets.length = 0; env.DIGIAPP_SAVES.ops.puts.length = 0;
    await salvar(env);
    expect(env.DIGIAPP_SAVES.ops.gets.filter(k => k.startsWith('nick'))).toEqual([]);
    expect(nickPuts(env)).toEqual([]);
  });
  it('colisao: nao rouba apelido alheio e o save segue', async () => {
    const env = mk({ [`profile:${ID}`]: antigo('Zelda'), 'nick:zelda': OUTRO });
    expect((await salvar(env)).status).toBe(200);
    expect(env.DIGIAPP_SAVES.store.get('nick:zelda')).toBe(OUTRO);
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${ID}`)).nickIx).toBeUndefined();
  });
  it('Anonimo nao e indexado', async () => {
    const env = mk({ [`profile:${ID}`]: antigo('Anônimo') });
    await salvar(env);
    expect(nickPuts(env)).toEqual([]);
  });
  it('falha do KV no indice nunca quebra o save', async () => {
    const env = mk({ [`profile:${ID}`]: antigo('Zelda') }, { falhaNick: true });
    const r = await salvar(env);
    expect(r.status).toBe(200);
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${ID}`)).name).toBe('Zelda');
  });
});
