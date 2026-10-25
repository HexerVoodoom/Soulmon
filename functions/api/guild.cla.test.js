import { describe, it, expect } from 'vitest';
import { onRequest } from './guild.js';
import { fakeKV } from './_claKv.testkit.js';

const sid = r => r.padEnd(32, '0');
const A = sid('claA'), B = sid('claB'), C = sid('claC');
const perfil = (id, nome) => JSON.stringify({ id, name: nome, pid: `P${id.slice(0, 4)}${'q'.repeat(19)}`, petName: 'p', stage: 'rookie', attrs: {}, friends: [], createdAt: Date.now() });
const req = (action, { method = 'POST', body, params = {} } = {}) =>
  new Request(`https://x.dev/api/guild?${new URLSearchParams({ action, ...params })}`, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined });
const call = (e, a, o) => onRequest({ request: req(a, o), env: e });
const post = async (e, a, body) => { const r = await call(e, a, { body }); return { status: r.status, json: await r.json() }; };
const get = async (e, a, id) => { const r = await call(e, a, { method: 'GET', params: { id } }); return { status: r.status, json: await r.json() }; };

async function setup() {
  const e = { DIGIAPP_SAVES: fakeKV({ [`profile:${A}`]: perfil(A, 'Ana'), [`profile:${B}`]: perfil(B, 'Beto'), [`profile:${C}`]: perfil(C, 'Caio') }) };
  const c = await (await call(e, 'guildCreate', { body: { id: A, name: 'Cla' } })).json();
  await call(e, 'guildJoin', { body: { id: B, code: c.guild.code } });
  const v = await (await call(e, 'guild', { method: 'GET', params: { id: A } })).json();
  const idB = v.guild.members.find(m => !m.euMesmo).memberId;
  const idA = v.guild.members.find(m => m.euMesmo).memberId;
  return { e, idA, idB };
}

describe('rotas do clã: sem guilda', () => {
  it('404 em tudo', async () => {
    const e = { DIGIAPP_SAVES: fakeKV({ [`profile:${A}`]: perfil(A, 'Ana') }) };
    expect((await get(e, 'claPraca', A)).status).toBe(404);
    expect((await get(e, 'claPlantio', A)).status).toBe(404);
    expect((await get(e, 'claMisterio', A)).status).toBe(404);
    expect((await post(e, 'claPlantar', { id: A })).status).toBe(404);
  });
  it('método errado = 400', async () => {
    const { e } = await setup();
    expect((await post(e, 'claPraca', { id: A })).status).toBe(400);
    expect((await get(e, 'claRegar', A)).status).toBe(400);
  });
});

describe('rotas do clã: praça', () => {
  it('slots, presente 1x/dia por par (409), claim e vista sem saveId', async () => {
    const { e, idA, idB } = await setup();
    expect((await post(e, 'claPracaSlot', { id: A, slot: 0, item: 'furn-lamp' })).json.praca.slots[0]).toMatchObject({ item: 'furn-lamp', by: idA, mine: true });
    expect((await post(e, 'claPracaSlot', { id: A, slot: 9, item: 'furn-lamp' })).status).toBe(400);
    expect((await post(e, 'claPracaSlot', { id: A, slot: 1, item: '../x' })).status).toBe(400);
    expect((await get(e, 'claPraca', B)).json.praca.slots[0]).toMatchObject({ item: 'furn-lamp', by: idA, mine: false });

    expect((await post(e, 'claPresente', { id: A, to: idB })).json.sent).toBe(true);
    expect((await post(e, 'claPresente', { id: A, to: idB })).status).toBe(409);
    expect((await post(e, 'claPresente', { id: A, to: idA })).status).toBe(400);
    expect((await post(e, 'claPresente', { id: A, to: 'nope' })).status).toBe(400);
    expect((await get(e, 'claPraca', A)).json.praca.mine.sentToday).toEqual([idB]);

    const vb = (await get(e, 'claPraca', B)).json.praca;
    expect(vb.gifts).toHaveLength(1);
    expect(vb.gifts[0].from).toBe(idA);
    expect(JSON.stringify(vb)).not.toContain(A);
    const cl = await post(e, 'claPresenteClaim', { id: B, giftId: vb.gifts[0].id });
    expect(cl.status).toBe(200);
    expect(cl.json.claimed.item.kind).toBeTruthy();
    expect(cl.json.praca.gifts).toEqual([]);
    const de = await post(e, 'claPresenteClaim', { id: B, giftId: vb.gifts[0].id }); // reentrega
    expect(de.status).toBe(200);
    expect(de.json.claimed).toEqual(cl.json.claimed);
    expect(cl.json.claimed.receipt).toContain(idA);
    expect((await post(e, 'claPresenteClaim', { id: A, giftId: vb.gifts[0].id })).status).toBe(404);
  });
});

