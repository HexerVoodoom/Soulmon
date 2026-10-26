import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';

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

const post = (env, action, id, body) => onRequest({
  request: new Request(`https://x.dev/api/community?action=${action}&id=${id}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, ...body }),
  }), env,
});

describe('apelido unico e sugestoes', () => {
  it('nickname: outra conta nao pega o mesmo nome (case-insensitive); o dono pode repetir', async () => {
    const env = mundo();
    expect((await post(env, 'nickname', ALICE, { name: 'Sol' })).status).toBe(200);
    expect((await post(env, 'nickname', BRUNO, { name: 'SOL' })).status).toBe(409);
    expect((await post(env, 'nickname', ALICE, { name: 'sol' })).status).toBe(200);
  });
  it('profile: nome em uso mantem o anterior e avisa nameTaken', async () => {
    const env = mundo();
    await post(env, 'nickname', ALICE, { name: 'Sol' });
    const r = await post(env, 'profile', BRUNO, { name: 'sol', pvpEnabled: true });
    expect((await r.json()).nameTaken).toBe(true);
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${BRUNO}`)).name).toBe('Bruno');
  });
  it('names: prefixo case-insensitive, so nomes, limite 8', async () => {
    const env = mundo();
    await post(env, 'nickname', BRUNO, { name: 'Bruno' });
    const j = await (await get(env, 'names', { prefix: 'BRU' })).json();
    expect(j).toEqual({ names: ['Bruno'] });
    expect(JSON.stringify(j)).not.toMatch(/@|pid|id/);
  });
  it('names: inclui quem tem apelido mesmo sem PvP ligado (indice nick:)', async () => {
    const env = mundo({ pvpEnabled: false });
    await post(env, 'nickname', BRUNO, { name: 'Bruna' });
    const j = await (await get(env, 'names', { prefix: 'bru' })).json();
    expect(j).toEqual({ names: ['bruna'] });
  });
  it('names: quem esta com publicHidden nao aparece; prefixo de 1 letra nao enumera', async () => {
    const env = mundo({ publicHidden: true });
    await post(env, 'nickname', BRUNO, { name: 'Bruna' });
    expect(await (await get(env, 'names', { prefix: 'bru' })).json()).toEqual({ names: [] });
    expect(await (await get(env, 'names', { prefix: 'b' })).json()).toEqual({ names: [] });
  });
  it('profile: elemento do Oraculo e aditivo, validado e herdado', async () => {
    const env = mundo();
    await salvar(env, { element: 'fire' });
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${BRUNO}`)).element).toBe('fire');
    await salvar(env, { element: '<x>' });
    expect(JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${BRUNO}`)).element).toBe('fire');
  });
});
