import { describe, it, expect, vi } from 'vitest';

vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'jogador@example.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: save } = await import('./save.js');
const ID = 'c'.repeat(32);
function env() {
  const store = new Map();
  return { DIGIAPP_SAVES: {
    get: async key => store.get(key) ?? null,
    getWithMetadata: async key => ({ value: store.get(key) ?? null, metadata: null }),
    put: async (key, value) => store.set(key, value),
  }, store };
}
const post = (e, defeatedElements) => save({
  request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: { defeatedElements } }) }),
  env: e,
});

describe('save.js — dex de elementos (defeatedElements)', () => {
  it('preserva a lista saneada, sem repetidos', async () => {
    const e = env();
    await post(e, ['fogo', 'lava', 'fogo', 'LIXO', 7]);
    expect(JSON.parse(e.store.get(ID)).defeatedElements).toEqual(['fogo', 'lava']);
  });
  it('descarta o campo sem forma de lista, sem afetar o resto do save', async () => {
    const e = env();
    await post(e, 'fogo');
    expect(JSON.parse(e.store.get(ID)).defeatedElements).toBeUndefined();
  });
});