describe('rotas do clã: dia do servidor, não do cliente', () => {
  const d = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  it('alternar dayKey D-1/D/D+1 não dá 2º presente, 2ª rega/proteção nem fura o teto do mistério', async () => {
    const { e, idB } = await setup();
    const chaves = [d(-1), d(0), d(1)];
    const st = [];
    for (const k of chaves) st.push((await post(e, 'claPresente', { id: A, to: idB, dayKey: k })).status);
    expect(st.sort()).toEqual([200, 409, 409]);
    await post(e, 'claPlantar', { id: A, dayKey: d(0) });
    // D2: regar/proteger exigem o sorteio do dia; a ação sorteada vale 1x só, qualquer dayKey.
    const sorteio = async (id) => (await post(e, 'claSortear', { id })).json.task;
    const kA = await sorteio(A), kB = await sorteio(B);
    const reg = [];
    for (const k of chaves) reg.push((await post(e, kA === 'water' ? 'claRegar' : 'claProteger', { id: A, dayKey: k })).status);
    expect(reg.sort()).toEqual([200, 409, 409]);
    const pr = [];
    for (const k of chaves) pr.push((await post(e, kB === 'water' ? 'claRegar' : 'claProteger', { id: B, dayKey: k })).status);
    expect(pr.sort()).toEqual([200, 409, 409]);
    let contou = 0;
    for (let i = 0; i < 15; i++) {
      const r = await post(e, 'claMisterioTarefa', { id: A, taskId: `t${i}`, dayKey: chaves[i % 3] });
      if (r.json.counted) contou++;
    }
    expect(contou).toBe(10);
  });
});

describe('rotas do clã: plantio', () => {
  it('planta uma vez, rega 1x/dia, proteção 1x/dia, colheita recusada antes da hora', async () => {
    const { e } = await setup();
    const v0 = (await get(e, 'claPlantio', A)).json.plantio;
    expect(v0).toMatchObject({ planted: false, canPlant: true });
    expect((await post(e, 'claRegar', { id: A })).status).toBe(404);
    expect((await post(e, 'claPlantar', { id: A })).json.plantio).toMatchObject({ planted: true, canPlant: false });
    expect((await post(e, 'claPlantar', { id: B })).status).toBe(409);
    // D2: sem sorteio do dia, regar e proteger são recusados com erro claro.
    const sem = await post(e, 'claRegar', { id: A });
    expect(sem.status).toBe(409);
    expect(sem.json.error).toBe('no draw');
    expect((await post(e, 'claProteger', { id: A })).json.error).toBe('no draw');
    const kA = (await post(e, 'claSortear', { id: A })).json.task;
    const certa = kA === 'water' ? 'claRegar' : 'claProteger', errada = kA === 'water' ? 'claProteger' : 'claRegar';
    expect((await post(e, errada, { id: A })).status).toBe(409);
    expect((await post(e, certa, { id: A })).status).toBe(200);
    expect((await post(e, certa, { id: A })).status).toBe(409);
    expect((await post(e, 'claColher', { id: A })).status).toBe(409);
    expect(JSON.stringify((await get(e, 'claPlantio', B)).json)).not.toContain(A);
  });
});

describe('rotas do clã: sorteio da ação do dia (L5-D2)', () => {
  it('o servidor sorteia aguar OU proteger, uma vez por dia por pessoa (idempotente), sem nome de atacante', async () => {
    const { e } = await setup();
    expect((await post(e, 'claSortear', { id: A })).status).toBe(404);
    await post(e, 'claPlantar', { id: A });
    const r1 = await post(e, 'claSortear', { id: A });
    expect(r1.status).toBe(200);
    expect(['water', 'protect']).toContain(r1.json.task);
    expect(r1.json.plantio.mine.task).toBe(r1.json.task);
    expect((await post(e, 'claSortear', { id: A })).json.task).toBe(r1.json.task);
    expect(r1.json.plantio.underAttack).toBe(true);
    expect(r1.json.plantio.totalDays).toBeGreaterThan(0);
    expect(JSON.stringify(r1.json)).not.toMatch(/yeti|corvo|crow/i);
  });
});

describe('rotas do clã: mistério', () => {
  it('envio único, tarefa idempotente, taskId inválido 400, resgate sem barra cheia 404', async () => {
    const { e } = await setup();
    expect((await post(e, 'claMisterioEnviar', { id: A })).json.misterio.mine.sent).toBe(true);
    expect((await post(e, 'claMisterioEnviar', { id: A })).status).toBe(409);
    const t1 = await post(e, 'claMisterioTarefa', { id: B, taskId: 'task-1' });
    expect(t1.json).toMatchObject({ counted: true });
    expect(t1.json.misterio.bar).toBe(1);
    expect((await post(e, 'claMisterioTarefa', { id: B, taskId: 'task-1' })).json).toMatchObject({ counted: false, reason: 'duplicate' });
    expect((await post(e, 'claMisterioTarefa', { id: B, taskId: 'a b' })).status).toBe(400);
    expect((await post(e, 'claMisterioClaim', { id: A })).status).toBe(404);
    expect((await get(e, 'claMisterio', A)).json.misterio.investigating).toBe(1);
  });
});
