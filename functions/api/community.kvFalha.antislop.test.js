/**
 * Antislop P1 (14/11/2026, itens 1, 4, 5 e 13 do relatório; REGISTRO §374): falha de LEITURA do KV não pode virar "zerado".
 *
 * Antes, `get(k).catch(() => null)` tratava "o KV falhou" igual a "a chave não existe", e o código GRAVAVA por cima:
 * o ticket do Treino zerava (extras pagos somem), o teto de Honra do dia reabria, a âncora de fuso trocava, a confirmação
 * do ticket extra respondia 409 com a reserva viva (o app não retenta 409 e o jogador perdia os 30 Bits), o duelo aberto
 * "sumia" (409 depois da partida gasta) e o reroll dos oponentes liberava um 2º sorteio.
 *
 * Agora a falha do `get` PROPAGA: o handler rejeita (em produção, 500 da plataforma com corpo não-JSON, que o app
 * classifica como falha de rede e retenta: `isFalhaDeRede`, `src/utils/community.ts`). Só o JSON ilegível é tolerado.
 * No `sparMatch` todas as leituras acontecem ANTES de apagar o duelo aberto, para o retry do app liquidar a partida.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { onRequest } from './community.js';
import { xpForLevel } from './_bond.js';
import { DUEL_DAY_MS } from './_duel.js';
import { grantSparHonor, sparHonorKey, sparTicketKey, sparTzKey, sparPendingKey, sparReserveKey, readSparTicket } from './_treino.js';

const AGORA = Date.parse('2026-11-11T12:00:00Z');
beforeAll(() => { vi.useFakeTimers({ toFake: ['Date'], now: AGORA }); });
afterAll(() => { vi.useRealTimers(); });

const ME = 'a'.repeat(32);
const OPP = 'b'.repeat(32);
const PID = 'pp01'.padEnd(24, 'z');
const DIA = '2026-11-11';

/** KV falso dos testes do Treino + `falhaGet`: prefixo de chave cujo `get` REJEITA (KV fora do ar só para aquela leitura). */
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const meta = new Map();
  const kv = {
    store, meta, falhaGet: /** @type {string | null} */ (null), puts: /** @type {string[]} */ ([]),
    get: async k => {
      if (kv.falhaGet && k.startsWith(kv.falhaGet)) throw new Error('kv get failed');
      return store.get(k) ?? null;
    },
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, opts) => { kv.puts.push(k); store.set(k, v); if (opts?.metadata !== undefined) meta.set(k, opts.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
  return kv;
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
const req = (action, body, query = '') => new Request(`https://x.dev/api/community?action=${action}&id=${ME}${query}`, body === undefined
  ? {}
  : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: ME, ...body }) });
const call = async (env, action, body, query) => {
  const res = await onRequest({ request: req(action, body, query), env });
  return { status: res.status, json: await res.json() };
};
const TZ = { off: 0 };

