import { describe, it, expect, vi, beforeEach } from 'vitest';

// QA3 — account.js com entrada hostil e isolamento entre contas. O veredito de autenticação é dublado (como em
// `account.test.js`); o que se exercita aqui é o que a rota faz DEPOIS de saber quem é o dono.
const authVerdict = { value: null };
vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async (_req, _env, saveId) => (authVerdict.value?.forId && authVerdict.value.forId !== saveId ? { ok: false, status: 403, reason: 'forbidden' } : authVerdict.value),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest } = await import('./account.js');

const A = 'a'.repeat(32);
const B = 'b'.repeat(32);

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
const mkEnv = seed => ({ DIGIAPP_SAVES: fakeKV(seed), FIREBASE_PROJECT_ID: 'soulmon-test' });
const post = (qs, raw) => new Request(`https://x/api/account?${qs}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw });
const get = qs => new Request(`https://x/api/account?${qs}`);

beforeEach(() => { authVerdict.value = { ok: true, email: 'a@x.com', forId: A }; });

describe('QA3 account.js — exportação', () => {
  it('registros corrompidos no KV não derrubam a exportação (save, perfil, ranking, entitlement, presentes)', async () => {
    const e = mkEnv({
      [A]: '{não é json', [`profile:${A}`]: '[[[', [`gifts:${A}`]: 'null', [`ent:${A}`]: '}{', [`rank:2026-10:${A}`]: 'xx',
      [`profile:${B}`]: JSON.stringify({ id: B, friends: [A] }),
    });
    const res = await onRequest({ request: get(`action=export&id=${A}`), env: e });
    expect(res.status).toBe(200);
    const corpo = await res.json();
    expect(corpo.format).toBe('soulmon.account-export/1');
  });

  it('friends[] com tipos estranhos (números, objetos, nulos, ids inválidos) sai sem saveId nenhum e sem lançar', async () => {
    const e = mkEnv({
      [A]: JSON.stringify({ friends: [B, 7, null, {}, [], 'curto', 'x'.repeat(200)] }),
      [`profile:${A}`]: JSON.stringify({ id: A, friends: [B, 7, null, {}, []] }),
      [`profile:${B}`]: JSON.stringify({ id: B, pid: 'p'.repeat(24) }),
    });
    const res = await onRequest({ request: get(`action=export&id=${A}`), env: e });
    expect(res.status).toBe(200);
    const texto = JSON.stringify(await res.json());
    expect(texto).not.toContain(B);
  });

  it('a exportação de A não contém nada de B (save, perfil, ranking, entitlement de B)', async () => {
    const e = mkEnv({
      [A]: JSON.stringify({ petName: 'A' }), [`ent:${A}`]: JSON.stringify({ tier: 'demo' }),
      [B]: JSON.stringify({ petName: 'SEGREDO-DE-B' }), [`profile:${B}`]: JSON.stringify({ id: B, name: 'SEGREDO-DE-B' }),
      [`ent:${B}`]: JSON.stringify({ tier: 'paid', orderDetails: [{ orderId: 'GPA.SEGREDO-DE-B', purchaseToken: 'TOKEN-SEGREDO-DE-B' }] }),
      [`rank:2026-10:${B}`]: JSON.stringify({ points: 999 }),
    });
    const texto = await (await onRequest({ request: get(`action=export&id=${A}`), env: e })).text();
    expect(texto).not.toContain('SEGREDO-DE-B');
    expect(texto).not.toContain(B);
  });

  it('token de A pedindo o saveId de B: 403 e o KV de B intocado', async () => {
    const e = mkEnv({ [B]: JSON.stringify({ petName: 'B' }), [`ent:${B}`]: JSON.stringify({ tier: 'paid' }) });
    const antes = JSON.stringify([...e.DIGIAPP_SAVES.store]);
    for (const acao of ['export', 'delete-request', 'delete-confirm']) {
      const req = acao === 'export' ? get(`action=${acao}&id=${B}`) : post(`action=${acao}&id=${B}`, JSON.stringify({ confirmToken: 'x'.repeat(32) }));
      const res = await onRequest({ request: req, env: e });
      expect(res.status, acao).toBe(403);
    }
    expect(JSON.stringify([...e.DIGIAPP_SAVES.store])).toBe(antes);
  });
});

describe('QA3 account.js — exclusão com corpo hostil', () => {
  const CORPOS = ['null', '[]', '"x"', '123', '{', '', '{"confirmToken":[]}', '{"confirmToken":{}}', '{"confirmToken":0}', '{"confirmToken":null}',
    '{"confirmToken":true}', '{"__proto__":{"confirmToken":"x"}}', '{"constructor":{"prototype":{"confirmToken":"x"}}}', `{"confirmToken":"${'z'.repeat(100000)}"}`];
  for (const corpo of CORPOS) {
    it(`delete-confirm com corpo ${corpo.slice(0, 40)}: 409 e NADA apagado`, async () => {
      const e = mkEnv({ [A]: JSON.stringify({ petName: 'A' }) });
      const pedido = await onRequest({ request: post(`action=delete-request&id=${A}`, '{}'), env: e });
      expect(pedido.status).toBe(200);
      const res = await onRequest({ request: post(`action=delete-confirm&id=${A}`, corpo || undefined), env: e });
      expect(res.status).toBe(409);
      expect(e.DIGIAPP_SAVES.store.has(A)).toBe(true);
      expect({}.confirmToken).toBeUndefined();
    });
  }

  it('o token de confirmação de A não vale para B (cada conta tem o seu)', async () => {
    const e = mkEnv({ [A]: JSON.stringify({ petName: 'A' }), [B]: JSON.stringify({ petName: 'B' }) });
    const pedidoA = await (await onRequest({ request: post(`action=delete-request&id=${A}`, '{}'), env: e })).json();
    authVerdict.value = { ok: true, email: 'b@x.com', forId: B };
    await onRequest({ request: post(`action=delete-request&id=${B}`, '{}'), env: e });
    const res = await onRequest({ request: post(`action=delete-confirm&id=${B}`, JSON.stringify({ confirmToken: pedidoA.confirmToken })), env: e });
    expect(res.status).toBe(409);
    expect(e.DIGIAPP_SAVES.store.has(A)).toBe(true);
    expect(e.DIGIAPP_SAVES.store.has(B)).toBe(true);
  });

  it('duas confirmações SIMULTÂNEAS com o mesmo token: terminam sem erro e o estado final é o de uma exclusão só', async () => {
    const e = mkEnv({
      [A]: JSON.stringify({ petName: 'A' }), [`profile:${A}`]: JSON.stringify({ id: A }),
      [`ent:${A}`]: JSON.stringify({ tier: 'paid', credits: 5, consumedOrders: ['GPA.1'], orderDetails: [{ orderId: 'GPA.1', purchaseToken: 't' }] }),
      [`ord:GPA.1`]: A,
    });
    const { confirmToken } = await (await onRequest({ request: post(`action=delete-request&id=${A}`, '{}'), env: e })).json();
    const cor = JSON.stringify({ confirmToken });
    const [r1, r2] = await Promise.all([
      onRequest({ request: post(`action=delete-confirm&id=${A}`, cor), env: e }),
      onRequest({ request: post(`action=delete-confirm&id=${A}`, cor), env: e }),
    ]);
    expect([r1.status, r2.status].every(s => s === 200 || s === 409)).toBe(true);
    expect(e.DIGIAPP_SAVES.store.has(A)).toBe(false);
    expect(e.DIGIAPP_SAVES.store.has(`profile:${A}`)).toBe(false);
    const ent = JSON.parse(e.DIGIAPP_SAVES.store.get(`ent:${A}`));
    expect(ent.tier).toBe('demo');
    expect(ent.credits).toBe(0);
    // o comprovante segue travado, ANÔNIMO (REGISTRO §49)
    expect(e.DIGIAPP_SAVES.store.get('ord:GPA.1')).toBe('deleted');
    expect(JSON.stringify([...e.DIGIAPP_SAVES.store])).not.toContain('"t"');
  });

  it('ação desconhecida, id inválido (tamanho, caracteres, traversal) e método errado nunca chegam ao KV', async () => {
    const e = mkEnv({ [A]: '{}' });
    for (const id of ['', 'curto', 'a'.repeat(65), 'a'.repeat(31) + '/', '../../etc/passwd', 'a'.repeat(31) + ':', `${A}%00`]) {
      const res = await onRequest({ request: get(`action=export&id=${encodeURIComponent(id)}`), env: e });
      expect(res.status, id).toBe(400);
    }
    expect((await onRequest({ request: get(`action=nada&id=${A}`), env: e })).status).toBe(400);
    expect((await onRequest({ request: new Request(`https://x/api/account?action=export&id=${A}`, { method: 'DELETE' }), env: e })).status).toBe(405);
    expect((await onRequest({ request: get(`action=delete-confirm&id=${A}`), env: e })).status).toBe(400);
  });
});
