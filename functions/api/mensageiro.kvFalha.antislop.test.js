/**
 * Antislop P6 (14/11/2026, item 1 do relatório r3; REGISTRO §378): falha de LEITURA do KV na caixa de cartas não pode virar
 * "caixa vazia".
 *
 * Antes, `ler()` fazia `try { JSON.parse(await kv.get('mail:<id>')) } catch { vazio }`: o `catch` pegava também o erro do
 * próprio `get`, e todo escritor (enqueueMail, readMail, claimMail, markRead, deleteMail, ackMail, removerConvitesDe*) gravava
 * por cima da caixa "vazia". Prova do avaliador: fila com 3 cartas de `bits:100` + `get` rejeitando → `enqueueMail` devolvia
 * `true` e a fila final era só a carta nova (prêmios pendentes apagados; `done` zerado deixava a carta `season:<mês>` renascer).
 *
 * Agora a falha do `get` PROPAGA e nada é gravado; só o JSON ilegível segue tolerado (com `console.warn`). Nos chamadores, o
 * convite em si nunca falha por causa da carta (a carta é melhor esforço COM log); o convite de clã, que É a carta, responde 503.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequest as community } from './community.js';
import { onRequest as guild } from './guild.js';
import { resetRateLimits } from './_rateLimit.js';
import { reqKey } from './_amigos.js';
import {
  ackMail, claimMail, deleteMail, enqueueInvite, enqueueMail, markRead, readMail, removerConvitesDe, removerConvitesDeCla,
} from './_mensageiro.js';

const A = 'a'.repeat(32);
const B = 'b'.repeat(32);
const PA = 'pida0000000000000000000a';
const PB = 'pidb0000000000000000000b';
const NOV = Date.UTC(2026, 10, 2);

/** KV falso + `falhaGet`: prefixo de chave cujo `get` REJEITA (o KV fora do ar só para aquela leitura). `puts` registra as gravações. */
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const kv = {
    store, falhaGet: /** @type {string | null} */ (null), puts: /** @type {string[]} */ ([]),
    get: async k => {
      if (kv.falhaGet && k.startsWith(kv.falhaGet)) throw new Error('kv get failed');
      return store.get(k) ?? null;
    },
    put: async (k, v) => { kv.puts.push(k); store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' } = {}) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
  return kv;
}
const perfil = (id, pid, extra = {}) => JSON.stringify({
  id, pid, name: `Nome${pid.slice(3, 4)}`, petName: 'pet', stage: 'rookie', pvpEnabled: true,
  attrs: { power: 1, harmony: 1, benevolence: 1 }, friends: [], createdAt: Date.now(), ...extra,
});
const premio = i => ({ mid: `comp-${i}`, bodyPt: 'Toma.', bodyEn: 'Take.', titlePt: 'T', titleEn: 'T', bits: 100, emblems: 0, at: 1000 + i, read: false, claimedAt: 0 });
const convite = { mid: `invite:${PA}:x`, kind: 'friend-invite', fromPid: PA, bodyPt: 'Convite.', bodyEn: 'Invite.', titlePt: 'C', titleEn: 'C', bits: 0, emblems: 0, at: 1, read: true, claimedAt: 0 };
const caixaCom3 = () => JSON.stringify({ q: [premio(1), premio(2), premio(3), convite], done: ['season:2026-09'], season: '2026-10' });

function mundo(extra = {}) {
  const kv = fakeKV({
    [`profile:${A}`]: perfil(A, PA), [`profile:${B}`]: perfil(B, PB),
    [`pid:${PA}`]: A, [`pid:${PB}`]: B,
    [`mail:${B}`]: caixaCom3(),
    ...extra,
  });
  return { env: { DIGIAPP_SAVES: kv }, kv };
}
const req = (base, action, body) => new Request(`https://x.dev/api/${base}?${new URLSearchParams({ action })}`,
  { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
const post = async (handler, base, env, action, body) => {
  const r = await handler({ request: req(base, action, body), env });
  return { status: r.status, body: await r.json().catch(() => null) };
};

let warn;
beforeEach(() => { resetRateLimits(); warn = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => { vi.restoreAllMocks(); });

describe('item 1 · `_mensageiro.js`: falha de leitura de `mail:<saveId>` propaga e NUNCA grava por cima', () => {
  it('prova do avaliador: fila com 3 cartas de prêmio + `get` rejeitando → enqueueMail rejeita e a fila fica intacta', async () => {
    const { env, kv } = mundo();
    const antes = kv.store.get(`mail:${B}`);
    kv.falhaGet = 'mail:';
    await expect(enqueueMail(env, kv, B, { mid: 'novo', bodyPt: 'Oi.', bodyEn: 'Hi.' })).rejects.toThrow('kv get failed');
    expect(kv.store.get(`mail:${B}`)).toBe(antes);
    expect(kv.puts.filter(k => k.startsWith('mail:'))).toEqual([]);
  });

  it('todo escritor da caixa rejeita sem gravar (readMail com virada de mês, claim, markRead, delete, ack, removerConvites*, enqueueInvite)', async () => {
    const { env, kv } = mundo();
    const antes = kv.store.get(`mail:${B}`);
    kv.falhaGet = 'mail:';
    const chamadas = [
      () => readMail(env, kv, B, NOV),
      () => claimMail(kv, B, null),
      () => markRead(kv, B, ['comp-1']),
      () => deleteMail(kv, B, 'read'),
      () => deleteMail(kv, B, ['comp-1'], true),
      () => ackMail(kv, B, ['comp-1']),
      () => removerConvitesDe(kv, B, PA),
      () => removerConvitesDeCla(kv, B),
      () => enqueueInvite(env, kv, B, { mid: 'invite:z:1', kind: 'friend-invite', fromPid: PA, bodyPt: 'x', bodyEn: 'x' }, () => false),
    ];
    for (const f of chamadas) await expect(f()).rejects.toThrow('kv get failed');
    expect(kv.store.get(`mail:${B}`)).toBe(antes);
    expect(kv.puts.filter(k => k.startsWith('mail:'))).toEqual([]);
  });

  it('JSON ilegível segue tolerado (caixa recomeça vazia) e deixa rastro no console.warn com o saveId', async () => {
    const { env, kv } = mundo({ [`mail:${B}`]: '{isto não é json' });
    expect(await enqueueMail(env, kv, B, { mid: 'novo', bodyPt: 'Oi.', bodyEn: 'Hi.' })).toBe(true);
    expect(JSON.parse(kv.store.get(`mail:${B}`)).q.map(m => m.mid)).toEqual(['novo']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('mail'), expect.objectContaining({ saveId: B }));
  });
});

describe('item 1 · chamadores: a falha da carta não vira 200 silencioso nem perde nada', () => {
  it('convite de AMIZADE: o convite vale (200 pending, gravado na lista), a carta falha COM log e a caixa existente fica intacta', async () => {
    const { env, kv } = mundo();
    const antes = kv.store.get(`mail:${B}`);
    kv.falhaGet = 'mail:';
    const r = await post(community, 'community', env, 'friends', { id: A, friendId: PB });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, status: 'pending' });
    expect(JSON.parse(kv.store.get(reqKey(B))).in).toEqual([expect.objectContaining({ from: A })]);
    expect(kv.store.get(`mail:${B}`)).toBe(antes);
    expect(warn).toHaveBeenCalled();
  });

  it('PRESENTE: a carta falha → o presente cai na fila antiga `gifts:` (nada se perde) e a caixa existente fica intacta', async () => {
    const { env, kv } = mundo({
      [`profile:${A}`]: perfil(A, PA, { friends: [B] }), [`profile:${B}`]: perfil(B, PB, { friends: [A] }), [`gmir:${A}`]: '1',
    });
    const antes = kv.store.get(`mail:${B}`);
    kv.falhaGet = 'mail:';
    const r = await post(community, 'community', env, 'gift', { id: A, friendId: PB });
    expect(r.body).toMatchObject({ ok: true, credited: 20 });
    expect(JSON.parse(kv.store.get(`gifts:${B}`))).toEqual([expect.objectContaining({ bits: 20 })]);
    expect(kv.store.get(`mail:${B}`)).toBe(antes);
    expect(warn).toHaveBeenCalled();
  });

  it('convite de CLÃ (a carta É o convite): 503 "try again", nunca 200 sem carta; a caixa existente fica intacta', async () => {
    const { env, kv } = mundo();
    const criado = await post(guild, 'guild', env, 'guildCreate', { id: A, name: 'Os Lumes' });
    expect(criado.status).toBe(200);
    const antes = kv.store.get(`mail:${B}`);
    kv.falhaGet = 'mail:';
    const r = await post(guild, 'guild', env, 'guildInvite', { id: A, to: PB });
    expect(r.status).toBe(503);
    expect(kv.store.get(`mail:${B}`)).toBe(antes);
  });

  it('caixa (GET mail) com a leitura falhando não responde 200 com caixa vazia: o handler rejeita (5xx da plataforma, o app retenta)', async () => {
    const { env, kv } = mundo();
    const antes = kv.store.get(`mail:${B}`);
    kv.falhaGet = 'mail:';
    let status = 0;
    try { status = (await community({ request: new Request(`https://x.dev/api/community?action=mail&id=${B}`), env })).status; } catch { status = 500; }
    expect(status).toBeGreaterThanOrEqual(500);
    expect(kv.store.get(`mail:${B}`)).toBe(antes);
  });
});
