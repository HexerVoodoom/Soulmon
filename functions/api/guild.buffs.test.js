import { describe, it, expect } from 'vitest';
import { onRequest } from './guild.js';
import { COOP_MAX_MEMBERS } from './_coop.js';
import { CASA_BITS_POR_DIA, CASA_DOACOES } from './_casa.js';
import { FEIRA_LOJA_PCT, FEIRA_LOJA_PCT_BUFF, haFeiraDeVerdade } from './_feiraLoja.js';
import {
  BUFFS, BUFF_PRECO, BUFF_MS, BUFF_DIAS, comprarBuff, vistaDosBuffs, lerBuffs, tesouroDoCla, clanTemBuff, normalizarBuffs,
} from './_buffsCla.js';

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const sid = r => r.padEnd(32, '0');
const A = sid('buffA'), B = sid('buffB');
const perfil = (id, nome) => JSON.stringify({ id, name: nome, pid: `P${id.slice(0, 4)}${'q'.repeat(19)}`, petName: 'p', stage: 'rookie', attrs: {}, friends: [], createdAt: Date.now() });
const req = (action, { method = 'POST', body, params = {} } = {}) =>
  new Request(`https://x.dev/api/guild?${new URLSearchParams({ action, ...params })}`, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined });
const call = (e, a, o) => onRequest({ request: req(a, o), env: e });

// um clã com tesouro de `pts` pontos de doação (10 Bits cada) na mão de A
const cartoesCom = pts => ({ [A]: { casa: { pts: { doacao: pts } } } });
const cla = () => ({ id: 'gid-buffs', members: [A, B] });
const OP = n => `op-teste-${String(n).padStart(4, '0')}`;

describe('o preço dos Buffs sai de constantes (nunca à mão)', () => {
  it('90% da doação semanal máxima de um clã cheio', () => {
    expect(CASA_DOACOES).toEqual([50, 100]);
    expect(BUFF_DIAS).toBe(7);
    expect(BUFF_PRECO).toBe(Math.round(0.9 * COOP_MAX_MEMBERS * CASA_BITS_POR_DIA * 7));
    expect(BUFF_PRECO).toBe(7560);
    // um clã cheio doa no máximo 8400 por semana: cabe UM buff e sobra pouco (840), nunca dois
    const semanal = COOP_MAX_MEMBERS * CASA_BITS_POR_DIA * 7;
    expect(BUFF_PRECO).toBeLessThan(semanal);
    expect(2 * BUFF_PRECO).toBeGreaterThan(semanal);
  });
  it('catálogo fechado de 4 buffs', () => expect([...BUFFS]).toEqual(['gauge', 'feira', 'drop', 'energia']));
});

describe('comprar buff com o tesouro do clã', () => {
  it('tesouro insuficiente: recusa sem gravar nada', async () => {
    const env = { DIGIAPP_SAVES: fakeKV() };
    const r = await comprarBuff(env, cla(), cartoesCom(BUFF_PRECO / 10 - 1), 'gauge', OP(1), 1000);
    expect(r).toEqual({ ok: false, reason: 'insufficient' });
    expect(env.DIGIAPP_SAVES.store.size).toBe(0);
  });
  it('tesouro suficiente: debita o preço, dura 7 dias desde a compra e some depois', async () => {
    const env = { DIGIAPP_SAVES: fakeKV() };
    const g = cla();
    const t0 = Date.UTC(2026, 10, 10);
    const cart = cartoesCom(BUFF_PRECO / 10 + 5); // sobra 50
    expect(await comprarBuff(env, g, cart, 'drop', OP(2), t0)).toEqual({ ok: true, repeated: false });
    const b = await lerBuffs(env, g.id);
    expect(b.gasto).toBe(BUFF_PRECO);
    expect(b.buffs.drop).toEqual({ desde: t0, ate: t0 + BUFF_MS });
    expect(await tesouroDoCla(env, g, cart, b)).toBe(50);
    expect(await clanTemBuff(env, g.id, 'drop', t0 + BUFF_MS - 1)).toBe(true);
    expect(await clanTemBuff(env, g.id, 'drop', t0 + BUFF_MS)).toBe(false);
    expect(await clanTemBuff(env, g.id, 'gauge', t0)).toBe(false);
    const v = await vistaDosBuffs(env, g, cart, t0 + 1000);
    expect(Object.keys(v.ativos)).toEqual(['drop']);
    expect(v.preco).toBe(BUFF_PRECO);
    expect((await vistaDosBuffs(env, g, cart, t0 + BUFF_MS + 1)).ativos).toEqual({});
  });
  it('comprar de novo enquanto ativo ESTENDE (mais 7 dias); vencido, recomeça', async () => {
    const t0 = 10_000_000;
    const cart = cartoesCom(2 * (BUFF_PRECO / 10) + 3);
    const env = { DIGIAPP_SAVES: fakeKV() };
    const g = cla();
    await comprarBuff(env, g, cart, 'energia', OP(3), t0);
    await comprarBuff(env, g, cart, 'energia', OP(4), t0 + 1000);
    expect((await lerBuffs(env, g.id)).buffs.energia).toEqual({ desde: t0, ate: t0 + 2 * BUFF_MS });
    const env2 = { DIGIAPP_SAVES: fakeKV() };
    await comprarBuff(env2, g, cart, 'energia', OP(3), t0);
    await comprarBuff(env2, g, cart, 'energia', OP(4), t0 + BUFF_MS + 5);
    expect((await lerBuffs(env2, g.id)).buffs.energia).toEqual({ desde: t0 + BUFF_MS + 5, ate: t0 + 2 * BUFF_MS + 5 });
  });
  it('idempotente por opId; id/op inválidos; reuso do op com outro buff', async () => {
    const env = { DIGIAPP_SAVES: fakeKV() };
    const g = cla();
    const cart = cartoesCom(2 * (BUFF_PRECO / 10));
    expect(await comprarBuff(env, g, cart, 'feira', OP(5), 1)).toEqual({ ok: true, repeated: false });
    expect(await comprarBuff(env, g, cart, 'feira', OP(5), 2)).toEqual({ ok: true, repeated: true });
    expect((await lerBuffs(env, g.id)).gasto).toBe(BUFF_PRECO);
    expect(await comprarBuff(env, g, cart, 'gauge', OP(5), 3)).toEqual({ ok: false, reason: 'op-reuse' });
    expect(await comprarBuff(env, g, cart, 'nao-existe', OP(6), 3)).toEqual({ ok: false, reason: 'invalid-buff' });
    expect(await comprarBuff(env, g, cart, 'gauge', 'x', 3)).toEqual({ ok: false, reason: 'invalid-op' });
  });
  it('a Loja antiga NÃO é mais descontada (o gasto volta ao tesouro) e lixo vira vazio', async () => {
    const env = { DIGIAPP_SAVES: fakeKV({ 'coopLoja:gid-buffs': JSON.stringify({ gasto: 100 }) }) };
    const g = cla();
    const b = await lerBuffs(env, g.id);
    expect(await tesouroDoCla(env, g, cartoesCom(50), b)).toBe(500);
    expect(normalizarBuffs({ gasto: -3, buffs: { gauge: { ate: 'x' }, fake: { ate: 5 } }, ops: { a: 'gauge' } })).toEqual({ v: 1, gasto: 0, buffs: {}, ops: {} });
  });
});

