import { describe, it, expect, beforeEach } from 'vitest';
import { onRequest as guild } from './guild.js';
import { onRequest as community } from './community.js';
import { fakeKV } from './_claKv.testkit.js';
import { resetRateLimits } from './_rateLimit.js';
import { INVITE_PENDING_MAX } from './_mensageiro.js';

// §358 (13/11/2026, pedido do dono "Invite de amizade e clã deve enviar carta"): convite de amizade E de clã chegam por carta do Papus,
// com UMA carta pendente por par, teto de 20 convites pendentes por pessoa, e a carta some quando o convite acaba.

const sid = r => r.padEnd(32, '0');
const A = sid('ivA'), B = sid('ivB'), C = sid('ivC');
const pidDe = id => `P${id.slice(0, 4)}${'q'.repeat(19)}`;
const perfil = (id, nome, extra = {}) => JSON.stringify({ id, name: nome, pid: pidDe(id), petName: 'p', stage: 'rookie', pvpEnabled: true, attrs: {}, friends: [], createdAt: Date.now(), ...extra });
const req = (base, action, body) => new Request(`https://x.dev/api/${base}?${new URLSearchParams({ action })}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
const g = async (e, action, body) => { const r = await guild({ request: req('guild', action, body), env: e }); return { status: r.status, json: await r.json() }; };
const c = async (e, action, body) => { const r = await community({ request: req('community', action, body), env: e }); return { status: r.status, json: await r.json() }; };

const mundo = (extra = {}, seed = {}) => ({ DIGIAPP_SAVES: fakeKV({
  [`profile:${A}`]: perfil(A, 'Ana'), [`pid:${pidDe(A)}`]: A,
  [`profile:${B}`]: perfil(B, 'Beto', extra), [`pid:${pidDe(B)}`]: B,
  [`profile:${C}`]: perfil(C, 'Caio'), [`pid:${pidDe(C)}`]: C,
  ...seed,
}) });
const caixa = (e, id) => JSON.parse(e.DIGIAPP_SAVES.store.get(`mail:${id}`) || '{"q":[]}').q;
const poe = (e, id, q) => e.DIGIAPP_SAVES.store.set(`mail:${id}`, JSON.stringify({ q, done: [], season: '' }));
const pidFalso = i => `pidz${String(i).padStart(20, '0')}`;
const convitesFalsos = n => Array.from({ length: n }, (_, i) => ({
  mid: `invite:${pidFalso(i)}:x`, kind: 'friend-invite', fromPid: pidFalso(i),
  titlePt: 'Convite de amizade', titleEn: 'Friend invite', bodyPt: 'X convidou você.', bodyEn: 'X invited you.', bits: 0, emblems: 0, at: Date.now(),
}));
const criarCla = async (e, dono = A) => (await g(e, 'guildCreate', { id: dono, name: 'Os Lumes' })).json.guild.code;
const gidDe = (e, id) => e.DIGIAPP_SAVES.store.get(`coopOf:${id}`);

beforeEach(() => resetRateLimits());

describe('convite de clã por carta (§358)', () => {
  it('a carta é do tipo guild-invite, leva o código, o nome de quem convidou e o do clã (pt/en), e nada de saveId', async () => {
    const e = mundo();
    const code = await criarCla(e);
    expect((await g(e, 'guildInvite', { id: A, to: pidDe(B) })).json).toEqual({ invited: true });
    const [carta] = caixa(e, B);
    expect(carta).toMatchObject({ kind: 'guild-invite', guildCode: code, titlePt: 'Convite para um clã', titleEn: 'Clan invite' });
    expect(carta.bodyPt).toContain('Ana');
    expect(carta.bodyPt).toContain('Os Lumes');
    expect(carta.bodyEn).toContain('invited you to the clan Os Lumes');
    expect(JSON.stringify(carta)).not.toContain(A);
  });

  it('uma carta pendente por clã: outro membro convidando, ou o mesmo clã em outro dia, não empilha', async () => {
    const e = mundo();
    const code = await criarCla(e);
    await g(e, 'guildJoin', { id: C, code });
    await g(e, 'guildInvite', { id: A, to: pidDe(B) });
    expect((await g(e, 'guildInvite', { id: C, to: pidDe(B) })).json).toEqual({ invited: true });
    expect(caixa(e, B)).toHaveLength(1);
    // A carta de ontem (mid de outro dia) ainda está na caixa: o convite de hoje não vira uma segunda.
    poe(e, B, [{ ...caixa(e, B)[0], mid: `ginv:${gidDe(e, A)}:2020-01-01` }]);
    await g(e, 'guildInvite', { id: A, to: pidDe(B) });
    expect(caixa(e, B)).toHaveLength(1);
  });

  it('entrar no clã (pelo código da carta) tira da caixa TODO convite de clã pendente, inclusive o formato antigo sem kind', async () => {
    const e = mundo();
    await criarCla(e);
    await g(e, 'guildInvite', { id: A, to: pidDe(B) });
    const antigo = { mid: 'ginv:outroclaxxxxxxxxxxxxxx:2026-11-12', titlePt: 'Convite para um clã', titleEn: 'Clan invite', bodyPt: 'Velho.', bodyEn: 'Old.', bits: 0, emblems: 0, at: 1 };
    const [amizade] = convitesFalsos(1);
    poe(e, B, [...caixa(e, B), antigo, amizade]);
    expect((await g(e, 'guildJoin', { id: B, code: caixa(e, B)[0].guildCode })).status).toBe(200);
    expect(caixa(e, B).map(m => m.mid)).toEqual([amizade.mid]);
  });

  it('teto: com 20 convites pendentes, o convite responde igual mas não vira carta; cartas comuns não contam', async () => {
    const e = mundo();
    await criarCla(e);
    const comum = { mid: 'gift:1', kind: 'gift', titlePt: 'P', titleEn: 'P', bodyPt: 'p', bodyEn: 'p', bits: 5, emblems: 0, at: Date.now() };
    expect(INVITE_PENDING_MAX).toBe(20);
    poe(e, B, [...convitesFalsos(INVITE_PENDING_MAX), comum]);
    expect((await g(e, 'guildInvite', { id: A, to: pidDe(B) })).json).toEqual({ invited: true });
    expect(caixa(e, B).filter(m => m.kind === 'guild-invite')).toEqual([]);
    poe(e, B, [...convitesFalsos(INVITE_PENDING_MAX - 1), comum]);
    await g(e, 'guildInvite', { id: A, to: pidDe(B) });
    expect(caixa(e, B).filter(m => m.kind === 'guild-invite')).toHaveLength(1);
  });

  it('convidado com PvP desligado recebe a carta (amigo achável, §351)', async () => {
    const e = mundo({ pvpEnabled: false });
    await criarCla(e);
    await g(e, 'guildInvite', { id: A, to: pidDe(B) });
    expect(caixa(e, B).filter(m => m.kind === 'guild-invite')).toHaveLength(1);
  });

  it('convite recusado pelo rate limit (20/h por conta) não deposita carta', async () => {
    const extras = {};
    const alvos = Array.from({ length: 21 }, (_, i) => sid(`rl${String(i).padStart(2, '0')}`));
    for (const id of alvos) { extras[`profile:${id}`] = perfil(id, `N${id.slice(2, 4)}`); extras[`pid:${pidDe(id)}`] = id; }
    const e = mundo({}, extras);
    await criarCla(e);
    for (const id of alvos.slice(0, 20)) expect((await g(e, 'guildInvite', { id: A, to: pidDe(id) })).status).toBe(200);
    const ultimo = alvos[20];
    expect((await g(e, 'guildInvite', { id: A, to: pidDe(ultimo) })).status).toBe(429);
    expect(caixa(e, ultimo)).toEqual([]);
  });
});

describe('convite de amizade por carta (§288 + §358)', () => {
  it('uma carta pendente por par: carta do mesmo remetente ainda na caixa não duplica, mesmo se o pedido saiu da lista', async () => {
    const e = mundo();
    await c(e, 'friends', { id: A, friendId: pidDe(B) });
    expect(caixa(e, B).filter(m => m.kind === 'friend-invite')).toHaveLength(1);
    // O pedido sumiu das listas (ex.: teto de 30 recebidos), mas a carta continua: convidar de novo não empilha outra carta.
    for (const id of [A, B]) e.DIGIAPP_SAVES.store.delete(`freq:${id}`);
    await c(e, 'friends', { id: A, friendId: pidDe(B) });
    expect(caixa(e, B).filter(m => m.kind === 'friend-invite')).toHaveLength(1);
  });

  it('teto de 20 convites pendentes: o pedido de amizade é gravado (lista de Amigos) mas não vira carta', async () => {
    const e = mundo();
    poe(e, B, convitesFalsos(INVITE_PENDING_MAX));
    expect((await c(e, 'friends', { id: A, friendId: pidDe(B) })).json).toMatchObject({ ok: true, status: 'pending' });
    expect(caixa(e, B).filter(m => m.fromPid === pidDe(A))).toEqual([]);
    const estado = await community({ request: new Request(`https://x.dev/api/community?action=friendsState&id=${B}`), env: e });
    expect(JSON.stringify(await estado.json())).toContain(pidDe(A));
  });

  it('convidado com PvP desligado recebe a carta (amigo achável, §351), com o texto pt/en de convite', async () => {
    const e = mundo({ pvpEnabled: false });
    await c(e, 'friends', { id: A, friendId: pidDe(B) });
    const [carta] = caixa(e, B).filter(m => m.kind === 'friend-invite');
    expect(carta).toMatchObject({ fromPid: pidDe(A), titlePt: 'Convite de amizade', titleEn: 'Friend invite' });
    expect(carta.bodyPt).toBe('Ana convidou você para ser amigo. Aceitar?');
    expect(carta.bodyEn).toBe('Ana invited you to be friends. Accept?');
  });
});
