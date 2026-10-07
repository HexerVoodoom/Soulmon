import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';

// Tarefa C (07/10/2026) — foto e moldura no perfil publico: so IDs de listas fechadas
// (`_avatares.js`, `_frames.js`), herdados quando ausentes, `null` limpa, lixo e rejeitado.

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

function mundo(extraB = {}) {
  return {
    DIGIAPP_SAVES: fakeKV({
      [`profile:${ALICE}`]: perfil(ALICE, PID_A, 'Alice'),
      [`profile:${BRUNO}`]: perfil(BRUNO, PID_B, SEGREDO, { lifetimePoints: 77, ...extraB }),
      [`profile:${CAROL}`]: perfil(CAROL, PID_C, 'Carol'),
      [`pid:${PID_A}`]: ALICE, [`pid:${PID_B}`]: BRUNO, [`pid:${PID_C}`]: CAROL,
      // Combate v3 (PR5): o duelo lê o SAVE de cada lado.
      [ALICE]: JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3 }),
      [BRUNO]: JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3 }),
      [CAROL]: JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3 }),
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


const salvar = (env, body) => post(env, 'profile', BRUNO, { name: 'Bruno', pvpEnabled: true, ...body });
const gravado = env => JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${BRUNO}`));
const linhaB = (lista) => lista.find(x => x.name === 'Bruno');

describe('perfil publico — avatarId/frameId', () => {
  it('ids da lista fechada sao guardados e saem em publicProfile, oponentes e ranking', async () => {
    const env = mundo();
    expect((await salvar(env, { avatarId: 'ativo-arena', frameId: 'rank-ouro' })).status).toBe(200);
    expect(gravado(env)).toMatchObject({ avatarId: 'ativo-arena', frameId: 'rank-ouro' });
    const { player } = await (await get(env, 'player', { id: PID_B })).json();
    expect(player).toMatchObject({ avatarId: 'ativo-arena', frameId: 'rank-ouro' });
    const { players } = await (await get(env, 'players')).json();
    expect(linhaB(players)).toMatchObject({ avatarId: 'ativo-arena', frameId: 'rank-ouro' });
    const { opponents } = await (await get(env, 'opponents', { id: ALICE })).json();
    expect(opponents.some(o => o.avatarId === 'ativo-arena' && o.frameId === 'rank-ouro')).toBe(true);
    const { rank: r } = await (await get(env, 'rank', { season: SEASON })).json();
    expect(linhaB(r)).toMatchObject({ avatarId: 'ativo-arena', frameId: 'rank-ouro' });
  });

  it('ausentes no corpo: herda o gravado (cliente antigo nao apaga); null explicito limpa', async () => {
    const env = mundo();
    await salvar(env, { avatarId: 'ativo-arena', frameId: 'rank-ouro' });
    await salvar(env, {});
    expect(gravado(env)).toMatchObject({ avatarId: 'ativo-arena', frameId: 'rank-ouro' });
    await salvar(env, { avatarId: null, frameId: null });
    expect(gravado(env)).toMatchObject({ avatarId: null, frameId: null });
  });

  it('fora da lista fechada e rejeitado (vira null, nunca eco do texto) e nada vaza', async () => {
    const env = mundo();
    await salvar(env, { avatarId: 'https://evil.example/x.png', frameId: '<img onerror=x>' });
    expect(gravado(env)).toMatchObject({ avatarId: null, frameId: null });
    const txt = await (await get(env, 'players')).text();
    expect(txt).not.toContain('evil.example');
    // perfil antigo no KV com lixo gravado tambem sai sanitizado
    env.DIGIAPP_SAVES.store.set(`profile:${BRUNO}`, JSON.stringify({ ...gravado(env), avatarId: 'nao-existe', frameId: 'x' }));
    const { player } = await (await get(env, 'player', { id: PID_B })).json();
    expect(player.avatarId).toBeNull();
    expect(player.frameId).toBeNull();
  });
});
