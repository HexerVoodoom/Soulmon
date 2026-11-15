/**
 * QA r4 C2 · A3 (REGISTRO §386, decisão do dono 14/11/2026): o teto de 1.000 Bits/dia dos pacotes vira à MEIA-NOITE DO JOGADOR,
 * não mais em UTC. O cliente manda `zone`/`off` (a âncora `playerDayTz`), o servidor valida (±1 dia do UTC dele) e PRENDE a âncora
 * na conta por `BITS_TZ_LOCK_MS` (alternar fuso não abre dois "dias"). Cliente antigo sem fuso segue no dia UTC.
 * Handler REAL (`entitlements.js`), KV de mentira.
 */
import { describe, it, expect } from 'vitest';
import { onRequestPost, onRequestGet } from './entitlements.js';
import { ENT_PREFIX, readEntitlement } from './_entitlements.js';
import { buyBitsPack, BITS_TZ_LOCK_MS, bitsDayResetAt } from './_bitsPacks.js';
import { SPAR_TZ_LOCK_MS } from './_treino.js';
import { playerDayOf } from './_strays.js';
import { playerDayIso } from '../../src/utils/playerDay';

const ID = 'd'.repeat(32);
const H = 3_600_000;
const BRT = -3 * H;
/** 14/11/2026 20:00 em Brasília (UTC−3) = 23:00 UTC. */
const NOITE = Date.UTC(2026, 10, 14, 23, 0, 0);

function fakeEnv(credits = 10_000) {
  const store = new Map();
  store.set(ENT_PREFIX + ID, JSON.stringify({ tier: 'paid', credits }));
  return {
    SOULMON_SAVES: {
      store,
      get: async k => store.get(k) ?? null,
      put: async (k, v) => { store.set(k, String(v)); },
      delete: async k => { store.delete(k); },
    },
  };
}
let n = 0;
const op = () => `op-dia-jogador-${String(++n).padStart(4, '0')}`;
const brt = { offsetMs: BRT };

describe('teto dos pacotes no dia do JOGADOR', () => {
  it('jogador em UTC−3: o dia NÃO vira às 21h locais (meia-noite UTC); vira à meia-noite dele', async () => {
    const e = fakeEnv();
    expect((await buyBitsPack(e, ID, 'bits-1000', op(), { nowMs: NOITE, tz: brt })).ok).toBe(true);
    // 22:30 locais = 01:30 UTC do dia seguinte: no dia UTC antigo, o teto reabria aqui.
    const madrugadaUtc = NOITE + 2.5 * H;
    expect(await buyBitsPack(e, ID, 'bits-200', op(), { nowMs: madrugadaUtc, tz: brt })).toMatchObject({ ok: false, reason: 'daily-cap', leftToday: 0 });
    // 00:10 locais do dia 15 = 03:10 UTC: dia novo do jogador.
    expect((await buyBitsPack(e, ID, 'bits-200', op(), { nowMs: NOITE + 4 * H + 10 * 60_000, tz: brt })).ok).toBe(true);
  });

  it('alternar o fuso não abre um 2º dia: a âncora fica presa por BITS_TZ_LOCK_MS', async () => {
    const e = fakeEnv();
    expect((await buyBitsPack(e, ID, 'bits-1000', op(), { nowMs: NOITE, tz: brt })).ok).toBe(true);
    // +14 h: em 23:00 UTC já é dia 15 lá. Sem a âncora presa, isso abriria mais 1.000.
    expect(await buyBitsPack(e, ID, 'bits-200', op(), { nowMs: NOITE + 60_000, tz: { offsetMs: 14 * H } })).toMatchObject({ ok: false, reason: 'daily-cap' });
    expect(await buyBitsPack(e, ID, 'bits-200', op(), { nowMs: NOITE + 2 * 60_000, tz: { zone: 'Pacific/Kiritimati' } })).toMatchObject({ ok: false, reason: 'daily-cap' });
  });

  it('a âncora troca depois do prazo (viagem real)', async () => {
    const e = fakeEnv();
    await buyBitsPack(e, ID, 'bits-200', op(), { nowMs: NOITE, tz: brt });
    const depois = NOITE + BITS_TZ_LOCK_MS + H;
    await buyBitsPack(e, ID, 'bits-200', op(), { nowMs: depois, tz: { offsetMs: 9 * H } });
    expect((await readEntitlement(e, ID)).bitsTz).toMatchObject({ offsetMs: 9 * H });
  });

  it('cliente antigo sem fuso: dia UTC (retrocompatível) e a conta fica presa ao UTC', async () => {
    const e = fakeEnv();
    expect((await buyBitsPack(e, ID, 'bits-1000', op(), { nowMs: NOITE })).ok).toBe(true);
    expect((await buyBitsPack(e, ID, 'bits-200', op(), { nowMs: NOITE + 1.5 * H })).ok).toBe(true); // 00:30 UTC: dia novo
    // o 1º fuso que chega depois não abre outro dia dentro do prazo
    expect(await buyBitsPack(e, ID, 'bits-1000', op(), { nowMs: NOITE + 1.6 * H, tz: brt })).toMatchObject({ ok: false, reason: 'daily-cap' });
  });

  it('pedido sem fuso numa conta já ancorada usa a âncora (o APK em cache não reabre o dia)', async () => {
    const e = fakeEnv();
    await buyBitsPack(e, ID, 'bits-1000', op(), { nowMs: NOITE, tz: brt });
    expect(await buyBitsPack(e, ID, 'bits-200', op(), { nowMs: NOITE + 2.5 * H })).toMatchObject({ ok: false, reason: 'daily-cap' });
  });

  it('fuso inválido (offset além de 14 h, zona inexistente) é ignorado: vale o UTC', async () => {
    const e = fakeEnv();
    await buyBitsPack(e, ID, 'bits-200', op(), { nowMs: NOITE, tz: { offsetMs: 40 * H } });
    const ent = await readEntitlement(e, ID);
    expect(ent.bitsTz).toMatchObject({ offsetMs: 0 });
    const e2 = fakeEnv();
    await buyBitsPack(e2, ID, 'bits-200', op(), { nowMs: NOITE, tz: { zone: 'Marte/Olympus' } });
    expect((await readEntitlement(e2, ID)).bitsTz).toMatchObject({ offsetMs: 0 });
  });

  it('BITS_TZ_LOCK_MS é o mesmo prazo da âncora do Treino', () => {
    expect(BITS_TZ_LOCK_MS).toBe(SPAR_TZ_LOCK_MS);
  });
});

