import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';
import { artLineOrNull, ART_LINE_IDS } from './_artLine.js';

// D-60 (19/10/2026) — a linha de arte vai no perfil publico para o oponente ser desenhado com a arte DELE.
// So id de lista fechada; ausente no corpo herda; `null` limpa; perfil antigo (sem o campo) sai `null`.

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
const gravado = env => JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${BRUNO}`));
const linhaB = (lista) => lista.find(x => x.name === 'Bruno');

describe('perfil publico — artLine (D-60)', () => {
  it('com o campo: guarda e sai em player, players, oponentes e ranking', async () => {
    const env = mundo();
    expect((await salvar(env, { artLine: 'meteoro' })).status).toBe(200);
    expect(gravado(env).artLine).toBe('meteoro');
    const { player } = await (await get(env, 'player', { id: PID_B })).json();
    expect(player.artLine).toBe('meteoro');
    const { players } = await (await get(env, 'players')).json();
    expect(linhaB(players).artLine).toBe('meteoro');
    const { opponents } = await (await get(env, 'opponents', { id: ALICE })).json();
    expect(opponents.some(o => o.artLine === 'meteoro')).toBe(true);
    const { rank: r } = await (await get(env, 'rank', { season: SEASON })).json();
    expect(linhaB(r).artLine).toBe('meteoro');
  });

  it('sem o campo (perfil/cliente antigo): sai null, nunca undefined nem eco; ausente no corpo herda; null limpa', async () => {
    const env = mundo();
    const { player } = await (await get(env, 'player', { id: PID_B })).json();
    expect(player.artLine).toBeNull();
    await salvar(env, { artLine: 'kaelen' });
    await salvar(env, {});
    expect(gravado(env).artLine).toBe('kaelen');
    await salvar(env, { artLine: null });
    expect(gravado(env).artLine).toBeNull();
  });

  it('fora da lista fechada vira null (nada de texto livre no diretorio publico)', async () => {
    const env = mundo();
    await salvar(env, { artLine: 'https://evil.example/x.png' });
    expect(gravado(env).artLine).toBeNull();
    await salvar(env, { artLine: '<img onerror=x>' });
    expect(gravado(env).artLine).toBeNull();
    env.DIGIAPP_SAVES.store.set(`profile:${BRUNO}`, JSON.stringify({ ...gravado(env), artLine: 'nao-existe' }));
    const { player } = await (await get(env, 'player', { id: PID_B })).json();
    expect(player.artLine).toBeNull();
    expect(await (await get(env, 'players')).text()).not.toContain('evil.example');
  });

  it('artLineOrNull: so ids da lista', () => {
    expect(artLineOrNull('corvo')).toBe('corvo');
    expect(artLineOrNull('rookie')).toBeNull(); // id de estagio nao e linha
    expect(artLineOrNull(5)).toBeNull();
    expect(ART_LINE_IDS.size).toBe(15);
  });
});
