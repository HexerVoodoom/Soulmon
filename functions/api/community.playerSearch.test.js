import { describe, it, expect } from 'vitest';
import { onRequest, PLAYER_SEARCH_MAX, PLAYER_SEARCH_LIMIT } from './community.js';
import { claimNick, foldNome, nickFoldKey, nickKey } from './_profile.js';

// §321 (13/11/2026): a busca de jogadores por PREFIXO do convite do clã e da aba Amigos.
// Régua: começo do nome, sem acento e sem caixa; mínimo de 2 caracteres; no máximo 10; só campos públicos; quem se escondeu
// não aparece; teto por conta; o índice é uma `list` por prefixo (sem varrer perfis).

const sid = (n) => `save${String(n).padStart(28, '0')}`;
const pidDe = (n) => `${String(n).padStart(4, '0')}${'a'.repeat(20)}`;
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const listCalls = [];
  return {
    store, listCalls,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix, cursor, limit }) => {
      listCalls.push({ prefix, limit });
      const todas = [...store.keys()].filter(k => k.startsWith(prefix)).sort();
      const ini = cursor ? Number(cursor) : 0;
      const n = limit ?? 1000;
      const fatia = todas.slice(ini, ini + n);
      const fim = ini + n >= todas.length;
      return { keys: fatia.map(name => ({ name })), list_complete: fim, cursor: fim ? undefined : String(ini + n) };
    },
  };
}
/** Perfil com TUDO o que é privado preenchido — o teste confere que nada disso sai. */
const perfil = (n, name, extra = {}) => ({
  id: sid(n), pid: pidDe(n), name, petName: 'pet', stage: 'champion-power', pvpEnabled: true,
  email: `pessoa${n}@exemplo.com`, deviceId: `aparelho-${n}`, tasksDone: 99, lifetimePoints: 1234, friends: [sid(99)],
  attrs: { power: 1, harmony: 1, benevolence: 1 }, createdAt: Date.now(), ...extra,
});
async function mundo(pessoas, extra = {}) {
  const env = { DIGIAPP_SAVES: fakeKV(extra) };
  for (const [n, name, more] of pessoas) {
    const p = perfil(n, name, more);
    env.DIGIAPP_SAVES.store.set(`profile:${p.id}`, JSON.stringify(p));
    env.DIGIAPP_SAVES.store.set(`pid:${p.pid}`, p.id);
    await claimNick(env, p.id, name);
  }
  return env;
}
let ip = 0;
const buscar = (env, q, id = sid(1)) => onRequest({
  request: new Request(`https://x.dev/api/community?${new URLSearchParams({ action: 'playerSearch', id, q })}`, { headers: { 'CF-Connecting-IP': `10.0.0.${(ip++ % 250) + 1}` } }),
  env,
});

describe('foldNome — a régua de dobra', () => {
  it('tira acento, caixa e espaço sobrando', () => {
    expect(foldNome('  JOÃO  da   Silva ')).toBe('joao da silva');
    expect(foldNome('Ágata')).toBe('agata');
    expect(foldNome('Çarina')).toBe('carina');
  });
  it('o índice dobrado guarda o saveId no nome da chave (dois apelidos que dobram igual não colidem)', () => {
    expect(nickFoldKey('João', sid(2))).toBe(`nickf:joao:${sid(2)}`);
    expect(nickFoldKey('Joao', sid(3))).toBe(`nickf:joao:${sid(3)}`);
  });
});

describe('playerSearch — prefixo, sem acento e sem caixa', () => {
  it('"JOA" acha João, Joana e Joaquim (começo do nome), e não Ana Joaquina', async () => {
    const env = await mundo([[1, 'Eu'], [2, 'João'], [3, 'Joana'], [4, 'Joaquim'], [5, 'Ana Joaquina'], [6, 'Pedro']]);
    const r = await buscar(env, 'JOA');
    expect(r.status).toBe(200);
    const { players } = await r.json();
    expect(players.map(p => p.name).sort()).toEqual(['Joana', 'Joaquim', 'João']);
  });
  it('acento no termo também casa nome sem acento ("joã" acha "Joao")', async () => {
    const env = await mundo([[1, 'Eu'], [2, 'Joao']]);
    const { players } = await (await buscar(env, 'joã')).json();
    expect(players.map(p => p.name)).toEqual(['Joao']);
  });
  it('lê primeiro o índice dobrado por PREFIXO e depois só os NOMES das chaves `nick:` (não varre perfis)', async () => {
    const env = await mundo([[1, 'Eu'], [2, 'João']]);
    env.DIGIAPP_SAVES.listCalls.length = 0;
    await buscar(env, 'joa');
    expect(env.DIGIAPP_SAVES.listCalls).toEqual([{ prefix: 'nickf:joa', limit: 30 }, { prefix: 'nick:', limit: 1000 }]);
  });
});

