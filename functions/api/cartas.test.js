import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';
import { claimMail, readMail } from './_mensageiro.js';
import { CARTAS_GLOBAIS, cartasGlobaisAtivas } from './_cartasGlobais.js';

// §288 — cartas do Papus: presente com "Resgatar", convite de amizade (Aceitar/Recusar) e carta GLOBAL de anúncio (uma vez por conta).

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

const kvDe = env => env.DIGIAPP_SAVES;
const caixa = (env, id) => (JSON.parse(kvDe(env).store.get(`mail:${id}`) || '{}').q || []);
const amigos = () => mundo({ [`profile:${A}`]: perfil(A, PA, { friends: [B] }), [`profile:${B}`]: perfil(B, PB, { friends: [A] }), [`gmir:${A}`]: '1' });

describe('presente por carta', () => {
  it('chega como carta com prêmio pendente; o resgate paga UMA vez (idempotente) e não usa a fila antiga', async () => {
    const env = amigos();
    expect((await post(env, 'gift', { id: A, friendId: PB })).body).toMatchObject({ ok: true, credited: 20 });
    const [c] = caixa(env, B).filter(m => m.kind === 'gift');
    expect(c).toMatchObject({ bits: 20, emblems: 0, claimedAt: 0 });
    expect(c.bodyPt).toContain('Nomea');
    expect(c.bodyEn).toContain('Nomea');
    expect(kvDe(env).store.has(`gifts:${B}`)).toBe(false);
    const kv = kvDe(env);
    expect(await claimMail(kv, B, [c.mid])).toEqual([expect.objectContaining({ mid: c.mid, bits: 20 })]);
    expect(await claimMail(kv, B, [c.mid])).toEqual([]);
    expect(await claimMail(kv, B, null)).toEqual([]);
  });

  it('migração: presente já pendente na fila antiga continua resgatável; caixa cheia de prêmios cai na fila antiga (nada se perde)', async () => {
    const velho = [{ from: 'Antigo', bits: 20, at: 1, gid: 'g-velho' }];
    const cheia = Array.from({ length: 30 }, (_, i) => ({ mid: `comp-${i}`, bodyPt: 'x', bodyEn: 'x', bits: 5, emblems: 0, at: 1000 + i }));
    const env = amigos();
    kvDe(env).store.set(`gifts:${B}`, JSON.stringify(velho));
    kvDe(env).store.set(`mail:${B}`, JSON.stringify({ q: cheia, done: [], season: '2026-10' }));
    expect((await post(env, 'gift', { id: A, friendId: PB })).body.credited).toBe(20);
    expect(caixa(env, B)).toHaveLength(30);
    const fila = JSON.parse(kvDe(env).store.get(`gifts:${B}`));
    expect(fila.map(g => g.gid)).toContain('g-velho');
    expect(fila).toHaveLength(2);
    expect((await get(env, 'gifts', { id: B })).body.gifts).toHaveLength(2);
  });
});

describe('convite de amizade por carta', () => {
  it('o convite gera a carta com quem convidou; aceitar liga os dois e a carta some', async () => {
    const env = mundo();
    await post(env, 'friends', { id: A, friendId: PB });
    const [c] = caixa(env, B).filter(m => m.kind === 'friend-invite');
    expect(c).toMatchObject({ fromPid: PA, bits: 0, emblems: 0 });
    expect(JSON.stringify(c)).not.toContain(A);
    const r = await post(env, 'friendAccept', { id: B, friendId: c.fromPid });
    expect(r.body).toMatchObject({ ok: true, status: 'friends' });
    expect(caixa(env, B).filter(m => m.kind === 'friend-invite')).toEqual([]);
    expect(JSON.parse(kvDe(env).store.get(`profile:${A}`)).friends).toEqual([B]);
  });

  it('recusar não liga ninguém e a carta some; convite repetido não duplica a carta', async () => {
    const env = mundo();
    await post(env, 'friends', { id: A, friendId: PB });
    await post(env, 'friends', { id: A, friendId: PB });
    expect(caixa(env, B).filter(m => m.kind === 'friend-invite')).toHaveLength(1);
    const r = await post(env, 'friendAccept', { id: B, friendId: PA, decline: true });
    expect(r.status).toBe(200);
    expect(caixa(env, B).filter(m => m.kind === 'friend-invite')).toEqual([]);
    expect(JSON.parse(kvDe(env).store.get(`profile:${A}`)).friends).toEqual([]);
    expect(JSON.parse(kvDe(env).store.get(`profile:${B}`)).friends).toEqual([]);
  });

  it('quem convidou e cancelou (remover) tira a carta da caixa do outro; aceite tardio dá 404', async () => {
    const env = mundo();
    await post(env, 'friends', { id: A, friendId: PB });
    await post(env, 'friends', { id: A, friendId: PB, remove: true });
    expect(caixa(env, B).filter(m => m.kind === 'friend-invite')).toEqual([]);
    expect((await post(env, 'friendAccept', { id: B, friendId: PA })).status).toBe(404);
  });

  it('quem se escondeu da lista pública convida sem carta (o convite nem aparece na lista do outro)', async () => {
    const env = mundo({ [`profile:${A}`]: perfil(A, PA, { publicHidden: true }) });
    await post(env, 'friends', { id: A, friendId: PB });
    expect(caixa(env, B).filter(m => m.kind === 'friend-invite')).toEqual([]);
  });
});

