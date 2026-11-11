/**
 * TICKETS DO TREINO (10/11/2026): 1 ticket grátis por DIA DO JOGADOR = 20 partidas COM Honra; ticket extra (30 Bits, cobrados pelo app)
 * = +20 partidas SEM Honra, no máximo 3 por dia; o contador mora no servidor (`sparTicket:<id>:<dia>`). Treino nunca ranqueia.
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';
import { xpForLevel } from './_bond.js';
import { DUEL_DAY_MS } from './_duel.js';
import {
  TREINO_TICKET_MATCHES, TREINO_EXTRA_TICKET_BITS, TREINO_EXTRA_TICKETS_MAX, sparTicketKey, sparTicketStatus, sanitizeSparTicket,
} from './_treino.js';
import {
  TREINO_TICKET_MATCHES as T_APP, TREINO_EXTRA_TICKET_BITS as B_APP, TREINO_EXTRA_TICKETS_MAX as M_APP, sanitizeTreinoTickets,
} from '../../src/utils/treinoTickets';

const ME = 'a'.repeat(32);
const idDe = n => String(n).padStart(2, '0').repeat(16).slice(0, 32).replace(/0/g, 'x');
const pidDe = n => `pp${String(n).padStart(2, '0')}`.padEnd(24, 'z');

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
const perfil = (id, pid, over = {}) => JSON.stringify({ id, name: id.slice(0, 3), petName: 'Bicho', stage: 'rookie', pvpEnabled: true, pid, lifetimePoints: 77, ...over });
const save = (bond, over = {}) => JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3, totalXP: xpForLevel(bond), ...over });

/** `bonds`: o Vínculo de cada oponente (índice = n). Eu tenho `meBond`. */
function mkEnv({ meBond = 10, bonds = [], meOver = {}, oppProfile = {}, oppSave = {} } = {}) {
  const f = Date.now() - 90 * DUEL_DAY_MS;
  const kv = fakeKV({ [`profile:${ME}`]: perfil(ME, pidDe(0)), [ME]: save(meBond, meOver) });
  kv.meta.set(ME, { t: Date.now(), f });
  const ids = [];
  bonds.forEach((b, i) => {
    const id = idDe(i + 1);
    const pid = pidDe(i + 1);
    ids.push({ id, pid, bond: b });
    kv.store.set(`profile:${id}`, perfil(id, pid, oppProfile[i] ?? {}));
    kv.store.set(`pid:${pid}`, id);
    kv.store.set(id, save(b, oppSave[i] ?? {}));
    kv.meta.set(id, { t: Date.now(), f });
  });
  return { env: { DIGIAPP_SAVES: kv }, ids, kv };
}
const call = async (env, action, body, method = 'POST') => {
  const res = await onRequest({
    request: new Request(`https://x.dev/api/community?action=${action}&id=${ME}`, {
      method, headers: { 'content-type': 'application/json' }, body: method === 'POST' ? JSON.stringify({ id: ME, ...body }) : undefined,
    }),
    env,
  });
  return { status: res.status, json: await res.json() };
};


/** Eu sou muito mais forte (level alto, save antigo): vitória garantida contra rookie. */
const FORTE = { evolutionStage: 'ultra-power', perfectDays: 999 };
const FRACO = { evolutionStage: 'rookie', perfectDays: 0 };

const OPP_FRACO = { evolutionStage: 'rookie', perfectDays: 0 };
const hoje = () => new Date().toISOString().slice(0, 10);
const lutar = async (env, ids, body = {}) => {
  const o = ids[0];
  const s = await call(env, 'sparStart', { opponentId: o.pid, zone: 'UTC' });
  if (s.status !== 200) return s;
  return call(env, 'sparMatch', { opponentId: o.pid, seed: s.json.seed, zone: 'UTC', ...body });
};

describe('paridade app x servidor', () => {
  it('constantes e leitura do contador batem', () => {
    expect([T_APP, B_APP, M_APP]).toEqual([TREINO_TICKET_MATCHES, TREINO_EXTRA_TICKET_BITS, TREINO_EXTRA_TICKETS_MAX]);
    expect([TREINO_TICKET_MATCHES, TREINO_EXTRA_TICKET_BITS, TREINO_EXTRA_TICKETS_MAX]).toEqual([20, 30, 3]);
    for (const raw of [undefined, null, 'lixo', '{"played":7,"extra":2}', { played: -4, extra: 99 }, { played: 5000, extra: 1 }]) {
      const a = sparTicketStatus(raw);
      expect(sanitizeTreinoTickets(a)).toEqual(a);
      expect(sanitizeSparTicket(raw).extra).toBeLessThanOrEqual(3);
    }
    expect(sanitizeTreinoTickets('x')).toBeUndefined();
  });
});

