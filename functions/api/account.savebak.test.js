/**
 * A guarda de regressao do save (`_saveGuard.js`) grava copias INTEGRAIS em `savebak:<saveId>:<ts>` (TTL 30 dias).
 * Excluir a conta tem que leva-las junto, sem tocar nas de outra conta.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));

const { onRequest } = await import('./account.js');

const ID = 'a'.repeat(32);
const OTHER = 'b'.repeat(32);

function fakeKV(seed) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: {} }),
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const post = (qs, body) => new Request(`https://x/api/account?${qs}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });

describe('delete-confirm leva os backups savebak do titular', () => {
  it('apaga savebak:<id>:* e preserva os de outra conta', async () => {
    const e = { DIGIAPP_SAVES: fakeKV({
      [ID]: JSON.stringify({ totalXP: 900 }),
      [`savebak:${ID}:0000000000001`]: JSON.stringify({ totalXP: 900 }),
      [`savebak:${ID}:0000000000002`]: JSON.stringify({ totalXP: 800 }),
      [`savebak:${OTHER}:0000000000001`]: JSON.stringify({ totalXP: 5 }),
    }), FIREBASE_PROJECT_ID: 'soulmon-test' };
    const { confirmToken } = await (await onRequest({ request: post(`action=delete-request&id=${ID}`), env: e })).json();
    const res = await onRequest({ request: post(`action=delete-confirm&id=${ID}`, { confirmToken }), env: e });
    expect(res.status).toBe(200);
    expect((await res.json()).executado.falhou).toEqual([]);
    const k = [...e.DIGIAPP_SAVES.store.keys()];
    expect(k.filter(x => x.startsWith(`savebak:${ID}:`))).toEqual([]);
    expect(k).toContain(`savebak:${OTHER}:0000000000001`);
    expect(e.DIGIAPP_SAVES.store.has(ID)).toBe(false);
  });
});
