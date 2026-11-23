/**
 * QA rodada 2 (11/11/2026): regressões nomeadas do Treino depois do #792 (âncora do fuso da conta, `fixarTzTreino`).
 *
 * R2-T1  Pedido SEM fuso (zone/off ausentes) não prendia a âncora: o dia caía no UTC, e o PRIMEIRO fuso explícito que chegasse
 *        depois virava a âncora. Jogar as 20 partidas sem fuso e mandar `off: +14 h` abria um segundo "dia" (mais 20 partidas
 *        com Honra) no mesmo instante. Agora pedido sem fuso prende o UTC.
 * R2-T2  A âncora tinha TTL de 60 dias contado só da gravação: conta ativa que nunca troca de fuso perdia a âncora no dia 60
 *        e o truque acima voltava. Agora a âncora com mais de 30 dias é regravada (mesmo valor) e o prazo recomeça.
 *
 * O relógio é FIXADO às 12:00 UTC: nessa hora o fuso +14 h já está no dia seguinte (o teste não depende da hora em que roda).
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { onRequest } from './community.js';
import { xpForLevel } from './_bond.js';
import { DUEL_DAY_MS } from './_duel.js';
import { sparTicketKey, sparTzKey, SPAR_TZ_LOCK_MS } from './_treino.js';

const AGORA = Date.parse('2026-11-11T12:00:00Z');
beforeAll(() => { vi.useFakeTimers({ toFake: ['Date'], now: AGORA }); });
afterAll(() => { vi.useRealTimers(); });

const ME = 'a'.repeat(32);
const OPP = 'b'.repeat(32);
const PID = 'pp01'.padEnd(24, 'z');

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const meta = new Map();
  return {
    store, meta,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, opts) => { store.set(k, v); if (opts?.metadata !== undefined) meta.set(k, opts.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const perfil = (id, pid) => JSON.stringify({ id, name: id.slice(0, 3), petName: 'Bicho', stage: 'rookie', pvpEnabled: true, pid, lifetimePoints: 77 });
const save = (bond, over = {}) => JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3, totalXP: xpForLevel(bond), ...over });
function mkEnv() {
  const f = AGORA - 90 * DUEL_DAY_MS;
  const kv = fakeKV({
    [`profile:${ME}`]: perfil(ME, 'pp00'.padEnd(24, 'z')), [ME]: save(10, { evolutionStage: 'ultra-power', perfectDays: 999 }),
    [`profile:${OPP}`]: perfil(OPP, PID), [`pid:${PID}`]: OPP, [OPP]: save(10, { perfectDays: 0 }),
  });
  kv.meta.set(ME, { t: AGORA, f });
  kv.meta.set(OPP, { t: AGORA, f });
  return { env: { DIGIAPP_SAVES: kv }, kv };
}
const call = async (env, action, body) => {
  const res = await onRequest({
    request: new Request(`https://x.dev/api/community?action=${action}&id=${ME}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: ME, ...body }),
    }),
    env,
  });
  return { status: res.status, json: await res.json() };
};
/** Abre e desiste (o mais barato): a partida é gasta no `sparStart`. */
const gastar = async (env, tz) => {
  const s = await call(env, 'sparStart', { opponentId: PID, ...tz });
  if (s.status !== 200) return s;
  return call(env, 'sparMatch', { opponentId: PID, seed: s.json.seed, forfeit: true, ...tz });
};

describe('QA rodada 2: âncora do fuso do Treino', () => {
  it('R2-T1: 20 partidas SEM fuso e depois off +14 h NÃO abrem um segundo dia (o pedido sem fuso prende o UTC)', async () => {
    const { env, kv } = mkEnv();
    for (let i = 0; i < 20; i++) expect((await gastar(env, {})).status).toBe(200);
    expect(JSON.parse(kv.store.get(sparTicketKey(ME, '2026-11-11'))).played).toBe(20);
    const r = await call(env, 'sparStart', { opponentId: PID, off: 14 * 3600e3 });
    expect(r.status).toBe(409);
    expect(kv.store.has(sparTicketKey(ME, '2026-11-12'))).toBe(false);
  });

  it('R2-T1: a âncora UTC presa por um pedido sem fuso ainda troca depois de 24 h (viagem real)', async () => {
    const { env, kv } = mkEnv();
    kv.store.set(sparTzKey(ME), JSON.stringify({ offsetMs: 0, at: AGORA - SPAR_TZ_LOCK_MS - 1000 }));
    const s = await call(env, 'sparStart', { opponentId: PID, off: -3 * 3600e3 });
    expect(s.status).toBe(200);
    expect(JSON.parse(kv.store.get(sparTzKey(ME))).offsetMs).toBe(-3 * 3600e3);
  });

  it('R2-T2: âncora com mais de 30 dias e o MESMO fuso é regravada (o prazo de 60 dias recomeça)', async () => {
    const { env, kv } = mkEnv();
    const velho = AGORA - 31 * 86400e3;
    kv.store.set(sparTzKey(ME), JSON.stringify({ zone: 'America/Sao_Paulo', at: velho }));
    const s = await call(env, 'sparStart', { opponentId: PID, zone: 'America/Sao_Paulo' });
    expect(s.status).toBe(200);
    const a = JSON.parse(kv.store.get(sparTzKey(ME)));
    expect(a.zone).toBe('America/Sao_Paulo');
    expect(a.at).toBe(AGORA);
  });

  it('R2-T2: âncora recente e o mesmo fuso NÃO grava de novo (sem escrita por pedido)', async () => {
    const { env, kv } = mkEnv();
    const recente = AGORA - 2 * 86400e3;
    kv.store.set(sparTzKey(ME), JSON.stringify({ zone: 'America/Sao_Paulo', at: recente }));
    await call(env, 'sparStart', { opponentId: PID, zone: 'America/Sao_Paulo' });
    expect(JSON.parse(kv.store.get(sparTzKey(ME))).at).toBe(recente);
  });
});
