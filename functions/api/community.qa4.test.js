/**
 * QA r4, achados 2–5 (REGISTRO §381), handler REAL de `community.js`:
 *  2. `mailClaim` reivindica cada carta por INSERT único em `order_claims` (`mailclaim:<id>:<mid>`): N pedidos paralelos pagam UMA vez.
 *     O presente de Bits entre amigos reivindica o dia do par (`gift:<id>:<amigo>:<dia>`): outro isolate que já mandou hoje recusa.
 *  3. `sparMatch` só apaga o duelo aberto DEPOIS de gravar `sparDone`: gravação que falha no meio não perde a vitória no retry.
 *  4. `_treino.js`: a âncora de fuso e a baixa da reserva do ticket extra propagam a falha do KV (antes: `.catch(() => {})`).
 *  5. Busca de jogador: queda do KV propaga (antes: lista vazia); perfil com JSON ilegível segue pulado, com `console.warn`.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { onRequest } from './community.js';
import { claimMail } from './_mensageiro.js';
import { xpForLevel } from './_bond.js';
import { DUEL_DAY_MS } from './_duel.js';
import { sparPendingKey, sparDoneKey, sparHonorKey, sparTzKey, sparReserveKey, sparTicketKey, fixarTzTreino, buySparTicket } from './_treino.js';
import { nickFoldKey, nickKey } from './_profile.js';

const AGORA = Date.parse('2026-11-11T12:00:00Z');
beforeAll(() => { vi.useFakeTimers({ toFake: ['Date'], now: AGORA }); });
afterAll(() => { vi.useRealTimers(); });

const ME = 'a'.repeat(32);
const OPP = 'b'.repeat(32);
const PID = 'pp01'.padEnd(24, 'z');
const DIA = '2026-11-11';

/** KV falso + `falhaGet`/`falhaPut`/`falhaDelete` (prefixo cuja operação REJEITA uma vez ou sempre) + `lento` (await entre leitura e escrita). */
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const meta = new Map();
  const tick = () => (kv.lento ? new Promise(r => setTimeout(r, 3)) : Promise.resolve());
  const falha = (regra, k) => {
    if (!regra || !k.startsWith(regra.prefixo)) return false;
    if (regra.vezes !== undefined) { if (regra.vezes <= 0) return false; regra.vezes--; }
    return true;
  };
  const kv = {
    store, meta, lento: false,
    falhaGet: /** @type {any} */ (null), falhaPut: /** @type {any} */ (null), falhaDelete: /** @type {any} */ (null),
    get: async k => { await tick(); if (falha(kv.falhaGet, k)) throw new Error('kv get failed'); return store.get(k) ?? null; },
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, opts) => {
      await tick();
      if (falha(kv.falhaPut, k)) throw new Error('kv put failed');
      store.set(k, v);
      if (opts?.metadata !== undefined) meta.set(k, opts.metadata);
    },
    delete: async k => { if (falha(kv.falhaDelete, k)) throw new Error('kv delete failed'); store.delete(k); meta.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
  return kv;
}
function fakeD1() {
  const rows = new Map();
  return {
    rows,
    prepare: sql => ({
      bind: (...a) => ({
        async run() {
          if (/^INSERT/i.test(sql)) {
            if (rows.has(a[0])) throw new Error('UNIQUE constraint failed: order_claims.order_id');
            rows.set(a[0], { save: a[1], claimed: a[2], expires: a[3] });
          } else if (/^DELETE/i.test(sql)) {
            const r = rows.get(a[0]);
            if (r && /expires_at <=/.test(sql)) { if (r.expires != null && r.expires <= a[1]) rows.delete(a[0]); }
            else if (r) rows.delete(a[0]);
          }
          return { success: true };
        },
        async first() { const r = rows.get(a[0]); return r ? { save_id: r.save } : null; },
      }),
    }),
  };
}
const perfil = (id, pid, extra = {}) => JSON.stringify({ id, name: id.slice(0, 3), petName: 'Bicho', stage: 'rookie', pvpEnabled: true, pid, lifetimePoints: 77, ...extra });
const save = (bond, over = {}) => JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3, totalXP: xpForLevel(bond), ...over });
function mkEnv({ d1 = false, meExtra = {} } = {}) {
  const f = AGORA - 90 * DUEL_DAY_MS;
  const kv = fakeKV({
    [`profile:${ME}`]: perfil(ME, 'pp00'.padEnd(24, 'z'), meExtra), [ME]: save(10, { evolutionStage: 'ultra-power', perfectDays: 999 }),
    [`profile:${OPP}`]: perfil(OPP, PID), [`pid:${PID}`]: OPP, [OPP]: save(10, { perfectDays: 0 }),
  });
  kv.meta.set(ME, { t: AGORA, f });
  kv.meta.set(OPP, { t: AGORA, f });
  return { env: { DIGIAPP_SAVES: kv, ...(d1 ? { DB: fakeD1() } : {}) }, kv };
}
const req = (action, body, query = '') => new Request(`https://x.dev/api/community?action=${action}&id=${ME}${query}`, body === undefined
  ? {}
  : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: ME, ...body }) });
