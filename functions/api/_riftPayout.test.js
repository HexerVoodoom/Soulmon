import { describe, it, expect, beforeEach } from 'vitest';
import { submitScore } from './_rankings.js';
import { closePreviousMonth, prevMonthKey, readMyPrize, _resetClosedCache, lockKey, paidKey } from './_riftPayout.js';
import { readEntitlement } from './_entitlements.js';

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
const sub = (env, c, score, at = OCT) => submitScore(env, { game: 'endless-rift', period: 'monthly', saveId: id(c), score, now: at });
const credits = async (env, c) => (await readEntitlement(env, id(c))).credits;

describe('fechamento mensal do Endless Rift (Créditos 50/25/10)', () => {
  let env;
  beforeEach(() => { env = { SOULMON_SAVES: fakeKV() }; _resetClosedCache(); });

  it('chave do mês anterior (vira o ano)', () => {
    expect(prevMonthKey(NOV)).toBe('2026-10');
    expect(prevMonthKey(new Date('2027-01-05T00:00:00Z'))).toBe('2026-12');
  });

  it('paga 50/25/10 ao top 3 e ninguém mais', async () => {
    await sub(env, 'a', 300); await sub(env, 'b', 200); await sub(env, 'c', 100); await sub(env, 'd', 50);
    const r = await closePreviousMonth(env, NOV);
    expect(r.status).toBe('closed');
    expect([await credits(env, 'a'), await credits(env, 'b'), await credits(env, 'c'), await credits(env, 'd')]).toEqual([50, 25, 10, 0]);
    expect(await readMyPrize(env, id('a'), NOV)).toMatchObject({ month: '2026-10', credits: 50, place: 1 });
  });

  it('idempotência: chamar 2x paga 1x (mesmo sem o cache em memória)', async () => {
    await sub(env, 'a', 300); await sub(env, 'b', 200);
    await closePreviousMonth(env, NOV);
    _resetClosedCache();
    const again = await closePreviousMonth(env, NOV);
    expect(again.status).toBe('already');
    expect(await credits(env, 'a')).toBe(50);
    expect(await credits(env, 'b')).toBe(25);
  });

  it('retomada de trava `running` velha não repaga quem já recebeu', async () => {
    await sub(env, 'a', 300); await sub(env, 'b', 200);
    await closePreviousMonth(env, NOV);
    // simula queda depois de pagar A: trava volta a running antiga e o pagamento de B some
    env.SOULMON_SAVES.store.set(lockKey('2026-10'), { v: JSON.stringify({ state: 'running', at: 1, token: 'x' }) });
    env.SOULMON_SAVES.store.delete(paidKey('2026-10', id('b')));
    _resetClosedCache();
    const r = await closePreviousMonth(env, NOV);
    expect(r.status).toBe('closed');
    expect(await credits(env, 'a')).toBe(50); // não dobrou
    expect(await credits(env, 'b')).toBe(50); // 25 + 25: B foi repago (a chave dele foi apagada de propósito)
  });

  it('trava running recente = busy, nada é pago', async () => {
    await sub(env, 'a', 300);
    env.SOULMON_SAVES.store.set(lockKey('2026-10'), { v: JSON.stringify({ state: 'running', at: NOV.getTime() - 1000, token: 'x' }) });
    expect((await closePreviousMonth(env, NOV)).status).toBe('busy');
    expect(await credits(env, 'a')).toBe(0);
  });

  it('simulado é pulado: o prêmio desce para o próximo real', async () => {
    env.SOULMON_SAVES.store.set(`profile:${id('s')}`, { v: JSON.stringify({ name: 'Bot', simulated: true }) });
    await sub(env, 's', 900); await sub(env, 'a', 300); await sub(env, 'b', 200); await sub(env, 'c', 100); await sub(env, 'd', 50);
    await closePreviousMonth(env, NOV);
    expect(await credits(env, 's')).toBe(0);
    expect([await credits(env, 'a'), await credits(env, 'b'), await credits(env, 'c'), await credits(env, 'd')]).toEqual([50, 25, 10, 0]);
  });

  it('empate no score: quem chegou primeiro leva a colocação melhor', async () => {
    await sub(env, 'b', 300, new Date('2026-10-10T10:00:00Z'));
    await sub(env, 'a', 300, new Date('2026-10-05T10:00:00Z')); // a chegou antes, mesmo com saveId "maior" na lista
    await sub(env, 'c', 100);
    await closePreviousMonth(env, NOV);
    expect([await credits(env, 'a'), await credits(env, 'b'), await credits(env, 'c')]).toEqual([50, 25, 10]);
  });

  it('mês sem jogadores fecha sem pagar e sem erro; KV ausente não lança', async () => {
    expect((await closePreviousMonth(env, NOV)).paid).toEqual([]);
    _resetClosedCache();
    expect((await closePreviousMonth({}, NOV)).status).toBe('skipped');
  });

  it('o mês corrente nunca é fechado: placar de outubro só vale em novembro', async () => {
    await sub(env, 'a', 300);
    await closePreviousMonth(env, OCT); // prev = setembro (vazio)
    expect(await credits(env, 'a')).toBe(0);
  });
});
