import { describe, it, expect, vi } from 'vitest';

vi.mock('./_profile.js', async (orig) => ({ ...(await orig()), getProfile: async (_e, id) => (id === 'p'.repeat(32) ? { simulated: true } : {}) }));
const { ackMail, enqueueMail, readMail, seasonPrize } = await import('./_mensageiro.js');

const ID = 'b'.repeat(32);
const NOV = Date.UTC(2026, 10, 2);
function kvFake(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async () => ({ keys: [], list_complete: true }),
  };
}
const carta = { mid: 'comp-1', bodyPt: 'Desculpe.', bodyEn: 'Sorry.', bits: 50 };

describe('fila do mensageiro (§241)', () => {
  it('entrega idempotente: mesmo mid não entra duas vezes, nem depois de confirmado', async () => {
    const kv = kvFake(); const env = { DIGIAPP_SAVES: kv };
    expect(await enqueueMail(env, kv, ID, carta)).toBe(true);
    expect(await enqueueMail(env, kv, ID, carta)).toBe(false);
    expect((await readMail(env, kv, ID, NOV)).map(m => m.mid)).toEqual(['comp-1']);
    expect(await ackMail(kv, ID, ['comp-1'])).toBe(1);
    expect(await ackMail(kv, ID, ['comp-1'])).toBe(0);
    expect(await enqueueMail(env, kv, ID, carta)).toBe(false);
    expect(await readMail(env, kv, ID, NOV)).toEqual([]);
  });
  it('simulado nunca recebe', async () => {
    const kv = kvFake(); const env = { DIGIAPP_SAVES: kv };
    expect(await enqueueMail(env, kv, 'p'.repeat(32), carta)).toBe(false);
  });
  it('carta da temporada: participante recebe uma vez; quem não jogou, não; colocação ignora simulado', async () => {
    const seed = {
      [`rank:2026-10:${ID}`]: JSON.stringify({ points: 10 }),
      'rankidx:2026-10': JSON.stringify({ done: true, p: { [ID]: 10 } }),
    };
    const kv = kvFake(seed); const env = { DIGIAPP_SAVES: kv };
    const [c] = await readMail(env, kv, ID, NOV);
    expect(c.mid).toBe('season:2026-10');
    expect(c.emblems).toBeGreaterThanOrEqual(6);
    expect((await readMail(env, kv, ID, NOV)).length).toBe(1);
    await ackMail(kv, ID, [c.mid]);
    expect(await readMail(env, kv, ID, NOV)).toEqual([]);
    const outro = 'c'.repeat(32);
    expect(await readMail(env, kv, outro, NOV)).toEqual([]);
  });
  it('prêmio por colocação desce e participar sempre rende', () => {
    expect(seasonPrize(1)).toBeGreaterThan(seasonPrize(2));
    expect(seasonPrize(3)).toBeGreaterThan(seasonPrize(20));
    expect(seasonPrize(100)).toBeGreaterThan(seasonPrize(null));
    expect(seasonPrize(null)).toBe(6);
  });
});

const { claimMail, deleteMail, markRead, MAIL_TTL_MS } = await import('./_mensageiro.js');
const T0 = Date.UTC(2026, 10, 3);
const comItem = { mid: 'item-1', bodyPt: 'Toma.', bodyEn: 'Take.', bits: 50, emblems: 2, at: T0 };
const semItem = { mid: 'aviso-1', bodyPt: 'Oi. Tudo bem?', bodyEn: 'Hi. All good?', at: T0 };
async function caixa() {
  const kv = kvFake(); const env = { DIGIAPP_SAVES: kv };
  await enqueueMail(env, kv, ID, comItem);
  await enqueueMail(env, kv, ID, semItem);
  return { kv, env };
}

