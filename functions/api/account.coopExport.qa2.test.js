/**
 * QA rodada 2 (22/09/2026) — `04-dados-r2` §1.3 e §2.3:
 *
 *   (4) o cooperativo estava FORA da exclusão: `coop:<gid>.members`,
 *       `coopOf:<saveId>` e `coopCk:<gid>:<saveId>` ficavam 120 d, e o membro
 *       apagado virava fantasma — `target = members.length × 5` nunca mais
 *       fechava. Agora `handleDeleteConfirm` chama `coopLeave` (`_coop.js`).
 *   (5) a exportação devolvia `profile.friends[]` e `state.friends[]` CRUS —
 *       a única rota que entregava o saveId de terceiros. Agora sai o pid
 *       público (ou é omitido).
 */
import { describe, it, expect, vi } from 'vitest';

// A autenticação não é o assunto deste arquivo (é o de
// `_accountTombstone.reabertura.qa2.test.js`); aqui ela passa.
vi.mock('./_auth.js', async (orig) => ({
  ...(await orig()),
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false, tombstone: { deleted: false, reopened: false } }),
}));

const { onRequest } = await import('./account.js');
const { onRequest: community } = await import('./community.js');
const { coopKey, coopOfKey, coopCkKey, grupoDe } = await import('./_coop.js');

const ID = 'a'.repeat(32);
const OTHER_SAVE_ID = 'b'.repeat(32);
const SEM_PID = 'c'.repeat(32);

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
const env = (seed) => ({ DIGIAPP_SAVES: fakeKV(seed), FIREBASE_PROJECT_ID: 'soulmon-test' });

async function excluir(e) {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  const pedido = await (await onRequest({ request: post(`https://x/api/account?action=delete-request&id=${ID}`), env: e })).json();
  return onRequest({ request: post(`https://x/api/account?action=delete-confirm&id=${ID}`, { confirmToken: pedido.confirmToken }), env: e });
}

describe('(4) coop na exclusão', () => {
  it('grupo de 2, um exclui a conta → members = 1, coopOf/coopCk do excluído somem, meta recalculada', async () => {
    const e = env({ [ID]: JSON.stringify({ petName: 'A' }), [`profile:${OTHER_SAVE_ID}`]: JSON.stringify({ name: 'B', pid: 'p'.repeat(24), stage: 'rookie' }) });
    // Grupo real, montado pela própria rota.
    const rCriado = await community({ request: post('https://x/api/community?action=coopCreate', { id: OTHER_SAVE_ID, name: 'Dupla' }), env: e });
    const criado = await rCriado.json();
    expect(rCriado.status, JSON.stringify(criado)).toBe(200);
    const code = criado.group.code;
    const entrou = await community({ request: post('https://x/api/community?action=coopJoin', { id: ID, code }), env: e });
    expect(entrou.status).toBe(200);
    const gid = criado.group.id;
    await community({ request: post('https://x/api/community?action=coopCheckin', { id: ID }), env: e });
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(coopKey(gid))).members).toHaveLength(2);
    expect(e.DIGIAPP_SAVES.store.has(coopCkKey(gid, ID))).toBe(true);

    // O inventário lista a vaga.
    const pedido = await (await onRequest({ request: post(`https://x/api/account?action=delete-request&id=${ID}`), env: e })).json();
    expect(pedido.plano.apaga).toEqual(expect.arrayContaining([`coop:${gid} (sua vaga no grupo)`, coopOfKey(ID), coopCkKey(gid, ID)]));

    const r = await onRequest({ request: post(`https://x/api/account?action=delete-confirm&id=${ID}`, { confirmToken: pedido.confirmToken }), env: e });
    const body = await r.json();
    expect(r.status).toBe(200);
    expect(body.executado.grupoCooperativoDeixado).toBe(true);
    expect(body.executado.falhou).toEqual([]);

    const g = JSON.parse(e.DIGIAPP_SAVES.store.get(coopKey(gid)));
    expect(g.members).toEqual([OTHER_SAVE_ID]);
    expect(e.DIGIAPP_SAVES.store.has(coopOfKey(ID))).toBe(false);
    expect(e.DIGIAPP_SAVES.store.has(coopCkKey(gid, ID))).toBe(false);
    expect(await grupoDe(e, ID)).toBeNull();
    // Meta derivada do tamanho: 1 membro × 5.
    const vista = await (await community({ request: new Request(`https://x/api/community?action=coop&id=${OTHER_SAVE_ID}`), env: e })).json();
    expect(vista.group.target).toBe(5);
    expect(vista.group.members).toHaveLength(1);
  });

  it('sem grupo a exclusão segue normal (idempotente)', async () => {
    const e = env({ [ID]: JSON.stringify({ petName: 'A' }) });
    const body = await (await excluir(e)).json();
    expect(body.executado.grupoCooperativoDeixado).toBe(false);
    expect(body.executado.falhou).toEqual([]);
  });
});

