import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { onRequest } from './community.js';
import { legacyPidFor } from './_profile.js';

// L07-04: rank anônimo não pode regravar perfil de terceiro.
// L07-06: closeSeason compara a chave em tempo constante.

const ALICE = 'a'.repeat(32);
const BRUNO = 'b'.repeat(32);
const SEASON = new Date().toISOString().slice(0, 7);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const writes = [];
  return {
    store, writes,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }),
    put: async (k, v) => { writes.push(['put', k]); store.set(k, v); },
    delete: async k => { writes.push(['delete', k]); store.delete(k); },
    list: async ({ prefix }) => ({
      keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })),
      list_complete: true,
    }),
  };
}
const perfil = (id, pid, name) => JSON.stringify({
  id, pid, name, petName: `pet-${name}`, stage: 'rookie', pvpEnabled: true,
  attrs: { power: 1, harmony: 1, benevolence: 1 }, friends: [], createdAt: Date.now(),
});
const rank = p => JSON.stringify({ points: p, wins: 1, losses: 0, day: '2000-01-01', matchesToday: 0 });

describe('L07-04 rank anônimo é só leitura', () => {
  it('perfil de terceiro com pid legado: nenhuma escrita, id null', async () => {
    const legado = await legacyPidFor(BRUNO);
    const kv = fakeKV({
      [`profile:${BRUNO}`]: perfil(BRUNO, legado, 'Bruno'),
      [`pid:${legado}`]: BRUNO,
      [`rank:${SEASON}:${BRUNO}`]: rank(50),
    });
    kv.writes.length = 0;
    const res = await onRequest({
      request: new Request('https://x.dev/api/community?action=rank'),
      env: { DIGIAPP_SAVES: kv },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rank[0].id).toBeNull();
    expect(body.rank[0].name).toBe('Bruno');
    expect(kv.writes).toEqual([]);
    expect(JSON.parse(kv.store.get(`profile:${BRUNO}`)).pid).toBe(legado);
  });
});

describe('L07-06 closeSeason: chave em tempo constante', () => {
  const KEY = 'chave-de-admin';
  const fechar = (adminKey) => onRequest({
    request: new Request('https://x.dev/api/community?action=closeSeason', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ season: '2026-08', adminKey }),
    }),
    env: { DIGIAPP_SAVES: fakeKV({ [`rank:2026-08:${ALICE}`]: rank(5) }), SEASON_ADMIN_KEY: KEY },
  });

  it('chave errada 401', async () => {
    expect((await fechar('errada')).status).toBe(401);
    expect((await fechar(KEY + 'x')).status).toBe(401);
    expect((await fechar(undefined)).status).toBe(401);
  });
  it('chave certa segue', async () => {
    expect((await fechar(KEY)).status).not.toBe(401);
  });
  it('estrutural: não usa adminKey !==', () => {
    const src = readFileSync(new URL('./community.js', import.meta.url), 'utf8');
    expect(src).not.toMatch(/adminKey\s*!==?/);
    expect(src).toMatch(/secretEquals\(adminKey/);
  });
});
