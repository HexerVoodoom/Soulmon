/**
 * Orçamento de Bits na fiação do POST /api/save (REGISTRO §387), MODO OBSERVAÇÃO: o save sai INTACTO sempre; excedente vira no
 * máximo uma chave `bitsobs:<dia>:<prefixo>` por conta por dia; falha do registro nunca derruba o save; admin isento.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const adminState = vi.hoisted(() => ({ admin: false }));
vi.mock('./_admin.js', async (importOriginal) => {
  const orig = /** @type {any} */ (await importOriginal());
  return { ...orig, verifiedAdmin: vi.fn(async () => ({ admin: adminState.admin })) };
});

import { onRequest } from './save.js';
import { BITS_ORCAMENTO_MODO, BITS_ORCAMENTO_TETO } from './_bitsOrcamento.js';

const ID = 'abcdef0123456789abcdef0123456789';
const PREFIXO = ID.slice(0, 8);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const meta = new Map();
  const puts = [];
  return {
    store, meta, puts, falharEm: /** @type {RegExp | null} */ (null),
    async get(k) { return store.get(k) ?? null; },
    async getWithMetadata(k) {
      if (this.falharEm?.test(k)) throw new Error('kv fora');
      return { value: store.get(k) ?? null, metadata: meta.get(k) ?? null };
    },
    async put(k, v, opts) {
      if (this.falharEm?.test(k)) throw new Error('kv fora');
      puts.push({ k, v, opts });
      store.set(k, v);
      if (opts?.metadata !== undefined) meta.set(k, opts.metadata);
    },
    async delete(k) { store.delete(k); meta.delete(k); },
    async list() { return { keys: [], list_complete: true }; },
  };
}
const post = (env, state) => onRequest({
  request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) }),
  env,
});
const obsKeys = (kv) => [...kv.store.keys()].filter(k => k.startsWith('bitsobs:'));

beforeEach(() => { adminState.admin = false; vi.spyOn(console, 'warn').mockImplementation(() => {}); vi.spyOn(console, 'info').mockImplementation(() => {}); });
afterEach(() => vi.restoreAllMocks());

