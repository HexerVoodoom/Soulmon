import { describe, it, expect, vi } from 'vitest';
vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: save } = await import('./save.js');
const ID = 'c'.repeat(32);
function fakeKV() {
  const store = new Map();
  return { store, get: async k => store.get(k) ?? null, getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }),
    put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }) };
}
const post = (e, state) => save({ request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) }), env: e });
const mk = () => ({ DIGIAPP_SAVES: fakeKV(), FIREBASE_PROJECT_ID: 'soulmon-test' });
const lido = e => JSON.parse(e.DIGIAPP_SAVES.store.get(ID));

describe('save.js — foto e moldura só por ID de lista fechada', () => {
  it('ids do catálogo passam', async () => {
    const e = mk();
    await post(e, { avatarId: 'ativo-arena', equippedFrame: 'rank-ouro' });
    expect(lido(e)).toMatchObject({ avatarId: 'ativo-arena', equippedFrame: 'rank-ouro' });
  });
  it('fora do catálogo / lixo vira null', async () => {
    const e = mk();
    await post(e, { avatarId: 'https://evil/x.png', equippedFrame: 'moldura-inexistente' });
    expect(lido(e)).toMatchObject({ avatarId: null, equippedFrame: null });
  });
});