describe('a ação guildBuffBuy e a lápide da Loja', () => {
  async function setup() {
    const e = { DIGIAPP_SAVES: fakeKV({ [`profile:${A}`]: perfil(A, 'Ana'), [`profile:${B}`]: perfil(B, 'Beto') }) };
    const c = await (await call(e, 'guildCreate', { body: { id: A, name: 'Casa' } })).json();
    await call(e, 'guildJoin', { body: { id: B, code: c.guild.code } });
    return e;
  }
  it('a Loja saiu: guildShopBuy devolve 404 gone, NUNCA 410 (o app desloga em 410)', async () => {
    const e = await setup();
    const r = await call(e, 'guildShopBuy', { body: { id: A, itemId: 'loja-fogueira-roda', opId: 'op-12345678' } });
    expect(r.status).not.toBe(410);
    expect(r.status).toBe(404);
    expect(await r.json()).toEqual({ error: 'gone' });
  });
  it('só o anfitrião compra (403); saldo curto = 409; buff inválido = 400', async () => {
    const e = await setup();
    const body = (id, buffId) => ({ body: { id, buffId, opId: 'op-12345678' } });
    expect((await call(e, 'guildBuffBuy', body(B, 'gauge'))).status).toBe(403);
    expect((await call(e, 'guildBuffBuy', body(A, 'gauge'))).status).toBe(409);
    expect((await call(e, 'guildBuffBuy', body(A, 'nada'))).status).toBe(400);
  });
  it('a vista leva tesouro, preço e quem pode comprar (cliente nunca manda preço)', async () => {
    const e = await setup();
    const v = async id => (await (await call(e, 'guild', { method: 'GET', params: { id } })).json()).guild.casa.buffs;
    expect(await v(A)).toEqual({ saldo: 0, preco: BUFF_PRECO, dias: BUFF_DIAS, ativos: {}, euPosso: true });
    expect((await v(B)).euPosso).toBe(false);
    await call(e, 'guildDonate', { body: { id: A, bits: 100 } });
    expect((await v(B)).saldo).toBe(100);
  });
});

describe('Buff "Feira": 8% vira 12% pela mesma regra determinística', () => {
  it('com o bônus a chance vai a 12% e sem ele fica em 8%', () => {
    expect(FEIRA_LOJA_PCT).toBe(8);
    expect(FEIRA_LOJA_PCT + FEIRA_LOJA_PCT_BUFF).toBe(12);
    let sem = 0, com = 0;
    const N = 20000;
    for (let i = 0; i < N; i++) {
      const dia = new Date(Date.UTC(2026, 0, 1) + (i % 365) * 86400000).toISOString().slice(0, 10);
      const save = `s${i}`.padEnd(32, '0');
      if (haFeiraDeVerdade(save, dia)) sem++;
      if (haFeiraDeVerdade(save, dia, FEIRA_LOJA_PCT_BUFF)) com++;
    }
    expect(sem / N).toBeGreaterThan(0.07); expect(sem / N).toBeLessThan(0.09);
    expect(com / N).toBeGreaterThan(0.11); expect(com / N).toBeLessThan(0.13);
    expect(com).toBeGreaterThanOrEqual(sem); // quem já tinha feira continua tendo
  });
});
