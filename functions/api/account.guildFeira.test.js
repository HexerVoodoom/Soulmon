/**
 * WPG-6 × WPG-4/5 (`PLANO-GUILDA.md` §10.6): a exclusão apaga a Feira e o
 * resgate do titular (golpes de golpe real, claims de resgate real, Conchas e
 * cenários) e a exportação traz só o que é dele — nunca o dano, nunca outro membro.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('./_auth.js', async (orig) => ({
  ...(await orig()),
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false, tombstone: { deleted: false, reopened: false } }),
}));

const { onRequest } = await import('./account.js');
const { onRequest: guild } = await import('./guild.js');
const { coopHitKey, coopClaimKey, coopShellKey, coopScenesKey, coopRaidOkKey } = await import('./_coop.js');

const ID = 'a'.repeat(32);
const OUTRO = 'b'.repeat(32);
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
const post = (url, body) => new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
const g = (e, action, body) => guild({ request: post(`https://x/api/guild?action=${action}`, body), env: e });
afterEach(() => vi.useRealTimers());

async function montar() {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
  vi.spyOn(console, 'log').mockImplementation(() => {});
  const e = {
    DIGIAPP_SAVES: fakeKV({
      [ID]: JSON.stringify({ petName: 'A' }),
      [`profile:${ID}`]: JSON.stringify({ name: 'A', pid: 'z'.repeat(24), stage: 'rookie' }),
      [`profile:${OUTRO}`]: JSON.stringify({ name: 'Beatriz', pid: 'p'.repeat(24), stage: 'rookie' }),
    }),
    FIREBASE_PROJECT_ID: 'soulmon-test',
  };
  const criado = (await (await g(e, 'guildCreate', { id: OUTRO, name: 'Dupla' })).json()).guild;
  await g(e, 'guildJoin', { id: ID, code: criado.code });
  // Feira real: os dois golpeiam, a semana é dissipada por semeadura e o titular resgata.
  await g(e, 'guildRaidHit', { id: ID });
  await g(e, 'guildRaidHit', { id: OUTRO });
  const w = '2026-W37';
  const meu = JSON.parse(e.DIGIAPP_SAVES.store.get(coopHitKey(criado.id, w, ID)));
  e.DIGIAPP_SAVES.store.set(coopHitKey(criado.id, w, ID), JSON.stringify({ ...meu, dmg: 200 }));
  expect((await g(e, 'guildClaim', { id: ID, week: w })).status).toBe(200);
  expect((await g(e, 'guildClaim', { id: OUTRO, week: w })).status).toBe(200);
  e.DIGIAPP_SAVES.store.set(coopScenesKey(ID), JSON.stringify({ ids: ['bg-guild-clareira'] }));
  return { e, gid: criado.id, w };
}

describe('exclusão × Feira e resgate', () => {
  it('apaga coopHit, coopClaim, coopShell e coopScenes do titular; os do outro membro e a marca da roda ficam', async () => {
    const { e, gid, w } = await montar();
    // Um golpe de 2 semanas atrás (o coopHit vive 21 d) também sai.
    e.DIGIAPP_SAVES.store.set(coopHitKey(gid, '2026-W35', ID), JSON.stringify({ days: ['2026-08-26'], dmg: 12 }));
    const pedido = await (await onRequest({ request: post(`https://x/api/account?action=delete-request&id=${ID}`), env: e })).json();
    const r = await onRequest({ request: post(`https://x/api/account?action=delete-confirm&id=${ID}`, { confirmToken: pedido.confirmToken }), env: e });
    expect(r.status).toBe(200);
    expect((await r.json()).executado.falhou).toEqual([]);
    for (const k of [coopHitKey(gid, w, ID), coopHitKey(gid, '2026-W35', ID), coopClaimKey(ID, w), coopShellKey(ID), coopScenesKey(ID)]) {
      expect(e.DIGIAPP_SAVES.store.has(k), k).toBe(false);
    }
    expect([...e.DIGIAPP_SAVES.store.keys()].filter(k => k.startsWith('coop') && k.includes(ID))).toEqual([]);
    expect(e.DIGIAPP_SAVES.store.has(coopHitKey(gid, w, OUTRO))).toBe(true);
    expect(e.DIGIAPP_SAVES.store.has(coopClaimKey(OUTRO, w))).toBe(true);
    // A semana vencida é da RODA (sem dado pessoal): continua vencida.
    expect(e.DIGIAPP_SAVES.store.has(coopRaidOkKey(gid, w))).toBe(true);
  });
});

describe('exportação × Feira e resgate', () => {
  it('traz os próprios dias de golpe e as próprias semanas resgatadas — sem dano e sem nada do outro membro', async () => {
    const { e, w } = await montar();
    const txt = await (await onRequest({ request: new Request(`https://x/api/account?action=export&id=${ID}`), env: e })).text();
    const coop = JSON.parse(txt).data.coop;
    expect(coop.grupo.myHitsThisWeek).toEqual(['2026-09-10']);
    expect(coop.recompensas).toEqual({ claimedWeeks: [w], guildScenes: ['bg-guild-clareira'], shellWeeks: [w], raidWeeks: [w], carriedThreadDays: 0 });
    expect(txt).not.toContain(OUTRO);
    expect(txt).not.toMatch(/"dmg"|"hp"/);
  });
});
