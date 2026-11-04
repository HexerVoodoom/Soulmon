import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';

// Nome do especial escolhido pelo jogador: validacao, filtro PT/EN, troca 1x/semana no servidor, fallback e vista dos outros.

const ALICE = 'a'.repeat(32);
const BRUNO = 'b'.repeat(32);
const PID_A = 'aa'.repeat(12);
const PID_B = 'bb'.repeat(12);
const SEASON = new Date().toISOString().slice(0, 7);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }),
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
const mundo = (extraB = {}) => ({
  DIGIAPP_SAVES: fakeKV({
    [`profile:${ALICE}`]: perfil(ALICE, PID_A, 'Alice'),
    [`profile:${BRUNO}`]: perfil(BRUNO, PID_B, 'Bruno', { lifetimePoints: 77, ...extraB }),
    [`pid:${PID_A}`]: ALICE, [`pid:${PID_B}`]: BRUNO,
    [ALICE]: JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3 }),
    [BRUNO]: JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3 }),
    [`rank:${SEASON}:${ALICE}`]: rank(10),
    [`rank:${SEASON}:${BRUNO}`]: rank(99),
  }),
});
const get = (env, action, params = {}) => onRequest({
  request: new Request(`https://x.dev/api/community?${new URLSearchParams({ action, ...params })}`), env,
});
const salvar = (env, body) => onRequest({
  request: new Request(`https://x.dev/api/community?action=profile&id=${BRUNO}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: BRUNO, name: 'Bruno', pvpEnabled: true, ...body }),
  }), env,
});

const post = (env, action, id, body) => onRequest({
  request: new Request(`https://x.dev/api/community?action=${action}&id=${id}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, ...body }),
  }), env,
});

const perfilDe = env => JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${BRUNO}`));
const DIA = 24 * 3600 * 1000;

describe('nome do especial (perfil publico)', () => {
  it('aceita nome valido, grava com a hora do servidor e devolve na resposta', async () => {
    const env = mundo();
    const antes = Date.now();
    const j = await (await salvar(env, { especialNome: '  Raio   Solar 2 ' })).json();
    expect(j.especialNome).toBe('Raio Solar 2');
    expect(j.especialNomeAt).toBeGreaterThanOrEqual(antes);
    expect(perfilDe(env).especialNome).toBe('Raio Solar 2');
  });

  it('forma: mais de 20, simbolos e contato voltam ao nome padrao e avisam', async () => {
    for (const ruim of ['a'.repeat(21), 'Raio!', 'raio@sol', 'x.com sol', 'Zap: 1234', '<b>x</b>']) {
      const env = mundo();
      const j = await (await salvar(env, { especialNome: ruim })).json();
      expect(j.especialNomeRejected, ruim).toBe(true);
      expect(j.especialNome, ruim).toBe('');
      expect(perfilDe(env).especialNome, ruim).toBeUndefined();
    }
  });

  it('filtro de palavrao PT e EN (inclusive leet, repeticao e espacos); palavra comum passa', async () => {
    for (const ruim of ['Caralho Voador', 'p0rra', 'Fuuuuck', 'f u c k', 'Sh1t Storm', 'Puta merda', 'Hitler']) {
      const env = mundo();
      const j = await (await salvar(env, { especialNome: ruim })).json();
      expect(j.especialNomeRejected, ruim).toBe(true);
    }
    for (const bom of ['Classic Blast', 'Assassino', 'Fúria Azul', 'Golpe 2']) {
      const env = mundo();
      const j = await (await salvar(env, { especialNome: bom })).json();
      expect(j.especialNomeRejected, bom).toBeUndefined();
      expect(j.especialNome).toBe(bom);
    }
  });

  it('troca limitada a uma por semana, medida no servidor; repetir o mesmo nome nao gasta', async () => {
    const env = mundo();
    await salvar(env, { especialNome: 'Primeiro' });
    const igual = await (await salvar(env, { especialNome: 'Primeiro' })).json();
    expect(igual.especialNomeLimit).toBeUndefined();
    const j = await (await salvar(env, { especialNome: 'Segundo' })).json();
    expect(j.especialNomeLimit).toBe(true);
    expect(j.especialNome).toBe('Primeiro');
    expect(perfilDe(env).especialNome).toBe('Primeiro');
    // 6 dias: ainda travado; 8 dias: liberado. O relogio do cliente nao entra.
    const p = perfilDe(env);
    env.DIGIAPP_SAVES.store.set(`profile:${BRUNO}`, JSON.stringify({ ...p, especialNomeAt: Date.now() - 6 * DIA }));
    expect((await (await salvar(env, { especialNome: 'Segundo' })).json()).especialNomeLimit).toBe(true);
    env.DIGIAPP_SAVES.store.set(`profile:${BRUNO}`, JSON.stringify({ ...p, especialNomeAt: Date.now() - 8 * DIA }));
    const livre = await (await salvar(env, { especialNome: 'Segundo' })).json();
    expect(livre.especialNomeLimit).toBeUndefined();
    expect(livre.especialNome).toBe('Segundo');
  });

  it('limpar e vazio/null volta ao padrao sem gastar a troca; limpar e regravar dentro da semana continua travado', async () => {
    const env = mundo();
    await salvar(env, { especialNome: 'Primeiro' });
    const limpo = await (await salvar(env, { especialNome: '' })).json();
    expect(limpo.especialNome).toBe('');
    expect(limpo.especialNomeLimit).toBeUndefined();
    expect(perfilDe(env).especialNome).toBeUndefined();
    expect((await (await salvar(env, { especialNome: 'Outro' })).json()).especialNomeLimit).toBe(true);
    expect((await (await salvar(env, { especialNome: null })).json()).especialNome).toBe('');
  });

  it('retrocompativel: corpo sem o campo herda o gravado e nao muda a resposta de quem nunca usou', async () => {
    const env = mundo();
    const sem = await (await salvar(env, {})).json();
    expect('especialNome' in sem).toBe(false);
    await salvar(env, { especialNome: 'Primeiro' });
    const herda = await (await salvar(env, {})).json();
    expect(herda.especialNome).toBe('Primeiro');
    expect(perfilDe(env).especialNome).toBe('Primeiro');
  });

  it('os outros veem: oponentes e perfil publico trazem o nome; texto fora da regra no KV nunca sai', async () => {
    const env = mundo();
    await salvar(env, { especialNome: 'Raio Solar' });
    const op = (await (await get(env, 'opponents', { id: ALICE })).json()).opponents.find(o => o.name === 'Bruno');
    expect(op.especialNome).toBe('Raio Solar');
    const det = await (await get(env, 'player', { id: PID_B })).json();
    expect(det.player.especialNome).toBe('Raio Solar');
    // KV adulterado ou perfil antigo com texto proibido: some na saida.
    env.DIGIAPP_SAVES.store.set(`profile:${BRUNO}`, JSON.stringify({ ...perfilDe(env), especialNome: 'Caralho <script>' }));
    const op2 = (await (await get(env, 'opponents', { id: ALICE })).json()).opponents.find(o => o.name === 'Bruno');
    expect(op2.especialNome).toBeUndefined();
  });

  it('perfil sem o campo (antigo) nao traz especialNome', async () => {
    const env = mundo();
    const op = (await (await get(env, 'opponents', { id: ALICE })).json()).opponents.find(o => o.name === 'Bruno');
    expect('especialNome' in op).toBe(false);
  });
});
