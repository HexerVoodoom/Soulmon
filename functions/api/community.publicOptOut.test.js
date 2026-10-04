import { describe, it, expect, vi, afterEach } from 'vitest';
import { onRequest } from './community.js';

// TORC-5 (02/10/2026) — opt-out da lista PÚBLICA do Torneio.
//
// Com o PvP automático no Vínculo 5, o apelido e o Soulmon entram na lista
// pública sem gesto da pessoa. O dono pediu um interruptor discreto em
// Configurações (ligado por padrão). Estes testes travam o lado do SERVIDOR:
// `publicHidden` no perfil tira a pessoa de TODA rota que serve dado dela a
// terceiros — e a remoção vale na hora, na mesma chamada que muda a escolha.
//
// A régua de vazamento é por TEXTO: o apelido de quem saiu não pode aparecer
// em nenhum corpo de resposta, em nenhuma rota.

const ALICE = 'a'.repeat(32); // quem consulta
const BRUNO = 'b'.repeat(32); // quem pode sair da lista
const CAROL = 'c'.repeat(32);
const PID_B = 'bb'.repeat(12);
const PID_C = 'cc'.repeat(12);
const PID_A = 'aa'.repeat(12);
const SEGREDO = 'ApelidoSecretoDoBruno';
const SEASON = new Date().toISOString().slice(0, 7);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix }) => ({
      keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })),
      list_complete: true,
    }),
  };
}

const perfil = (id, pid, name, extra = {}) => JSON.stringify({
  id, pid, name, petName: `pet-${name}`, stage: 'rookie', pvpEnabled: true,
  attrs: { power: 1, harmony: 1, benevolence: 1 },
  friends: [], createdAt: Date.now(), tasksDone: 3, ...extra,
});
const rank = (points) => JSON.stringify({ points, wins: 1, losses: 0, day: '2000-01-01', matchesToday: 0 });

function mundo(extraB = {}) {
  return {
    DIGIAPP_SAVES: fakeKV({
      [`profile:${ALICE}`]: perfil(ALICE, PID_A, 'Alice'),
      [`profile:${BRUNO}`]: perfil(BRUNO, PID_B, SEGREDO, { lifetimePoints: 77, ...extraB }),
      [`profile:${CAROL}`]: perfil(CAROL, PID_C, 'Carol'),
      [`pid:${PID_A}`]: ALICE, [`pid:${PID_B}`]: BRUNO, [`pid:${PID_C}`]: CAROL,
      [`rank:${SEASON}:${ALICE}`]: rank(10),
      [`rank:${SEASON}:${BRUNO}`]: rank(99),
      [`rank:${SEASON}:${CAROL}`]: rank(20),
    }),
  };
}

