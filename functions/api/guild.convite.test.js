import { describe, it, expect } from 'vitest';
import { onRequest } from './guild.js';
import { onRequest as community } from './community.js';
import { fakeKV } from './_claKv.testkit.js';
import { nomeDaGuildaDe } from './_guildaNome.js';

// §321 (13/11/2026): o "Convidar" do Salão (`guildInvite`) e o nome do clã embaixo do nome nas rotas públicas.

const sid = r => r.padEnd(32, '0');
const A = sid('cvA'), B = sid('cvB'), C = sid('cvC'), D = sid('cvD');
const pidDe = id => `P${id.slice(0, 4)}${'q'.repeat(19)}`;
const perfil = (id, nome, extra = {}) => JSON.stringify({ id, name: nome, pid: pidDe(id), petName: 'p', stage: 'rookie', pvpEnabled: true, attrs: {}, friends: [], createdAt: Date.now(), ...extra });
const req = (action, { method = 'POST', body, params = {} } = {}) =>
  new Request(`https://x.dev/api/guild?${new URLSearchParams({ action, ...params })}`, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined });
const call = (e, a, o) => onRequest({ request: req(a, o), env: e });
const post = async (e, a, body) => { const r = await call(e, a, { body }); return { status: r.status, json: await r.json() }; };

async function setup(extra = {}) {
  const e = { DIGIAPP_SAVES: fakeKV({
    [`profile:${A}`]: perfil(A, 'Ana'), [`pid:${pidDe(A)}`]: A,
    [`profile:${B}`]: perfil(B, 'Beto'), [`pid:${pidDe(B)}`]: B,
    [`profile:${C}`]: perfil(C, 'Caio'), [`pid:${pidDe(C)}`]: C,
    [`profile:${D}`]: perfil(D, 'Duda', { publicHidden: true }), [`pid:${pidDe(D)}`]: D,
    ...extra,
  }) };
  const c = await (await call(e, 'guildCreate', { body: { id: A, name: 'Os Lumes' } })).json();
  return { e, code: c.guild.code };
}
const cartas = (e, save) => JSON.parse(e.DIGIAPP_SAVES.store.get(`mail:${save}`) || '{"q":[]}').q;

describe('guildInvite — o convite vira carta do Papus com o nome e o código do clã', () => {
  it('convida pelo pid; a carta traz quem convidou, o clã e o código; repetir no mesmo dia não duplica', async () => {
    const { e, code } = await setup();
    const r = await post(e, 'guildInvite', { id: A, to: pidDe(B) });
    expect(r.status).toBe(200);
    expect(r.json).toEqual({ invited: true });
    await post(e, 'guildInvite', { id: A, to: pidDe(B) });
    const q = cartas(e, B);
    expect(q).toHaveLength(1);
    expect(q[0].bodyPt).toContain('Ana');
    expect(q[0].bodyPt).toContain('Os Lumes');
    expect(q[0].bodyPt).toContain(code);
    expect(JSON.stringify(q[0])).not.toContain(A);
  });
  it('sem clã = 404; alvo inválido = 400; escondido ou inexistente = 404 igual (não confirma conta)', async () => {
    const { e } = await setup();
    expect((await post(e, 'guildInvite', { id: B, to: pidDe(C) })).status).toBe(404);
    expect((await post(e, 'guildInvite', { id: A, to: '../x' })).status).toBe(400);
    const escondido = await post(e, 'guildInvite', { id: A, to: pidDe(D) });
    const inexistente = await post(e, 'guildInvite', { id: A, to: 'Pzzzz' + 'q'.repeat(19) });
    expect(escondido).toEqual({ status: 404, json: { error: 'player not found' } });
    expect(inexistente).toEqual(escondido);
    expect(cartas(e, D)).toEqual([]);
  });
  it('quem já está na roda = 409 already member; quem está em OUTRO clã = 409 already in a guild', async () => {
    const { e, code } = await setup();
    await call(e, 'guildJoin', { body: { id: B, code } });
    expect((await post(e, 'guildInvite', { id: A, to: pidDe(B) })).json.error).toBe('already member');
    await call(e, 'guildCreate', { body: { id: C, name: 'Outro' } });
    const r = await post(e, 'guildInvite', { id: A, to: pidDe(C) });
    expect(r).toMatchObject({ status: 409, json: { error: 'already in a guild' } });
  });
  it('quem se escondeu convida sem o próprio nome na carta', async () => {
    const { e } = await setup();
    const p = JSON.parse(e.DIGIAPP_SAVES.store.get(`profile:${A}`));
    e.DIGIAPP_SAVES.store.set(`profile:${A}`, JSON.stringify({ ...p, publicHidden: true }));
    await post(e, 'guildInvite', { id: A, to: pidDe(C) });
    expect(cartas(e, C)[0].bodyPt).toMatch(/^Alguém convidou você para o clã Os Lumes/);
  });
});

describe('nome do clã embaixo do nome (§321)', () => {
  it('nomeDaGuildaDe: só de quem é membro; índice órfão e sem clã = null', async () => {
    const { e } = await setup();
    expect(await nomeDaGuildaDe(e, A)).toBe('Os Lumes');
    expect(await nomeDaGuildaDe(e, B)).toBeNull();
    e.DIGIAPP_SAVES.store.set(`coopOf:${C}`, e.DIGIAPP_SAVES.store.get(`coopOf:${A}`));
    expect(await nomeDaGuildaDe(e, C)).toBeNull();
  });
  it('o diretório e o perfil público levam guildName só de quem tem clã', async () => {
    const { e } = await setup();
    const get = async (params) => (await community({ request: new Request(`https://x.dev/api/community?${new URLSearchParams(params)}`), env: e })).json();
    const { players } = await get({ action: 'players' });
    const ana = players.find(p => p.name === 'Ana');
    const beto = players.find(p => p.name === 'Beto');
    expect(ana.guildName).toBe('Os Lumes');
    expect('guildName' in beto).toBe(false);
    const { player } = await get({ action: 'player', id: pidDe(A) });
    expect(player.guildName).toBe('Os Lumes');
  });
});