describe('caixa de cartas (§245)', () => {
  it('resgate é idempotente e o prêmio vem do servidor', async () => {
    const { kv } = await caixa();
    const a = await claimMail(kv, ID, ['item-1', 'aviso-1'], T0 + 1);
    expect(a).toEqual([expect.objectContaining({ mid: 'item-1', bits: 50, emblems: 2 })]);
    expect(await claimMail(kv, ID, ['item-1'], T0 + 2)).toEqual([]);
    expect(await claimMail(kv, ID, null, T0 + 3)).toEqual([]);
  });
  it('"resgatar tudo" entrega só as com item e as marca como lidas', async () => {
    const { kv, env } = await caixa();
    const g = await claimMail(kv, ID, null, T0 + 1);
    expect(g.map(x => x.mid)).toEqual(['item-1']);
    const q = await readMail(env, kv, ID, T0 + 2);
    expect(q.find(m => m.mid === 'item-1')).toMatchObject({ read: true, claimedAt: T0 + 1 });
    expect(q.find(m => m.mid === 'aviso-1')?.read).toBe(false);
  });
  it('apagar carta com item pendente exige force; sem item apaga direto', async () => {
    const { kv, env } = await caixa();
    expect(await deleteMail(kv, ID, ['item-1'])).toEqual({ removed: 0, blocked: ['item-1'] });
    expect(await deleteMail(kv, ID, ['aviso-1'])).toEqual({ removed: 1, blocked: [] });
    expect(await deleteMail(kv, ID, ['item-1'], true)).toEqual({ removed: 1, blocked: [] });
    expect(await readMail(env, kv, ID, T0 + 2)).toEqual([]);
    expect(await enqueueMail(env, kv, ID, comItem)).toBe(false); // apagada não renasce
  });
  it('"excluir lidas" apaga só lidas sem item pendente', async () => {
    const { kv, env } = await caixa();
    await markRead(kv, ID, ['item-1', 'aviso-1']);
    expect(await deleteMail(kv, ID, 'read')).toEqual({ removed: 1, blocked: ['item-1'] });
    expect((await readMail(env, kv, ID, T0 + 2)).map(m => m.mid)).toEqual(['item-1']);
    await claimMail(kv, ID, ['item-1'], T0 + 3);
    expect((await deleteMail(kv, ID, 'read')).removed).toBe(1);
  });
  it('expira em 3 dias, menos a carta com item pendente', async () => {
    const { kv, env } = await caixa();
    expect((await readMail(env, kv, ID, T0 + MAIL_TTL_MS - 1000)).length).toBe(2);
    expect((await readMail(env, kv, ID, T0 + MAIL_TTL_MS + 1000)).map(m => m.mid)).toEqual(['item-1']);
    await claimMail(kv, ID, ['item-1'], T0 + MAIL_TTL_MS + 2000);
    expect((await readMail(env, kv, ID, T0 + MAIL_TTL_MS + 3000)).length).toBe(1); // resgatada agora: o prazo conta do resgate
    expect(await readMail(env, kv, ID, T0 + 2 * MAIL_TTL_MS + 5000)).toEqual([]);
    expect(await enqueueMail(env, kv, ID, semItem)).toBe(false); // expirada não renasce
  });
  it('fila cheia nunca joga fora carta com item pendente', async () => {
    const kv = kvFake(); const env = { DIGIAPP_SAVES: kv };
    await enqueueMail(env, kv, ID, comItem);
    for (let i = 0; i < 35; i++) await enqueueMail(env, kv, ID, { ...semItem, mid: `n${i}` });
    const q = await readMail(env, kv, ID, T0 + 1);
    expect(q.length).toBe(30);
    expect(q.some(m => m.mid === 'item-1')).toBe(true);
  });
  it('carta antiga sem título ganha um da primeira frase', async () => {
    const { kv, env } = await caixa();
    const q = await readMail(env, kv, ID, T0 + 1);
    expect(q.find(m => m.mid === 'aviso-1')?.titlePt).toBe('Oi.');
  });
});
