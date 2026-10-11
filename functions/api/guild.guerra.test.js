import { describe, it, expect } from 'vitest';
import { onRequest } from './guild.js';
import { resolverGuerra, WAR_PTS } from './_guerra.js';
import { duelSide } from './_duel.js';

const DAY = 86_400_000;
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const meta = new Map();
  return {
    store, meta,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, o) => { store.set(k, v); if (o?.metadata !== undefined) meta.set(k, o.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const sid = r => r.padEnd(32, '0');
const perfil = (id, nome) => JSON.stringify({ id, name: nome, pid: `P${id.slice(0, 4)}${'q'.repeat(19)}`, petName: 'p', stage: 'rookie', attrs: {}, friends: [], createdAt: Date.now() });
const saveDe = (xp = 5000, extra = {}) => JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3, totalXP: xp, ...extra });
const req = (action, { method = 'POST', body, params = {} } = {}) =>
  new Request(`https://x.dev/api/guild?${new URLSearchParams({ action, ...params })}`, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined });
const call = (e, a, o) => onRequest({ request: req(a, o), env: e });
const J = r => r.json();

/** Várias guildas num mesmo KV: `{ nome: [saveIds…] }`. Todos têm save e perfil. */
async function mundo(guildas, { semSave = [] } = {}) {
  const seed = {};
  const todos = Object.values(guildas).flat();
  for (const m of todos) { seed[`profile:${m}`] = perfil(m, `N${m.slice(0, 3)}`); if (!semSave.includes(m)) seed[m] = saveDe(); }
  const kv = fakeKV(seed);
  for (const m of todos) kv.meta.set(m, { t: Date.now(), f: Date.now() - 90 * DAY });
  const e = { DIGIAPP_SAVES: kv };
  const out = {};
  for (const [nome, membros] of Object.entries(guildas)) {
    const c = await J(await call(e, 'guildCreate', { body: { id: membros[0], name: nome } }));
    for (const m of membros.slice(1)) await call(e, 'guildJoin', { body: { id: m, code: c.guild.code } });
    out[nome] = { id: c.guild.id, host: membros[0], membros };
  }
  return { e, g: out };
}
const mk = (p, n) => Array.from({ length: n }, (_, i) => sid(`${p}${i}`));
const seek = (e, id) => call(e, 'guildWarSeek', { body: { id } }).then(J);

