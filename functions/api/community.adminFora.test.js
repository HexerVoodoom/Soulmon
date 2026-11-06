/**
 * GM/admin FORA de todo ranking do Torneio (06/11/2026) + histórico de temporadas ("Última temporada").
 * O servidor é a autoridade: o admin vem de `ADMIN_EMAILS` (saveId = hash do e-mail), nada do cliente.
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';
import { emailToSaveId } from './_auth.js';
import { readMail } from './_mensageiro.js';

const ADMIN_EMAIL = 'gm@example.test';
const ctxSeason = (off = 0) => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - off, 1)).toISOString().slice(0, 7); };
const season = ctxSeason(0), prev = ctxSeason(1), prev2 = ctxSeason(2);
const P = (c) => c.repeat(32);
const ids = { a: P('a'), b: P('b'), c: P('c'), d: P('d') };
const pidOf = (c) => c.repeat(24);

function fakeKV(seed) {
  const store = new Map(Object.entries(seed)); const meta = new Map();
  return {
    store,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, o) => { store.set(k, v); if (o?.metadata !== undefined) meta.set(k, o.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name, metadata: meta.get(name) })), list_complete: true }),
  };
}
const prof = (id, c, over = {}) => JSON.stringify({ id, name: `n${c}`, petName: 'B', stage: 'rookie', pvpEnabled: true, pid: pidOf(c), ...over });
const row = (points) => JSON.stringify({ points, wins: 0, losses: 0, day: '2000-01-01', matchesToday: 0 });

async function mkEnv(extra = {}) {
  const admin = await emailToSaveId(ADMIN_EMAIL);
  const seed = {
    [`profile:${admin}`]: prof(admin, 'g'), [`pid:${pidOf('g')}`]: admin,
    [`rank:${season}:${admin}`]: row(999), // admin com MAIS pontos que todo mundo
    ...extra,
  };
  for (const [c, id] of Object.entries(ids)) {
    seed[`profile:${id}`] = prof(id, c); seed[`pid:${pidOf(c)}`] = id;
  }
  seed[`rank:${season}:${ids.a}`] = row(300); seed[`rank:${season}:${ids.b}`] = row(200); seed[`rank:${season}:${ids.c}`] = row(100);
  return { admin, env: { DIGIAPP_SAVES: fakeKV(seed), ADMIN_EMAILS: ADMIN_EMAIL, SEASON_ADMIN_KEY: 'k' } };
}
const get = (env, qs) => onRequest({ request: new Request(`https://x.dev/api/community?${qs}`), env });
const post = (env, action, body) => onRequest({ request: new Request(`https://x.dev/api/community?action=${action}`, { method: 'POST', body: JSON.stringify(body) }), env });

describe('GM/admin fora do ranking do Torneio', () => {
  it('rank: o admin (999 pts) não aparece e não ocupa posição; os outros ficam com 1º/2º/3º', async () => {
    const { admin, env } = await mkEnv();
    const j = await (await get(env, `action=rank&id=${ids.a}`)).json();
    expect(j.rank.map(r => r.points)).toEqual([300, 200, 100]);
    expect(j.myPlace).toBe(1);
    const jc = await (await get(env, `action=rank&id=${ids.c}`)).json();
    expect(jc.myPlace).toBe(3);
    const ja = await (await get(env, `action=rank&id=${admin}`)).json();
    expect(ja.myPlace).toBeUndefined();
    expect(JSON.stringify(ja.rank)).not.toContain('999');
  });

  it('entrada ANTIGA do admin no índice sai da leitura, sem ser apagada do KV', async () => {
    const { admin, env } = await mkEnv({
      [`rankIndex:${season}`]: JSON.stringify({ v: 1, p: { [P('a')]: 300, [P('b')]: 200, [P('c')]: 100 }, done: true, cursor: null }),
    });
    const idx = JSON.parse(env.DIGIAPP_SAVES.store.get(`rankIndex:${season}`));
    idx.p[admin] = 999; env.DIGIAPP_SAVES.store.set(`rankIndex:${season}`, JSON.stringify(idx));
    const j = await (await get(env, `action=rank&id=${ids.b}`)).json();
    expect(j.rank.map(r => r.points)).toEqual([300, 200, 100]);
    expect(j.myPlace).toBe(2);
    expect(env.DIGIAPP_SAVES.store.has(`rank:${season}:${admin}`)).toBe(true);
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(`rankIndex:${season}`)).p[admin]).toBe(999);
  });

  it('seasonResult e closeSeason: sem troféu para o admin; o pódio sobe', async () => {
    const { env } = await mkEnv();
    const top = (await (await get(env, `action=seasonResult&season=${season}`)).json()).top3;
    expect(top.map(r => r.points)).toEqual([300, 200, 100]);
    const r = await (await post(env, 'closeSeason', { season, adminKey: 'k' })).json();
    expect(r.awarded).toBe(3);
    const pa = JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${ids.a}`));
    expect(pa.pendingTrophies).toEqual([{ season, place: 1 }]);
    const g = await emailToSaveId(ADMIN_EMAIL);
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${g}`)).pendingTrophies).toBeUndefined();
    // o pódio também vira histórico do jogador
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(`seasonHist:${ids.a}`)).s[season].place).toBe(1);
  });

  it('oponentes: o admin não é sorteado; e não dá para abrir duelo contra ele', async () => {
    const { env } = await mkEnv();
    for (let k = 0; k < 6; k++) {
      const j = await (await get(env, `action=opponents&id=${ids.a}`)).json();
      expect(j.opponents.map(o => o.id)).not.toContain(pidOf('g'));
    }
    const d = await post(env, 'duelStart', { id: ids.a, opponentId: pidOf('g') });
    expect(d.status).toBe(404);
  });

  it('carta de Honra da temporada: o admin não recebe e não desloca a colocação dos outros', async () => {
    const { admin, env } = await mkEnv({
      [`rank:${prev}:${P('a')}`]: row(300), [`rank:${prev}:${P('b')}`]: row(200),
    });
    env.DIGIAPP_SAVES.store.set(`rank:${prev}:${admin}`, row(999));
    // o índice da temporada passada já tem o admin no topo (entrada antiga)
    env.DIGIAPP_SAVES.store.set(`rankIndex:${prev}`, JSON.stringify({ v: 1, p: { [admin]: 999, [P('a')]: 300, [P('b')]: 200 }, done: true, cursor: null }));
    const kv = env.DIGIAPP_SAVES;
    expect(await readMail(env, kv, admin)).toEqual([]);
    const q = await readMail(env, kv, ids.a);
    expect(q[0].bodyPt).toContain('1º lugar');
  });
});

describe('Histórico de temporadas (seasonHistory)', () => {
  it('reconstrói a colocação final das temporadas encerradas, com melhor e última', async () => {
    const { env } = await mkEnv({
      [`rank:${prev}:${P('a')}`]: row(10), [`rank:${prev}:${P('b')}`]: row(50), [`rank:${prev}:${P('c')}`]: row(30),
      [`rank:${prev2}:${P('a')}`]: row(90), [`rank:${prev2}:${P('b')}`]: row(40),
    });
    const j = await (await get(env, `action=seasonHistory&id=${ids.a}`)).json();
    expect(j.seasons.map(s => [s.season, s.place])).toEqual([[prev, 3], [prev2, 1]]);
    expect(j.best).toEqual({ season: prev2, place: 1 });
    expect(j.last).toEqual({ season: prev, place: 3, points: 10 });
    expect(j.lastSeason).toBe(prev);
    // gravado: a segunda leitura não depende mais das linhas `rank:` (que o KV vence em 120 d)
    for (const k of [...env.DIGIAPP_SAVES.store.keys()]) if ((k.startsWith('rank:') && !k.includes(season)) || k.startsWith('rankIndex:')) env.DIGIAPP_SAVES.store.delete(k);
    const j2 = await (await get(env, `action=seasonHistory&id=${ids.a}`)).json();
    expect(j2.seasons.map(s => s.place)).toEqual([3, 1]);
  });

  it('nunca jogou: lista vazia, sem melhor e sem última', async () => {
    const { env } = await mkEnv();
    const j = await (await get(env, `action=seasonHistory&id=${ids.d}`)).json();
    expect(j).toMatchObject({ seasons: [], best: null, last: null });
  });

  it('admin: vazio e marcado como fora do ranking, mesmo com linhas antigas; e não desloca quem jogou', async () => {
    const { admin, env } = await mkEnv({ [`rank:${prev}:${P('a')}`]: row(10) });
    env.DIGIAPP_SAVES.store.set(`rank:${prev}:${admin}`, row(999));
    const j = await (await get(env, `action=seasonHistory&id=${admin}`)).json();
    expect(j).toMatchObject({ seasons: [], best: null, last: null, excluded: true });
    const ja = await (await get(env, `action=seasonHistory&id=${ids.a}`)).json();
    expect(ja.seasons[0]).toMatchObject({ season: prev, place: 1 });
  });
});