describe('(5) exportação não vaza saveId de terceiros', () => {
  it('profile.friends e state.friends saem como pid público; sem pid é omitido; o próprio saveId continua saindo', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const PID_B = 'q'.repeat(24);
    const e = env({
      [ID]: JSON.stringify({ petName: 'A', friends: [OTHER_SAVE_ID, SEM_PID] }),
      [`profile:${ID}`]: JSON.stringify({ name: 'A', pid: 'z'.repeat(24), friends: [OTHER_SAVE_ID, SEM_PID] }),
      [`profile:${OTHER_SAVE_ID}`]: JSON.stringify({ name: 'B', pid: PID_B }),
      [`profile:${SEM_PID}`]: JSON.stringify({ name: 'C' }),
    });
    const r = await onRequest({ request: new Request(`https://x/api/account?action=export&id=${ID}`), env: e });
    expect(r.status).toBe(200);
    const txt = await r.text();
    expect(txt).not.toContain(OTHER_SAVE_ID);
    expect(txt).not.toContain(SEM_PID);
    const data = JSON.parse(txt).data;
    expect(data[`${ID} (save)`].friends).toEqual([PID_B]);
    expect(data[`profile:${ID}`].friends).toEqual([PID_B]);
    expect(txt).toContain(ID);
    // O KV não foi tocado pela exportação (leitura pura).
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(`profile:${ID}`)).friends).toEqual([OTHER_SAVE_ID, SEM_PID]);
  });
});

describe('(6) exportação traz o grupo do titular (D-4, L1-codigo MÉDIO-1)', () => {
  it('ponteiro, os próprios check-ins e nome+papel — sem saveId nem nome de outro membro', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const e = env({
      [ID]: JSON.stringify({ petName: 'A' }),
      [`profile:${ID}`]: JSON.stringify({ name: 'A', pid: 'z'.repeat(24) }),
      [`profile:${OTHER_SAVE_ID}`]: JSON.stringify({ name: 'Beatriz', pid: 'p'.repeat(24), stage: 'rookie' }),
    });
    const criado = await (await community({ request: post('https://x/api/community?action=coopCreate', { id: OTHER_SAVE_ID, name: 'Dupla' }), env: e })).json();
    await community({ request: post('https://x/api/community?action=coopJoin', { id: ID, code: criado.group.code }), env: e });
    await community({ request: post('https://x/api/community?action=coopCheckin', { id: ID }), env: e });
    const gid = criado.group.id;

    const txt = await (await onRequest({ request: new Request(`https://x/api/account?action=export&id=${ID}`), env: e })).text();
    const coop = JSON.parse(txt).data.coop;
    expect(coop[coopOfKey(ID)]).toBe(gid);
    expect(coop[coopCkKey(gid, ID)].days).toHaveLength(1);
    expect(coop.grupo).toEqual({ id: gid, name: 'Dupla', joinedAs: 'member', myDistinctDays: 0, myLastThreadDay: null, myHitsThisWeek: [] });
    expect(txt).not.toContain(OTHER_SAVE_ID);
    expect(txt).not.toContain('Beatriz');
  });
});
