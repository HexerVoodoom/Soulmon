/**
 * Bug do dono (04/11/2026): subia de rank e a lista do Torneio não mudava. A proximidade era medida por
 * `lifetimePoints` (monotônico, quase parado); agora é pelos pontos da SEASON — a ordem que o ranking mostra.
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';

const season = new Date().toISOString().slice(0, 7);
const ME = 'a'.repeat(32);
const ids = Array.from({ length: 8 }, (_, i) => String.fromCharCode(98 + i).repeat(32)); // b..i
const pid = (i) => String.fromCharCode(106 + i).repeat(24);

function fakeKV(seed) {
  const store = new Map(Object.entries(seed)); const meta = new Map();
  return {
    store,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, o) => { store.set(k, v); if (o?.metadata !== undefined) meta.set(k, o.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const mkEnv = (myPoints) => {
  const seed = {
    [`profile:${ME}`]: JSON.stringify({ id: ME, name: 'me', stage: 'rookie', pvpEnabled: true, pid: 'z'.repeat(24), lifetimePoints: 500 }),
    [`rank:${season}:${ME}`]: JSON.stringify({ points: myPoints, wins: 0, losses: 0, day: '2000-01-01', matchesToday: 0 }),
  };
  ids.forEach((id, i) => {
    seed[`profile:${id}`] = JSON.stringify({ id, name: `n${i}`, petName: 'B', stage: 'rookie', pvpEnabled: true, pid: pid(i), lifetimePoints: 500 });
    seed[`pid:${pid(i)}`] = id;
    seed[`rank:${season}:${id}`] = JSON.stringify({ points: i * 10, wins: 0, losses: 0, day: '2000-01-01', matchesToday: 0 });
  });
  return { DIGIAPP_SAVES: fakeKV(seed) };
};
const opponents = async (env) => {
  const r = await onRequest({ request: new Request(`https://x.dev/api/community?action=opponents&id=${ME}`), env });
  expect(r.status).toBe(200);
  return (await r.json()).opponents.map(o => o.id);
};
const pontosDe = (p) => ids.findIndex((_, i) => pid(i) === p) * 10;

describe('Torneio: oponentes pelo rank da SEASON', () => {
  it('lista centrada perto do jogador e acompanha quando ele sobe', async () => {
    for (let k = 0; k < 10; k++) {
      for (const p of await opponents(mkEnv(0))) expect(pontosDe(p)).toBeLessThanOrEqual(30);
      for (const p of await opponents(mkEnv(70))) expect(pontosDe(p)).toBeGreaterThanOrEqual(40);
    }
  });
  it('pontos alheios não saem na resposta', async () => {
    const r = await onRequest({ request: new Request(`https://x.dev/api/community?action=opponents&id=${ME}`), env: mkEnv(30) });
    expect(JSON.stringify(await r.json())).not.toMatch(/points|lifetime/i);
  });
});
