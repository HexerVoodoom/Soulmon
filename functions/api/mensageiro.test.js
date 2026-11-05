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
