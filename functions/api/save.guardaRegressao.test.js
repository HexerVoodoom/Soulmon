/**
 * Guarda de regressão do save (incidente 17/11/2026): save COM progresso nunca é trocado por um SEM progresso
 * (ou com totalXP < 50% do gravado) sem intenção explícita; o raw anterior vai para `savebak:` (TTL 30 d, máx. 5).
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './save.js';
import { saveTemProgresso as espelho, SAVEBAK_MAX, SAVEBAK_TTL_SECONDS } from './_saveGuard.js';
import { saveTemProgresso as cliente } from '../../src/utils/backupRing';

const ID = 'c'.repeat(32);
const REAL = { soulmonMeta: { name: 'x' }, totalXP: 10532, evolutionStage: 'ultimate-power', activities: [{ id: 1 }] };
const VAZIO = { totalXP: 0, evolutionStage: 'rookie', activities: [], completedTasks: [] };

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const meta = new Map();
  const ttl = new Map();
  return {
    store, meta, ttl,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, opts) => { store.set(k, v); if (opts?.metadata !== undefined) meta.set(k, opts.metadata); if (opts?.expirationTtl) ttl.set(k, opts.expirationTtl); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name, metadata: meta.get(name) })) }),
  };
}
const mkEnv = (seed) => ({ DIGIAPP_SAVES: fakeKV(seed) });
const post = (env, state, { query = '', ...extra } = {}) => onRequest({
  request: new Request(`https://x/api/save?id=${ID}${query}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state, ...extra }) }),
  env,
});
const baks = (env) => [...env.DIGIAPP_SAVES.store.keys()].filter(k => k.startsWith(`savebak:${ID}:`));
const gravado = (env) => JSON.parse(env.DIGIAPP_SAVES.store.get(ID));

describe('guarda de regressão — servidor', () => {
  it('vazio por cima de save com progresso: 409 regression, KV intacto, backup guardado', async () => {
    const env = mkEnv();
    expect((await post(env, REAL)).status).toBe(200);
    const antes = env.DIGIAPP_SAVES.store.get(ID);
    const r = await post(env, VAZIO);
    expect(r.status).toBe(409);
    expect((await r.json()).error).toBe('regression');
    expect(env.DIGIAPP_SAVES.store.get(ID)).toBe(antes);
    const b = baks(env);
    expect(b).toHaveLength(1);
    expect(env.DIGIAPP_SAVES.store.get(b[0])).toBe(antes);
    expect(env.DIGIAPP_SAVES.ttl.get(b[0])).toBe(SAVEBAK_TTL_SECONDS);
  });

  it('o caso do incidente: baseRevision certo não vence a guarda', async () => {
    const env = mkEnv();
    await post(env, REAL, { baseRevision: 0 });
    const r = await post(env, VAZIO, { baseRevision: 1 });
    expect(r.status).toBe(409);
    expect((await r.json()).error).toBe('regression');
    expect(gravado(env).totalXP).toBe(10532);
  });

  it('totalXP < 50% do gravado também é regressão; >= 50% passa', async () => {
    const env = mkEnv();
    await post(env, REAL);
    expect((await post(env, { ...REAL, totalXP: 5000 })).status).toBe(409);
    expect((await post(env, { ...REAL, totalXP: 5300 })).status).toBe(200);
  });

  it.each(['restore', 'rebirth', 'reset'])('intenção explícita %s permite e ainda guarda o backup', async (intencao) => {
    const env = mkEnv();
    await post(env, REAL);
    const antes = env.DIGIAPP_SAVES.store.get(ID);
    const r = await post(env, VAZIO, { query: `&allowRegression=${intencao}` });
    expect(r.status).toBe(200);
    expect(gravado(env).totalXP).toBe(0);
    const b = baks(env);
    expect(b).toHaveLength(1);
    expect(env.DIGIAPP_SAVES.store.get(b[0])).toBe(antes);
  });

  it('valor de intenção desconhecido não vale', async () => {
    const env = mkEnv();
    await post(env, REAL);
    expect((await post(env, VAZIO, { query: '&allowRegression=true' })).status).toBe(409);
    expect((await post(env, VAZIO, { query: '&allowRegression=' })).status).toBe(409);
  });

  it('sem regressão não guarda nada: progresso normal, conta nova e save gravado sem progresso', async () => {
    const env = mkEnv();
    expect((await post(env, VAZIO)).status).toBe(200); // conta nova
    expect((await post(env, VAZIO)).status).toBe(200); // vazio sobre vazio
    expect((await post(env, REAL)).status).toBe(200); // subir
    expect((await post(env, { ...REAL, totalXP: 20000 })).status).toBe(200);
    expect(baks(env)).toHaveLength(0);
  });

  it('tentativa recusada em loop não escreve backup repetido (mesmo hash)', async () => {
    const env = mkEnv();
    await post(env, REAL);
    for (let i = 0; i < 4; i++) expect((await post(env, VAZIO)).status).toBe(409);
    expect(baks(env)).toHaveLength(1);
  });

  it(`guarda no máximo ${SAVEBAK_MAX} backups por save (os mais antigos saem)`, async () => {
    const env = mkEnv();
    await post(env, REAL);
    for (let i = 1; i <= SAVEBAK_MAX + 3; i++) {
      // cada rodada: sobe um save diferente (nova versão real) e o regride com intenção
      await post(env, { ...REAL, totalXP: 10532 + i });
      expect((await post(env, VAZIO, { query: '&allowRegression=restore' })).status).toBe(200);
      await new Promise(r => setTimeout(r, 2)); // timestamps distintos
    }
    expect(baks(env)).toHaveLength(SAVEBAK_MAX);
  });

  it('falha ao guardar o backup (KV sem list/put do backup) não derruba a permissão; sem intenção segue recusando', async () => {
    const env = mkEnv();
    await post(env, REAL);
    const kv = env.DIGIAPP_SAVES;
    const put = kv.put;
    kv.put = async (k, v, o) => { if (k.startsWith('savebak:')) throw new Error('kv down'); return put(k, v, o); };
    expect((await post(env, VAZIO)).status).toBe(409);
    expect((await post(env, VAZIO, { query: '&allowRegression=restore' })).status).toBe(200);
  });
});

describe('paridade da régua de progresso (servidor x cliente)', () => {
  const casos = [
    null, undefined, 0, 'x', [], {}, { totalXP: 0 }, { totalXP: 1 }, { totalXP: -5 }, { totalXP: '10' }, { totalXP: NaN },
    { soulmonMeta: {} }, { soulmonMeta: null }, { demoCharacterId: 'a' }, { demoCharacterId: '' },
    { activities: [] }, { activities: [1] }, { activities: 'a' }, { completedTasks: [1] }, { completedTasks: {} },
    VAZIO, REAL, { evolutionStage: 'ultimate-power' },
  ];
  it.each(casos.map((c, i) => [i, c]))('caso %s', (_i, c) => {
    expect(espelho(c)).toBe(cliente(c));
  });
});
