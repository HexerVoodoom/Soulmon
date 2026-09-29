/**
 * WPG-6 (parte do Bosque), `PLANO-GUILDA.md` §10.6:
 *   - a EXCLUSÃO apaga `coopFio`/`coopGest`/`coopHit`/`coopClaim` do titular e
 *     SOMA os fios ainda não fechados dele ao total ANÔNIMO do Bosque — a obra
 *     da roda não regride porque alguém apagou a conta (LV-G3);
 *   - a EXPORTAÇÃO traz só o fio do titular, nunca o de outro membro.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('./_auth.js', async (orig) => ({
  ...(await orig()),
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false, tombstone: { deleted: false, reopened: false } }),
}));

const { onRequest } = await import('./account.js');
const { onRequest: guild } = await import('./guild.js');
const { coopFioKey, coopGestKey, coopHitKey, coopClaimKey, semanaDe, lerGrupo, semanasDeClaim } = await import('./_coop.js');

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
      [`profile:${ID}`]: JSON.stringify({ name: 'A', pid: 'z'.repeat(24) }),
      [`profile:${OUTRO}`]: JSON.stringify({ name: 'Beatriz', pid: 'p'.repeat(24) }),
    }),
    FIREBASE_PROJECT_ID: 'soulmon-test',
  };
  const criado = (await (await g(e, 'guildCreate', { id: OUTRO, name: 'Dupla' })).json()).guild;
  await g(e, 'guildJoin', { id: ID, code: criado.code });
  return { e, gid: criado.id };
}

describe('exclusão de conta × Bosque', () => {
  it('apaga coopFio/coopGest/coopHit/coopClaim do titular e soma o fio pendente ao total anônimo', async () => {
    const { e, gid } = await montar();
    await g(e, 'guildThread', { id: ID, kind: 'fio' });
    await g(e, 'guildThread', { id: OUTRO, kind: 'fio' });
    await g(e, 'guildGesture', { id: ID, kind: 'luz' });
    const semana = semanaDe(new Date());
    e.DIGIAPP_SAVES.store.set(coopHitKey(gid, semana, ID), JSON.stringify({ days: ['2026-09-10'], dmg: 12 }));
    for (const w of semanasDeClaim(new Date()).slice(0, 3)) e.DIGIAPP_SAVES.store.set(coopClaimKey(ID, w), JSON.stringify({ at: 1, kind: 'raid' }));
    e.DIGIAPP_SAVES.store.set(coopClaimKey(OUTRO, semana), JSON.stringify({ at: 1, kind: 'raid' }));

    const pedido = await (await onRequest({ request: post(`https://x/api/account?action=delete-request&id=${ID}`), env: e })).json();
    expect(pedido.plano.apaga).toEqual(expect.arrayContaining([coopFioKey(gid, ID)]));
    const r = await onRequest({ request: post(`https://x/api/account?action=delete-confirm&id=${ID}`, { confirmToken: pedido.confirmToken }), env: e });
    const body = await r.json();
    expect(r.status).toBe(200);
    expect(body.executado.falhou).toEqual([]);

    const chaves = [...e.DIGIAPP_SAVES.store.keys()];
    expect(chaves.filter(k => k.startsWith('coop') && k.includes(ID))).toEqual([]);
    expect(e.DIGIAPP_SAVES.store.has(coopFioKey(gid, ID))).toBe(false);
    expect(e.DIGIAPP_SAVES.store.has(coopGestKey(gid, ID))).toBe(false);
    // O resgate de OUTRA pessoa não é tocado.
    expect(e.DIGIAPP_SAVES.store.has(coopClaimKey(OUTRO, semana))).toBe(true);
    expect(e.DIGIAPP_SAVES.store.has(coopFioKey(gid, OUTRO))).toBe(true);

    // O fio de hoje do excluído ficou como contagem anônima…
    const blob = await lerGrupo(e, gid);
    expect(blob.fiosAvulsos).toEqual({ '2026-09-10': 1 });
    expect(JSON.stringify(blob)).not.toContain(ID);
    // …e no fechamento de amanhã o dia vale 2 de 2 = 1,0 (não 1 de 1 nem 0,5).
    vi.setSystemTime(new Date('2026-09-11T12:00:00Z'));
    await guild({ request: new Request(`https://x/api/guild?action=guild&id=${OUTRO}`), env: e });
    expect((await lerGrupo(e, gid)).bosqueProgress).toBeCloseTo(1, 9);
  });

  it('sem guilda, a exclusão ainda apaga os coopClaim do titular (sem list)', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const e = { DIGIAPP_SAVES: fakeKV({ [ID]: JSON.stringify({ petName: 'A' }) }), FIREBASE_PROJECT_ID: 'soulmon-test' };
    const w = semanaDe(new Date(Date.now() - 14 * 86400000));
    e.DIGIAPP_SAVES.store.set(coopClaimKey(ID, w), '{}');
    const pedido = await (await onRequest({ request: post(`https://x/api/account?action=delete-request&id=${ID}`), env: e })).json();
    await onRequest({ request: post(`https://x/api/account?action=delete-confirm&id=${ID}`, { confirmToken: pedido.confirmToken }), env: e });
    expect(e.DIGIAPP_SAVES.store.has(coopClaimKey(ID, w))).toBe(false);
  });
});

describe('exportação × Bosque', () => {
  it('traz só o fio do titular (dias distintos, último dia) — nunca o de outro membro nem o progresso da roda', async () => {
    const { e, gid } = await montar();
    await g(e, 'guildThread', { id: ID, kind: 'fio' });
    await g(e, 'guildThread', { id: OUTRO, kind: 'fio' });
    vi.setSystemTime(new Date('2026-09-11T12:00:00Z'));
    await g(e, 'guildThread', { id: OUTRO, kind: 'fio' });
    const txt = await (await onRequest({ request: new Request(`https://x/api/account?action=export&id=${ID}`), env: e })).text();
    const coop = JSON.parse(txt).data.coop;
    expect(coop[coopFioKey(gid, ID)]).toEqual({ lastDay: '2026-09-10', distinctDays: 1, days: ['2026-09-10'] });
    expect(coop.grupo.myDistinctDays).toBe(1);
    expect(coop.grupo.myLastThreadDay).toBe('2026-09-10');
    expect(txt).not.toContain(coopFioKey(gid, OUTRO));
    expect(txt).not.toContain(OUTRO);
    expect(JSON.stringify(coop)).not.toContain('2026-09-11');
    expect(txt).not.toMatch(/bosqueProgress|fiosAvulsos/);
  });
});