describe('carta global de anúncio', () => {
  const kv0 = () => { const store = new Map(); return { store, get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); }, list: async () => ({ keys: [], list_complete: true }) }; };
  const g = CARTAS_GLOBAIS.find(x => x.id === 'widget-area-de-trabalho-2026-11');
  const quando = g.desde + 3600_000;
  const todasGlobais = l => l.filter(m => m.kind === 'global');
  const globais = l => todasGlobais(l).filter(m => m.mid === 'global:widget-area-de-trabalho-2026-11');

  it('a carta do widget está ativa na janela, sem prêmio, com o mini-tutorial e texto pt/en', () => {
    const [c] = cartasGlobaisAtivas(quando);
    expect(c).toMatchObject({ mid: 'global:widget-area-de-trabalho-2026-11', kind: 'global', tutorial: 'widget', npc: 'mensageiro' });
    expect(c.bodyPt).toContain('O que é o widget?');
    expect(c.bodyEn).toBeTruthy();
    expect(cartasGlobaisAtivas(g.desde - 1)).toEqual([]);
    expect(cartasGlobaisAtivas(g.ate)).toEqual([]);
  });

  it('a carta da Hexsmith está ativa (o PR dos botões já entrou), com NPC, 200 Bits, lápis e chama', async () => {
    const h = CARTAS_GLOBAIS.find(x => x.id === 'hexsmith-nomes-2026-11');
    expect(h).toMatchObject({ ativa: true, carta: { npc: 'hexsmith' } });
    for (const t of [h.carta.bodyPt, h.carta.bodyEn]) { expect(t).toContain('200 Bits'); }
    expect(h.carta.bodyPt).toMatch(/lápis[\s\S]*chama/);
    expect(cartasGlobaisAtivas(quando).map(c => c.mid)).toContain('global:hexsmith-nomes-2026-11');
    const kv = kv0(); const env = { DIGIAPP_SAVES: kv };
    expect(todasGlobais(await readMail(env, kv, B, quando)).map(m => m.npc).sort()).toEqual(['hexsmith', 'mensageiro']);
  });

  it('aparece UMA vez por conta: apagada não volta; sem prêmio e sem dado pessoal; cada conta recebe a sua', async () => {
    const kv = kv0(); const env = { DIGIAPP_SAVES: kv };
    const c = globais(await readMail(env, kv, B, quando))[0];
    expect(c).toMatchObject({ bits: 0, emblems: 0, read: false, tutorial: 'widget' });
    expect(JSON.stringify(c)).not.toMatch(/@|saveId/);
    expect(globais(await readMail(env, kv, B, quando + 1000))).toHaveLength(1);
    await post(env, 'mailDelete', { id: B, mids: [c.mid] });
    expect(globais(await readMail(env, kv, B, quando + 2000))).toEqual([]);
    expect(globais(await readMail(env, kv, C, quando))).toHaveLength(1);
  });

  it('marcar como lida não a duplica; expirada em 3 dias não renasce', async () => {
    const kv = kv0(); const env = { DIGIAPP_SAVES: kv };
    const [c] = globais(await readMail(env, kv, B, quando));
    await post(env, 'mailRead', { id: B, mids: [c.mid] });
    const depois = globais(await readMail(env, kv, B, quando + 1000));
    expect(depois).toHaveLength(1);
    expect(depois[0].read).toBe(true);
    const tarde = quando + 4 * 86400_000;
    expect(globais(await readMail(env, kv, B, tarde))).toEqual([]);
    expect(globais(await readMail(env, kv, B, tarde + 1000))).toEqual([]);
  });
});
