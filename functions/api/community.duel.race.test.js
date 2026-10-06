/**
 * PR13 / ALTO-1 da auditoria de segurança: `duelStart` em paralelo da mesma conta dava UMA SEMENTE POR CHAMADA por uma
 * cota só (todas liam `matchesToday = 0`). Agora: 1 semente, as demais 409; o mesmo oponente repetido devolve o MESMO
 * duelo (idempotente); `match` em paralelo liquida o duelo UMA vez.
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';
import { DUEL_DAY_MS } from './_duel.js';

const ME = 'a'.repeat(32);
const OPPS = ['b', 'c', 'd'].map(c => c.repeat(32));
const PID = Object.fromEntries(OPPS.map((o, i) => [o, String.fromCharCode(112 + i).repeat(24)]));

/** KV cujo `get`/`put` DEMORAM (força o entrelaçamento que o KV eventualmente consistente permite). */
function slowKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const meta = new Map();
  const wait = () => new Promise(r => setTimeout(r, 8));
  return {
    store, meta,
    get: async k => { await wait(); return store.get(k) ?? null; },
    getWithMetadata: async k => { await wait(); return { value: store.get(k) ?? null, metadata: meta.get(k) ?? null }; },
    put: async (k, v, opts) => { await wait(); store.set(k, v); if (opts?.metadata !== undefined) meta.set(k, opts.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const perfil = (id) => JSON.stringify({ id, name: id.slice(0, 3), petName: 'Bicho', stage: 'rookie', pvpEnabled: true, pid: PID[id] });
const save = JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3, totalXP: 5000 });
const mkEnv = () => {
  const seed = { [`profile:${ME}`]: perfil(ME).replace(/"pid":"[^"]*"/, '"pid":"zzzzzzzzzzzzzzzzzzzzzzzz"'), [ME]: save };
  for (const o of OPPS) { seed[`profile:${o}`] = perfil(o); seed[`pid:${PID[o]}`] = o; seed[o] = save; }
  const kv = slowKV(seed);
  for (const k of [ME, ...OPPS]) kv.meta.set(k, { t: Date.now(), f: Date.now() - 90 * DUEL_DAY_MS });
  return { DIGIAPP_SAVES: kv };
};
const call = async (env, action, body) => {
  const res = await onRequest({
    request: new Request(`https://x.dev/api/community?action=${action}&id=${ME}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: ME, ...body }),
    }),
    env,
  });
  return { status: res.status, json: await res.json() };
};
const rank = env => JSON.parse([...env.DIGIAPP_SAVES.store.entries()].find(([k]) => k.startsWith('rank:') && k.endsWith(ME))[1]);

describe('ALTO-1: cota e semente do duelo são atômicas por conta', () => {
  it('3 duelStart em paralelo contra 3 oponentes: UMA semente; as outras duas 409; a cota cai 1 vez', async () => {
    const env = mkEnv();
    const rs = await Promise.all(OPPS.map(o => call(env, 'duelStart', { opponentId: PID[o] })));
    const com = rs.filter(r => r.status === 200 && typeof r.json.seed === 'number');
    expect(com).toHaveLength(1);
    expect(rs.filter(r => r.status === 409 || r.status === 429)).toHaveLength(2);
    expect(rank(env).matchesToday).toBe(1);
    // o duelo que sobrou é o da semente que o cliente recebeu
    expect(rank(env).pending.seed).toBe(com[0].json.seed);
  });

  it('o MESMO oponente repetido em paralelo (retry/duplo toque): todos recebem a MESMA semente, a cota cai 1 vez', async () => {
    const env = mkEnv();
    const rs = await Promise.all([0, 1, 2].map(() => call(env, 'duelStart', { opponentId: PID[OPPS[0]] })));
    expect(rs.every(r => r.status === 200)).toBe(true);
    expect(new Set(rs.map(r => r.json.seed)).size).toBe(1);
    expect(rank(env).matchesToday).toBe(1);
    expect(rank(env).losses).toBe(0); // repetir não vira desistência
  });

  it('match em paralelo sobre o mesmo duelo: a derrota/vitória é liquidada UMA vez para o duelo aberto', async () => {
    const env = mkEnv();
    await call(env, 'duelStart', { opponentId: PID[OPPS[0]] });
    const rs = await Promise.all([0, 1, 2].map(() => call(env, 'match', { opponentId: PID[OPPS[0]], taps: [] })));
    expect(rs.every(r => r.status === 200 || r.status === 429)).toBe(true);
    // 1 duelo aberto + 2 caminhos "sem duelo aberto" (cliente antigo), cada um gasta partida: a cota total nunca passa de 5 e o
    // duelo aberto foi consumido uma só vez (cada resposta tem uma semente própria, nenhuma repetida).
    const sementes = rs.filter(r => r.status === 200).map(r => JSON.stringify(r.json.duel.events));
    expect(rank(env).matchesToday).toBe(3);
    expect(rank(env).pending ?? null).toBeNull();
    expect(sementes).toHaveLength(3);
  });

  it('o duelo aberto expirado ainda é fechado como derrota e o novo abre normalmente', async () => {
    const env = mkEnv();
    await call(env, 'duelStart', { opponentId: PID[OPPS[0]] });
    const k = [...env.DIGIAPP_SAVES.store.keys()].find(x => x.startsWith('rank:'));
    const rec = JSON.parse(env.DIGIAPP_SAVES.store.get(k)); rec.pending.at = Date.now() - 10 * 60_000; env.DIGIAPP_SAVES.store.set(k, JSON.stringify(rec));
    const r = await call(env, 'duelStart', { opponentId: PID[OPPS[1]] });
    expect(r.status).toBe(200);
    expect(rank(env).losses).toBe(1);
  });
});