// §356 (13/11/2026, bug em produção): o KV de produção tinha 178 chaves `nick:` e só 2 `nickf:` — o índice dobrado só nasce
// em `claimNick` (perfil salvo depois do deploy ou `backfillNicks`), e o perfil só sobe com PvP LIGADO. A busca não achava ninguém.
// Este mundo é o de PRODUÇÃO: apelido no índice `nick:` (com `nickof:`), perfil marcado `nickIx`, e NENHUMA chave `nickf:`.
async function mundoSemIndiceDobrado(pessoas) {
  const env = { DIGIAPP_SAVES: fakeKV() };
  for (const [n, name, more] of pessoas) {
    const p = perfil(n, name, { nickIx: true, ...more });
    const s = env.DIGIAPP_SAVES.store;
    s.set(`profile:${p.id}`, JSON.stringify(p));
    s.set(`pid:${p.pid}`, p.id);
    s.set(nickKey(name), p.id);
    s.set(`nickof:${p.id}`, nickKey(name));
  }
  for (const k of env.DIGIAPP_SAVES.store.keys()) expect(k.startsWith('nickf:')).toBe(false);
  return env;
}
const amigo = (env, search, id = sid(1)) => onRequest({
  request: new Request(`https://x.dev/api/community?${new URLSearchParams({ action: 'players', search, lookup: 'friend', id })}`, { headers: { 'CF-Connecting-IP': `10.1.0.${(ip++ % 250) + 1}` } }),
  env,
});

describe('playerSearch — jogador ainda fora do índice dobrado (o estado de produção, §356)', () => {
  it('o nome COMPLETO acha a pessoa', async () => {
    const env = await mundoSemIndiceDobrado([[1, 'Eu'], [2, 'Mari Silva'], [3, 'Pedro']]);
    const { players } = await (await buscar(env, 'Mari Silva')).json();
    expect(players.map(p => p.name)).toEqual(['Mari Silva']);
  });
  it('2 letras já sugerem, sem acento e sem caixa ("JO" acha João e Joana; não Ana Joaquina)', async () => {
    const env = await mundoSemIndiceDobrado([[1, 'Eu'], [2, 'João'], [3, 'Joana'], [4, 'Ana Joaquina']]);
    const { players } = await (await buscar(env, 'JO')).json();
    expect(players.map(p => p.name).sort()).toEqual(['Joana', 'João']);
    const sem = await (await buscar(env, 'joao')).json();
    expect(sem.players.map(p => p.name)).toEqual(['João']);
  });
  it('quem está com o PvP DESLIGADO aparece (o perfil dele nunca sobe sozinho para reindexar)', async () => {
    const env = await mundoSemIndiceDobrado([[1, 'Eu'], [2, 'Joana', { pvpEnabled: false }]]);
    const { players } = await (await buscar(env, 'joana')).json();
    expect(players.map(p => p.name)).toEqual(['Joana']);
    expect(players[0].id).toBe(pidDe(2));
  });
  it('a própria conta e quem saiu da lista pública (publicHidden) continuam fora', async () => {
    const env = await mundoSemIndiceDobrado([[1, 'Joel'], [2, 'João', { publicHidden: true }], [3, 'Joana']]);
    const { players } = await (await buscar(env, 'jo', sid(1))).json();
    expect(players.map(p => p.name)).toEqual(['Joana']);
  });
  it('índice dobrado parcial: quem já está nele e quem ainda não está aparecem juntos, sem repetir ninguém', async () => {
    const env = await mundoSemIndiceDobrado([[1, 'Eu'], [2, 'João'], [3, 'Joana']]);
    await claimNick(env, sid(2), 'João');
    const { players } = await (await buscar(env, 'jo')).json();
    expect(players.map(p => p.name).sort()).toEqual(['Joana', 'João']);
  });
  it('só campos públicos também pelo caminho do índice `nick:`', async () => {
    const env = await mundoSemIndiceDobrado([[1, 'Eu'], [2, 'João']]);
    const corpo = await (await buscar(env, 'joa')).text();
    for (const k of Object.keys(JSON.parse(corpo).players[0])) expect(['id', 'name', 'guildName', 'stage', 'spriteUrl', 'artLine']).toContain(k);
    for (const segredo of [sid(2), 'pessoa2@exemplo.com', 'aparelho-2', '1234', sid(99)]) expect(corpo).not.toContain(segredo);
  });
  it('a busca só LÊ: nenhuma chave nova no KV', async () => {
    const env = await mundoSemIndiceDobrado([[1, 'Eu'], [2, 'João', { pvpEnabled: false }]]);
    const antes = [...env.DIGIAPP_SAVES.store.keys()].sort();
    await buscar(env, 'joa');
    expect([...env.DIGIAPP_SAVES.store.keys()].sort()).toEqual(antes);
  });
  it('o "Convidar" pelo nome da aba Amigos (`lookup=friend`) acha o nome completo, inclusive com PvP desligado', async () => {
    const env = await mundoSemIndiceDobrado([[1, 'Eu'], [2, 'Mari Silva', { pvpEnabled: false }]]);
    const r = await amigo(env, 'Mari Silva');
    expect(r.status).toBe(200);
    expect((await r.json()).players.map(p => p.name)).toEqual(['Mari Silva']);
  });
});