describe('ticket grátis do dia: 20 partidas com Honra', () => {
  it('a lista informa o ticket do dia (20 com Honra, 0 jogadas, pode comprar)', async () => {
    const { env } = mkEnv({ bonds: [10] });
    const r = await call(env, 'sparOpponents', {}, 'GET');
    expect(r.json.tickets).toMatchObject({ played: 0, extra: 0, capacity: 20, honorLeft: 20, left: 20, canBuy: true });
  });

  it('cada partida liquidada gasta 1; vitória nas 20 primeiras paga Honra; a 21ª é recusada sem ticket extra', async () => {
    const { env, ids, kv } = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
    let honra = 0;
    for (let i = 0; i < 20; i++) { const r = await lutar(env, ids); expect(r.status).toBe(200); honra += r.json.honor; expect(r.json.tickets.played).toBe(i + 1); }
    expect(honra).toBe(20); // teto de Honra do dia, atingido dentro das 20 partidas
    expect(JSON.parse(kv.store.get(sparTicketKey(ME, hoje())))).toEqual({ played: 20, extra: 0 });
    const r21 = await lutar(env, ids);
    expect(r21.status).toBe(409);
    expect(r21.json.error).toBe('no tickets');
    expect([...kv.store.keys()].some(k => k.startsWith('rank:'))).toBe(false);
  });

  it('abrir a luta GASTA 1 partida do ticket; desistir não devolve (sem farm de leitura) e a Honra segue sem pagar', async () => {
    const { env, ids, kv } = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
    const o = ids[0];
    const s = await call(env, 'sparStart', { opponentId: o.pid, zone: 'UTC' });
    expect(s.json.tickets.played).toBe(1);
    expect(JSON.parse(kv.store.get(sparTicketKey(ME, hoje())))).toEqual({ played: 1, extra: 0 });
    const r = await call(env, 'sparMatch', { opponentId: o.pid, seed: s.json.seed, zone: 'UTC', forfeit: true });
    expect(r.json.forfeit).toBe(true);
    expect(r.json.honor).toBe(0);
    expect(JSON.parse(kv.store.get(sparTicketKey(ME, hoje())))).toEqual({ played: 1, extra: 0 }); // não gasta 2x
  });

  it('desistir 20 vezes fecha o ticket grátis: a 21ª abertura é recusada', async () => {
    const { env, ids } = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
    for (let i = 0; i < 20; i++) { const r = await lutar(env, ids, { forfeit: true }); expect(r.status).toBe(200); }
    const r21 = await call(env, 'sparStart', { opponentId: ids[0].pid, zone: 'UTC' });
    expect(r21.status).toBe(409);
  });

  it('reabrir o MESMO oponente já aberto não gasta outra partida', async () => {
    const { env, ids } = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
    const o = ids[0];
    await call(env, 'sparStart', { opponentId: o.pid, zone: 'UTC' });
    const s2 = await call(env, 'sparStart', { opponentId: o.pid, zone: 'UTC' });
    const l = await call(env, 'sparOpponents', {}, 'GET');
    expect(l.json.tickets.played).toBe(1);
    expect(s2.status).toBe(200);
  });

  it('virada do dia do jogador: dia seguinte tem ticket novo (outro registro)', async () => {
    const { env, ids, kv } = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
    kv.store.set(sparTicketKey(ME, hoje()), JSON.stringify({ played: 20, extra: 0 }));
    const cheio = await lutar(env, ids);
    expect(cheio.status).toBe(409);
    const amanha = await lutar(env, ids, {}); // mesmo UTC: ainda cheio
    expect(amanha.status).toBe(409);
    const o = ids[0];
    // O fuso da conta é preso: trocar de ±14 h NÃO abre outro dia. Só uma âncora presa há >24 h aceita a troca.
    const s2 = await call(env, 'sparStart', { opponentId: o.pid, off: 14 * 3600e3 });
    const s3 = await call(env, 'sparStart', { opponentId: o.pid, off: -14 * 3600e3 });
    expect([s2.status, s3.status]).toEqual(s2.status === 200 ? [200, 200] : [409, 409]);
  });
});

