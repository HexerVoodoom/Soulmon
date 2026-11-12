import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('./_auth.js', () => ({
  authorizeSaveAccess: async (req, _env, id) => (req.headers.get('X-Dono') === id ? { ok: true } : { ok: false, status: 403, reason: 'forbidden' }),
}));
const { onRequest } = await import('./focus-journey.js');
const { journeyChests } = await import('./_focusJourney.js');

const ID = 'b'.repeat(32);
const DIA = '2026-11-08';
const T0 = Date.UTC(2026, 10, 8, 12);
function envFake() {
  const store = new Map();
  return { store, DIGIAPP_SAVES: { get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); } } };
}
const call = (env, body, dono = ID) => onRequest({
  request: new Request(`https://x/api/focus-journey?id=${ID}`, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'X-Dono': dono }, ...(body ? { body: JSON.stringify(body) } : {}) }),
  env,
}).then(r => r.json().then(j => ({ status: r.status, ...j })));
const at = (min) => vi.setSystemTime(T0 + min * 60_000);

afterEach(() => vi.useRealTimers());

describe('/api/focus-journey (§247)', () => {
  it('outra conta não mexe na jornada', async () => {
    const env = envFake();
    expect((await call(env, { action: 'start', mode: 'p25', env: 'forest', keys: [], day: DIA }, 'c'.repeat(32))).status).toBe(403);
  });
  it('o relógio é do servidor: claim cedo não paga baú futuro; o mesmo recibo nunca paga duas vezes', async () => {
    vi.useFakeTimers(); at(0);
    const env = envFake();
    const { active } = await call(env, { action: 'start', mode: 'p25', env: 'forest', keys: ['brejo'], day: DIA });
    expect((await call(env, { action: 'start', mode: 'p25', env: 'forest', keys: [], day: DIA })).status).toBe(409);
    const chests = journeyChests(active.seed, 'p25');
    at(chests[1].at * 25 + 0.01);
    const r1 = await call(env, { action: 'claim' });
    expect(Object.keys(r1.grants).sort()).toEqual([`${active.sid}:0`, `${active.sid}:1`]);
    const r2 = await call(env, { action: 'claim' });
    expect(r2.ledger.items + r2.ledger.ess).toBe(r1.ledger.items + r1.ledger.ess);
  });
  it('pausa até 3 vezes; fim paga a conclusão e a 1ª do dia dá a chave da masmorra', async () => {
    vi.useFakeTimers(); at(0);
    const env = envFake();
    const { active } = await call(env, { action: 'start', mode: 'p25', env: 'shore', keys: [], day: DIA });
    for (let i = 0; i < 4; i++) { at(1 + i * 2); await call(env, { action: 'pause' }); at(2 + i * 2); await call(env, { action: 'resume' }); }
    expect(JSON.parse(env.store.get(`fj:${ID}`)).pauses).toBe(3);
    at(40);
    const fim = await call(env, { action: 'claim' });
    expect(fim.dungeonKeyDay).toBe(DIA);
    expect(fim.active).toBeNull();
    expect(fim.ledger.done).toBe(1);
    expect(fim.grants[`${active.sid}:done`]).toBeDefined();
    at(41);
    await call(env, { action: 'start', mode: 'p25', env: 'shore', keys: [], day: DIA });
    at(70);
    const segunda = await call(env, { action: 'claim' });
    expect(segunda.dungeonKeyDay).toBeUndefined();
    expect(segunda.ledger.done).toBe(2);
  });
  it('encerrar antes paga os baús alcançados e não a conclusão (D-5)', async () => {
    vi.useFakeTimers(); at(0);
    const env = envFake();
    const { active } = await call(env, { action: 'start', mode: 'p25', env: 'cavern', keys: [], day: DIA });
    at(13);
    const r = await call(env, { action: 'end' });
    expect(r.active).toBeNull();
    expect(r.ledger.done).toBe(0);
    expect(r.grants[`${active.sid}:done`]).toBeUndefined();
    expect(Object.keys(r.grants).length).toBeGreaterThan(0);
  });
  it('dia do jogador muito longe do servidor é recusado', async () => {
    vi.useFakeTimers(); at(0);
    expect((await call(envFake(), { action: 'start', mode: 'p25', env: 'forest', keys: [], day: '2026-11-20' })).status).toBe(400);
  });
  it('a jornada concluida com recibo entra no razao das missoes (1 por dia); baus e encerrar cedo nao contam (REGISTRO §309)', async () => {
    vi.useFakeTimers(); at(0);
    const env = envFake();
    const { active } = await call(env, { action: 'start', mode: 'p25', env: 'forest', keys: [], day: DIA });
    at(5);
    await call(env, { action: 'claim' }); // cedo: so baus, sem conclusao
    expect(env.store.get(`mval:${ID}:2026-W45:f`)).toBeUndefined();
    at(40);
    await call(env, { action: 'claim' });
    expect(JSON.parse(env.store.get(`mval:${ID}:2026-W45:f`))).toEqual([DIA]);
    expect(active.day).toBe(DIA);
    // 2a jornada no mesmo dia: o dia nao entra duas vezes
    at(41);
    await call(env, { action: 'start', mode: 'p25', env: 'forest', keys: [], day: DIA });
    at(80);
    await call(env, { action: 'claim' });
    expect(JSON.parse(env.store.get(`mval:${ID}:2026-W45:f`))).toEqual([DIA]);
  });
  it('encerrar (end) nao conta para a semanal', async () => {
    vi.useFakeTimers(); at(0);
    const env = envFake();
    await call(env, { action: 'start', mode: 'p25', env: 'forest', keys: [], day: DIA });
    at(40);
    await call(env, { action: 'end' });
    expect(env.store.get(`mval:${ID}:2026-W45:f`)).toBeUndefined();
  });
});