describe('bitsLeftToday e bitsResetAt nas respostas', () => {
  const post = (env, body) => onRequestPost({
    request: new Request('https://x/api/entitlements?action=buy-bits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ID, ...body }) }),
    env,
  });
  const get = (env, q = '') => onRequestGet({ request: new Request(`https://x/api/entitlements?id=${ID}${q}`), env });

  it('buy-bits devolve bitsLeftToday e bitsResetAt (a meia-noite do jogador); o GET também, mesmo sem compra no dia', async () => {
    const e = fakeEnv();
    const virgem = await (await get(e)).json();
    expect(virgem.bitsLeftToday).toBe(1000);
    expect(typeof virgem.bitsResetAt).toBe('number');
    const r = await (await post(e, { pack: 'bits-500', opId: op(), zone: 'America/Sao_Paulo', off: BRT })).json();
    expect(r).toMatchObject({ ok: true, leftToday: r.bitsLeftToday });
    expect(r.bitsLeftToday).toBe(500);
    const fim = r.bitsResetAt;
    expect(playerDayOf(fim, { zone: 'America/Sao_Paulo' })).not.toBe(playerDayOf(fim - 2000, { zone: 'America/Sao_Paulo' }));
    expect(fim).toBeGreaterThan(Date.now());
    const lido = await (await get(e)).json();
    expect(lido).toMatchObject({ bitsLeftToday: 500, bitsPackLeft: 500 });
  });

  it('bitsDayResetAt: o primeiro instante do dia seguinte do jogador', () => {
    const fim = bitsDayResetAt(NOITE, brt);
    expect(new Date(fim).toISOString()).toBe('2026-11-15T03:00:00.000Z');
  });
});

describe('paridade do dia do jogador: servidor (`playerDayOf`) × cliente (`playerDayIso`)', () => {
  const instantes = [NOITE, NOITE + 2.5 * H, NOITE + 4 * H, Date.UTC(2026, 2, 8, 6, 30), Date.UTC(2026, 9, 25, 0, 30), Date.UTC(2026, 11, 31, 23, 59)];
  const ancoras = [{ zone: 'America/Sao_Paulo' }, { zone: 'Asia/Tokyo' }, { zone: 'America/New_York' }, { zone: 'Pacific/Kiritimati' }, { offsetMs: BRT }, { offsetMs: 5.5 * H }, { offsetMs: 0 }];
  for (const a of ancoras) {
    it(JSON.stringify(a), () => {
      for (const t of instantes) expect(playerDayOf(t, a)).toBe(playerDayIso(new Date(t), a));
    });
  }
});
