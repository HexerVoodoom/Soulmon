/**
 * 27/10/2026 (Torneio): (1) reroll dos 3 oponentes é UM por intervalo entre combates, travado no SERVIDOR;
 * (2) sprite de simulado vem de `sim:sprite:<id>` mesmo com o perfil defasado (sem `spriteUrl`), na lista E na partida.
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';

const ME = 'a'.repeat(32);
const OPP = 'b'.repeat(32);
const SIM = 'sim_0007';
const TOKEN = 'e5857867b2921099ca8c94aa6ccab5af';
const SPRITE = `/api/sprite-image?k=${TOKEN}`;
const PID = { [OPP]: 'p'.repeat(24), [SIM]: 's'.repeat(24) };
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
    // simulado com perfil DEFASADO: artLine antiga e nenhum spriteUrl
    [`profile:${SIM}`]: perfil(SIM, { artLine: 'igni', simulated: true }), [`pid:${PID[SIM]}`]: SIM,
    [ME]: save(), [OPP]: save(), [SIM]: save(),
    [`sim:sprite:${SIM}`]: SPRITE,
  });
  for (const k of [ME, OPP, SIM]) kv.meta.set(k, { t: Date.now(), f: Date.now() - 90 * DAY });
  return { DIGIAPP_SAVES: kv };
};
const opponents = async (env, q = '') => {
  const res = await onRequest({ request: new Request(`https://x.dev/api/community?action=opponents&id=${ME}${q}`), env });
  return { status: res.status, json: await res.json() };
};
const post = async (env, action, body) => {
  const res = await onRequest({
    request: new Request(`https://x.dev/api/community?action=${action}&id=${ME}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: ME, ...body }) }),
    env,
  });
  return { status: res.status, json: await res.json() };
};

describe('reroll dos oponentes', () => {
  it('o 2º reroll sem combate é recusado (429); depois de um combate volta a valer', async () => {
    const env = mkEnv();
    expect((await opponents(env)).json.rerolled).toBe(false);
    const r1 = await opponents(env, '&reroll=1');
    expect(r1.status).toBe(200);
    expect(r1.json.rerolled).toBe(true);
    const r2 = await opponents(env, '&reroll=1');
    expect(r2.status).toBe(429);
    expect(r2.json.rerolled).toBe(true);
    // a lista comum segue funcionando e diz que já foi usado
    expect((await opponents(env)).json.rerolled).toBe(true);
    // um combate termina
    const ini = await post(env, 'duelStart', { opponentId: PID[OPP] });
    await post(env, 'match', { opponentId: PID[OPP], taps: [], seed: ini.json.seed });
    expect((await opponents(env)).json.rerolled).toBe(false);
    expect((await opponents(env, '&reroll=1')).status).toBe(200);
  });

  it('sem `reroll` nada muda (cliente antigo): resposta sem a trava e sem efeito colateral', async () => {
    const env = mkEnv();
    await opponents(env); await opponents(env);
    expect([...env.DIGIAPP_SAVES.store.keys()].some(k => k.startsWith('reroll:'))).toBe(false);
  });
});

describe('sprite do simulado: preview == duelo', () => {
  it('a lista usa sim:sprite mesmo com o perfil sem spriteUrl', async () => {
    const env = mkEnv();
    const { json } = await opponents(env);
    // o perfil em KV ainda diz 'Bicho': o servidor sobrepoe pelo dado estatico (petNameDoSimulado)
    const sim = json.opponents.find(o => o.petName === 'HolySylvasi' && o.spriteUrl);
    expect(sim?.spriteUrl).toBe(SPRITE);
    expect(JSON.stringify(json)).not.toMatch(/sim_0007/);
  });

  it('a partida devolve o MESMO sprite do preview', async () => {
    const env = mkEnv();
    const { json } = await opponents(env);
    const sim = json.opponents.find(o => o.spriteUrl === SPRITE);
    const ini = await post(env, 'duelStart', { opponentId: sim.id });
    const m = await post(env, 'match', { opponentId: sim.id, taps: [], seed: ini.json.seed });
    expect(m.json.opponent.spriteUrl).toBe(sim.spriteUrl);
  });

  it('sprite inválido na chave não vira spriteUrl (cai no perfil, como antes)', async () => {
    const env = mkEnv();
    env.DIGIAPP_SAVES.store.set(`sim:sprite:${SIM}`, 'https://evil.example/x.png');
    const { json } = await opponents(env);
    expect(json.opponents.some(o => o.spriteUrl === 'https://evil.example/x.png')).toBe(false);
  });
});
