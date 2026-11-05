import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';
import { MAX_FRIENDS } from './_amigos.js';

// §243 — amizade por convite. O servidor decide: convite pendente não é amizade, aceitar liga os DOIS lados,
// remover desfaz os dois, o limite é 20 contado aqui, e o presente (20 Bits, 1×/dia/amigo) não se repete nem ao regravar o perfil.

const A = 'a'.repeat(32);
const B = 'b'.repeat(32);
const C = 'c'.repeat(32);
const PA = 'pida0000000000000000000a';
const PB = 'pidb0000000000000000000b';
const PC = 'pidc0000000000000000000c';

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const perfil = (id, pid, extra = {}) => JSON.stringify({
  id, pid, name: `Nome${pid.slice(3, 4)}`, petName: 'pet', stage: 'rookie', pvpEnabled: true,
  attrs: { power: 1, harmony: 1, benevolence: 1 }, friends: [], createdAt: Date.now(), ...extra,
});
const mundo = (extra = {}) => ({
  DIGIAPP_SAVES: fakeKV({
    [`profile:${A}`]: perfil(A, PA), [`profile:${B}`]: perfil(B, PB), [`profile:${C}`]: perfil(C, PC),
    [`pid:${PA}`]: A, [`pid:${PB}`]: B, [`pid:${PC}`]: C,
    ...extra,
  }),
});
const req = (action, { method = 'GET', body, params = {} } = {}) => new Request(
  `https://x.dev/api/community?${new URLSearchParams({ action, ...params })}`,
  { method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined },
);
const post = async (env, action, body) => { const r = await onRequest({ request: req(action, { method: 'POST', body }), env }); return { status: r.status, body: await r.json() }; };
const get = async (env, action, params) => { const r = await onRequest({ request: req(action, { params }), env }); return { status: r.status, body: await r.json() }; };
const lista = (env, id) => JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${id}`)).friends;

describe('amizade por convite', () => {
  it('convidar não cria amizade; aceitar liga os dois lados; o convite some', async () => {
    const env = mundo();
    const c = await post(env, 'friends', { id: A, friendId: PB });
    expect(c.body).toMatchObject({ ok: true, status: 'pending', friends: [] });
    expect(lista(env, A)).toEqual([]);
    expect(lista(env, B)).toEqual([]);
    const estB = await get(env, 'friendsState', { id: B });
    expect(estB.body.incoming).toEqual([{ id: PA, name: 'Nomea', at: expect.any(Number) }]);
    const estA = await get(env, 'friendsState', { id: A });
    expect(estA.body.outgoing).toEqual([PB]);
    const ok = await post(env, 'friendAccept', { id: B, friendId: PA });
    expect(ok.body).toMatchObject({ ok: true, status: 'friends', friends: [PA] });
    expect(lista(env, A)).toEqual([B]);
    expect(lista(env, B)).toEqual([A]);
    expect((await get(env, 'friendsState', { id: B })).body.incoming).toEqual([]);
    expect((await get(env, 'friendsState', { id: A })).body.outgoing).toEqual([]);
  });

  it('convite repetido é idempotente e convite cruzado vira amizade na hora', async () => {
    const env = mundo();
    await post(env, 'friends', { id: A, friendId: PB });
    const r2 = await post(env, 'friends', { id: A, friendId: PB });
    expect(r2.body.status).toBe('pending');
    expect((await get(env, 'friendsState', { id: B })).body.incoming).toHaveLength(1);
    const cruzado = await post(env, 'friends', { id: B, friendId: PA });
    expect(cruzado.body.status).toBe('friends');
    expect(lista(env, A)).toEqual([B]);
    expect(lista(env, B)).toEqual([A]);
  });

  it('só quem foi convidado aceita; terceiro e o próprio autor do convite não conseguem', async () => {
    const env = mundo();
    await post(env, 'friends', { id: A, friendId: PB });
    expect((await post(env, 'friendAccept', { id: C, friendId: PA })).status).toBe(404);
    expect((await post(env, 'friendAccept', { id: A, friendId: PB })).status).toBe(404);
    expect(lista(env, A)).toEqual([]);
    expect(lista(env, B)).toEqual([]);
  });

  it('recusar apaga o convite dos dois lados e não liga ninguém', async () => {
    const env = mundo();
    await post(env, 'friends', { id: A, friendId: PB });
    const r = await post(env, 'friendAccept', { id: B, friendId: PA, decline: true });
    expect(r.body.ok).toBe(true);
    expect(lista(env, B)).toEqual([]);
    expect((await get(env, 'friendsState', { id: A })).body.outgoing).toEqual([]);
    expect((await get(env, 'friendsState', { id: B })).body.incoming).toEqual([]);
  });

  it('o limite é 20 e vale no servidor, de quem convida e de quem aceita', async () => {
    const cheios = Array.from({ length: MAX_FRIENDS }, (_, i) => `x${String(i).padStart(2, '0')}`.padEnd(32, 'x'));
    const env = mundo({ [`profile:${A}`]: perfil(A, PA, { friends: cheios }) });
    const r = await post(env, 'friends', { id: A, friendId: PB });
    expect(r.status).toBe(400);
    expect(r.body.error).toContain('20');
    // aceitante cheio
    const env2 = mundo({ [`profile:${B}`]: perfil(B, PB, { friends: cheios }) });
    await post(env2, 'friends', { id: A, friendId: PB });
    const ac = await post(env2, 'friendAccept', { id: B, friendId: PA });
    expect(ac.status).toBe(400);
    expect(lista(env2, A)).toEqual([]);
    // convidante que encheu entre o convite e o aceite: o convite expira e a lista de quem aceitou fica intacta
    const env3 = mundo();
    await post(env3, 'friends', { id: A, friendId: PB });
    env3.DIGIAPP_SAVES.store.set(`profile:${A}`, perfil(A, PA, { friends: cheios }));
    const ex = await post(env3, 'friendAccept', { id: B, friendId: PA });
    expect(ex.status).toBe(409);
    expect(lista(env3, B)).toEqual([]);
  });

  it('remover desfaz nos dois lados (e é idempotente)', async () => {
    const env = mundo({ [`profile:${A}`]: perfil(A, PA, { friends: [B] }), [`profile:${B}`]: perfil(B, PB, { friends: [A] }) });
    const r = await post(env, 'friends', { id: A, friendId: PB, remove: true });
    expect(r.body).toEqual({ ok: true, friends: [] });
    expect(lista(env, A)).toEqual([]);
    expect(lista(env, B)).toEqual([]);
    expect((await post(env, 'friends', { id: A, friendId: PB, remove: true })).status).toBe(200);
  });

  it('simulado e escondido não recebem convite (e a resposta não os denuncia)', async () => {
    const env = mundo({ [`profile:${B}`]: perfil(B, PB, { simulated: true }), [`profile:${C}`]: perfil(C, PC, { publicHidden: true }) });
    const sim = await post(env, 'friends', { id: A, friendId: PB });
    expect(sim.body.status).toBe('pending');
    expect(env.DIGIAPP_SAVES.store.has(`freq:${B}`)).toBe(false);
    expect(env.DIGIAPP_SAVES.store.has(`freq:${A}`)).toBe(false);
    expect((await post(env, 'friends', { id: A, friendId: PC })).status).toBe(404);
  });

  it('não vaza saveId em nenhuma resposta', async () => {
    const env = mundo();
    await post(env, 'friends', { id: A, friendId: PB });
    const e = await get(env, 'friendsState', { id: B });
    const ok = await post(env, 'friendAccept', { id: B, friendId: PA });
    const txt = JSON.stringify([e.body, ok.body, (await get(env, 'friendsState', { id: A })).body]);
    for (const id of [A, B, C]) expect(txt).not.toContain(id);
  });
});

describe('migração das amizades antigas', () => {
  it('quem já tinha alguém passa a ser amigo mútuo, sem apagar nada e sem repetir', async () => {
    const env = mundo({ [`profile:${A}`]: perfil(A, PA, { friends: [B, C] }) });
    const e1 = await get(env, 'friendsState', { id: A });
    expect(e1.body.friends.sort()).toEqual([PB, PC].sort());
    expect(lista(env, B)).toEqual([A]);
    expect(lista(env, C)).toEqual([A]);
    const antes = JSON.stringify([...env.DIGIAPP_SAVES.store.entries()].filter(([k]) => k.startsWith('profile:')));
    await get(env, 'friendsState', { id: A });
    // varredura do dono: segunda passada é no-op
    env.SEASON_ADMIN_KEY = 'k';
    const v1 = await post(env, 'friendsMigrate', { adminKey: 'k' });
    expect(v1.body.ok).toBe(true);
    const v2 = await post(env, 'friendsMigrate', { adminKey: 'k' });
    expect(v2.body.espelhados).toBe(0);
    expect(JSON.stringify([...env.DIGIAPP_SAVES.store.entries()].filter(([k]) => k.startsWith('profile:')))).toBe(antes);
    expect((await post(env, 'friendsMigrate', { adminKey: 'errada' })).status).toBe(401);
  });

  it('não passa de 20 e não mexe em simulado', async () => {
    const cheios = Array.from({ length: MAX_FRIENDS }, (_, i) => `y${String(i).padStart(2, '0')}`.padEnd(32, 'y'));
    const env = mundo({
      [`profile:${A}`]: perfil(A, PA, { friends: [B, C] }),
      [`profile:${B}`]: perfil(B, PB, { friends: cheios }),
      [`profile:${C}`]: perfil(C, PC, { simulated: true }),
    });
    await get(env, 'friendsState', { id: A });
    expect(lista(env, B)).toEqual(cheios);
    expect(lista(env, C)).toEqual([]);
    expect(lista(env, A)).toEqual([B, C]);
  });
});

describe('presente: 20 Bits, 1×/dia/amigo, no servidor', () => {
  const amigos = () => mundo({ [`profile:${A}`]: perfil(A, PA, { friends: [B] }), [`profile:${B}`]: perfil(B, PB, { friends: [A] }), [`gmir:${A}`]: '1' });
  const fila = (env, id) => JSON.parse(env.DIGIAPP_SAVES.store.get(`gifts:${id}`) || '[]');

  it('só amigo recebe; o segundo no mesmo dia é 429 e não cria Bits; regravar o perfil não zera o limite', async () => {
    const env = amigos();
    expect((await post(env, 'gift', { id: A, friendId: PC })).status).toBe(403);
    expect((await post(env, 'gift', { id: A, friendId: PB })).status).toBe(200);
    expect(fila(env, B)).toHaveLength(1);
    expect(fila(env, B)[0]).toMatchObject({ bits: 20, from: 'Nomea' });
    // o perfil de A é regravado (profile action) — o registro do dia não mora lá
    await post(env, 'profile', { id: A, name: 'Nomea', stage: 'rookie' });
    const de = await post(env, 'gift', { id: A, friendId: PB });
    expect(de.status).toBe(429);
    expect(fila(env, B)).toHaveLength(1);
    const est = await get(env, 'friendsState', { id: A });
    expect(est.body.sentToday).toEqual([PB]);
  });

  it('toques paralelos passam uma vez só', async () => {
    const env = amigos();
    const rs = await Promise.all([1, 2, 3, 4].map(() => post(env, 'gift', { id: A, friendId: PB })));
    expect(rs.filter(r => r.status === 200)).toHaveLength(1);
    expect(fila(env, B)).toHaveLength(1);
  });

  it('o destinatário vê a notícia e o histórico; "visto" zera o selo; remover amizade fecha o presente', async () => {
    const env = amigos();
    await post(env, 'gift', { id: A, friendId: PB });
    const e = await get(env, 'friendsState', { id: B });
    expect(e.body.notes).toEqual([{ name: 'Nomea', bits: 20, at: expect.any(Number), unseen: true }]);
    expect(e.body.unseen).toBe(1);
    await post(env, 'friendsSeen', { id: B });
    const e2 = await get(env, 'friendsState', { id: B });
    expect(e2.body.unseen).toBe(0);
    expect(e2.body.notes).toHaveLength(1);
    await post(env, 'friends', { id: B, friendId: PA, remove: true });
    expect((await post(env, 'gift', { id: A, friendId: PB })).status).toBe(403);
  });

  it('presente para simulado: aceito sem efeito (sem fila, sem histórico)', async () => {
    const env = mundo({ [`profile:${A}`]: perfil(A, PA, { friends: [B] }), [`profile:${B}`]: perfil(B, PB, { simulated: true }), [`gmir:${A}`]: '1' });
    expect((await post(env, 'gift', { id: A, friendId: PB })).status).toBe(200);
    expect(env.DIGIAPP_SAVES.store.has(`gifts:${B}`)).toBe(false);
    expect(env.DIGIAPP_SAVES.store.has(`gnote:${B}`)).toBe(false);
  });
});

describe('presente: teto de recebimento (100 Bits/dia) e dia do jogador', () => {
  const rec = () => {
    const env = mundo({ [`profile:${B}`]: perfil(B, PB, { friends: [A, C] }), [`profile:${C}`]: perfil(C, PC, { friends: [B] }), [`gmir:${B}`]: '1' });
    const cs = ['d', 'e', 'f', 'g', 'h', 'i'].map((l, i) => ({ id: l.repeat(32), pid: `pid${l}00000000000000000${i}` }));
    for (const c of cs) {
      env.DIGIAPP_SAVES.store.set(`profile:${c.id}`, perfil(c.id, c.pid, { friends: [B] }));
      env.DIGIAPP_SAVES.store.set(`pid:${c.pid}`, c.id);
      env.DIGIAPP_SAVES.store.set(`gmir:${c.id}`, '1');
    }
    const pb = JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${B}`));
    pb.friends = [A, C, ...cs.map(c => c.id)];
    env.DIGIAPP_SAVES.store.set(`profile:${B}`, JSON.stringify(pb));
    env.DIGIAPP_SAVES.store.set(`profile:${A}`, perfil(A, PA, { friends: [B] }));
    env.DIGIAPP_SAVES.store.set(`profile:${C}`, perfil(C, PC, { friends: [B] }));
    return { env, remetentes: [{ id: A, pid: PA }, { id: C, pid: PC }, ...cs] };
  };
  const fila = (env, id) => JSON.parse(env.DIGIAPP_SAVES.store.get(`gifts:${id}`) || '[]');

  it('o excedente além de 100 não credita; a resposta e o histórico dizem o valor real', async () => {
    const { env, remetentes } = rec();
    const rs = [];
    for (const r of remetentes) rs.push((await post(env, 'gift', { id: r.id, friendId: PB })).body.credited);
    // 8 amigos × 20 = 160 pedidos; só 100 valem
    expect(rs.slice(0, 5)).toEqual([20, 20, 20, 20, 20]);
    expect(rs.slice(5)).toEqual([0, 0, 0]);
    expect(fila(env, B).reduce((s, g) => s + g.bits, 0)).toBe(100);
    const est = await get(env, 'friendsState', { id: B });
    expect(est.body.dailyCap).toBe(100);
    expect(est.body.notes.filter(n => n.bits === 0)).toHaveLength(3);
  });

  it('o teto é do dia de QUEM RECEBE: com outro fuso o contador recomeça', async () => {
    const { env, remetentes } = rec();
    // o destinatário mora num fuso em que "hoje" já é outro dia que o UTC
    await get(env, 'friendsState', { id: B, off: String(-12 * 3_600_000) });
    for (const r of remetentes.slice(0, 5)) await post(env, 'gift', { id: r.id, friendId: PB });
    expect((await post(env, 'gift', { id: remetentes[5].id, friendId: PB })).body.credited).toBe(0);
    // simula a virada do dia dele: o contador gravado é de outro dia
    const k = `grecv:${B}`;
    env.DIGIAPP_SAVES.store.set(k, JSON.stringify({ day: '2000-01-01', bits: 100 }));
    expect((await post(env, 'gift', { id: remetentes[6].id, friendId: PB })).body.credited).toBe(20);
  });

  it('o "1 por dia" segue o dia do REMETENTE (fuso), não o UTC', async () => {
    const env = mundo({ [`profile:${A}`]: perfil(A, PA, { friends: [B] }), [`profile:${B}`]: perfil(B, PB, { friends: [A] }), [`gmir:${A}`]: '1' });
    const off = 5 * 3_600_000;
    expect((await post(env, 'gift', { id: A, friendId: PB, off })).status).toBe(200);
    expect((await post(env, 'gift', { id: A, friendId: PB, off })).status).toBe(429);
    const est = await get(env, 'friendsState', { id: A, off: String(off) });
    expect(est.body.sentToday).toEqual([PB]);
    const gravado = JSON.parse(env.DIGIAPP_SAVES.store.get(`gsent:${A}`));
    expect(gravado.day).toBe(new Date(Date.now() + off).toISOString().slice(0, 10));
    // outro dia do jogador: libera
    env.DIGIAPP_SAVES.store.set(`gsent:${A}`, JSON.stringify({ day: '2000-01-01', to: [B] }));
    expect((await post(env, 'gift', { id: A, friendId: PB, off })).status).toBe(200);
  });
});
