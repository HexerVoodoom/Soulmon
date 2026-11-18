import { describe, it, expect, beforeEach } from 'vitest';
import { submitScore } from './_rankings.js';
import { closeArcadeMonth, prevMonth, _resetArcadeCache, ARCADE_ITEM_ID, ARCADE_MONTHLY_GAMES, ARCADE_ALT_PRIZE, arcadeMark } from './_arcadePrize.js';
import { readEntitlement, publicView } from './_entitlements.js';

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
const id = (c) => `player-${c.repeat(8)}`;
const OCT = new Date('2026-10-20T12:00:00Z');
const NOV = new Date('2026-11-02T09:00:00Z');
const sub = (env, game, c, score, at = OCT) => submitScore(env, { game, period: 'monthly', saveId: id(c), score, now: at });
const prizes = async (env, c) => (await readEntitlement(env, id(c))).itemPrizes ?? [];

describe('Fliperama de Canto: prêmio do 1º lugar no ranking mensal de minigame', () => {
  let env;
  beforeEach(() => { env = { SOULMON_SAVES: fakeKV() }; _resetArcadeCache(); });

  it('só os rankings mensais dos prédios de minigame premiam (não o Rift, não os semanais)', () => {
    expect([...ARCADE_MONTHLY_GAMES]).toEqual(['match3', 'match3-pvp']);
    expect(prevMonth(NOV)).toBe('2026-10');
  });

  it('o 1º de cada jogo mensal ganha o item; o 2º não', async () => {
    await sub(env, 'match3', 'a', 300); await sub(env, 'match3', 'b', 200);
    await sub(env, 'match3-pvp', 'c', 90);
    const r = await closeArcadeMonth(env, NOV);
    expect(r.status).toBe('closed');
    expect(await prizes(env, 'a')).toEqual([ARCADE_ITEM_ID]);
    expect(await prizes(env, 'b')).toEqual([]);
    expect(await prizes(env, 'c')).toEqual([ARCADE_ITEM_ID]);
    expect(r.results.map(x => x.status)).toEqual(['item', 'item']);
  });

  it('idempotente: fechar de novo (cache limpo, trava, auditoria) não entrega duas vezes', async () => {
    await sub(env, 'match3', 'a', 300);
    await closeArcadeMonth(env, NOV);
    _resetArcadeCache();
    expect((await closeArcadeMonth(env, NOV)).status).toBe('already');
    const ent = await readEntitlement(env, id('a'));
    expect(ent.itemPrizes).toEqual([ARCADE_ITEM_ID]);
    expect(ent.rankPrizes.filter(m => m === arcadeMark('2026-10', 'match3'))).toHaveLength(1);
  });

  it('item único: vencer dois jogos no mesmo mês dá UM item; o segundo cai no alternativo (desligado = só registro)', async () => {
    await sub(env, 'match3', 'a', 300); await sub(env, 'match3-pvp', 'a', 500);
    const r = await closeArcadeMonth(env, NOV);
    expect(await prizes(env, 'a')).toEqual([ARCADE_ITEM_ID]);
    expect(r.results.map(x => x.status)).toEqual(['item', 'owned']);
    expect(ARCADE_ALT_PRIZE.enabled).toBe(false);
    expect((await readEntitlement(env, id('a'))).credits).toBe(0);
    const audit = JSON.parse(env.SOULMON_SAVES.store.get('arcade-prize:2026-10:match3-pvp').v);
    expect(audit).toMatchObject({ saveId: id('a'), status: 'owned', game: 'match3-pvp' });
  });

  it('quem já tem o item no save gravado recebe o alternativo (aqui desligado), não um segundo item', async () => {
    env.SOULMON_SAVES.store.set(id('a'), { v: JSON.stringify({ ownedFurniture: [ARCADE_ITEM_ID] }) });
    await sub(env, 'match3', 'a', 300);
    const r = await closeArcadeMonth(env, NOV);
    expect(r.results[0].status).toBe('owned');
    expect(await prizes(env, 'a')).toEqual([]);
  });

  it('simulado nunca ganha: o prêmio desce para o próximo jogador real', async () => {
    await submitScore(env, { game: 'match3', period: 'monthly', saveId: 'sim_0001', score: 999, now: OCT });
    await sub(env, 'match3', 'b', 10);
    await closeArcadeMonth(env, NOV);
    expect(await prizes(env, 'b')).toEqual([ARCADE_ITEM_ID]);
  });

  it('o GET público mostra itemPrizes só quando há algum', async () => {
    expect(publicView(await readEntitlement(env, id('z'))).itemPrizes).toBeUndefined();
    await sub(env, 'match3', 'a', 300);
    await closeArcadeMonth(env, NOV);
    expect(publicView(await readEntitlement(env, id('a'))).itemPrizes).toEqual([ARCADE_ITEM_ID]);
  });

  it('sem ninguém no ranking fecha sem erro', async () => {
    const r = await closeArcadeMonth(env, NOV);
    expect(r).toMatchObject({ status: 'closed', results: [] });
  });
});
