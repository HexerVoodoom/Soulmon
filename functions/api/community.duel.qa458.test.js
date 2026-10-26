/**
 * QA-4 / QA-5 (PERGUNTAS-DO-DONO): robustez do duelo do Torneio.
 *  - QA-4: reenvio do MESMO `match` (resposta perdida na rede) devolve o resultado já liquidado, sem gastar outra partida.
 *  - QA-5: oponente que some (oculta/desliga PvP/apaga perfil) no meio do duelo = cancelamento sem custo, ele não pontua.
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';
import { DUEL_PENDING_MS } from './_duel.js';

const ME = 'a'.repeat(32);
const OPP = 'b'.repeat(32);
const OPP2 = 'c'.repeat(32);
const PID = { [OPP]: 'p'.repeat(24), [OPP2]: 'q'.repeat(24) };
const DAY = 86400000;

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const meta = new Map();
  return {
    store, meta,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, o) => { store.set(k, v); if (o?.metadata !== undefined) meta.set(k, o.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const perfil = (id, extra = {}) => JSON.stringify({ id, name: id.slice(0, 3), petName: 'Bicho', stage: 'rookie', pvpEnabled: true, pid: PID[id], ...extra });
const save = () => JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3, totalXP: 5000 });
const mkEnv = () => {
  const kv = fakeKV({
    [`profile:${ME}`]: perfil(ME),
    [`profile:${OPP}`]: perfil(OPP), [`pid:${PID[OPP]}`]: OPP,
    [`profile:${OPP2}`]: perfil(OPP2), [`pid:${PID[OPP2]}`]: OPP2,
    [ME]: save(), [OPP]: save(), [OPP2]: save(),
  });
  for (const k of [ME, OPP, OPP2]) kv.meta.set(k, { t: Date.now(), f: Date.now() - 90 * DAY });
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
const rankDe = (env, id) => { const k = [...env.DIGIAPP_SAVES.store.keys()].find(x => x.startsWith('rank:') && x.endsWith(id)); return k ? JSON.parse(env.DIGIAPP_SAVES.store.get(k)) : null; };
const esconder = (env, id, extra) => env.DIGIAPP_SAVES.store.set(`profile:${id}`, perfil(id, extra));

describe('QA-4: match reenviado é idempotente', () => {
  it('com a mesma semente, o 2º envio devolve o mesmo resultado e não gasta partida nem repontua', async () => {
    const env = mkEnv();
    const ini = await call(env, 'duelStart', { opponentId: PID[OPP] });
    const a = await call(env, 'match', { opponentId: PID[OPP], taps: [], seed: ini.json.seed });
    expect(a.status).toBe(200);
    const antes = rankDe(env, ME);
    const b = await call(env, 'match', { opponentId: PID[OPP], taps: [], seed: ini.json.seed });
    expect(b.status).toBe(200);
    expect(b.json.replayed).toBe(true);
    expect(b.json.won).toBe(a.json.won);
    expect(b.json.matchesLeft).toBe(a.json.matchesLeft);
    const depois = rankDe(env, ME);
    expect(depois.matchesToday).toBe(antes.matchesToday);
    expect(depois.points).toBe(antes.points);
    expect(depois.wins + depois.losses).toBe(antes.wins + antes.losses);
  });
  it('semente diferente (ou ausente) NÃO é reenvio: cliente antigo segue como antes', async () => {
    const env = mkEnv();
    const ini = await call(env, 'duelStart', { opponentId: PID[OPP] });
    await call(env, 'match', { opponentId: PID[OPP], taps: [], seed: ini.json.seed });
    const c = await call(env, 'match', { opponentId: PID[OPP], taps: [] });
    expect(c.json.replayed).toBeUndefined();
    expect(rankDe(env, ME).matchesToday).toBe(2);
  });
});

describe('QA-5: oponente que some no meio do duelo cancela sem custo', () => {
  it('match 404 com duelo aberto: devolve a partida, limpa o duelo e o oponente não pontua', async () => {
    const env = mkEnv();
    await call(env, 'duelStart', { opponentId: PID[OPP] });
    expect(rankDe(env, ME).matchesToday).toBe(1);
    esconder(env, OPP, { publicHidden: true });
    const r = await call(env, 'match', { opponentId: PID[OPP], taps: [] });
    expect(r.status).toBe(404);
    expect(r.json.cancelled).toBe(true);
    const rk = rankDe(env, ME);
    expect(rk.pending).toBeNull();
    expect(rk.matchesToday).toBe(0);
    expect(rk.losses ?? 0).toBe(0);
    expect(rankDe(env, OPP)?.points ?? 0).toBe(0);
  });
  it('duelo que ficou aberto e vira derrota na próxima abertura: oponente que sumiu não ganha ponto e a partida volta', async () => {
    const env = mkEnv();
    await call(env, 'duelStart', { opponentId: PID[OPP] });
    esconder(env, OPP, { pvpEnabled: false });
    const k = [...env.DIGIAPP_SAVES.store.keys()].find(x => x.startsWith('rank:') && x.endsWith(ME));
    const rec = JSON.parse(env.DIGIAPP_SAVES.store.get(k)); rec.pending.at = Date.now() - DUEL_PENDING_MS - 1000; env.DIGIAPP_SAVES.store.set(k, JSON.stringify(rec));
    const r = await call(env, 'duelStart', { opponentId: PID[OPP2] });
    expect(r.status).toBe(200);
    expect(rankDe(env, OPP)?.points ?? 0).toBe(0);
    expect(rankDe(env, ME).matchesToday).toBe(1); // só a nova; a cancelada voltou
    expect(rankDe(env, ME).losses ?? 0).toBe(0);
  });
});