const call = async (env, action, body, query) => {
  const res = await onRequest({ request: req(action, body, query), env });
  return { status: res.status, json: await res.json() };
};
const TZ = { off: 0 };
const carta = (mid, bits) => ({ mid, bodyPt: 'Compensação.', bodyEn: 'Compensation.', bits, emblems: 0, at: AGORA - 1000 });

describe('achado 2 · mailClaim atômico', () => {
  it('5 pedidos paralelos da mesma carta: granted sai UMA vez no total (antes: 5)', async () => {
    const { env, kv } = mkEnv({ d1: true });
    kv.store.set(`mail:${ME}`, JSON.stringify({ q: [carta('comp-1', 50)], done: [], season: '2026-10' }));
    kv.lento = true;
    const rs = await Promise.all(Array.from({ length: 5 }, () => call(env, 'mailClaim', { mids: ['comp-1'] })));
    expect(rs.every(r => r.status === 200)).toBe(true);
    expect(rs.flatMap(r => r.json.granted)).toHaveLength(1);
    expect(env.DB.rows.has(`mailclaim:${ME}:comp-1`)).toBe(true);
  });

  it('linha de reivindicação já existe (outro pedido pagou): não paga de novo e a carta fica marcada como resgatada', async () => {
    const { env, kv } = mkEnv({ d1: true });
    kv.store.set(`mail:${ME}`, JSON.stringify({ q: [carta('comp-2', 50)], done: [], season: '2026-10' }));
    env.DB.rows.set(`mailclaim:${ME}:comp-2`, { save: ME, claimed: AGORA, expires: AGORA + 1e9 });
    expect(await claimMail(kv, ME, null, AGORA, env.DB)).toEqual([]);
    expect(JSON.parse(kv.store.get(`mail:${ME}`)).q[0].claimedAt).toBeGreaterThan(0);
  });

  it('gravação da caixa falha depois do INSERT: a linha sai, e o retry paga (não some o prêmio)', async () => {
    const { env, kv } = mkEnv({ d1: true });
    kv.store.set(`mail:${ME}`, JSON.stringify({ q: [carta('comp-3', 50)], done: [], season: '2026-10' }));
    kv.falhaPut = { prefixo: 'mail:', vezes: 1 };
    await expect(claimMail(kv, ME, ['comp-3'], AGORA, env.DB)).rejects.toThrow('kv put failed');
    expect(env.DB.rows.has(`mailclaim:${ME}:comp-3`)).toBe(false);
    expect(await claimMail(kv, ME, ['comp-3'], AGORA, env.DB)).toEqual([expect.objectContaining({ mid: 'comp-3', bits: 50 })]);
  });

  it('sem D1: comportamento de antes (uma vez por carta no mesmo fluxo sequencial)', async () => {
    const { kv } = mkEnv();
    kv.store.set(`mail:${ME}`, JSON.stringify({ q: [carta('comp-4', 50)], done: [], season: '2026-10' }));
    expect(await claimMail(kv, ME, ['comp-4'], AGORA)).toHaveLength(1);
    expect(await claimMail(kv, ME, ['comp-4'], AGORA)).toEqual([]);
  });
});