describe('a guerra de guilda 4×4', () => {
  it('3 pareia com 3: a 1ª guilda espera, a 2ª resolve na hora e as duas veem o resultado', async () => {
    const { e, g } = await mundo({ Alfa: mk('a', 3), Beta: mk('b', 3) });
    const r1 = await seek(e, g.Alfa.host);
    expect(r1.state).toBe('waiting');
    expect(r1.war.waiting).toEqual({ size: 3 });
    const r2 = await seek(e, g.Beta.host);
    expect(r2.state).toBe('done');
    expect(r2.war.last.size).toBe(3);
    expect(r2.war.last.duels).toHaveLength(3);
    expect(r2.war.last.enemy).toBe('Alfa');
    const alfa = await J(await call(e, 'guildWar', { method: 'GET', params: { id: g.Alfa.host } }));
    expect(alfa.war.waiting).toBeNull();
    expect(alfa.war.last.enemy).toBe('Beta');
    // espelho: o que é vitória de um é derrota do outro (ou empate dos dois)
    const inv = { win: 'loss', loss: 'win', draw: 'draw' };
    expect(alfa.war.last.outcome).toBe(inv[r2.war.last.outcome]);
  });

  it('o pareamento é POR TAMANHO: 2 não encontra 3, nem 3 encontra 4', async () => {
    const { e, g } = await mundo({ Dois: mk('d', 2), Tres: mk('t', 3), Quatro: mk('q', 4) });
    expect((await seek(e, g.Dois.host)).state).toBe('waiting');
    expect((await seek(e, g.Tres.host)).state).toBe('waiting');
    expect((await seek(e, g.Quatro.host)).state).toBe('waiting');
  });

  it('guilda grande escala 4 e pareia com outra de 4 (não de 12)', async () => {
    const { e, g } = await mundo({ Grande: mk('g', 9), Quatro: mk('q', 4) });
    expect((await seek(e, g.Grande.host)).state).toBe('waiting');
    const r = await seek(e, g.Quatro.host);
    expect(r.state).toBe('done');
    expect(r.war.last.size).toBe(4);
  });

  it('1 pessoa (ou só 1 com ficha) é pequena demais; uma guerra por dia; a mesma guilda não luta contra si', async () => {
    const solo = await mundo({ Solo: mk('s', 1) });
    expect((await seek(solo.e, solo.g.Solo.host)).state).toBe('small');
    const { e, g } = await mundo({ Alfa: mk('a', 3), Beta: mk('b', 3) }, { semSave: [sid('a1'), sid('a2')] });
    expect((await seek(e, g.Alfa.host)).state).toBe('small'); // só 1 tem ficha
    const dois = await mundo({ X: mk('x', 2), Y: mk('y', 2) });
    await seek(dois.e, dois.g.X.host);
    expect((await seek(dois.e, dois.g.X.membros[1])).state).toBe('waiting'); // já está na fila: não luta contra si
    await seek(dois.e, dois.g.Y.host);
    expect((await seek(dois.e, dois.g.Y.host)).state).toBe('already');
  });

  it('a resposta nunca carrega saveId, estágio, HP nem dano', async () => {
    const { e, g } = await mundo({ Alfa: mk('a', 2), Beta: mk('b', 2) });
    await seek(e, g.Alfa.host);
    const txt = JSON.stringify(await seek(e, g.Beta.host));
    for (const m of [...g.Alfa.membros, ...g.Beta.membros]) expect(txt).not.toContain(m);
    for (const proibido of ['rookie', 'hp', 'dmg', 'damage', 'roster', 'level', 'xp']) expect(txt.toLowerCase()).not.toContain(proibido);
  });

  it('o resultado rega a casa das duas guildas (perder nunca rende zero)', async () => {
    const { e, g } = await mundo({ Alfa: mk('a', 2), Beta: mk('b', 2) });
    await seek(e, g.Alfa.host);
    await seek(e, g.Beta.host);
    for (const k of ['Alfa', 'Beta']) {
      const raw = JSON.parse(e.DIGIAPP_SAVES.store.get(`coopCasa:${g[k].id}:${g[k].host}`));
      expect(raw.pts.guerra).toBeGreaterThanOrEqual(WAR_PTS.loss);
    }
  });

  it('sem guilda, 404; método errado, 400', async () => {
    const e = { DIGIAPP_SAVES: fakeKV({ [`profile:${sid('z0')}`]: perfil(sid('z0'), 'Z') }) };
    expect((await call(e, 'guildWarSeek', { body: { id: sid('z0') } })).status).toBe(404);
    expect((await call(e, 'guildWar', { method: 'POST', body: { id: sid('z0') } })).status).toBe(400);
  });
});

describe('resolverGuerra — pura e determinística', () => {
  const lado = (xp) => ({ save: 's', side: duelSide({ evolutionStage: 'rookie', perfectDays: 3, totalXP: xp }, { maxLevel: 99 }) });
  it('mesma semente, mesmo resultado; o time bem mais forte vence', () => {
    const fracos = [lado(100), lado(100)], fortes = [lado(200000), lado(200000)];
    const a = resolverGuerra(fortes, fracos, 'x'), b = resolverGuerra(fortes, fracos, 'x');
    expect(a).toEqual(b);
    expect(a.aWins).toBeGreaterThanOrEqual(a.bWins);
    expect(a.duels).toHaveLength(2);
  });
});
