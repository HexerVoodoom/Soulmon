// Faixa de evoluções × exclusão de conta: `delete-confirm` tira a pessoa do blob global, e não mexe no resto.
import { describe, it, expect, vi } from 'vitest';

vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));

const { onRequest } = await import('./account.js');
const { EVO_FEED_KEY } = await import('./_evoFeed.js');

const ID = 'a'.repeat(32);
const OUTRO = 'b'.repeat(32);

function fakeKV(seed) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    falhaNoFeed: false,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }),
    async put(k, v) { if (k === EVO_FEED_KEY && this.falhaNoFeed) throw new Error('429'); store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const post = (qs, body) => new Request(`https://x/api/account?${qs}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
const excluir = async (kv) => {
  const env = { DIGIAPP_SAVES: kv };
  const { confirmToken } = await (await onRequest({ request: post(`action=delete-request&id=${ID}`), env })).json();
  return onRequest({ request: post(`action=delete-confirm&id=${ID}`, { confirmToken }), env });
};
const mundo = () => fakeKV({
  [ID]: JSON.stringify({ petName: 'Bolha' }),
  [`profile:${ID}`]: JSON.stringify({ id: ID, name: 'Ana', friends: [] }),
  [EVO_FEED_KEY]: JSON.stringify([{ by: ID, name: 'Ana', pet: 'Bolha', tier: 'champion', branch: 'power', at: 1 }, { by: OUTRO, name: 'Bia', pet: 'Brasa', tier: 'mega', branch: null, at: 2 }]),
});

describe('account › delete-confirm › faixa de evoluções', () => {
  it('tira só a pessoa do blob', async () => {
    const kv = mundo();
    expect((await excluir(kv)).status).toBe(200);
    expect(JSON.parse(kv.store.get(EVO_FEED_KEY)).map(e => e.by)).toEqual([OUTRO]);
    expect(kv.store.get(EVO_FEED_KEY)).not.toContain('Ana');
  });
  it('falha no KV do feed não impede a exclusão e é reportada', async () => {
    const kv = mundo();
    kv.falhaNoFeed = true;
    const res = await excluir(kv);
    const corpo = await res.json();
    expect(res.status).toBe(200);
    expect(kv.store.has(ID)).toBe(false);
    expect(JSON.stringify(corpo)).toContain(EVO_FEED_KEY);
  });
});