describe('achado 2 · presente de Bits reivindica o dia do par', () => {
  it('outro isolate já reivindicou `gift:<id>:<amigo>:<dia>`: 429 e nenhum Bit chega ao amigo', async () => {
    const { env, kv } = mkEnv({ d1: true, meExtra: { friends: [OPP] } });
    env.DB.rows.set(`gift:${ME}:${OPP}:${DIA}`, { save: ME, claimed: AGORA, expires: AGORA + 1e9 });
    const r = await call(env, 'gift', { friendId: PID, ...TZ });
    expect(r.status).toBe(429);
    expect(kv.store.has(`mail:${OPP}`)).toBe(false);
    expect(kv.store.has(`gifts:${OPP}`)).toBe(false);
  });

  it('primeiro presente do dia passa e grava a reivindicação; o segundo recusa', async () => {
    const { env } = mkEnv({ d1: true, meExtra: { friends: [OPP] } });
    expect((await call(env, 'gift', { friendId: PID, ...TZ })).status).toBe(200);
    expect(env.DB.rows.has(`gift:${ME}:${OPP}:${DIA}`)).toBe(true);
    expect((await call(env, 'gift', { friendId: PID, ...TZ })).status).toBe(429);
  });

  it('a marca do dia não grava: a reivindicação sai e o retry manda o presente', async () => {
    const { env, kv } = mkEnv({ d1: true, meExtra: { friends: [OPP] } });
    kv.falhaPut = { prefixo: 'gsent:', vezes: 1 };
    await expect(call(env, 'gift', { friendId: PID, ...TZ })).rejects.toThrow('kv put failed');
    expect(env.DB.rows.has(`gift:${ME}:${OPP}:${DIA}`)).toBe(false);
    expect((await call(env, 'gift', { friendId: PID, ...TZ })).status).toBe(200);
  });
});

describe('achado 3 · sparMatch apaga o duelo aberto só depois de gravar sparDone', () => {
  const taps = [9, 9, 9, 9, 9, 9, 9, 9, 9, 9];
  it('`put` de sparDone falha → rejeita, o duelo continua aberto e o retry (mesma semente) liquida a vitória com Honra', async () => {
    const { env, kv } = mkEnv();
    const s = await call(env, 'sparStart', { opponentId: PID, ...TZ });
    expect(s.status).toBe(200);
    kv.falhaPut = { prefixo: 'sparDone:', vezes: 1 };
    const corpo = { opponentId: PID, taps, seed: s.json.seed, ...TZ };
    await expect(call(env, 'sparMatch', corpo)).rejects.toThrow('kv put failed');
    expect(kv.store.has(sparPendingKey(ME))).toBe(true);
    const retry = await call(env, 'sparMatch', corpo);
    expect(retry.status).toBe(200);
    expect(retry.json.outcome).toBe('win');
    expect(retry.json.honor).toBeGreaterThan(0);
    expect(kv.store.has(sparPendingKey(ME))).toBe(false);
  });

  it('`delete` do duelo aberto falha depois de sparDone → o retry devolve o resultado já liquidado, sem Honra nova', async () => {
    const { env, kv } = mkEnv();
    const s = await call(env, 'sparStart', { opponentId: PID, ...TZ });
    kv.falhaDelete = { prefixo: 'spar:', vezes: 1 };
    const corpo = { opponentId: PID, taps, seed: s.json.seed, ...TZ };
    await expect(call(env, 'sparMatch', corpo)).rejects.toThrow('kv delete failed');
    expect(kv.store.has(sparDoneKey(ME))).toBe(true);
    const honraAntes = kv.store.get(sparHonorKey(ME, DIA));
    const retry = await call(env, 'sparMatch', corpo);
    expect(retry.status).toBe(200);
    expect(retry.json.replayed).toBe(true);
    expect(kv.store.get(sparHonorKey(ME, DIA))).toBe(honraAntes);
    expect(kv.store.has(sparPendingKey(ME))).toBe(false);
  });
});

describe('achado 4 · `_treino.js` propaga a falha do KV', () => {
  it('fixarTzTreino: `put` da âncora falha → rejeita (antes: seguia sem âncora e o próximo fuso virava outro dia)', async () => {
    const { env, kv } = mkEnv();
    kv.falhaPut = { prefixo: 'sparTz:' };
    await expect(fixarTzTreino(env, ME, { offsetMs: 0 })).rejects.toThrow('kv put failed');
    expect(kv.store.has(sparTzKey(ME))).toBe(false);
  });

  it('confirm do ticket extra: `delete` da reserva falha → rejeita SEM conceder; o retry concede uma vez', async () => {
    const { env, kv } = mkEnv();
    kv.store.set(sparTicketKey(ME, DIA), JSON.stringify({ played: 20, extra: 0 }));
    expect((await buySparTicket(env, ME, DIA, 'reserve')).ok).toBe(true);
    kv.falhaDelete = { prefixo: 'sparReserve:', vezes: 1 };
    await expect(buySparTicket(env, ME, DIA, 'confirm')).rejects.toThrow('kv delete failed');
    expect(JSON.parse(kv.store.get(sparTicketKey(ME, DIA))).extra).toBe(0);
    expect(kv.store.has(sparReserveKey(ME, DIA))).toBe(true);
    expect((await buySparTicket(env, ME, DIA, 'confirm')).status.extra).toBe(1);
    expect((await buySparTicket(env, ME, DIA, 'confirm')).ok).toBe(false);
  });
});