describe('item 1 · `_treino.js`: falha de leitura do KV propaga e NÃO grava por cima', () => {
  it('grantSparHonor: `get` do contador rejeita → rejeita sem gravar (antes: contador do teto voltava a 0 e gravava 2)', async () => {
    const { env, kv } = mkEnv();
    kv.store.set(sparHonorKey(ME, DIA), '20');
    kv.falhaGet = 'sparHonor:';
    await expect(grantSparHonor(env, ME, DIA, () => 0.9)).rejects.toThrow('kv get failed');
    expect(kv.store.get(sparHonorKey(ME, DIA))).toBe('20');
    expect(kv.puts).toEqual([]);
  });

  it('readSparTicket: `get` rejeita → rejeita; JSON ilegível segue tolerado (vira zero)', async () => {
    const { env, kv } = mkEnv();
    kv.falhaGet = 'sparTicket:';
    await expect(readSparTicket(env, ME, DIA)).rejects.toThrow('kv get failed');
    kv.falhaGet = null;
    kv.store.set(sparTicketKey(ME, DIA), '{lixo');
    expect(await readSparTicket(env, ME, DIA)).toEqual({ played: 0, extra: 0 });
  });

  it('sparStart: ticket ilegível no KV por falha → rejeita e o ticket pago (45 jogadas, 2 extras) fica intacto', async () => {
    const { env, kv } = mkEnv();
    kv.store.set(sparTicketKey(ME, DIA), JSON.stringify({ played: 45, extra: 2 }));
    kv.falhaGet = 'sparTicket:';
    await expect(call(env, 'sparStart', { opponentId: PID, ...TZ })).rejects.toThrow('kv get failed');
    expect(JSON.parse(kv.store.get(sparTicketKey(ME, DIA)))).toEqual({ played: 45, extra: 2 });
    expect(kv.store.has(sparPendingKey(ME))).toBe(false);
  });

  it('fixarTzTreino: `get` da âncora rejeita → rejeita e a âncora travada (-14 h) NÃO troca pelo fuso do pedido', async () => {
    const { env, kv } = mkEnv();
    const ancora = JSON.stringify({ offsetMs: -14 * 3600e3, at: AGORA - 3600e3 });
    kv.store.set(sparTzKey(ME), ancora);
    kv.falhaGet = 'sparTz:';
    await expect(call(env, 'sparStart', { opponentId: PID, off: 14 * 3600e3 })).rejects.toThrow('kv get failed');
    expect(kv.store.get(sparTzKey(ME))).toBe(ancora);
  });

  it('fixarTzTreino: âncora com JSON ilegível segue tolerada (prende o fuso do pedido, como antes)', async () => {
    const { env, kv } = mkEnv();
    kv.store.set(sparTzKey(ME), '{lixo');
    expect((await call(env, 'sparStart', { opponentId: PID, off: -3 * 3600e3 })).status).toBe(200);
    expect(JSON.parse(kv.store.get(sparTzKey(ME))).offsetMs).toBe(-3 * 3600e3);
  });
});

describe('item 1 (ajuste) · sparMatch lê TUDO antes de apagar o duelo aberto: o retry do app liquida a partida', () => {
  for (const prefixo of ['sparTicket:', 'sparDone:', 'spar:', 'sparHonor:']) {
    it(`falha no \`get\` de ${prefixo} → rejeita, o duelo aberto continua e o retry (mesma semente) devolve o resultado`, async () => {
      const { env, kv } = mkEnv();
      const s = await call(env, 'sparStart', { opponentId: PID, ...TZ });
      expect(s.status).toBe(200);
      const ticketAntes = kv.store.get(sparTicketKey(ME, DIA));
      kv.falhaGet = prefixo;
      const corpo = { opponentId: PID, taps: [9, 9, 9, 9, 9, 9, 9, 9, 9, 9], seed: s.json.seed, ...TZ };
      if (prefixo === 'sparHonor:') {
        // A leitura do teto de Honra só existe na VITÓRIA: confirma a premissa antes de afirmar.
        kv.falhaGet = null;
        const sonda = mkEnv();
        const ss = await call(sonda.env, 'sparStart', { opponentId: PID, ...TZ });
        const r = await call(sonda.env, 'sparMatch', { ...corpo, seed: ss.json.seed });
        expect(r.json.outcome).toBe('win');
        kv.falhaGet = prefixo;
      }
      await expect(call(env, 'sparMatch', corpo)).rejects.toThrow('kv get failed');
      expect(kv.store.has(sparPendingKey(ME))).toBe(true);
      expect(kv.store.get(sparTicketKey(ME, DIA))).toBe(ticketAntes);
      kv.falhaGet = null;
      const retry = await call(env, 'sparMatch', corpo);
      expect(retry.status).toBe(200);
      expect(retry.json.outcome).toBeDefined();
      expect(kv.store.has(sparPendingKey(ME))).toBe(false);
    });
  }
});

