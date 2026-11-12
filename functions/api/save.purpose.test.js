import { describe, it, expect, vi } from 'vitest';

// Objetivo anual (12/11/2026): `state.purpose` no save. O servidor só garante a forma e os tetos de
// `src/utils/purpose.ts` (objetivo 200, frase 120) e não deixa um objeto gigante passar.
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

describe('save.js — purpose (objetivo anual)', () => {
  it('guarda o objetivo e corta texto acima dos tetos', async () => {
    const e = mk();
    await post(e, { purpose: { goal: { text: 'x'.repeat(500), areas: [], createdAt: '2026-01-01', status: 'active' }, motive: { key: 'health', phrase: 'y'.repeat(500) }, priorities: ['a', 'b', 'c', 'd'] } });
    const p = lido(e).purpose;
    expect(p.goal.text).toHaveLength(200);
    expect(p.motive.phrase).toHaveLength(120);
    expect(p.priorities).toEqual(['a', 'b', 'c']);
  });
  it('não-objeto some; save sem o campo não ganha o campo', async () => {
    const e = mk();
    await post(e, { purpose: [1, 2] });
    expect('purpose' in lido(e)).toBe(false);
    const e2 = mk();
    await post(e2, { petName: 'x' });
    expect('purpose' in lido(e2)).toBe(false);
  });
  it('objeto gigante é descartado', async () => {
    const e = mk();
    await post(e, { purpose: { lixo: 'z'.repeat(300 * 1024) } });
    expect('purpose' in lido(e)).toBe(false);
  });
});
