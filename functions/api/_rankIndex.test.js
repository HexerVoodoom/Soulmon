// Índice ordenado da season (REGISTRO §23, decisão do dono 31/10/2026): pódio e posição saem da season INTEIRA,
// não das 300 primeiras chaves `rank:` em ordem de saveId.
import { describe, it, expect, vi } from 'vitest';
import { onRequest } from './community.js';
import { completarIndice, lerIndice, ordenar } from './_rankIndex.js';

/** KV falso com `list` ordenado, paginado por `cursor`/`limit` e com `metadata`; conta `get`s. */
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed).map(([k, v]) => [k, { v }]));
  const kv = {
    store, gets: 0,
    get: async k => { kv.gets++; return store.get(k)?.v ?? null; },
    getWithMetadata: async k => ({ value: store.get(k)?.v ?? null, metadata: store.get(k)?.m ?? null }),
    put: async (k, v, o) => { store.set(k, { v, m: o?.metadata }); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '', cursor, limit = 1000 }) => {
      const names = [...store.keys()].filter(k => k.startsWith(prefix)).sort();
      const ini = cursor ? Number(cursor) : 0;
      const fatia = names.slice(ini, ini + limit);
      const fim = ini + fatia.length >= names.length;
      return { keys: fatia.map(name => ({ name, metadata: store.get(name).m })), list_complete: fim, cursor: fim ? undefined : String(ini + fatia.length) };
    },
  };
  return kv;
}

const SEASON = '2026-08';
const KEY = 'chave-de-admin';
const id = n => n.toString(16).padStart(32, '0');
const rankRow = points => JSON.stringify({ points, wins: 1, losses: 0 });
const perfil = sid => JSON.stringify({ id: sid, name: `n-${sid.slice(-4)}`, pvpEnabled: true, friends: [] });
const fechar = env => onRequest({
  request: new Request('https://x.dev/api/community?action=closeSeason', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ season: SEASON, adminKey: KEY }),
  }),
  env,
});

function seasonCom(n, campeao) {
  const seed = {};
  for (let i = 0; i < n; i++) seed[`rank:${SEASON}:${id(i)}`] = rankRow(10);
  seed[`rank:${SEASON}:${campeao}`] = rankRow(999);
  seed[`profile:${campeao}`] = perfil(campeao);
  return seed;
}

describe('índice da season — pódio além das 300 primeiras chaves', () => {
  it('regressão: o campeão com o saveId MAIOR de 350 jogadores leva o 1º lugar', async () => {
    const campeao = 'f'.repeat(32);
    const env = { DIGIAPP_SAVES: fakeKV(seasonCom(350, campeao)), SEASON_ADMIN_KEY: KEY };
    const res = await fechar(env);
    expect(res.status).toBe(200);
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${campeao}`).v).pendingTrophies).toEqual([{ season: SEASON, place: 1 }]);
  });

  it('índice incompleto depois do lote: fecha pelo caminho antigo (300 chaves) com log `season.close.fallback`', async () => {
    const campeao = id(5); // dentro das 300 primeiras chaves por saveId
    const seed = {};
    for (let i = 0; i < 700; i++) seed[`rank:${SEASON}:${id(i)}`] = rankRow(10);
    seed[`rank:${SEASON}:${campeao}`] = rankRow(999);
    seed[`profile:${campeao}`] = perfil(campeao);
    const env = { DIGIAPP_SAVES: fakeKV(seed), SEASON_ADMIN_KEY: KEY };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r1 = await fechar(env);
    expect(r1.status).toBe(200);
    expect(warn.mock.calls.some(c => String(c[0]).includes('season.close.fallback'))).toBe(true);
    expect(env.DIGIAPP_SAVES.store.has(`closed:${SEASON}`)).toBe(true);
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${campeao}`).v).pendingTrophies).toEqual([{ season: SEASON, place: 1 }]);
    warn.mockRestore();
  });
});

describe('completarIndice — preenchimento por lotes', () => {
  it('respeita o orçamento de `get` e não pula chave entre lotes', async () => {
    const seed = {};
    for (let i = 0; i < 25; i++) seed[`rank:${SEASON}:${id(i)}`] = rankRow(i);
    const kv = fakeKV(seed);
    const env = { DIGIAPP_SAVES: kv };
    let idx;
    for (let i = 0; i < 10; i++) {
      kv.gets = 0;
      idx = await completarIndice(env, SEASON, 10);
      expect(kv.gets).toBeLessThanOrEqual(10 + 2); // + leitura e releitura do próprio índice
      if (idx.done) break;
    }
    expect(idx.done).toBe(true);
    expect(Object.keys(idx.p)).toHaveLength(25);
    expect(ordenar(idx.p)[0]).toEqual({ owner: id(24), points: 24 });
  });

  it('linha nova (com `metadata.pts`) entra pelo `list`, sem `get` por linha', async () => {
    const kv = fakeKV();
    for (let i = 0; i < 30; i++) await kv.put(`rank:${SEASON}:${id(i)}`, rankRow(i), { metadata: { pts: i } });
    kv.gets = 0;
    const idx = await completarIndice({ DIGIAPP_SAVES: kv }, SEASON, 5);
    expect(idx.done).toBe(true);
    expect(kv.gets).toBe(2);
    expect((await lerIndice({ DIGIAPP_SAVES: kv }, SEASON)).p[id(29)]).toBe(29);
  });
});