describe('item 4 · confirm do ticket extra: falha do `get` da reserva vira 5xx (retentado), nunca 409 com a reserva viva', () => {
  it('reserva → (app debita os 30 Bits) → confirm com KV falhando rejeita sem conceder → retry concede UMA vez', async () => {
    const { env, kv } = mkEnv();
    kv.store.set(sparTicketKey(ME, DIA), JSON.stringify({ played: 20, extra: 0 }));
    const reserva = await call(env, 'sparBuyTicket', { phase: 'reserve', ...TZ });
    expect(reserva.status).toBe(200);
    expect(reserva.json.reserved).toBe(true);
    // (aqui o app cobra os Bits: `TournamentPage.buyTreinoTicket` só confirma depois do débito)
    kv.falhaGet = 'sparReserve:';
    await expect(call(env, 'sparBuyTicket', { phase: 'confirm', ...TZ })).rejects.toThrow('kv get failed');
    expect(kv.store.has(sparReserveKey(ME, DIA))).toBe(true);
    expect(JSON.parse(kv.store.get(sparTicketKey(ME, DIA))).extra).toBe(0);
    kv.falhaGet = null;
    const ok = await call(env, 'sparBuyTicket', { phase: 'confirm', ...TZ });
    expect(ok.status).toBe(200);
    expect(ok.json.tickets.extra).toBe(1);
    // repetir depois do sucesso segue 409 `no reserve` (nunca concede 2x)
    const de_novo = await call(env, 'sparBuyTicket', { phase: 'confirm', ...TZ });
    expect(de_novo.status).toBe(409);
    expect(JSON.parse(kv.store.get(sparTicketKey(ME, DIA))).extra).toBe(1);
  });
});

describe('item 5 · `lerSpar`: falha do KV propaga; só o JSON ilegível é tolerado (com aviso)', () => {
  it('sparStart com o `get` do duelo aberto falhando rejeita SEM gastar outra partida (antes: abria outro e gastava)', async () => {
    const { env, kv } = mkEnv();
    const s = await call(env, 'sparStart', { opponentId: PID, ...TZ });
    expect(s.status).toBe(200);
    const ticketAntes = kv.store.get(sparTicketKey(ME, DIA));
    kv.falhaGet = 'spar:';
    await expect(call(env, 'sparStart', { opponentId: PID, ...TZ })).rejects.toThrow('kv get failed');
    expect(kv.store.get(sparTicketKey(ME, DIA))).toBe(ticketAntes);
  });

  it('duelo aberto com JSON ilegível: 409 `no open duel` (como antes) e `console.warn` com o saveId', async () => {
    const { env, kv } = mkEnv();
    kv.store.set(sparPendingKey(ME), '{lixo');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const r = await call(env, 'sparMatch', { opponentId: PID, taps: [], seed: 1, ...TZ });
      expect(r.status).toBe(409);
      expect(r.json.error).toBe('no open duel');
      expect(warn.mock.calls.some(c => String(c[0]).includes('spar') && JSON.stringify(c).includes(ME))).toBe(true);
    } finally { warn.mockRestore(); }
  });
});

describe('item 13 · reroll dos oponentes', () => {
  it('`get` da trava do reroll falhando → rejeita e NÃO libera um 2º reroll (antes: tratava como "não usado" e gravava)', async () => {
    const { env, kv } = mkEnv();
    kv.store.set(`reroll:${ME}`, '1');
    kv.falhaGet = 'reroll:';
    await expect(call(env, 'opponents', undefined, '&reroll=1')).rejects.toThrow('kv get failed');
    expect(kv.puts.filter(k => k.startsWith('reroll:'))).toEqual([]);
  });

  it('o `delete` da trava no fim do combate segue best-effort, agora com `console.warn` (a partida liquida 200)', async () => {
    const { env, kv } = mkEnv();
    const ini = await call(env, 'duelStart', { opponentId: PID });
    expect(ini.status).toBe(200);
    const del = kv.delete;
    kv.delete = async k => { if (k.startsWith('reroll:')) throw new Error('kv delete failed'); return del(k); };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const m = await call(env, 'match', { opponentId: PID, taps: [], seed: ini.json.seed });
      expect(m.status).toBe(200);
      expect(warn.mock.calls.some(c => String(c[0]).includes('reroll'))).toBe(true);
    } finally { warn.mockRestore(); kv.delete = del; }
  });
});