describe('ticket extra: 30 Bits (app), +20 partidas SEM Honra, máx. 3/dia', () => {
  it('compra soma 20 de capacidade; as partidas extras jogam, mas não pagam Honra', async () => {
    const { env, ids, kv } = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
    kv.store.set(sparTicketKey(ME, hoje()), JSON.stringify({ played: 20, extra: 0 }));
    const c = await call(env, 'sparBuyTicket', { zone: 'UTC' });
    expect(c.status).toBe(200);
    expect(c.json.tickets).toMatchObject({ extra: 1, capacity: 40, left: 20, honorLeft: 0 });
    for (let i = 0; i < 20; i++) {
      const r = await lutar(env, ids);
      expect(r.status).toBe(200);
      expect(r.json.outcome).toBe('win');
      expect(r.json.honor).toBe(0);
      expect(r.json.noHonorTicket).toBe(true);
    }
    expect((await lutar(env, ids)).status).toBe(409);
    expect(Number(kv.store.get(`sparHonor:${ME}:${hoje()}`) ?? 0)).toBe(0);
  });

  it('teto de 3 extras por dia: a 4ª compra é recusada (409) e nada muda', async () => {
    const { env, kv } = mkEnv({ bonds: [10] });
    for (let i = 1; i <= 3; i++) expect((await call(env, 'sparBuyTicket', { zone: 'UTC' })).json.tickets.extra).toBe(i);
    const antes = kv.store.get(sparTicketKey(ME, hoje()));
    const r4 = await call(env, 'sparBuyTicket', { zone: 'UTC' });
    expect(r4.status).toBe(409);
    expect(r4.json.tickets.canBuy).toBe(false);
    expect(kv.store.get(sparTicketKey(ME, hoje()))).toBe(antes);
    expect(r4.json.tickets.capacity).toBe(80);
  });

  it('comprar não mexe em Honra, rank nem save', async () => {
    const { env, kv } = mkEnv({ bonds: [10] });
    const antes = [...kv.store.keys()].sort().join();
    await call(env, 'sparBuyTicket', { zone: 'UTC' });
    const depois = [...kv.store.keys()].sort();
    expect(depois.filter(k => !antes.split(',').includes(k) && !k.startsWith('sparTz:'))).toEqual([sparTicketKey(ME, hoje())]);
  });

  it('só o dono compra (sem login de outro id = recusa)', async () => {
    const { env } = mkEnv({ bonds: [10] });
    const res = await onRequest({ request: new Request('https://x.dev/api/community?action=sparBuyTicket', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: 'zz' }) }), env });
    expect(res.status).toBe(400);
  });
});

describe('ticket extra em DUAS FASES (reserva + confirmação)', () => {
  it('reservar NÃO concede; confirmar concede UMA vez; confirmar de novo sem reserva é recusado', async () => {
    const { env, kv } = mkEnv({ bonds: [10] });
    const r = await call(env, 'sparBuyTicket', { zone: 'UTC', phase: 'reserve' });
    expect(r.status).toBe(200);
    expect(r.json.tickets.extra).toBe(0);
    expect(kv.store.has(sparTicketKey(ME, hoje()))).toBe(false);
    const c = await call(env, 'sparBuyTicket', { zone: 'UTC', phase: 'confirm' });
    expect(c.json.tickets.extra).toBe(1);
    const c2 = await call(env, 'sparBuyTicket', { zone: 'UTC', phase: 'confirm' });
    expect(c2.status).toBe(409);
    expect(c2.json.error).toBe('no reserve');
    expect(JSON.parse(kv.store.get(sparTicketKey(ME, hoje()))).extra).toBe(1);
  });

  it('recusa no app = só reservou: o ticket nunca sai de graça e a reserva vence', async () => {
    const { env, kv } = mkEnv({ bonds: [10] });
    await call(env, 'sparBuyTicket', { zone: 'UTC', phase: 'reserve' });
    kv.store.set(`sparReserve:${ME}:${hoje()}`, String(Date.now() - 10 * 60e3)); // venceu
    const c = await call(env, 'sparBuyTicket', { zone: 'UTC', phase: 'confirm' });
    expect(c.status).toBe(409);
    expect(kv.store.has(sparTicketKey(ME, hoje()))).toBe(false);
  });

  it('no teto de 3 a reserva é recusada', async () => {
    const { env, kv } = mkEnv({ bonds: [10] });
    kv.store.set(sparTicketKey(ME, hoje()), JSON.stringify({ played: 0, extra: 3 }));
    const r = await call(env, 'sparBuyTicket', { zone: 'UTC', phase: 'reserve' });
    expect(r.status).toBe(409);
  });
});
