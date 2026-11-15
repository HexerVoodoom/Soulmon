import { describe, it, expect, beforeEach } from 'vitest';
import { onRequest as guild } from './guild.js';
import { onRequest as community } from './community.js';
import { fakeKV } from './_claKv.testkit.js';
import { resetRateLimits } from './_rateLimit.js';
import { INVITE_DECLINE_BLOCK_MS, FRIEND_INVITE_DAILY_CAP, GUILD_INVITE_DAILY_CAP, FRIEND_INVITE_HOURLY, GUILD_INVITE_HOURLY } from './_conviteLimite.js';
import { GUILD_INVITE_LIMIT } from './guild.js';

// QA r4 C2 · C (REGISTRO §388, decisão do dono 14/11/2026: "limite por par no servidor"). Depois de um convite de amizade OU de clã
// RECUSADO, o mesmo remetente só convida o mesmo destinatário de novo depois de 7 dias; resposta ao bloqueado = a do sucesso
// (não revela a recusa). Teto DIÁRIO por remetente no KV, além dos 30/h e 20/h por isolate de antes.

const sid = r => r.padEnd(32, '0');
const A = sid('lpA'), B = sid('lpB'), C = sid('lpC');
const pidDe = id => `P${id.slice(0, 4)}${'q'.repeat(19)}`;
const perfil = (id, nome) => JSON.stringify({ id, name: nome, pid: pidDe(id), petName: 'p', stage: 'rookie', pvpEnabled: true, attrs: {}, friends: [], createdAt: Date.now() });
const req = (base, action, body) => new Request(`https://x.dev/api/${base}?${new URLSearchParams({ action })}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
const g = async (e, action, body) => { const r = await guild({ request: req('guild', action, body), env: e }); return { status: r.status, json: await r.json() }; };
const c = async (e, action, body) => { const r = await community({ request: req('community', action, body), env: e }); return { status: r.status, json: await r.json() }; };
const mundo = () => ({ DIGIAPP_SAVES: fakeKV({
  [`profile:${A}`]: perfil(A, 'Ana'), [`pid:${pidDe(A)}`]: A,
  [`profile:${B}`]: perfil(B, 'Beto'), [`pid:${pidDe(B)}`]: B,
  [`profile:${C}`]: perfil(C, 'Caio'), [`pid:${pidDe(C)}`]: C,
}) });
const caixa = (e, id) => JSON.parse(e.DIGIAPP_SAVES.store.get(`mail:${id}`) || '{"q":[]}').q;
const convitesDe = (e, id) => JSON.parse(e.DIGIAPP_SAVES.store.get(`freq:${id}`) || '{"in":[],"out":[]}');

beforeEach(() => resetRateLimits());

describe('amizade: recusa bloqueia o par por 7 dias, em silêncio', () => {
  it('B recusa → A convida de novo: resposta IGUAL à do sucesso, mas nada chega a B (nem convite nem carta)', async () => {
    const e = mundo();
    const primeira = await c(e, 'friends', { id: A, friendId: pidDe(B) });
    expect(primeira.json.status).toBe('pending');
    expect((await c(e, 'friendAccept', { id: B, friendId: pidDe(A), decline: true })).status).toBe(200);
    expect(caixa(e, B)).toHaveLength(0);
    const segunda = await c(e, 'friends', { id: A, friendId: pidDe(B) });
    expect(segunda).toEqual(primeira);
    expect(convitesDe(e, B).in).toHaveLength(0);
    expect(caixa(e, B)).toHaveLength(0);
  });

  it('o bloqueio é por PAR: A ainda convida C; e B (quem recusou) pode convidar A', async () => {
    const e = mundo();
    await c(e, 'friends', { id: A, friendId: pidDe(B) });
    await c(e, 'friendAccept', { id: B, friendId: pidDe(A), decline: true });
    await c(e, 'friends', { id: A, friendId: pidDe(C) });
    expect(convitesDe(e, C).in.map(r => r.from)).toEqual([A]);
    await c(e, 'friends', { id: B, friendId: pidDe(A) });
    expect(convitesDe(e, A).in.map(r => r.from)).toEqual([B]);
  });

  it('a marca de bloqueio vive no KV com prazo de 7 dias (vence sozinha)', async () => {
    const e = mundo();
    await c(e, 'friends', { id: A, friendId: pidDe(B) });
    await c(e, 'friendAccept', { id: B, friendId: pidDe(A), decline: true });
    const chave = [...e.DIGIAPP_SAVES.store.keys()].find(k => k.startsWith('invblk:f:'));
    expect(chave).toBe(`invblk:f:${A}:${B}`);
    expect(INVITE_DECLINE_BLOCK_MS).toBe(7 * 86_400_000);
  });
});

describe('clã: recusar a carta bloqueia o mesmo clã por 7 dias, em silêncio', () => {
  it('B recusa a carta (apagar a carta de convite) → o clã convida de novo: { invited: true } e nenhuma carta nova', async () => {
    const e = mundo();
    await g(e, 'guildCreate', { id: A, name: 'Os Lumes' });
    expect((await g(e, 'guildInvite', { id: A, to: pidDe(B) })).json).toEqual({ invited: true });
    const [carta] = caixa(e, B);
    expect((await c(e, 'mailDelete', { id: B, mids: [carta.mid] })).status).toBe(200);
    expect(caixa(e, B)).toHaveLength(0);
    // Outro dia (o `mid` do dia não está mais em `done`): sem o bloqueio, a carta voltaria.
    e.DIGIAPP_SAVES.store.set(`mail:${B}`, JSON.stringify({ q: [], done: [], season: '' }));
    expect((await g(e, 'guildInvite', { id: A, to: pidDe(B) })).json).toEqual({ invited: true });
    expect(caixa(e, B)).toHaveLength(0);
  });

  it('carta que vence sozinha (3 dias) NÃO conta como recusa: o clã convida de novo e a carta chega', async () => {
    const e = mundo();
    await g(e, 'guildCreate', { id: A, name: 'Os Lumes' });
    await g(e, 'guildInvite', { id: A, to: pidDe(B) });
    e.DIGIAPP_SAVES.store.set(`mail:${B}`, JSON.stringify({ q: [], done: [], season: '' }));
    await g(e, 'guildInvite', { id: A, to: pidDe(B) });
    expect(caixa(e, B)).toHaveLength(1);
  });
});

describe('teto diário por remetente no KV (além do teto por hora)', () => {
  it('amizade: passado FRIEND_INVITE_DAILY_CAP no dia, 429; o contador mora no KV (sobrevive a outro isolate)', async () => {
    const e = mundo();
    const dia = new Date().toISOString().slice(0, 10);
    e.DIGIAPP_SAVES.store.set(`invday:f:${A}:${dia}`, String(FRIEND_INVITE_DAILY_CAP));
    expect((await c(e, 'friends', { id: A, friendId: pidDe(B) })).status).toBe(429);
    expect(convitesDe(e, B).in).toHaveLength(0);
  });

  it('clã: passado GUILD_INVITE_DAILY_CAP no dia, 429 e nenhuma carta', async () => {
    const e = mundo();
    await g(e, 'guildCreate', { id: A, name: 'Os Lumes' });
    const dia = new Date().toISOString().slice(0, 10);
    e.DIGIAPP_SAVES.store.set(`invday:g:${A}:${dia}`, String(GUILD_INVITE_DAILY_CAP));
    expect((await g(e, 'guildInvite', { id: A, to: pidDe(B) })).status).toBe(429);
    expect(caixa(e, B)).toHaveLength(0);
  });

  it('as constantes têm um dono só, e os tetos por hora seguem 30 e 20', () => {
    expect(FRIEND_INVITE_HOURLY).toEqual({ limit: 30, windowMs: 3_600_000 });
    expect(GUILD_INVITE_HOURLY).toEqual({ limit: 20, windowMs: 3_600_000 });
    expect(GUILD_INVITE_LIMIT).toBe(GUILD_INVITE_HOURLY);
    expect(FRIEND_INVITE_DAILY_CAP).toBeGreaterThan(FRIEND_INVITE_HOURLY.limit);
    expect(GUILD_INVITE_DAILY_CAP).toBeGreaterThan(GUILD_INVITE_HOURLY.limit);
  });
});
