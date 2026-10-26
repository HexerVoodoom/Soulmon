import { describe, it, expect } from 'vitest';
import { onRequest } from './guild.js';
import { LOJA_CATALOGO, lojaKey } from './_lojaCla.js';

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
const A = sid('lojaA'), B = sid('lojaB');
const perfil = (id, nome) => JSON.stringify({ id, name: nome, pid: `P${id.slice(0, 4)}${'q'.repeat(19)}`, petName: 'p', stage: 'rookie', attrs: {}, friends: [], createdAt: Date.now() });
const req = (action, { method = 'POST', body, params = {} } = {}) =>
  new Request(`https://x.dev/api/guild?${new URLSearchParams({ action, ...params })}`, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined });
const call = (e, a, o) => onRequest({ request: req(a, o), env: e });
const barato = LOJA_CATALOGO.reduce((a, b) => (b.preco < a.preco ? b : a));

async function setup() {
  const e = { DIGIAPP_SAVES: fakeKV({ [`profile:${A}`]: perfil(A, 'Ana'), [`profile:${B}`]: perfil(B, 'Beto') }) };
  const c = await (await call(e, 'guildCreate', { body: { id: A, name: 'Loja' } })).json();
  await call(e, 'guildJoin', { body: { id: B, code: c.guild.code } });
  return { e, gid: c.guild.id };
}
const doar = async (e, id, bits) => (await call(e, 'guildDonate', { body: { id, bits } })).json();
const vista = async (e, id) => (await (await call(e, 'guild', { method: 'GET', params: { id } })).json()).guild;
const comprar = (e, id, itemId, opId, extra = {}) => call(e, 'guildShopBuy', { body: { id, itemId, opId, ...extra } });

describe('a loja do clã', () => {
  it('a vista traz a loja vazia (leitura tolerante: sem registro = vazio) e saldo zero', async () => {
    const { e } = await setup();
    expect((await vista(e, A)).casa.loja).toEqual({ itens: [], saldo: 0 });
  });

  it('compra desconta do saldo do clã no servidor e o item aparece para todos', async () => {
    const { e } = await setup();
    await doar(e, A, 200); await doar(e, B, 200);
    const antes = (await vista(e, A)).casa;
    expect(antes.loja.saldo).toBe(400);
    const r = await comprar(e, A, barato.id, 'op-compra-0001');
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.repeated).toBe(false);
    const depois = (await vista(e, B)).casa;
    expect(depois.loja.itens).toEqual([barato.id]);
    expect(depois.loja.saldo).toBe(400 - barato.preco);
    // o total doado NÃO encolhe: a loja gasta saldo, não apaga história
    expect(depois.bitsTotal).toBe(antes.bitsTotal);
  });

  it('idempotente por opId: repetir não cobra de novo', async () => {
    const { e } = await setup();
    await doar(e, A, 200); await doar(e, B, 200);
    await comprar(e, A, barato.id, 'op-idem-00001');
    const s1 = (await vista(e, A)).casa.loja.saldo;
    const r = await comprar(e, B, barato.id, 'op-idem-00001');
    expect(r.status).toBe(200);
    expect((await r.json()).repeated).toBe(true);
    expect((await vista(e, A)).casa.loja.saldo).toBe(s1);
    // mesmo opId com OUTRO item = reuso indevido
    const outro = LOJA_CATALOGO.find(i => i.id !== barato.id);
    expect((await comprar(e, A, outro.id, 'op-idem-00001')).status).toBe(409);
  });

  it('saldo insuficiente: 409 e nada é gravado', async () => {
    const { e, gid } = await setup();
    await doar(e, A, 50);
    const r = await comprar(e, A, barato.id, 'op-pobre-0001');
    expect(r.status).toBe(409);
    expect((await r.json()).error).toBe('not enough bits');
    expect(e.DIGIAPP_SAVES.store.has(lojaKey(gid))).toBe(false);
    expect((await vista(e, A)).casa.loja).toEqual({ itens: [], saldo: 50 });
  });

  it('item já do clã: 409 sem cobrar (opId novo)', async () => {
    const { e } = await setup();
    await doar(e, A, 200); await doar(e, B, 200);
    await comprar(e, A, barato.id, 'op-dupla-0001');
    const s = (await vista(e, A)).casa.loja.saldo;
    const r = await comprar(e, A, barato.id, 'op-dupla-0002');
    expect(r.status).toBe(409);
    expect((await r.json()).error).toBe('already owned');
    expect((await vista(e, A)).casa.loja.saldo).toBe(s);
  });

  it('item inválido e opId inválido: 400', async () => {
    const { e } = await setup();
    await doar(e, A, 200);
    for (const item of ['furn-lamp', '', null, 7, { a: 1 }, '__proto__']) expect((await comprar(e, A, item, 'op-invalid-001')).status).toBe(400);
    for (const op of [undefined, '', 'curto', 'x'.repeat(65), 'tem espaco aqui', 12]) expect((await comprar(e, A, barato.id, op)).status).toBe(400);
  });

  it('o preço que o cliente manda é ignorado', async () => {
    const { e } = await setup();
    await doar(e, A, 200); await doar(e, B, 200);
    const caro = LOJA_CATALOGO.reduce((a, b) => (b.preco > a.preco ? b : a));
    // preço 1 no corpo não barateia; preço enorme não encarece
    expect(caro.preco).toBeGreaterThan(400);
    const r = await comprar(e, A, caro.id, 'op-preco-0001', { preco: 1, price: 1, cost: 0, gasto: -999, bits: 1 });
    expect(r.status).toBe(409);
    expect((await vista(e, A)).casa.loja).toEqual({ itens: [], saldo: 400 });
    const { e: e2 } = await setup();
    await doar(e2, A, 200); await doar(e2, B, 200);
    await comprar(e2, A, barato.id, 'op-preco-0002', { preco: 99999 });
    expect((await vista(e2, A)).casa.loja.saldo).toBe(400 - barato.preco);
  });

  it('o saldo nunca fica negativo e quem sai não encolhe o saldo', async () => {
    const { e } = await setup();
    await doar(e, A, 200); await doar(e, B, 200);
    await comprar(e, A, barato.id, 'op-saida-0001');
    const s = (await vista(e, A)).casa.loja.saldo;
    await call(e, 'guildLeave', { body: { id: B } });
    expect((await vista(e, A)).casa.loja.saldo).toBe(s);
  });

  it('a vista não leva quem comprou nem o gasto (nada por pessoa)', async () => {
    const { e } = await setup();
    await doar(e, A, 200); await doar(e, B, 200);
    await comprar(e, A, barato.id, 'op-quem-00001');
    const loja = (await vista(e, B)).casa.loja;
    expect(Object.keys(loja).sort()).toEqual(['itens', 'saldo']);
    expect(JSON.stringify(loja)).not.toContain(A);
  });

  it('sem guilda, 404', async () => {
    const e = { DIGIAPP_SAVES: fakeKV({ [`profile:${A}`]: perfil(A, 'Ana') }) };
    expect((await comprar(e, A, barato.id, 'op-sem-guild-1')).status).toBe(404);
  });
});