const get = (env, action, params = {}) => onRequest({
  request: new Request(`https://x.dev/api/community?${new URLSearchParams({ action, ...params })}`),
  env,
});
const post = (env, action, id, body) => onRequest({
  request: new Request(`https://x.dev/api/community?action=${action}&id=${id}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, ...body }),
  }),
  env,
});
const alternar = (env, publicHidden) => post(env, 'profile', BRUNO, { name: SEGREDO, pvpEnabled: true, publicHidden });

/** Corpo cru de todas as rotas que servem dado de OUTRA pessoa à Alice. */
async function varrerRotas(env) {
  const textos = [];
  textos.push(await (await get(env, 'players')).text());
  textos.push(await (await get(env, 'players', { search: 'secreto' })).text());
  textos.push(await (await get(env, 'player', { id: PID_B })).text());
  textos.push(await (await get(env, 'opponents', { id: ALICE })).text());
  textos.push(await (await get(env, 'rank', { season: SEASON })).text());
  textos.push(await (await get(env, 'rank', { season: SEASON, id: ALICE })).text());
  textos.push(await (await get(env, 'seasonResult', { season: SEASON })).text());
  return textos;
}

describe('opt-out da lista pública — o servidor respeita a flag por conta', () => {
  it('padrão: quem não optou aparece (diretório, oponentes e ranking)', async () => {
    const env = mundo();
    const { players } = await (await get(env, 'players')).json();
    expect(players.map(p => p.name)).toContain(SEGREDO);
    const { rank: r } = await (await get(env, 'rank', { season: SEASON })).json();
    expect(r.map(x => x.name)).toContain(SEGREDO);
  });

  it('ligar o opt-out remove da lista, dos oponentes e do ranking NA HORA — e o apelido não sai por rota nenhuma', async () => {
    const env = mundo();
    const res = await alternar(env, true);
    expect((await res.json()).publicHidden).toBe(true);
    for (const t of await varrerRotas(env)) expect(t).not.toContain(SEGREDO);
    const { players } = await (await get(env, 'players')).json();
    expect(players.map(p => p.name)).toEqual(['Alice', 'Carol']);
    const { opponents } = await (await get(env, 'opponents', { id: ALICE })).json();
    expect(opponents.map(o => o.name)).toEqual(['Carol']);
    const { rank: r } = await (await get(env, 'rank', { season: SEASON })).json();
    expect(r.map(x => x.name)).toEqual(['Carol', 'Alice']);
    const { top3 } = await (await get(env, 'seasonResult', { season: SEASON })).json();
    expect(top3.map(x => x.name)).not.toContain(SEGREDO);
  });

  it('o perfil de quem saiu responde como inexistente (não confirma a conta)', async () => {
    const env = mundo({ publicHidden: true });
    expect(await (await get(env, 'player', { id: PID_B })).json()).toEqual({ found: false });
  });

  it('reativar devolve a pessoa a todas as listas', async () => {
    const env = mundo();
    await alternar(env, true);
    await alternar(env, false);
    const { players } = await (await get(env, 'players')).json();
    expect(players.map(p => p.name)).toContain(SEGREDO);
    const { opponents } = await (await get(env, 'opponents', { id: ALICE })).json();
    expect(opponents.map(o => o.name)).toContain(SEGREDO);
    const { rank: r } = await (await get(env, 'rank', { season: SEASON })).json();
    expect(r.map(x => x.name)).toContain(SEGREDO);
  });

  it('cliente antigo (sem o campo) NÃO desfaz a escolha feita em outro aparelho', async () => {
    const env = mundo();
    await alternar(env, true);
    await post(env, 'profile', BRUNO, { name: SEGREDO, pvpEnabled: true }); // sem publicHidden
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${BRUNO}`)).publicHidden).toBe(true);
    const { players } = await (await get(env, 'players')).json();
    expect(players.map(p => p.name)).not.toContain(SEGREDO);
  });

  it('R8: `myPlace` é a posição REAL (ocultos também ocupam lugar) e só vem para o próprio dono', async () => {
    const env = mundo({ publicHidden: true });
    // pontos: Bruno 99 (oculto) > Carol 20 > Alice 10 → Alice é a 3ª, mesmo com Bruno fora da lista
    expect((await (await get(env, 'rank', { season: SEASON, id: ALICE })).json()).myPlace).toBe(3);
    expect((await (await get(env, 'rank', { season: SEASON, id: BRUNO })).json()).myPlace).toBe(1);
    expect((await (await get(env, 'rank', { season: SEASON })).json()).myPlace).toBeUndefined();
  });

  it('quem saiu continua vendo o PRÓPRIO lugar (me), e só ele', async () => {
    const env = mundo({ publicHidden: true });
    const meu = await (await get(env, 'rank', { season: SEASON, id: BRUNO })).json();
    expect(meu.me).toMatchObject({ points: 99, lifetime: 77, hidden: true });
    expect(meu.rank.map(x => x.name)).not.toContain(SEGREDO);
    // consulta de outra pessoa / anônima não recebe `me` dele
    const alheio = await (await get(env, 'rank', { season: SEASON, id: ALICE })).json();
    expect(alheio.me).toBeUndefined();
    expect((await (await get(env, 'rank', { season: SEASON })).json()).me).toBeUndefined();
  });

  it('quem saiu continua podendo jogar e ainda enfrenta quem aparece', async () => {
    const env = mundo({ publicHidden: true });
    const res = await post(env, 'duelStart', BRUNO, { opponentId: PID_C });
    expect(res.status).toBe(200);
  });

  it('ninguém pode DUELAR contra quem saiu, nem por pid conhecido', async () => {
    const env = mundo({ publicHidden: true });
    const res = await post(env, 'duelStart', ALICE, { opponentId: PID_B });
    expect(res.status).toBe(404);
    const m = await post(env, 'match', ALICE, { opponentId: PID_B });
    expect(m.status).toBe(404);
    expect(await m.text()).not.toContain(SEGREDO);
  });

  it('ninguém consegue adicionar como amigo quem saiu; remover continua possível', async () => {
    const env = mundo({ publicHidden: true });
    const add = await post(env, 'friends', ALICE, { friendId: PID_B });
    expect(add.status).toBe(404);
    const rem = await post(env, 'friends', ALICE, { friendId: PID_B, remove: true });
    expect(rem.status).toBe(200);
  });

  it('o pid de quem saiu não vaza na lista de amigos que terceiros leem', async () => {
    const env = mundo();
    env.DIGIAPP_SAVES.store.set(`profile:${CAROL}`, perfil(CAROL, PID_C, 'Carol', { friends: [BRUNO, ALICE] }));
    await alternar(env, true);
    const { player } = await (await get(env, 'player', { id: PID_C })).json();
    expect(player.friends).toEqual([PID_A]);
  });

  it('presente de quem saiu não leva o apelido', async () => {
    const env = mundo({ publicHidden: true, friends: [CAROL] });
    expect((await post(env, 'gift', BRUNO, { friendId: PID_C })).status).toBe(200);
    expect(env.DIGIAPP_SAVES.store.get(`gifts:${CAROL}`)).not.toContain(SEGREDO);
    // e quem aparece continua mandando o apelido normalmente
    const env2 = mundo({ friends: [CAROL] });
    await post(env2, 'gift', BRUNO, { friendId: PID_C });
    expect(env2.DIGIAPP_SAVES.store.get(`gifts:${CAROL}`)).toContain(SEGREDO);
  });

  describe('cache de borda de 60 s', () => {
    afterEach(() => { vi.unstubAllGlobals(); });
    const fakeCaches = () => {
      const puts = []; const deletes = [];
      vi.stubGlobal('caches', { default: {
        match: async () => undefined,
        put: async (req) => { puts.push(req.url); },
        delete: async (req) => { deletes.push(req.url); return true; },
      } });
      return { puts, deletes };
    };

    it('rank com id (o `me` da pessoa) NUNCA vai para o cache de URL; o público continua indo', async () => {
      const { puts } = fakeCaches();
      const env = mundo({ publicHidden: true });
      await get(env, 'rank', { season: SEASON, id: BRUNO });
      expect(puts).toEqual([]);
      await get(env, 'rank', { season: SEASON });
      expect(puts).toHaveLength(1);
    });

    it('trocar a escolha tira as listas públicas do cache desta borda; salvar sem trocar não mexe', async () => {
      const { deletes } = fakeCaches();
      const env = mundo();
      await alternar(env, false);
      expect(deletes).toEqual([]);
      await alternar(env, true);
      expect(deletes.some(u => u.includes('action=players'))).toBe(true);
      expect(deletes.some(u => u.includes('action=rank'))).toBe(true);
    });
  });

  it('o flag só aceita booleano real: string "false" não esconde nem mostra por engano', async () => {
    const env = mundo({ publicHidden: true });
    await post(env, 'profile', BRUNO, { name: SEGREDO, pvpEnabled: true, publicHidden: 'false' });
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${BRUNO}`)).publicHidden).toBe(true);
  });
});