describe('POST /api/save — orçamento de Bits em modo observação', () => {
  it('o interruptor está em observar', () => {
    expect(BITS_ORCAMENTO_MODO).toBe('observar');
  });

  it('jogador honesto (ganho de um dia cheio) não gera registro; o metadata guarda g/ob/ot', async () => {
    const kv = fakeKV();
    const env = { SOULMON_SAVES: kv };
    expect((await post(env, { gamePoints: 100 })).status).toBe(200);
    expect((await post(env, { gamePoints: 900 })).status).toBe(200);
    expect(obsKeys(kv)).toEqual([]);
    const m = kv.meta.get(ID);
    expect(m.g).toBe(900);
    expect(m.ob).toBeGreaterThan(0);
    expect(m.ot).toBeGreaterThan(0);
  });

  it('volta após 30 dias com folga zerada: não gera registro', async () => {
    const kv = fakeKV({ [ID]: JSON.stringify({ gamePoints: 1000 }) });
    kv.meta.set(ID, { t: 1, g: 1000, ob: 0, ot: Date.now() - 30 * 86_400_000 });
    expect((await post({ SOULMON_SAVES: kv }, { gamePoints: 3000 })).status).toBe(200);
    expect(obsKeys(kv)).toEqual([]);
  });

  it('+50.000 gera 1 registro e o save é gravado IDÊNTICO ao enviado', async () => {
    const kv = fakeKV({ [ID]: JSON.stringify({ gamePoints: 1000 }) });
    const state = { gamePoints: 51_000, perfectDays: 3, playerDayTz: { offsetMs: 0 } };
    const res = await post({ SOULMON_SAVES: kv }, state);
    expect(res.status).toBe(200);
    expect(JSON.parse(kv.store.get(ID))).toEqual(state);
    const chaves = obsKeys(kv);
    expect(chaves).toHaveLength(1);
    expect(chaves[0]).toMatch(new RegExp(`^bitsobs:\\d{4}-\\d{2}-\\d{2}:${PREFIXO}$`));
    expect(chaves[0]).not.toContain(ID);
    const obs = JSON.parse(kv.store.get(chaves[0]));
    expect(obs).toMatchObject({ excedente: 50_000 - BITS_ORCAMENTO_TETO, saldo_antes: 1000, saldo_depois: 51_000, creditos: 0 });
    expect(kv.meta.get(chaves[0])).toEqual(obs);
    const put = kv.puts.find(p => p.k === chaves[0]);
    expect(put.opts.expirationTtl).toBe(45 * 86400);
  });

  it('segundo save no mesmo dia não duplica a chave; fica o MAIOR excedente', async () => {
    const kv = fakeKV({ [ID]: JSON.stringify({ gamePoints: 0 }) });
    const env = { SOULMON_SAVES: kv };
    await post(env, { gamePoints: 60_000 });
    await post(env, { gamePoints: 61_000 });
    await post(env, { gamePoints: 200_000 });
    const chaves = obsKeys(kv);
    expect(chaves).toHaveLength(1);
    expect(JSON.parse(kv.store.get(chaves[0])).excedente).toBe(139_000);
  });

  it('gasto nunca gera registro', async () => {
    const kv = fakeKV({ [ID]: JSON.stringify({ gamePoints: 90_000 }) });
    kv.meta.set(ID, { t: 1, g: 90_000, ob: 0, ot: Date.now() });
    await post({ SOULMON_SAVES: kv }, { gamePoints: 10 });
    expect(obsKeys(kv)).toEqual([]);
  });

  it('carta resgatada no servidor soma à folga (não gera registro)', async () => {
    const agora = Date.now();
    const kv = fakeKV({
      [ID]: JSON.stringify({ gamePoints: 0 }),
      [`mail:${ID}`]: JSON.stringify({ q: [{ mid: 'c1', bodyPt: 'x', bodyEn: 'x', bits: 5000, at: agora, claimedAt: agora }], done: [] }),
    });
    kv.meta.set(ID, { t: 1, g: 0, ob: 0, ot: agora });
    await post({ SOULMON_SAVES: kv }, { gamePoints: 5000 });
    expect(obsKeys(kv)).toEqual([]);
  });

  it('admin é isento', async () => {
    adminState.admin = true;
    const kv = fakeKV({ [ID]: JSON.stringify({ gamePoints: 0 }) });
    await post({ SOULMON_SAVES: kv }, { gamePoints: 999_999 });
    expect(obsKeys(kv)).toEqual([]);
    expect(kv.meta.get(ID).ob).toBe(BITS_ORCAMENTO_TETO);
  });

  it('falha ao gravar o registro não derruba o save', async () => {
    const kv = fakeKV({ [ID]: JSON.stringify({ gamePoints: 0 }) });
    kv.falharEm = /^bitsobs:/;
    const res = await post({ SOULMON_SAVES: kv }, { gamePoints: 80_000 });
    expect(res.status).toBe(200);
    expect(JSON.parse(kv.store.get(ID)).gamePoints).toBe(80_000);
  });

  it('falha ao medir (leitura de créditos fora) não derruba o save', async () => {
    const kv = fakeKV({ [ID]: JSON.stringify({ gamePoints: 0 }) });
    const getOrig = kv.get.bind(kv);
    kv.get = async (k) => { if (k.startsWith('ent:') || k.startsWith('mail:')) throw new Error('kv fora'); return getOrig(k); };
    const res = await post({ SOULMON_SAVES: kv }, { gamePoints: 80_000 });
    expect(res.status).toBe(200);
    expect(JSON.parse(kv.store.get(ID)).gamePoints).toBe(80_000);
    expect(obsKeys(kv)).toEqual([]);
  });

  it('um D1 quebrado no env não afeta nada (o registro mora no KV)', async () => {
    const kv = fakeKV({ [ID]: JSON.stringify({ gamePoints: 0 }) });
    const DB = { prepare() { throw new Error('d1 fora'); } };
    const res = await post({ SOULMON_SAVES: kv, DB }, { gamePoints: 80_000 });
    expect(res.status).toBe(200);
    expect(JSON.parse(kv.store.get(ID)).gamePoints).toBe(80_000);
  });
});
