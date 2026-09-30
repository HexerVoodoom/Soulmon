/**
 * O duelo fantasma no SERVIDOR — as duas brechas que ficaram abertas na
 * primeira versão e o que as fecha:
 *  1. sair antes do fim era de graça → agora é DERROTA (`forfeitPending`);
 *  2. a semente vinha na lista de oponentes, e um cliente editado simulava os
 *     três e escolhia o que vence → agora ela nasce em `duelStart`, DEPOIS de
 *     a partida ser gasta.
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';
import { DUEL_PENDING_MS } from './_duel.js';

const ME = 'a'.repeat(32);
const OPP = 'b'.repeat(32);
const OPP2 = 'c'.repeat(32);
const PID = { [OPP]: 'p'.repeat(24), [OPP2]: 'q'.repeat(24) };

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix }) => ({
      keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })),
      list_complete: true,
    }),
  };
}
const perfil = (id, stage = 'rookie') => JSON.stringify({ id, name: id.slice(0, 3), petName: 'Bicho', stage, pvpEnabled: true, pid: PID[id] });
const mkEnv = () => ({
  DIGIAPP_SAVES: fakeKV({
    [`profile:${ME}`]: perfil(ME),
    [`profile:${OPP}`]: perfil(OPP), [`pid:${PID[OPP]}`]: OPP,
    [`profile:${OPP2}`]: perfil(OPP2), [`pid:${PID[OPP2]}`]: OPP2,
  }),
});
const call = async (env, action, body, method = 'POST') => {
  const res = await onRequest({
    request: new Request(`https://x.dev/api/community?action=${action}&id=${ME}`, {
      method, headers: { 'content-type': 'application/json' }, body: method === 'POST' ? JSON.stringify({ id: ME, ...body }) : undefined,
    }),
    env,
  });
  return { status: res.status, json: await res.json() };
};
const rank = env => {
  const k = [...env.DIGIAPP_SAVES.store.keys()].find(x => x.startsWith('rank:') && x.endsWith(ME));
  return JSON.parse(env.DIGIAPP_SAVES.store.get(k));
};
const rankDe = (env, id) => {
  const k = [...env.DIGIAPP_SAVES.store.keys()].find(x => x.startsWith('rank:') && x.endsWith(id));
  return k ? JSON.parse(env.DIGIAPP_SAVES.store.get(k)) : null;
};

describe('duelo — a semente nunca chega antes do compromisso', () => {
  it('a lista de oponentes não traz semente nenhuma', async () => {
    const env = mkEnv();
    const r = await call(env, 'opponents', {}, 'GET');
    expect(r.status).toBe(200);
    for (const o of r.json.opponents) {
      expect(o.duel).toBeTruthy();
      expect(JSON.stringify(o)).not.toMatch(/seed/i);
    }
  });

  it('duelStart gasta a partida do dia e devolve a semente', async () => {
    const env = mkEnv();
    const r = await call(env, 'duelStart', { opponentId: PID[OPP] });
    expect(r.status).toBe(200);
    expect(typeof r.json.seed).toBe('number');
    expect(r.json.matchesLeft).toBe(4);
    expect(rank(env).matchesToday).toBe(1);
  });
});

describe('duelo — desistir é perder', () => {
  it('forfeit conta derrota, paga o oponente e NÃO deixa a partida de graça', async () => {
    const env = mkEnv();
    await call(env, 'duelStart', { opponentId: PID[OPP] });
    const r = await call(env, 'match', { opponentId: PID[OPP], forfeit: true });
    expect(r.json.won).toBe(false);
    expect(r.json.forfeit).toBe(true);
    expect(r.json.matchesLeft).toBe(4);
    expect(rank(env).losses).toBe(1);
    expect(rankDe(env, OPP).wins).toBe(1);
    expect(rank(env).pending).toBeNull();
  });

  it('fechar o app (duelo aberto) vira derrota na próxima abertura', async () => {
    const env = mkEnv();
    await call(env, 'duelStart', { opponentId: PID[OPP] });
    await call(env, 'duelStart', { opponentId: PID[OPP2] });
    const r = rank(env);
    expect(r.losses).toBe(1);        // o primeiro foi fechado como derrota
    expect(r.matchesToday).toBe(2);  // e gastou a sua partida
    expect(r.pending.opp).toBe(PID[OPP2]);
  });

  it('duelo aberto contra outro oponente também é fechado como derrota no match', async () => {
    const env = mkEnv();
    await call(env, 'duelStart', { opponentId: PID[OPP] });
    await call(env, 'match', { opponentId: PID[OPP2], cheers: [] });
    expect(rank(env).losses + rank(env).wins).toBe(2);
    expect(rank(env).matchesToday).toBe(2);
  });

  it('passou do prazo do duelo: o match vira desistência, mesmo com torcida perfeita', async () => {
    const env = mkEnv();
    await call(env, 'duelStart', { opponentId: PID[OPP] });
    const k = [...env.DIGIAPP_SAVES.store.keys()].find(x => x.startsWith('rank:') && x.endsWith(ME));
    const rec = JSON.parse(env.DIGIAPP_SAVES.store.get(k));
    rec.pending.at = Date.now() - DUEL_PENDING_MS - 1000;
    env.DIGIAPP_SAVES.store.set(k, JSON.stringify(rec));
    const r = await call(env, 'match', { opponentId: PID[OPP], cheers: [1, 1, 1] });
    expect(r.json.forfeit).toBe(true);
    expect(r.json.won).toBe(false);
  });

  it('não dá para desistir de um duelo que não está aberto', async () => {
    const env = mkEnv();
    const r = await call(env, 'match', { opponentId: PID[OPP], forfeit: true });
    expect(r.status).toBe(409);
    expect(rankDe(env, ME)).toBeNull(); // 409 antes de gravar: nada foi gasto
  });
});

describe('duelo — resolver usa a semente do servidor e gasta uma partida só', () => {
  it('duelStart + match = UMA partida gasta, e o pending some', async () => {
    const env = mkEnv();
    await call(env, 'duelStart', { opponentId: PID[OPP] });
    const r = await call(env, 'match', { opponentId: PID[OPP], cheers: [1, 1, 1] });
    expect(r.status).toBe(200);
    expect(r.json.forfeit).toBeUndefined();
    expect(rank(env).matchesToday).toBe(1);
    expect(rank(env).pending).toBeNull();
    expect(r.json.duel.events.length).toBeGreaterThan(0);
  });

  it('semente enviada pelo cliente é ignorada: mesmo duelo, mesmo resultado', async () => {
    const a = mkEnv(); const b = mkEnv();
    await call(a, 'duelStart', { opponentId: PID[OPP] });
    await call(b, 'duelStart', { opponentId: PID[OPP] });
    // força a mesma semente do servidor nos dois e manda "semente" diferente do cliente
    const setSeed = env => {
      const k = [...env.DIGIAPP_SAVES.store.keys()].find(x => x.startsWith('rank:') && x.endsWith(ME));
      const rec = JSON.parse(env.DIGIAPP_SAVES.store.get(k)); rec.pending.seed = 12345;
      env.DIGIAPP_SAVES.store.set(k, JSON.stringify(rec));
    };
    setSeed(a); setSeed(b);
    const ra = await call(a, 'match', { opponentId: PID[OPP], cheers: [0.5, 0.5, 0.5], seed: 1 });
    const rb = await call(b, 'match', { opponentId: PID[OPP], cheers: [0.5, 0.5, 0.5], seed: 999 });
    expect(ra.json.duel.events).toEqual(rb.json.duel.events);
  });

  it('a cota diária vale para o duelo: a 6ª abertura é recusada', async () => {
    const env = mkEnv();
    for (let i = 0; i < 5; i++) {
      await call(env, 'duelStart', { opponentId: PID[OPP] });
      await call(env, 'match', { opponentId: PID[OPP], cheers: [] });
    }
    const r = await call(env, 'duelStart', { opponentId: PID[OPP] });
    expect(r.status).toBe(429);
  });

  it('cliente antigo (sem duelStart) ainda joga: abre e fecha numa chamada só', async () => {
    const env = mkEnv();
    const r = await call(env, 'match', { opponentId: PID[OPP] });
    expect(r.status).toBe(200);
    expect(rank(env).matchesToday).toBe(1);
  });
});
