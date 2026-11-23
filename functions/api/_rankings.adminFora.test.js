import { describe, it, expect, beforeEach } from 'vitest';
import { submitScore, readBoard } from './_rankings.js';
import { closeArcadeMonth, _resetArcadeCache } from './_arcadePrize.js';
import { closePreviousMonth } from './_riftPayout.js';
import { adminSaveIds, adminSaveIdsSeguro } from './_rankAdmin.js';
import { emailToSaveId } from './_auth.js';

function fakeKV() {
  const store = new Map();
  return {
    store,
    get: async k => (store.has(k) ? store.get(k).v : null),
    put: async (k, v, o) => { store.set(k, { v, m: o?.metadata }); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '', limit = 1000 }) => {
      const names = [...store.keys()].filter(k => k.startsWith(prefix)).sort().slice(0, limit);
      return { keys: names.map(name => ({ name, metadata: store.get(name).m })), list_complete: true };
    },
  };
}
const EMAIL = 'dono@example.com';
const id = (c) => `player-${c.repeat(8)}`;
const OCT = new Date('2026-10-20T12:00:00Z');
const NOV = new Date('2026-11-02T09:00:00Z');
let admin;
let env;
let envSem;
beforeEach(async () => {
  _resetArcadeCache();
  admin = await emailToSaveId(EMAIL);
  const kv = fakeKV();
  env = { SOULMON_SAVES: kv, ADMIN_EMAILS: EMAIL };
  envSem = { SOULMON_SAVES: kv };
});
const sub = (e, game, saveId, score, period = 'weekly', now = OCT) => submitScore(e, { game, period, saveId, score, now });
const board = (e, game, saveId, period = 'weekly', now = OCT) => readBoard(e, { game, period, saveId, now });

describe('admin fora dos rankings dos minigames', () => {
  it('admin com o MAIOR placar não aparece, não ocupa posição e os outros sobem sem buraco', async () => {
    await sub(env, 'dino', id('a'), 300); await sub(env, 'dino', admin, 999); await sub(env, 'dino', id('b'), 200);
    const b = await board(env, 'dino', id('b'));
    expect(b.top.map(r => [r.rank, r.score])).toEqual([[1, 300], [2, 200]]);
    expect(b.me.rank).toBe(2);
  });

  it('nada é apagado: o rkme do admin existe e ele vê o próprio placar sem posição nem faixa de prêmio', async () => {
    await sub(env, 'dino', id('a'), 300); await sub(env, 'dino', admin, 999);
    expect(env.SOULMON_SAVES.store.has(`rkme:dino:${(await board(env, 'dino', admin)).periodKey}:${admin}`)).toBe(true);
    const b = await board(env, 'dino', admin);
    expect(b.me.score).toBe(999);
    expect(b.me.rank).toBeNull();
    expect(b.top).toHaveLength(1);
  });

  it('placar já gravado ANTES (linha no índice) sai na leitura, em jogo menor-é-melhor também', async () => {
    await sub(envSem, 'zip', id('a'), 50000); await sub(envSem, 'zip', admin, 10000); await sub(envSem, 'zip', id('b'), 60000);
    expect((await board(envSem, 'zip', id('b'))).top.map(r => r.score)).toEqual([10000, 50000, 60000]);
    const b = await board(env, 'zip', id('b'));
    expect(b.top.map(r => r.score)).toEqual([50000, 60000]);
    expect(b.me.rank).toBe(2);
  });

  it('ranking reordenado (match3 mensal com teto de simulados) também filtra o admin', async () => {
    await sub(envSem, 'match3', id('a'), 300, 'monthly'); await sub(envSem, 'match3', admin, 900, 'monthly');
    const b = await board(env, 'match3', id('a'), 'monthly');
    expect(b.top.map(r => r.name).length).toBeGreaterThan(0);
    expect(b.top.every(r => r.score !== 900)).toBe(true);
    expect((await board(env, 'match3', admin, 'monthly')).me.rank).toBeNull();
  });

  it('sem ADMIN_EMAILS nada muda: o admin aparece como qualquer um', async () => {
    await sub(envSem, 'dino', id('a'), 300); await sub(envSem, 'dino', admin, 999);
    const b = await board(envSem, 'dino', admin);
    expect(b.top[0].score).toBe(999);
    expect(b.me.rank).toBe(1);
  });

  it('erro ao ler a lista de admins não esconde jogador comum', async () => {
    await sub(env, 'dino', id('a'), 300);
    const ruim = { SOULMON_SAVES: env.SOULMON_SAVES, get ADMIN_EMAILS() { throw new Error('boom'); } };
    expect((await adminSaveIdsSeguro(ruim)).size).toBe(0);
    expect((await board(ruim, 'dino', id('a'))).top.map(r => r.score)).toEqual([300]);
  });

  it('a lista de admins é lida em cache (mesmo Set para o mesmo secret)', async () => {
    expect(await adminSaveIds(env)).toBe(await adminSaveIds(env));
  });
});

describe('admin fora dos prêmios mensais', () => {
  it('Fliperama: o admin em 1º não leva a carta; o 1º real leva', async () => {
    await sub(envSem, 'match3', id('a'), 300, 'monthly'); await sub(envSem, 'match3', admin, 900, 'monthly');
    const r = await closeArcadeMonth(env, NOV);
    expect(r.results.map(x => x.saveId)).toEqual([id('a')]);
    expect(env.SOULMON_SAVES.store.has(`mail:${admin}`)).toBe(false);
  });

  it('Rift: o admin em 1º não leva Crédito pendente; os reais sobem', async () => {
    await sub(envSem, 'endless-rift', id('a'), 50, 'monthly'); await sub(envSem, 'endless-rift', admin, 80, 'monthly');
    const r = await closePreviousMonth(env, NOV);
    expect(r.pending.map(x => [x.saveId, x.place])).toEqual([[id('a'), 1]]);
  });
});