describe('playerSearch — guarda-corpos', () => {
  it('mínimo de 2 caracteres: vazio, 1 letra e só espaços são 400 e não leem o índice', async () => {
    const env = await mundo([[1, 'Eu'], [2, 'João']]);
    env.DIGIAPP_SAVES.listCalls.length = 0;
    for (const q of ['', 'j', '   ', ' J ']) {
      const r = await buscar(env, q);
      expect(r.status).toBe(400);
      expect((await r.json()).error).toBe('query too short');
    }
    expect(env.DIGIAPP_SAVES.listCalls).toEqual([]);
  });
  it('devolve no máximo 10', async () => {
    const gente = [[1, 'Eu']];
    for (let i = 2; i <= 30; i++) gente.push([i, `Joana${i}`]);
    const env = await mundo(gente);
    const { players } = await (await buscar(env, 'jo')).json();
    expect(PLAYER_SEARCH_MAX).toBe(10);
    expect(players).toHaveLength(10);
  });
  it('só campos públicos: pid, nome, clã, estágio e arte — nunca saveId, e-mail, aparelho, pontos ou amigos', async () => {
    const env = await mundo([[1, 'Eu'], [2, 'João', { spriteUrl: '/api/sprite-image?k=' + 'a'.repeat(32), artLine: 'corvo' }]]);
    env.DIGIAPP_SAVES.store.set(`coopOf:${sid(2)}`, 'gid0000000001');
    env.DIGIAPP_SAVES.store.set('coop:gid0000000001', JSON.stringify({ id: 'gid0000000001', name: 'Os Lumes', members: [sid(2)] }));
    const corpo = await (await buscar(env, 'joa')).text();
    const { players } = JSON.parse(corpo);
    expect(players).toHaveLength(1);
    for (const k of Object.keys(players[0])) expect(['id', 'name', 'guildName', 'stage', 'spriteUrl', 'artLine']).toContain(k);
    expect(players[0]).toMatchObject({ id: pidDe(2), name: 'João', guildName: 'Os Lumes', stage: 'champion-power' });
    for (const segredo of [sid(2), 'pessoa2@exemplo.com', 'aparelho-2', '1234', sid(99), 'gid0000000001']) expect(corpo).not.toContain(segredo);
  });
  it('quem saiu da lista pública (publicHidden) não aparece; a própria conta também não', async () => {
    const env = await mundo([[1, 'Joel'], [2, 'João', { publicHidden: true }], [3, 'Joana']]);
    const { players } = await (await buscar(env, 'jo', sid(1))).json();
    expect(players.map(p => p.name)).toEqual(['Joana']);
  });
  it('índice velho (renomeou) não devolve o nome antigo: vale o nome atual do perfil', async () => {
    const env = await mundo([[1, 'Eu'], [2, 'João']]);
    const p = JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${sid(2)}`));
    env.DIGIAPP_SAVES.store.set(`profile:${sid(2)}`, JSON.stringify({ ...p, name: 'Marcos' }));
    const { players } = await (await buscar(env, 'joa')).json();
    expect(players).toEqual([]);
  });
  it('renomear tira a chave dobrada antiga e cria a nova', async () => {
    const env = await mundo([[1, 'Eu'], [2, 'João']]);
    await claimNick(env, sid(2), 'Marcos');
    expect(env.DIGIAPP_SAVES.store.has(`nickf:joao:${sid(2)}`)).toBe(false);
    expect(env.DIGIAPP_SAVES.store.has(`nickf:marcos:${sid(2)}`)).toBe(true);
    expect(env.DIGIAPP_SAVES.store.get(nickKey('Marcos'))).toBe(sid(2));
  });
  it('teto POR CONTA: depois de 30 buscas no minuto, 429 (mesmo trocando de IP)', async () => {
    const env = await mundo([[7, 'Eu'], [2, 'João']]);
    let ultimo = 200;
    for (let i = 0; i < PLAYER_SEARCH_LIMIT.limit + 1; i++) ultimo = (await buscar(env, 'joa', sid(7))).status;
    expect(ultimo).toBe(429);
  });
});
