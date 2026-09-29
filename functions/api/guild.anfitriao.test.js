import { describe, it, expect } from 'vitest';
import { onRequest } from './guild.js';
import { coopKey, coopCodeKey } from './_coop.js';

/**
 * Anfitrião (WPG-2, `05-servidor.md` §5.3; G7 sem expulsão): só quem criou
 * renomeia e troca o código; ao sair, a vez passa ao membro mais antigo, em
 * silêncio; e não existe ação de remover alguém.
 */
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const puts = [];
  return {
    store, puts,
    get: async k => store.get(k) ?? null,
    put: async (k, v, opts) => { puts.push({ k, v, opts }); store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
/** Um id de save válido (32 chars) a partir de um rótulo curto. */
const sid = r => r.padEnd(32, '0');
const perfil = (id, nome, extra = {}) => JSON.stringify({ id, name: nome, pid: `P${id.slice(0, 4)}${'q'.repeat(19)}`, petName: 'pet', stage: 'mega-power', attrs: { power: 9, harmony: 9, benevolence: 9 }, friends: [], createdAt: Date.now(), ...extra });
function req(action, { method = 'GET', body, params = {}, ip } = {}) {
  const qs = new URLSearchParams({ action, ...params });
  return new Request(`https://x.dev/api/guild?${qs}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(ip ? { 'CF-Connecting-IP': ip } : {}) },
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  });
}
const [ANA, BIA, CAU] = ['ana', 'bia', 'cau'].map(sid);
const chamar = (e, action, opts) => onRequest({ request: req(action, opts), env: e });
const post = (e, action, body) => chamar(e, action, { method: 'POST', body });

async function roda() {
  const e = { DIGIAPP_SAVES: fakeKV({ [`profile:${ANA}`]: perfil(ANA, 'Ana'), [`profile:${BIA}`]: perfil(BIA, 'Bia'), [`profile:${CAU}`]: perfil(CAU, 'Cau') }) };
  const g = (await (await post(e, 'guildCreate', { id: ANA, name: 'Roda' })).json()).guild;
  await post(e, 'guildJoin', { id: BIA, code: g.code });
  await post(e, 'guildJoin', { id: CAU, code: g.code });
  return { e, g };
}

describe('anfitrião', () => {
  it('quem criou é o anfitrião; hostSave fica no blob e nunca na resposta', async () => {
    const { e, g } = await roda();
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(coopKey(g.id))).hostSave).toBe(ANA);
    const vistaBia = (await (await chamar(e, 'guild', { params: { id: BIA } })).json()).guild;
    expect(vistaBia.isHost).toBe(false);
    expect(JSON.stringify(vistaBia)).not.toContain('hostSave');
  });

  it('não-anfitrião não renomeia nem troca código (403 not host)', async () => {
    const { e } = await roda();
    for (const [action, body] of [['guildRename', { id: BIA, name: 'Tomada' }], ['guildNewCode', { id: BIA }]]) {
      const r = await post(e, action, body);
      expect(r.status).toBe(403);
      expect((await r.json()).error).toBe('not host');
    }
  });

  it('código novo: o velho deixa de abrir a guilda, o novo abre', async () => {
    const { e, g } = await roda();
    const novo = (await (await post(e, 'guildNewCode', { id: ANA })).json()).guild.code;
    expect(novo).not.toBe(g.code);
    expect(e.DIGIAPP_SAVES.store.has(coopCodeKey(g.code))).toBe(false);
    expect(e.DIGIAPP_SAVES.store.get(coopCodeKey(novo))).toBe(g.id);
    const fora = sid('dan');
    expect((await post(e, 'guildJoin', { id: fora, code: g.code })).status).toBe(404);
    expect((await post(e, 'guildJoin', { id: fora, code: novo })).status).toBe(200);
  });

  it('anfitrião sai → o membro mais antigo passa a ser anfitrião, e só ele', async () => {
    const { e, g } = await roda();
    expect((await post(e, 'guildLeave', { id: ANA })).status).toBe(200);
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(coopKey(g.id))).hostSave).toBe(BIA);
    expect((await (await chamar(e, 'guild', { params: { id: BIA } })).json()).guild.isHost).toBe(true);
    expect((await (await chamar(e, 'guild', { params: { id: CAU } })).json()).guild.isHost).toBe(false);
    expect((await post(e, 'guildRename', { id: BIA, name: 'Roda da Bia' })).status).toBe(200);
  });

  it('guilda anterior ao campo hostSave: o criador (members[0]) é o anfitrião', async () => {
    const { e, g } = await roda();
    const blob = JSON.parse(e.DIGIAPP_SAVES.store.get(coopKey(g.id)));
    delete blob.hostSave;
    e.DIGIAPP_SAVES.store.set(coopKey(g.id), JSON.stringify(blob));
    expect((await (await chamar(e, 'guild', { params: { id: ANA } })).json()).guild.isHost).toBe(true);
    expect((await post(e, 'guildRename', { id: BIA, name: 'X' })).status).toBe(403);
  });

  it('não existe expulsão (G7): guildRemove/guildKick são ação desconhecida e ninguém sai', async () => {
    const { e, g } = await roda();
    for (const action of ['guildRemove', 'guildKick', 'coopRemove']) {
      const r = await post(e, action, { id: ANA, memberPid: 'qualquer', member: BIA });
      expect(r.status).toBe(400);
    }
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(coopKey(g.id))).members).toEqual([ANA, BIA, CAU]);
  });
});
