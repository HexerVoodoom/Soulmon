import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';
import { nickKey } from './_profile.js';

// Busca de jogadores: acha QUALQUER um pelo índice de apelidos (antes: só os 300 primeiros perfis).

const sid = (n) => String(n).padStart(32, '0');
function fakeKV(seed = {}, pageSize = 1000) {
  const store = new Map(Object.entries(seed));
  const listCalls = [];
  return {
    store, listCalls,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix, cursor, limit }) => {
      listCalls.push(prefix);
      const todas = [...store.keys()].filter(k => k.startsWith(prefix)).sort();
      const ini = cursor ? Number(cursor) : 0;
      const n = Math.min(limit ?? 1000, pageSize);
      const fatia = todas.slice(ini, ini + n);
      const fim = ini + n >= todas.length;
      return { keys: fatia.map(name => ({ name })), list_complete: fim, cursor: fim ? undefined : String(ini + n) };
    },
  };
}
const perfil = (id, name, extra = {}) => JSON.stringify({
  id, name, petName: 'pet', stage: 'rookie', pvpEnabled: true, attrs: { power: 1, harmony: 1, benevolence: 1 }, friends: [], createdAt: Date.now(), tasksDone: 1, ...extra,
});
const ADMIN = 'k'.repeat(24);
function mundo(total, extra = {}) {
  const seed = {};
  for (let i = 1; i <= total; i++) {
    const nome = `jogador${i}`;
    seed[`profile:${sid(i)}`] = perfil(sid(i), nome);
    seed[nickKey(nome)] = sid(i);
  }
  return { DIGIAPP_SAVES: fakeKV({ ...seed, ...extra }), SEASON_ADMIN_KEY: ADMIN };
}
const get = (env, params) => onRequest({ request: new Request(`https://x.dev/api/community?${new URLSearchParams({ action: 'players', ...params })}`), env });

describe('players?search — índice de apelidos', () => {
  it('acha jogador além da posição 300', async () => {
    const env = mundo(700);
    const { players } = await (await get(env, { search: 'jogador699' })).json();
    expect(players.map(p => p.name)).toEqual(['jogador699']);
  });
  it('não varre perfis: o custo da busca é lista de nick: + gets só de quem casa', async () => {
    const env = mundo(700);
    await get(env, { search: 'jogador650' });
    expect(new Set(env.DIGIAPP_SAVES.listCalls)).toEqual(new Set(['nick:']));
  });
  it('respeita o consentimento: PvP desligado ou escondido não aparece', async () => {
    const env = mundo(0, {
      [`profile:${sid(1)}`]: perfil(sid(1), 'segredo', { pvpEnabled: false }), [nickKey('segredo')]: sid(1),
      [`profile:${sid(2)}`]: perfil(sid(2), 'segredo2', { pvpEnabled: true, publicHidden: true }), [nickKey('segredo2')]: sid(2),
    });
    const { players } = await (await get(env, { search: 'segredo' })).json();
    expect(players).toEqual([]);
  });
  it('casa por trecho (não só prefixo) e devolve no máximo 50', async () => {
    const env = mundo(120);
    const { players } = await (await get(env, { search: 'jogador' })).json();
    expect(players.length).toBe(50);
    const um = await (await get(env, { search: 'dor11' })).json();
    expect(um.players.map(p => p.name)).toContain('jogador11');
  });
});

describe('backfillNicks — caminho seguro para perfis sem índice', () => {
  const post = (env, body) => onRequest({ request: new Request('https://x.dev/api/community?action=backfillNicks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }), env });
  it('recusa sem a chave de admin', async () => {
    const env = mundo(0);
    expect((await post(env, {})).status).toBe(401);
    expect((await post(env, { adminKey: 'errada' })).status).toBe(401);
  });
  it('indexa perfil antigo por lotes, não rouba apelido alheio e é idempotente; depois a busca acha', async () => {
    const env = mundo(0, {
      [`profile:${sid(1)}`]: perfil(sid(1), 'Antigo'),
      [`profile:${sid(2)}`]: perfil(sid(2), 'Ocupado'), [nickKey('Ocupado')]: sid(9),
      [`profile:${sid(3)}`]: perfil(sid(3), 'Anônimo'),
    });
    expect((await (await get(env, { search: 'antigo' })).json()).players).toEqual([]);
    const r = await (await post(env, { adminKey: ADMIN })).json();
    expect(r.done).toBe(true);
    expect(r.indexed).toBe(1);
    expect(r.taken).toBe(1);
    expect(r.skipped).toBe(1);
    expect(env.DIGIAPP_SAVES.store.get(nickKey('Ocupado'))).toBe(sid(9));
    expect((await (await get(env, { search: 'antigo' })).json()).players.map(p => p.name)).toEqual(['Antigo']);
    const r2 = await (await post(env, { adminKey: ADMIN })).json();
    expect(r2.taken).toBe(1);
    expect(env.DIGIAPP_SAVES.store.get(nickKey('Antigo'))).toBe(sid(1));
  });
});
