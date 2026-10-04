import { describe, it, expect, vi } from 'vitest';

// Molduras de avatar (R8, 04/10/2026) — cosmética no save. O servidor só garante a FORMA do que o
// cliente manda (`equippedFrame`: id ou null; `ownedFrames`: lista de ids sem repetição, teto 200).
vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: save } = await import('./save.js');

const ID = 'b'.repeat(32);
function fakeKV() {
  const store = new Map();
  return {
    store,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }),
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const mk = () => ({ DIGIAPP_SAVES: fakeKV(), FIREBASE_PROJECT_ID: 'soulmon-test' });
const post = (e, state) => save({
  request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) }),
  env: e,
});
const lido = e => JSON.parse(e.DIGIAPP_SAVES.store.get(ID));

describe('save.js — molduras', () => {
  it('ids bem formados passam intactos', async () => {
    const e = mk();
    expect((await post(e, { equippedFrame: 'rank-ouro', ownedFrames: ['loja-brasa', 'evento-lua-colheita'] })).status).toBe(200);
    expect(lido(e)).toMatchObject({ equippedFrame: 'rank-ouro', ownedFrames: ['loja-brasa', 'evento-lua-colheita'] });
  });

  it('lixo é descartado: equipada vira null, posse perde inválidos e repetidos', async () => {
    const e = mk();
    await post(e, { equippedFrame: '<img onerror=x>', ownedFrames: ['ok-1', 'ok-1', 'Maiuscula', 5, null, { a: 1 }, 'x'.repeat(41)] });
    expect(lido(e).equippedFrame).toBeNull();
    expect(lido(e).ownedFrames).toEqual(['ok-1']);
  });

  it('posse que não é lista vira lista vazia; teto de 200', async () => {
    const e = mk();
    await post(e, { ownedFrames: 'loja-brasa' });
    expect(lido(e).ownedFrames).toEqual([]);
    await post(e, { ownedFrames: Array.from({ length: 260 }, (_, i) => `f-${i}`) });
    expect(lido(e).ownedFrames.length).toBe(200);
  });

  it('save sem os campos não ganha campo nenhum (save antigo segue igual)', async () => {
    const e = mk();
    await post(e, { petName: 'Bolha' });
    expect('equippedFrame' in lido(e)).toBe(false);
    expect('ownedFrames' in lido(e)).toBe(false);
  });
});
