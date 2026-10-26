import { describe, it, expect, beforeEach } from 'vitest';
import { submitScore } from './_rankings.js';
import {
  closePreviousMonth, prevMonthKey, readMyPrize, _resetClosedCache, lockKey, pendingKey, approveRiftPrize, rejectRiftPrize, listRiftPrizes,
} from './_riftPayout.js';
import { readEntitlement, grantRankPrize } from './_entitlements.js';
import { writeTombstone } from './_accountTombstone.js';

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
const approve = (env, c, month = '2026-10') => approveRiftPrize(env, month, id(c));

describe('fechamento mensal do Endless Rift: grava PENDENTE, o dono aprova (Créditos 50/25/10)', () => {
  let env;
  beforeEach(() => { env = { SOULMON_SAVES: fakeKV() }; _resetClosedCache(); });

  it('chave do mês anterior (vira o ano)', () => {
    expect(prevMonthKey(NOV)).toBe('2026-10');
    expect(prevMonthKey(new Date('2027-01-05T00:00:00Z'))).toBe('2026-12');
  });

  it('o fechamento NÃO paga: grava o top 3 como pendente e mais ninguém', async () => {
    await sub(env, 'a', 300); await sub(env, 'b', 200); await sub(env, 'c', 100); await sub(env, 'd', 50);
    const r = await closePreviousMonth(env, NOV);
    expect(r.status).toBe('closed');
    expect(r.pending.map(p => [p.saveId, p.credits, p.place])).toEqual([[id('a'), 50, 1], [id('b'), 25, 2], [id('c'), 10, 3]]);
    expect([await credits(env, 'a'), await credits(env, 'b'), await credits(env, 'c'), await credits(env, 'd')]).toEqual([0, 0, 0, 0]);
    expect(await readMyPrize(env, id('a'), NOV)).toBeNull(); // pendente não é prêmio recebido
    expect(env.SOULMON_SAVES.store.has(pendingKey('2026-10', id('d')))).toBe(false);
  });

  it('aprovar credita 50/25/10 e o jogador passa a ver o prêmio', async () => {
    await sub(env, 'a', 300); await sub(env, 'b', 200); await sub(env, 'c', 100);
    await closePreviousMonth(env, NOV);
    expect((await approve(env, 'a')).status).toBe('paid');
    expect((await approve(env, 'b')).status).toBe('paid');
    expect((await approve(env, 'c')).status).toBe('paid');
    expect([await credits(env, 'a'), await credits(env, 'b'), await credits(env, 'c')]).toEqual([50, 25, 10]);
    expect(await readMyPrize(env, id('a'), NOV)).toMatchObject({ month: '2026-10', credits: 50, place: 1 });
  });

  it('aprovar 2x (duas abas do GM) paga 1x: a marca de pago mora DENTRO do ent', async () => {
    await sub(env, 'a', 300);
    await closePreviousMonth(env, NOV);
    await approve(env, 'a');
    await approve(env, 'a');
    expect(await credits(env, 'a')).toBe(50);
    expect((await readEntitlement(env, id('a'))).rankPrizes).toEqual(['rift:2026-10']);
  });

  it('o registro de pago some (KV eventual/queda), mas o ent lembra: reaprovar NÃO repaga', async () => {
    await sub(env, 'a', 300);
    await closePreviousMonth(env, NOV);
    await approve(env, 'a');
    // simula a queda: o pendente volta a "pending" (a escrita do registro se perdeu), o crédito já está no ent
    const raw = JSON.parse(env.SOULMON_SAVES.store.get(pendingKey('2026-10', id('a'))).v);
    env.SOULMON_SAVES.store.set(pendingKey('2026-10', id('a')), { v: JSON.stringify({ ...raw, status: 'pending', paidAt: undefined }) });
    const again = await approve(env, 'a');
    expect(again.status).toBe('already');
    expect(await credits(env, 'a')).toBe(50);
    expect(await readMyPrize(env, id('a'), NOV)).toMatchObject({ credits: 50 }); // o registro foi regravado
  });

  it('falha no crédito NÃO perde o prêmio: o pendente continua pendente e dá para aprovar depois', async () => {
    await sub(env, 'a', 300);
    await closePreviousMonth(env, NOV);
    const kvx = env.SOULMON_SAVES;
    const put = kvx.put;
    kvx.put = async (k, ...r) => { if (k.startsWith('ent:')) throw new Error('kv fora'); return put(k, ...r); };
    await expect(approve(env, 'a')).rejects.toThrow('kv fora');
    kvx.put = put;
    expect(JSON.parse(kvx.store.get(pendingKey('2026-10', id('a'))).v).status).toBe('pending');
    expect(await credits(env, 'a')).toBe(0);
    expect((await approve(env, 'a')).status).toBe('paid');
    expect(await credits(env, 'a')).toBe(50);
  });

  it('rejeitar não credita, e rejeitado não é aprovado depois', async () => {
    await sub(env, 'a', 300);
    await closePreviousMonth(env, NOV);
    expect((await rejectRiftPrize(env, '2026-10', id('a'))).status).toBe('rejected');
    expect((await approve(env, 'a')).status).toBe('rejected');
    expect(await credits(env, 'a')).toBe(0);
  });

  it('conta apagada depois do fechamento NÃO recebe: o prêmio não ressuscita o ent', async () => {
    await sub(env, 'a', 300);
    await closePreviousMonth(env, NOV);
    await writeTombstone(env, id('a'), NOV.getTime() + 1000);
    const r = await approve(env, 'a');
    expect(r.status).toBe('refused');
    expect(env.SOULMON_SAVES.store.has(`ent:${id('a')}`)).toBe(false);
    expect(JSON.parse(env.SOULMON_SAVES.store.get(pendingKey('2026-10', id('a'))).v).status).toBe('pending'); // continua visível ao dono
  });

  it('resíduo minimizado de conta apagada (accountDeletedAt) também recusa', async () => {
    env.SOULMON_SAVES.store.set(`ent:${id('a')}`, { v: JSON.stringify({ tier: 'demo', credits: 0, accountDeletedAt: NOV.getTime() + 5 }) });
    const r = await grantRankPrize(env, id('a'), 50, 'rift:2026-10', NOV.getTime());
    expect(r).toMatchObject({ granted: false, refused: 'deleted' });
    expect(await credits(env, 'a')).toBe(0);
  });

  it('quem apagou ANTES do fechamento e voltou (conta nova) não é barrado', async () => {
    await writeTombstone(env, id('a'), OCT.getTime() - 86_400_000);
    const r = await grantRankPrize(env, id('a'), 50, 'rift:2026-10', NOV.getTime());
    expect(r.granted).toBe(true);
  });

  it('grantRankPrize exige a marca e valor inteiro positivo', async () => {
    expect((await grantRankPrize(env, id('a'), 50)).refused).toBe('invalid');
    expect((await grantRankPrize(env, id('a'), 0, 'rift:x')).refused).toBe('invalid');
    expect((await grantRankPrize(env, id('a'), 1.5, 'rift:x')).refused).toBe('invalid');
  });

  it('idempotência do fechamento: chamar 2x não duplica nem sobrescreve (mesmo sem o cache em memória)', async () => {
    await sub(env, 'a', 300); await sub(env, 'b', 200);
    await closePreviousMonth(env, NOV);
    await approve(env, 'a');
    _resetClosedCache();
    const again = await closePreviousMonth(env, NOV);
    expect(again.status).toBe('already');
    // mesmo com a trava perdida, um pendente que já virou pago não volta a pendente
    env.SOULMON_SAVES.store.delete(lockKey('2026-10'));
    _resetClosedCache();
    await closePreviousMonth(env, NOV);
    expect(JSON.parse(env.SOULMON_SAVES.store.get(pendingKey('2026-10', id('a'))).v).status).toBe('paid');
    expect(await credits(env, 'a')).toBe(50);
  });

  it('trava running velha é retomada sem perder pendente; running recente = busy', async () => {
    await sub(env, 'a', 300); await sub(env, 'b', 200);
    env.SOULMON_SAVES.store.set(lockKey('2026-10'), { v: JSON.stringify({ state: 'running', at: NOV.getTime() - 1000, token: 'x' }) });
    expect((await closePreviousMonth(env, NOV)).status).toBe('busy');
    env.SOULMON_SAVES.store.set(lockKey('2026-10'), { v: JSON.stringify({ state: 'running', at: 1, token: 'x' }) });
    expect((await closePreviousMonth(env, NOV)).status).toBe('closed');
    expect(env.SOULMON_SAVES.store.has(pendingKey('2026-10', id('a')))).toBe(true);
    expect(env.SOULMON_SAVES.store.has(pendingKey('2026-10', id('b')))).toBe(true);
  });

  it('simulado é pulado: o pendente desce para o próximo real', async () => {
    env.SOULMON_SAVES.store.set(`profile:${id('s')}`, { v: JSON.stringify({ name: 'Bot', simulated: true }) });
    await sub(env, 's', 900); await sub(env, 'a', 300); await sub(env, 'b', 200); await sub(env, 'c', 100); await sub(env, 'd', 50);
    await closePreviousMonth(env, NOV);
    expect(env.SOULMON_SAVES.store.has(pendingKey('2026-10', id('s')))).toBe(false);
    for (const c of 'abc') await approve(env, c);
    expect([await credits(env, 's'), await credits(env, 'a'), await credits(env, 'b'), await credits(env, 'c'), await credits(env, 'd')]).toEqual([0, 50, 25, 10, 0]);
  });

  it('empate no score: quem chegou primeiro leva a colocação melhor', async () => {
    await sub(env, 'b', 300, new Date('2026-10-10T10:00:00Z'));
    await sub(env, 'a', 300, new Date('2026-10-05T10:00:00Z'));
    await sub(env, 'c', 100);
    await closePreviousMonth(env, NOV);
    for (const c of 'abc') await approve(env, c);
    expect([await credits(env, 'a'), await credits(env, 'b'), await credits(env, 'c')]).toEqual([50, 25, 10]);
  });

  it('a lista do GM traz a progressão (lastro e histórico) e põe pendentes primeiro', async () => {
    await sub(env, 'a', 300); await sub(env, 'b', 200);
    env.SOULMON_SAVES.store.set(`riftlayers:2026-10:${id('a')}`, { v: JSON.stringify({ n: 40, base: 261, rec: 260, d: '2026-10-20', dn: 3 }) });
    env.SOULMON_SAVES.store.set(`rkme:endless-rift:2026-09:${id('a')}`, { v: '260' });
    await closePreviousMonth(env, NOV);
    await approve(env, 'a');
    const items = await listRiftPrizes(env);
    expect(items.map(i => [i.place, i.status])).toEqual([[2, 'pending'], [1, 'paid']]);
    const a = items.find(i => i.saveId === id('a'));
    expect(a.progresso).toEqual({ base: 261, camadasComecadas: 40, recordeDoServidor: 260 });
    expect(a.historico).toEqual([{ month: '2026-09', best: 260 }]);
  });

  it('mês sem jogadores fecha sem pendentes e sem erro; KV ausente não lança', async () => {
    expect((await closePreviousMonth(env, NOV)).pending).toEqual([]);
    _resetClosedCache();
    expect((await closePreviousMonth({}, NOV)).status).toBe('skipped');
  });

  it('o mês corrente nunca é fechado: placar de outubro só vale em novembro', async () => {
    await sub(env, 'a', 300);
    await closePreviousMonth(env, OCT); // prev = setembro (vazio)
    expect(env.SOULMON_SAVES.store.has(pendingKey('2026-10', id('a')))).toBe(false);
  });
});
